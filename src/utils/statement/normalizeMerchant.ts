/**
 * Normalização determinística de descrição bancária em uma "merchant_key".
 * Usada tanto no de-para aprendido quanto no line_hash de deduplicação.
 */

const NOISE_TOKENS = [
  "COMPRA",
  "CARTAO",
  "CARTÃO",
  "DEBITO",
  "DÉBITO",
  "CREDITO",
  "CRÉDITO",
  "PAGAMENTO",
  "PAGTO",
  "PGTO",
  "COMPRAS",
  "PARCELA",
  "PARC",
  "TRANSFERENCIA",
  "TRANSFERÊNCIA",
  "TRANSF",
  "TED",
  "DOC",
  "PIX",
  "ENVIADO",
  "RECEBIDO",
  "ELETRONICA",
  "ELETRÔNICA",
  "NACIONAL",
  "INTERNACIONAL",
  "APROVADA",
  "LIQUIDACAO",
  "LIQUIDAÇÃO",
  "MENSALIDADE",
  "AVULSO",
  "LTDA",
  "ME",
  "EPP",
  "SA",
  "S/A",
  "EIRELI",
  "BR",
  "BRA",
];

export const stripAccents = (value: string): string =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/**
 * Ex.: "COMPRA CARTAO 12/03 ZAFFARI CENTRO *1234" -> "ZAFFARI CENTRO"
 */
export const normalizeMerchant = (description: string): string => {
  if (!description) return "";

  let value = stripAccents(description).toUpperCase();

  // remove datas, horas, documentos e sequências numéricas
  value = value.replace(/\d{2}[/.-]\d{2}([/.-]\d{2,4})?/g, " ");
  value = value.replace(/\d{2}:\d{2}(:\d{2})?/g, " ");
  value = value.replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, " "); // CPF
  value = value.replace(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, " "); // CNPJ
  value = value.replace(/[*#]+\s*\d+/g, " ");
  value = value.replace(/\b\d+\b/g, " ");

  // pontuação
  value = value.replace(/[^A-Z\s]/g, " ");

  const tokens = value
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1)
    .filter((t) => !NOISE_TOKENS.includes(t));

  const key = tokens.join(" ").trim();

  // se a limpeza apagou tudo, cai para a descrição crua normalizada
  if (!key) {
    return stripAccents(description).toUpperCase().replace(/\s+/g, " ").trim();
  }

  return key;
};
