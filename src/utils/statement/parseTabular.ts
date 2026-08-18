import * as XLSX from "xlsx";
import {
  ColumnMapping,
  ParseResult,
  RawStatementEntry,
} from "@/types/statements";

export interface TabularPreview {
  headers: string[];
  rows: Record<string, string>[];
}

/** Detecta o separador mais provável de um CSV brasileiro */
const detectDelimiter = (sample: string): string => {
  const candidates = [";", ",", "\t", "|"];
  let best = ";";
  let bestCount = -1;
  candidates.forEach((c) => {
    const count = (sample.match(new RegExp(`\\${c}`, "g")) || []).length;
    if (count > bestCount) {
      bestCount = count;
      best = c;
    }
  });
  return best;
};

const splitCsvLine = (line: string, delimiter: string): string[] => {
  const out: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      out.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  out.push(current.trim());
  return out;
};

export const parseCsvPreview = (content: string): TabularPreview => {
  const clean = content.replace(/^\uFEFF/, "");
  const lines = clean
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) return { headers: [], rows: [] };

  const delimiter = detectDelimiter(lines.slice(0, 5).join("\n"));

  // pula linhas de preâmbulo: o cabeçalho é a primeira linha com 3+ colunas
  let headerIndex = 0;
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    if (splitCsvLine(lines[i], delimiter).filter(Boolean).length >= 3) {
      headerIndex = i;
      break;
    }
  }

  const headers = splitCsvLine(lines[headerIndex], delimiter).map(
    (h, i) => h || `Coluna ${i + 1}`
  );

  const rows = lines.slice(headerIndex + 1).map((line) => {
    const cells = splitCsvLine(line, delimiter);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (cells[i] ?? "").trim();
    });
    return row;
  });

  return { headers, rows };
};

export const parseXlsxPreview = async (
  file: File | Blob
): Promise<TabularPreview> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return { headers: [], rows: [] };

  const matrix: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });

  let headerIndex = 0;
  for (let i = 0; i < Math.min(matrix.length, 15); i++) {
    const filled = (matrix[i] || []).filter(
      (c) => String(c ?? "").trim().length > 0
    ).length;
    if (filled >= 3) {
      headerIndex = i;
      break;
    }
  }

  const headers = (matrix[headerIndex] || []).map((h, i) =>
    String(h ?? "").trim() || `Coluna ${i + 1}`
  );

  const rows = matrix.slice(headerIndex + 1).map((line) => {
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = String((line || [])[i] ?? "").trim();
    });
    return row;
  });

  return { headers, rows };
};

/** "1.234,56" | "-1234.56" | "R$ 1.234,56 D" -> número com sinal */
export const parseAmount = (raw: string): number | null => {
  if (!raw) return null;
  let value = String(raw).trim();
  if (!value) return null;

  const isParens = /^\(.*\)$/.test(value);
  const hasTrailingD = /\bD$/i.test(value.replace(/[.\s]/g, ""));
  const hasTrailingC = /\bC$/i.test(value.replace(/[.\s]/g, ""));

  value = value.replace(/[()]/g, "");
  value = value.replace(/[Rr]\$?\s?/g, "");
  value = value.replace(/\s|[A-Za-z]/g, "");

  const negative = value.includes("-") || isParens || hasTrailingD;
  value = value.replace(/-/g, "");

  const lastComma = value.lastIndexOf(",");
  const lastDot = value.lastIndexOf(".");

  if (lastComma > lastDot) {
    // formato brasileiro: 1.234,56
    value = value.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    value = value.replace(/,/g, "");
  } else {
    value = value.replace(/[.,]/g, "");
  }

  const num = Number(value);
  if (!isFinite(num) || num === 0) return null;

  if (hasTrailingC) return Math.abs(num);
  return negative ? -Math.abs(num) : Math.abs(num);
};

export const parseDateCell = (
  raw: string,
  format: ColumnMapping["dateFormat"]
): string | null => {
  if (!raw) return null;
  const value = String(raw).trim();

  // serial do Excel
  if (/^\d{5}$/.test(value)) {
    const serial = Number(value);
    const date = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
    return date.toISOString().slice(0, 10);
  }

  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso && format !== "dd/mm/yyyy" && format !== "mm/dd/yyyy") {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }

  const parts = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (parts) {
    let [, a, b, y] = parts;
    let day = a;
    let month = b;
    if (format === "mm/dd/yyyy") {
      day = b;
      month = a;
    }
    if (y.length === 2) y = `20${y}`;
    const dd = day.padStart(2, "0");
    const mm = month.padStart(2, "0");
    if (Number(mm) > 12) return null;
    return `${y}-${mm}-${dd}`;
  }

  return null;
};

export const buildEntriesFromRows = (
  rows: Record<string, string>[],
  mapping: ColumnMapping
): RawStatementEntry[] => {
  const entries: RawStatementEntry[] = [];

  rows.forEach((row) => {
    const postedAt = parseDateCell(row[mapping.date], mapping.dateFormat);
    const amountSigned = parseAmount(row[mapping.amount]);
    if (!postedAt || amountSigned === null) return;

    let direction: "income" | "expense";
    if (mapping.directionColumn) {
      const flag = (row[mapping.directionColumn] || "").toUpperCase();
      const isExpense =
        /^D/.test(flag) ||
        flag.includes("DEBIT") ||
        flag.includes("DÉBIT") ||
        flag.includes("SAIDA") ||
        flag.includes("SAÍDA") ||
        flag.includes("PAGAMENTO");
      direction = isExpense ? "expense" : "income";
    } else {
      const negativeIsExpense = mapping.negativeIsExpense;
      const isNegative = amountSigned < 0;
      direction = negativeIsExpense
        ? isNegative
          ? "expense"
          : "income"
        : isNegative
        ? "income"
        : "expense";
    }

    entries.push({
      postedAt,
      description: (row[mapping.description] || "Lançamento").trim(),
      amount: Math.abs(amountSigned),
      direction,
      fitid: null,
      raw: row as Record<string, unknown>,
    });
  });

  return entries;
};

export const buildTabularResult = (
  rows: Record<string, string>[],
  mapping: ColumnMapping
): ParseResult => ({
  entries: buildEntriesFromRows(rows, mapping),
  openingBalance: null,
  closingBalance: null,
});
