import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const MAX_PAGES = 30;
const BATCH_SIZE = 4;
const BATCH_THRESHOLD = 6;

const SYSTEM_PROMPT = `Você é um extrator determinístico de extratos bancários brasileiros.
Regras absolutas:
- Extraia APENAS linhas de lançamento (movimentações reais da conta).
- IGNORE cabeçalho, rodapé, numeração de página, saldo do dia, saldo anterior, saldo final, subtotais, totalizadores, avisos legais, propaganda e qualquer texto institucional.
- NÃO invente nenhuma linha. Se não houver lançamento no texto, devolva lista vazia.
- NÃO altere nenhum valor, data ou descrição. Copie exatamente o que está no documento.
- amount é SEMPRE positivo. A natureza vai em direction: "expense" para débito/saída/pagamento/compra, "income" para crédito/entrada/depósito/recebimento.
- date sempre no formato ISO YYYY-MM-DD. Se o extrato usar DD/MM ou DD/MM/AAAA, converta sem inventar o ano: use o ano presente no documento.
- Se o documento informar saldo inicial (saldo anterior) e/ou saldo final, devolva-os nos campos opening_balance e closing_balance. Se não existirem no texto, omita-os. Nunca calcule esses saldos.`;

const TOOL = {
  type: "function",
  function: {
    name: "return_statement",
    description:
      "Devolve os lançamentos extraídos do extrato e, quando existirem no documento, os saldos inicial e final.",
    parameters: {
      type: "object",
      properties: {
        transactions: {
          type: "array",
          description: "Lançamentos encontrados, na ordem em que aparecem.",
          items: {
            type: "object",
            properties: {
              date: { type: "string", description: "Data ISO YYYY-MM-DD" },
              description: { type: "string", description: "Descrição literal do lançamento" },
              amount: { type: "number", description: "Valor sempre positivo" },
              direction: { type: "string", enum: ["income", "expense"] },
            },
            required: ["date", "description", "amount", "direction"],
            additionalProperties: false,
          },
        },
        opening_balance: {
          type: ["number", "null"],
          description: "Saldo inicial/anterior, se explícito no documento",
        },
        closing_balance: {
          type: ["number", "null"],
          description: "Saldo final, se explícito no documento",
        },
      },
      required: ["transactions"],
      additionalProperties: false,
    },
  },
};

interface ParsedTx {
  date: string;
  description: string;
  amount: number;
  direction: "income" | "expense";
}

interface BatchResult {
  transactions: ParsedTx[];
  opening_balance: number | null;
  closing_balance: number | null;
}

async function callModel(pagesText: string[], offset: number): Promise<BatchResult> {
  const userContent = pagesText
    .map((t, i) => `--- PÁGINA ${offset + i + 1} ---\n${t}`)
    .join("\n\n");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      tools: [TOOL],
      tool_choice: { type: "function", function: { name: "return_statement" } },
    }),
  });

  if (res.status === 429) {
    const e = new Error("rate_limit");
    // @ts-ignore custom
    e.status = 429;
    throw e;
  }
  if (res.status === 402) {
    const e = new Error("payment_required");
    // @ts-ignore custom
    e.status = 402;
    throw e;
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = await res.json();
  const call = json?.choices?.[0]?.message?.tool_calls?.[0];
  if (!call?.function?.arguments) {
    return { transactions: [], opening_balance: null, closing_balance: null };
  }

  let args: any;
  try {
    args = JSON.parse(call.function.arguments);
  } catch {
    return { transactions: [], opening_balance: null, closing_balance: null };
  }

  const transactions: ParsedTx[] = Array.isArray(args.transactions)
    ? args.transactions
        .filter(
          (t: any) =>
            t &&
            typeof t.date === "string" &&
            /^\d{4}-\d{2}-\d{2}$/.test(t.date) &&
            typeof t.description === "string" &&
            typeof t.amount === "number" &&
            isFinite(t.amount) &&
            t.amount > 0 &&
            (t.direction === "income" || t.direction === "expense")
        )
        .map((t: any) => ({
          date: t.date,
          description: String(t.description).trim(),
          amount: Math.abs(t.amount),
          direction: t.direction,
        }))
    : [];

  return {
    transactions,
    opening_balance: typeof args.opening_balance === "number" ? args.opening_balance : null,
    closing_balance: typeof args.closing_balance === "number" ? args.closing_balance : null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY não configurada no projeto." }),
        { status: 500, headers: jsonHeaders }
      );
    }

    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autenticado." }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    const body = await req.json().catch(() => null);
    const pages = body?.pages;

    if (!Array.isArray(pages) || pages.length === 0 || !pages.every((p) => typeof p === "string")) {
      return new Response(
        JSON.stringify({ error: "Envie 'pages' como um array de textos de página." }),
        { status: 400, headers: jsonHeaders }
      );
    }

    if (pages.length > MAX_PAGES) {
      return new Response(
        JSON.stringify({
          error: `PDF com ${pages.length} páginas excede o limite de ${MAX_PAGES} páginas.`,
        }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const batches: { pages: string[]; offset: number }[] = [];
    if (pages.length > BATCH_THRESHOLD) {
      for (let i = 0; i < pages.length; i += BATCH_SIZE) {
        batches.push({ pages: pages.slice(i, i + BATCH_SIZE), offset: i });
      }
    } else {
      batches.push({ pages, offset: 0 });
    }

    const transactions: ParsedTx[] = [];
    let opening: number | null = null;
    let closing: number | null = null;

    for (const batch of batches) {
      const result = await callModel(batch.pages, batch.offset);
      transactions.push(...result.transactions);
      // saldo inicial vem do primeiro lote que o informar, saldo final do último
      if (opening === null && result.opening_balance !== null) opening = result.opening_balance;
      if (result.closing_balance !== null) closing = result.closing_balance;
    }

    let balanceCheck: {
      opening_balance: number | null;
      closing_balance: number | null;
      computed_closing: number | null;
      diff: number | null;
      matches: boolean | null;
    } = {
      opening_balance: opening,
      closing_balance: closing,
      computed_closing: null,
      diff: null,
      matches: null,
    };

    if (opening !== null && closing !== null) {
      const credits = transactions
        .filter((t) => t.direction === "income")
        .reduce((s, t) => s + t.amount, 0);
      const debits = transactions
        .filter((t) => t.direction === "expense")
        .reduce((s, t) => s + t.amount, 0);
      const computed = opening + credits - debits;
      const diff = Number((closing - computed).toFixed(2));
      balanceCheck = {
        opening_balance: opening,
        closing_balance: closing,
        computed_closing: Number(computed.toFixed(2)),
        diff,
        matches: Math.abs(diff) < 0.01,
      };
    }

    return new Response(
      JSON.stringify({
        transactions,
        pages_processed: pages.length,
        batches: batches.length,
        balance_check: balanceCheck,
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (error: any) {
    if (error?.status === 429) {
      return new Response(
        JSON.stringify({
          error:
            "Limite de uso da IA atingido. Aguarde alguns instantes e tente novamente, ou importe o extrato em CSV/OFX.",
          code: "rate_limit",
        }),
        { status: 429, headers: jsonHeaders }
      );
    }
    if (error?.status === 402) {
      return new Response(
        JSON.stringify({
          error:
            "Os créditos de IA do workspace acabaram. Adicione créditos em Settings → Workspace → Usage para importar PDFs.",
          code: "payment_required",
        }),
        { status: 402, headers: jsonHeaders }
      );
    }
    console.error("parse-bank-statement-pdf error:", error);
    return new Response(
      JSON.stringify({ error: error?.message ?? "Falha ao processar o PDF." }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
