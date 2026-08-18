import { supabase } from "@/integrations/supabase/client";
import { MatchReason, RawStatementEntry } from "@/types/statements";

const db = supabase as any;

const AMOUNT_TOLERANCE = 5.0;
const PCT_TOLERANCE = 0.03;
const DAY_TOLERANCE = 3;

export interface CandidateTransaction {
  id: string;
  date: string;
  amount: number;
  description: string | null;
  type: "income" | "expense";
  goal_id: string | null;
}

const addDays = (iso: string, days: number): string => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const diffDays = (a: string, b: string): number =>
  Math.abs(
    Math.round(
      (new Date(`${a}T00:00:00`).getTime() -
        new Date(`${b}T00:00:00`).getTime()) /
        86400000
    )
  );

const similarity = (a: string, b: string): number => {
  const wordsA = new Set(a.toUpperCase().split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toUpperCase().split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let common = 0;
  wordsA.forEach((w) => {
    if (wordsB.has(w)) common++;
  });
  return common / Math.max(wordsA.size, wordsB.size);
};

/**
 * Busca candidatos de conciliação numa janela de datas cobrindo todo o lote.
 * Filtra reconciled_at IS NULL e user_id IS NOT NULL.
 */
export const fetchCandidates = async (
  userId: string,
  entries: RawStatementEntry[]
): Promise<CandidateTransaction[]> => {
  if (entries.length === 0) return [];

  const dates = entries.map((e) => e.postedAt).sort();
  const from = addDays(dates[0], -DAY_TOLERANCE);
  const to = addDays(dates[dates.length - 1], DAY_TOLERANCE);

  const { data, error } = await db
    .from("moneyzap_transactions")
    .select("id, date, amount, description, type, goal_id")
    .eq("user_id", userId)
    .not("user_id", "is", null)
    .is("reconciled_at", null)
    .gte("date", from)
    .lte("date", to)
    .limit(5000);

  if (error) {
    console.error("Error fetching reconciliation candidates:", error);
    return [];
  }

  return (data ?? []) as CandidateTransaction[];
};

export interface MatchOutcome {
  transactionId: string;
  score: number;
  reason: MatchReason;
}

/**
 * Nunca decide sozinho: apenas sinaliza a melhor suspeita.
 * `usedIds` evita que duas linhas do mesmo lote apontem para a mesma transação.
 */
export const findMatch = (
  entry: RawStatementEntry,
  candidates: CandidateTransaction[],
  usedIds: Set<string>
): MatchOutcome | null => {
  let best: MatchOutcome | null = null;

  candidates.forEach((candidate) => {
    if (usedIds.has(candidate.id)) return;
    if (candidate.type !== entry.direction) return;

    const days = diffDays(candidate.date, entry.postedAt);
    if (days > DAY_TOLERANCE) return;

    const candidateAmount = Number(candidate.amount);
    const diffValor = Math.abs(candidateAmount - entry.amount);
    const diffPct = diffValor / Math.max(candidateAmount, 0.01);

    if (diffValor > AMOUNT_TOLERANCE && diffPct > PCT_TOLERANCE) return;

    const score =
      0.6 * (1 - Math.min(diffValor / AMOUNT_TOLERANCE, 1)) +
      0.3 * (1 - days / DAY_TOLERANCE) +
      0.1 * similarity(candidate.description ?? "", entry.description);

    if (!best || score > best.score) {
      best = {
        transactionId: candidate.id,
        score: Number(score.toFixed(4)),
        reason: {
          diffValor: Number(diffValor.toFixed(2)),
          diffPct: Number((diffPct * 100).toFixed(2)),
          diffDias: days,
          candidato: {
            id: candidate.id,
            date: candidate.date,
            amount: candidateAmount,
            description: candidate.description ?? "",
            hasGoal: Boolean(candidate.goal_id),
          },
        },
      };
    }
  });

  return best;
};
