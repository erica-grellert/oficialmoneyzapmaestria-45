export type SubscriptionAccessState =
  | "paying"
  | "trialing"
  | "delinquent"
  | "inactive";

const DELINQUENT_STATUSES = new Set(["past_due", "unpaid"]);
const MANAGEABLE_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
]);

export interface SubscriptionAccessInput {
  status?: string | null;
  current_period_end?: string | null;
}

export function isPeriodExpired(
  currentPeriodEnd: string | null | undefined,
  now = new Date()
): boolean {
  if (!currentPeriodEnd) return false;
  const end = new Date(currentPeriodEnd);
  if (Number.isNaN(end.getTime())) return false;
  return now.getTime() > end.getTime();
}

export function getSubscriptionAccessState(
  status: string | null | undefined,
  currentPeriodEnd?: string | null,
  now = new Date()
): SubscriptionAccessState {
  const normalized = (status ?? "").toLowerCase();
  if (DELINQUENT_STATUSES.has(normalized)) return "delinquent";

  const expired = isPeriodExpired(currentPeriodEnd, now);
  if (normalized === "trialing" && !expired) return "trialing";
  if (normalized === "active" && !expired) return "paying";
  return "inactive";
}

export function hasSubscriptionAccess(
  status: string | null | undefined,
  currentPeriodEnd?: string | null,
  now = new Date()
): boolean {
  const state = getSubscriptionAccessState(status, currentPeriodEnd, now);
  return state === "paying" || state === "trialing";
}

export function canManageBilling(status: string | null | undefined): boolean {
  return MANAGEABLE_STATUSES.has((status ?? "").toLowerCase());
}

export function pickSubscription<T extends SubscriptionAccessInput>(
  rows: T[],
  now = new Date()
): T | null {
  if (!rows.length) return null;

  const withAccess = rows.find((row) =>
    hasSubscriptionAccess(row.status, row.current_period_end, now)
  );
  if (withAccess) return withAccess;

  const delinquent = rows.find(
    (row) =>
      getSubscriptionAccessState(row.status, row.current_period_end, now) ===
      "delinquent"
  );
  if (delinquent) return delinquent;

  return rows[0];
}
