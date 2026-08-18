/**
 * Normalização determinística de descrição bancária em uma "merchant_key".
 * Usada tanto no de-para aprendido quanto no line_hash de deduplicação.
 *
 * Regras aplicadas, nesta ordem:
 * 1. maiúsculas e sem acentos
 * 2. remover padrões de data (DD/MM, DD-MM, DD/MM/AAAA etc.)
 * 3. remover sequências numéricas, com ou sem pontos/hífens
 * 4. remover prefixos operacionais repetitivos (PIX TRANSF, TED, DOC, TBI etc.)
 * 5. colapsar espaços e cortar nas pontas
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
  "PADRAO",
  "PADRÃO",
  "TBI",
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

// Prefixos compostos que devem ser removidos antes da tokenização para
// evitar que sobrassem pedaços como "TRANSF" ou "PADRAO".
const COMPOUND_PREFIXES = [
  /\bPIX\s+(?:TRANSF(?:ERENCIA)?|PADRAO|PADRÃO|ENVIADO|RECEBIDO)\b/g,
  /\b(?:TRANSF(?:ERENCIA)?|TED|DOC|TBI)\s+(?:ENVIAD[AO]|RECEBID[AO])?\b/g,
];

export const stripAccents = (value: string): string =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/**
 * Ex.: "COMPRA CARTAO 12/03 ZAFFARI CENTRO *1234" -> "ZAFFARI CENTRO"
 * Ex.: "PIX TRANSF Edilene15/08" -> "EDILENE"
 * Ex.: "ITAU BLACK 3105-5611" -> "ITAU BLACK"
 */
export const normalizeMerchant = (description: string): string => {
  if (!description) return "";

  let value = stripAccents(description).toUpperCase();

  // 1. datas: DD/MM, DD-MM, DD/MM/AAAA (coladas ou não)
  value = value.replace(/\b\d{2}[\/\.-]\d{2}(?:[\/\.-]\d{2,4})?\b/g, " ");
  // 2. horas
  value = value.replace(/\b\d{2}:\d{2}(?::\d{2})?\b/g, " ");
  // 3. documentos (CPF/CNPJ)
  value = value.replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, " ");
  value = value.replace(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, " ");
  // 4. sequências numéricas, incluindo as que usam ponto/hífen (contas, contratos)
  value = value.replace(/[*#]+\s*\d+/g, " ");
  value = value.replace(/\d[\d\.\-,\/]*\d/g, " ");
  value = value.replace(/\b\d+\b/g, " ");

  // 5. prefixos operacionais compostos
  for (const regex of COMPOUND_PREFIXES) {
    value = value.replace(regex, " ");
  }

  // 6. pontuação restante
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
