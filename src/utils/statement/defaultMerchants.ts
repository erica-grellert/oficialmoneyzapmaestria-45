/**
 * Dicionário estático de estabelecimentos brasileiros -> nome de categoria.
 * Usado apenas como sugestão de segunda linha:
 *   1) regra do usuário (moneyzap_merchant_rules)
 *   2) este dicionário
 *   3) vazio
 * Sem migração: o casamento é feito por nome de categoria contra as
 * categorias que o usuário já tem cadastradas.
 */

import { normalizeMerchant } from "./normalizeMerchant";

export interface DefaultMerchant {
  /** trecho que deve aparecer na merchant_key normalizada */
  match: string;
  /** nome da categoria sugerida */
  category: string;
  direction?: "income" | "expense";
}

export const DEFAULT_MERCHANTS: DefaultMerchant[] = [
  // ---- Supermercados e mercearias (inclui regionais do Sul) ----
  { match: "ZAFFARI", category: "Supermercado" },
  { match: "BOURBON", category: "Supermercado" },
  { match: "NACIONAL SUPERMERCADO", category: "Supermercado" },
  { match: "ASUN", category: "Supermercado" },
  { match: "COMDIA", category: "Supermercado" },
  { match: "SUPERMERCADO", category: "Supermercado" },
  { match: "MERCADO", category: "Supermercado" },
  { match: "CARREFOUR", category: "Supermercado" },
  { match: "BIG BOMPRECO", category: "Supermercado" },
  { match: "ATACADAO", category: "Supermercado" },
  { match: "ASSAI", category: "Supermercado" },
  { match: "PAO DE ACUCAR", category: "Supermercado" },
  { match: "EXTRA", category: "Supermercado" },
  { match: "ANGELONI", category: "Supermercado" },
  { match: "FORT ATACADISTA", category: "Supermercado" },
  { match: "GIASSI", category: "Supermercado" },
  { match: "CONDOR", category: "Supermercado" },
  { match: "MUFFATO", category: "Supermercado" },
  { match: "TENDA ATACADO", category: "Supermercado" },
  { match: "SAM S CLUB", category: "Supermercado" },
  { match: "HORTIFRUTI", category: "Supermercado" },
  { match: "PADARIA", category: "Alimentação" },
  { match: "ACOUGUE", category: "Supermercado" },

  // ---- Farmácias ----
  { match: "PANVEL", category: "Saúde" },
  { match: "SAO JOAO FARMA", category: "Saúde" },
  { match: "FARMACIAS SAO JOAO", category: "Saúde" },
  { match: "FARMACIA", category: "Saúde" },
  { match: "DROGARIA", category: "Saúde" },
  { match: "DROGASIL", category: "Saúde" },
  { match: "RAIA", category: "Saúde" },
  { match: "PAGUE MENOS", category: "Saúde" },
  { match: "NISSEI", category: "Saúde" },
  { match: "ULTRAFARMA", category: "Saúde" },

  // ---- Saúde e bem-estar ----
  { match: "UNIMED", category: "Saúde" },
  { match: "AMIL", category: "Saúde" },
  { match: "BRADESCO SAUDE", category: "Saúde" },
  { match: "HAPVIDA", category: "Saúde" },
  { match: "LABORATORIO", category: "Saúde" },
  { match: "CLINICA", category: "Saúde" },
  { match: "HOSPITAL", category: "Saúde" },
  { match: "ODONTO", category: "Saúde" },
  { match: "SMARTFIT", category: "Saúde" },
  { match: "SMART FIT", category: "Saúde" },
  { match: "ACADEMIA", category: "Saúde" },

  // ---- Combustível e transporte ----
  { match: "SHELL", category: "Transporte" },
  { match: "IPIRANGA", category: "Transporte" },
  { match: "PETROBRAS", category: "Transporte" },
  { match: "BR DISTRIBUIDORA", category: "Transporte" },
  { match: "ALE COMBUSTIVEIS", category: "Transporte" },
  { match: "POSTO", category: "Transporte" },
  { match: "AUTO POSTO", category: "Transporte" },
  { match: "UBER", category: "Transporte" },
  { match: "NOVENTA E NOVE", category: "Transporte" },
  { match: "TAXI", category: "Transporte" },
  { match: "CABIFY", category: "Transporte" },
  { match: "ESTACIONAMENTO", category: "Transporte" },
  { match: "ESTAPAR", category: "Transporte" },
  { match: "SEM PARAR", category: "Transporte" },
  { match: "CONECTCAR", category: "Transporte" },
  { match: "VELOE", category: "Transporte" },
  { match: "PEDAGIO", category: "Transporte" },
  { match: "DETRAN", category: "Transporte" },
  { match: "LOCALIZA", category: "Transporte" },
  { match: "MOVIDA", category: "Transporte" },
  { match: "UNIDAS", category: "Transporte" },

  // ---- Delivery e restaurantes ----
  { match: "IFOOD", category: "Alimentação" },
  { match: "RAPPI", category: "Alimentação" },
  { match: "UBER EATS", category: "Alimentação" },
  { match: "AIQFOME", category: "Alimentação" },
  { match: "JAMES DELIVERY", category: "Alimentação" },
  { match: "RESTAURANTE", category: "Alimentação" },
  { match: "LANCHONETE", category: "Alimentação" },
  { match: "PIZZARIA", category: "Alimentação" },
  { match: "CHURRASCARIA", category: "Alimentação" },
  { match: "CAFE", category: "Alimentação" },
  { match: "STARBUCKS", category: "Alimentação" },
  { match: "MCDONALD", category: "Alimentação" },
  { match: "BURGER KING", category: "Alimentação" },
  { match: "SUBWAY", category: "Alimentação" },
  { match: "HABIBS", category: "Alimentação" },
  { match: "BOB S", category: "Alimentação" },
  { match: "OUTBACK", category: "Alimentação" },
  { match: "GIRAFFAS", category: "Alimentação" },

  // ---- Varejo e vestuário ----
  { match: "HAVAN", category: "Compras" },
  { match: "RENNER", category: "Vestuário" },
  { match: "RIACHUELO", category: "Vestuário" },
  { match: "C A MODAS", category: "Vestuário" },
  { match: "MARISA", category: "Vestuário" },
  { match: "CENTAURO", category: "Vestuário" },
  { match: "NIKE", category: "Vestuário" },
  { match: "ADIDAS", category: "Vestuário" },
  { match: "LOJAS COLOMBO", category: "Compras" },
  { match: "MAGAZINE LUIZA", category: "Compras" },
  { match: "MAGALU", category: "Compras" },
  { match: "CASAS BAHIA", category: "Compras" },
  { match: "PONTO FRIO", category: "Compras" },
  { match: "AMERICANAS", category: "Compras" },
  { match: "MERCADO LIVRE", category: "Compras" },
  { match: "MERCADOLIVRE", category: "Compras" },
  { match: "MERCADOPAGO", category: "Compras" },
  { match: "SHOPEE", category: "Compras" },
  { match: "AMAZON", category: "Compras" },
  { match: "ALIEXPRESS", category: "Compras" },
  { match: "LEROY MERLIN", category: "Casa" },
  { match: "TUMELERO", category: "Casa" },
  { match: "TELHANORTE", category: "Casa" },
  { match: "MADEIRA MADEIRA", category: "Casa" },
  { match: "PETZ", category: "Pets" },
  { match: "COBASI", category: "Pets" },
  { match: "PETLOVE", category: "Pets" },

  // ---- Assinaturas e serviços digitais ----
  { match: "NETFLIX", category: "Lazer" },
  { match: "SPOTIFY", category: "Lazer" },
  { match: "DISNEY", category: "Lazer" },
  { match: "PRIME VIDEO", category: "Lazer" },
  { match: "HBO", category: "Lazer" },
  { match: "MAX STREAM", category: "Lazer" },
  { match: "GLOBOPLAY", category: "Lazer" },
  { match: "YOUTUBE", category: "Lazer" },
  { match: "APPLE COM", category: "Lazer" },
  { match: "GOOGLE", category: "Serviços" },
  { match: "MICROSOFT", category: "Serviços" },
  { match: "ADOBE", category: "Serviços" },
  { match: "CINEMARK", category: "Lazer" },
  { match: "GNC CINEMAS", category: "Lazer" },

  // ---- Contas de casa ----
  { match: "CEEE", category: "Moradia" },
  { match: "RGE", category: "Moradia" },
  { match: "CPFL", category: "Moradia" },
  { match: "CELESC", category: "Moradia" },
  { match: "COPEL", category: "Moradia" },
  { match: "LIGHT", category: "Moradia" },
  { match: "ENEL", category: "Moradia" },
  { match: "CORSAN", category: "Moradia" },
  { match: "DMAE", category: "Moradia" },
  { match: "SABESP", category: "Moradia" },
  { match: "SULGAS", category: "Moradia" },
  { match: "COMGAS", category: "Moradia" },
  { match: "VIVO", category: "Moradia" },
  { match: "CLARO", category: "Moradia" },
  { match: "TIM", category: "Moradia" },
  { match: "OI FIXO", category: "Moradia" },
  { match: "NET SERVICOS", category: "Moradia" },
  { match: "CONDOMINIO", category: "Moradia" },
  { match: "ALUGUEL", category: "Moradia" },
  { match: "IPTU", category: "Impostos" },
  { match: "IPVA", category: "Impostos" },
  { match: "DARF", category: "Impostos" },
  { match: "RECEITA FEDERAL", category: "Impostos" },
  { match: "SIMPLES NACIONAL", category: "Impostos" },
  { match: "PREFEITURA", category: "Impostos" },

  // ---- Educação ----
  { match: "UNISINOS", category: "Educação" },
  { match: "PUCRS", category: "Educação" },
  { match: "UNIVERSIDADE", category: "Educação" },
  { match: "FACULDADE", category: "Educação" },
  { match: "COLEGIO", category: "Educação" },
  { match: "ESCOLA", category: "Educação" },
  { match: "UDEMY", category: "Educação" },
  { match: "HOTMART", category: "Educação" },

  // ---- Financeiro ----
  { match: "TARIFA", category: "Serviços" },
  { match: "IOF", category: "Serviços" },
  { match: "JUROS", category: "Serviços" },
  { match: "SEGURO", category: "Serviços" },
  { match: "PORTO SEGURO", category: "Serviços" },
  { match: "SALARIO", category: "Salário", direction: "income" },
  { match: "PROVENTOS", category: "Salário", direction: "income" },
  { match: "RENDIMENTO", category: "Investimentos", direction: "income" },
  { match: "RESGATE", category: "Investimentos", direction: "income" },
];

const NORMALIZED = DEFAULT_MERCHANTS.map((m) => ({
  ...m,
  match: normalizeMerchant(m.match) || m.match,
})).sort((a, b) => b.match.length - a.match.length);

/**
 * Devolve o nome da categoria sugerida pelo dicionário estático, ou null.
 */
export const suggestCategoryName = (
  merchantKey: string,
  direction: "income" | "expense"
): string | null => {
  if (!merchantKey) return null;
  const found = NORMALIZED.find(
    (m) =>
      merchantKey.includes(m.match) &&
      (!m.direction || m.direction === direction)
  );
  return found ? found.category : null;
};
