/**
 * Hashes determinísticos usados na importação de extrato.
 * line_hash = SHA-256 de posted_at + amount + direction + merchant_key
 */

const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

export const sha256 = async (value: string): Promise<string> => {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
};

export const sha256File = async (file: File | Blob): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return toHex(digest);
};

export const buildLineHash = async (params: {
  postedAt: string; // YYYY-MM-DD
  amount: number;
  direction: "income" | "expense";
  merchantKey: string;
}): Promise<string> => {
  const amount = Math.abs(Number(params.amount)).toFixed(2);
  return sha256(
    `${params.postedAt}|${amount}|${params.direction}|${params.merchantKey}`
  );
};
