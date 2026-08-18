import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { supabase } from "@/integrations/supabase/client";
import {
  MAX_PDF_PAGES,
  ParseResult,
  RawStatementEntry,
} from "@/types/statements";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export class StatementPdfError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

/** Extrai o texto de cada página preservando a ordem de leitura */
export const extractPdfPages = async (file: File | Blob): Promise<string[]> => {
  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;

  if (doc.numPages > MAX_PDF_PAGES) {
    throw new StatementPdfError(
      `O PDF tem ${doc.numPages} páginas e o limite é de ${MAX_PDF_PAGES}. Divida o arquivo e importe por partes.`,
      "too_many_pages"
    );
  }

  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();

    // agrupa por linha (coordenada Y) e ordena por X para manter a leitura
    const lines = new Map<number, { x: number; text: string }[]>();

    content.items.forEach((item: any) => {
      if (typeof item?.str !== "string" || !item.transform) return;
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      const bucket = lines.get(y) ?? [];
      bucket.push({ x, text: item.str });
      lines.set(y, bucket);
    });

    const text = Array.from(lines.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([, parts]) =>
        parts
          .sort((a, b) => a.x - b.x)
          .map((p) => p.text)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter((l) => l.length > 0)
      .join("\n");

    pages.push(text);
  }

  return pages;
};

/**
 * Extração via IA (único ponto de IA do importador).
 * A edge function já faz o lote de 4 páginas quando o PDF tem mais de 6.
 */
export const parsePdf = async (file: File | Blob): Promise<ParseResult> => {
  const pages = await extractPdfPages(file);

  if (pages.every((p) => p.trim().length === 0)) {
    throw new StatementPdfError(
      "Não foi possível ler texto neste PDF. Ele pode ser um documento escaneado (imagem). Tente exportar o extrato em CSV, OFX ou XLSX.",
      "empty_text"
    );
  }

  const { data, error } = await supabase.functions.invoke(
    "parse-bank-statement-pdf",
    { body: { pages } }
  );

  if (error) {
    const status = (error as any)?.context?.status;
    if (status === 429) {
      throw new StatementPdfError(
        "Limite de uso da IA atingido. Aguarde alguns instantes e tente novamente, ou importe o extrato em CSV/OFX.",
        "rate_limit"
      );
    }
    if (status === 402) {
      throw new StatementPdfError(
        "Os créditos de IA acabaram. Adicione créditos no workspace para importar PDFs.",
        "payment_required"
      );
    }
    throw new StatementPdfError(
      error.message || "Falha ao processar o PDF.",
      "invoke_error"
    );
  }

  if (data?.error) {
    throw new StatementPdfError(data.error, data.code);
  }

  const entries: RawStatementEntry[] = (data?.transactions ?? []).map(
    (t: any) => ({
      postedAt: t.date,
      description: t.description,
      amount: Math.abs(Number(t.amount)),
      direction: t.direction === "income" ? "income" : "expense",
      fitid: null,
      raw: { origem: "pdf-ia", ...t },
    })
  );

  const check = data?.balance_check ?? {};

  return {
    entries,
    openingBalance: check.opening_balance ?? null,
    closingBalance: check.closing_balance ?? null,
    balanceDiff:
      typeof check.diff === "number" && check.matches === false
        ? check.diff
        : null,
  };
};
