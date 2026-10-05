import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  corsHeaders,
  json,
  requireAdmin,
} from "../_shared/admin.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Método não permitido" }, 405);
  }

  try {
    const admin = await requireAdmin(req);
    if ("error" in admin) return admin.error;

    const now = Date.now();
    const [
      { count: userCount, error: userError },
      { count: transactionCount, error: transactionError },
      { data: subscriptions, error: subscriptionsError },
    ] = await Promise.all([
      admin.adminClient
        .from("moneyzap_users")
        .select("*", { count: "exact", head: true }),
      admin.adminClient
        .from("moneyzap_transactions")
        .select("*", { count: "exact", head: true }),
      admin.adminClient
        .from("moneyzap_subscriptions")
        .select("status, cancel_at_period_end, current_period_end"),
    ]);

    const statsError =
      userError ||
      transactionError ||
      subscriptionsError;

    if (statsError) {
      throw new Error(statsError.message);
    }

    const subscriptionRows = (subscriptions || []) as Array<{
      status: string;
      cancel_at_period_end: boolean | null;
      current_period_end: string | null;
    }>;

    const periodIsCurrent = (subscription: {
      current_period_end: string | null;
    }) =>
      !subscription.current_period_end ||
      new Date(subscription.current_period_end).getTime() > now;

    const activeSubscriptionCount = subscriptionRows.filter((subscription) => {
      return (
        subscription.status.toLowerCase() === "active" &&
        !subscription.cancel_at_period_end &&
        periodIsCurrent(subscription)
      );
    }).length;

    const trialingSubscriptionCount = subscriptionRows.filter(
      (subscription) =>
        subscription.status.toLowerCase() === "trialing" &&
        periodIsCurrent(subscription)
    ).length;

    const delinquentSubscriptionCount = subscriptionRows.filter(
      (subscription) => {
        const normalizedStatus = subscription.status.toLowerCase();
        return normalizedStatus === "past_due" || normalizedStatus === "unpaid";
      }
    ).length;

    const nonRenewingSubscriptionCount = subscriptionRows.filter(
      (subscription) => {
        const normalizedStatus = subscription.status.toLowerCase();
        const periodExpired =
          !!subscription.current_period_end &&
          new Date(subscription.current_period_end).getTime() <= now;

        return (
          subscription.cancel_at_period_end === true ||
          normalizedStatus === "canceled" ||
          normalizedStatus === "cancelled" ||
          (normalizedStatus === "active" && periodExpired)
        );
      }
    ).length;

    return json({
      stats: {
        activeUsers: userCount || 0,
        totalTransactions: transactionCount || 0,
        activeSubscriptions: activeSubscriptionCount,
        trialingSubscriptions: trialingSubscriptionCount,
        delinquentSubscriptions: delinquentSubscriptionCount,
        nonRenewingSubscriptions: nonRenewingSubscriptionCount,
      },
    });
  } catch (error) {
    console.error("admin-overview-stats error:", error);
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao carregar métricas administrativas",
      },
      500
    );
  }
});
