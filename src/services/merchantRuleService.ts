import { supabase } from "@/integrations/supabase/client";
import { suggestCategoryName } from "@/utils/statement/defaultMerchants";
import { stripAccents } from "@/utils/statement/normalizeMerchant";

// As tabelas de importação são novas; os tipos gerados podem ainda não
// contemplá-las enquanto a migração não roda.
const db = supabase as any;

export interface MerchantRule {
  id: string;
  merchant_key: string;
  category_id: string;
  entidade: number;
  direction: "income" | "expense";
  hit_count: number;
}

export const getMerchantRules = async (
  userId: string
): Promise<MerchantRule[]> => {
  const { data, error } = await db
    .from("moneyzap_merchant_rules")
    .select("id, merchant_key, category_id, entidade, direction, hit_count")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching merchant rules:", error);
    return [];
  }
  return (data ?? []) as MerchantRule[];
};

export interface CategoryOption {
  id: string;
  name: string;
  type: "income" | "expense";
  entidades: number[];
}

/**
 * Ordem de sugestão:
 *  1) regra do usuário
 *  2) dicionário estático de estabelecimentos
 *  3) vazio
 */
export const suggestCategoryId = (
  merchantKey: string,
  direction: "income" | "expense",
  entidade: number,
  rules: MerchantRule[],
  categories: CategoryOption[]
): string | null => {
  const rule = rules.find(
    (r) =>
      r.merchant_key === merchantKey &&
      r.direction === direction &&
      r.entidade === entidade
  );
  if (rule) return rule.category_id;

  const name = suggestCategoryName(merchantKey, direction);
  if (!name) return null;

  const target = stripAccents(name).toUpperCase();
  const match = categories.find(
    (c) =>
      c.type === direction &&
      (c.entidades ?? [1]).includes(entidade) &&
      stripAccents(c.name).toUpperCase() === target
  );

  return match ? match.id : null;
};

/** Grava/atualiza a regra do usuário quando ele categoriza manualmente */
export const upsertMerchantRule = async (params: {
  userId: string;
  merchantKey: string;
  categoryId: string;
  entidade: number;
  direction: "income" | "expense";
}): Promise<void> => {
  if (!params.merchantKey || !params.categoryId) return;

  const { data: existing } = await db
    .from("moneyzap_merchant_rules")
    .select("id, hit_count")
    .eq("user_id", params.userId)
    .eq("merchant_key", params.merchantKey)
    .eq("entidade", params.entidade)
    .eq("direction", params.direction)
    .maybeSingle();

  if (existing) {
    await db
      .from("moneyzap_merchant_rules")
      .update({
        category_id: params.categoryId,
        hit_count: (existing.hit_count ?? 1) + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    return;
  }

  await db.from("moneyzap_merchant_rules").insert({
    user_id: params.userId,
    merchant_key: params.merchantKey,
    category_id: params.categoryId,
    entidade: params.entidade,
    direction: params.direction,
  });
};
