import { ParseResult, RawStatementEntry } from "@/types/statements";

const tag = (block: string, name: string): string | null => {
  const match = block.match(
    new RegExp(`<${name}>([^<\\r\\n]*)`, "i")
  );
  return match ? match[1].trim() : null;
};

/** OFX DTPOSTED: 20240310 ou 20240310120000[-3:BRT] */
const parseOfxDate = (value: string | null): string | null => {
  if (!value) return null;
  const digits = value.replace(/[^0-9]/g, "");
  if (digits.length < 8) return null;
  const y = digits.slice(0, 4);
  const m = digits.slice(4, 6);
  const d = digits.slice(6, 8);
  const date = `${y}-${m}-${d}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
};

export const parseOfx = (content: string): ParseResult => {
  const entries: RawStatementEntry[] = [];

  const blocks = content.split(/<STMTTRN>/i).slice(1);

  blocks.forEach((chunk) => {
    const block = chunk.split(/<\/STMTTRN>/i)[0];

    const postedAt = parseOfxDate(tag(block, "DTPOSTED"));
    const rawAmount = tag(block, "TRNAMT");
    if (!postedAt || rawAmount === null) return;

    const amountValue = Number(rawAmount.replace(/\s/g, "").replace(",", "."));
    if (!isFinite(amountValue) || amountValue === 0) return;

    const name = tag(block, "NAME");
    const memo = tag(block, "MEMO");
    const fitid = tag(block, "FITID");
    const description = [name, memo].filter(Boolean).join(" - ") || "Lançamento";

    entries.push({
      postedAt,
      description,
      amount: Math.abs(amountValue),
      direction: amountValue < 0 ? "expense" : "income",
      fitid: fitid || null,
      raw: {
        DTPOSTED: tag(block, "DTPOSTED"),
        TRNAMT: rawAmount,
        NAME: name,
        MEMO: memo,
        FITID: fitid,
        TRNTYPE: tag(block, "TRNTYPE"),
      },
    });
  });

  const balanceTag = content.match(/<LEDGERBAL>[\s\S]*?<BALAMT>([^<\r\n]*)/i);
  const closingBalance = balanceTag
    ? Number(balanceTag[1].replace(",", "."))
    : null;

  return {
    entries,
    openingBalance: null,
    closingBalance:
      closingBalance !== null && isFinite(closingBalance) ? closingBalance : null,
  };
};
