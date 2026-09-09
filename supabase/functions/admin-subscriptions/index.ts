import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders, json, requireAdmin } from "../_shared/admin.ts";

type SubscriptionRow = {
  id: string;
  user_id: string | null;
  status: string;
  plan_type: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
};

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

    const { data: subscriptions, error } = await admin.adminClient
      .from("moneyzap_subscriptions")
      .select(
        "id, user_id, status, plan_type, current_period_start, current_period_end, cancel_at_period_end, stripe_subscription_id, stripe_customer_id, created_at, updated_at"
      )
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) throw new Error(error.message);

    const rows = (subscriptions || []) as SubscriptionRow[];
    const userIds = [
      ...new Set(
        rows
          .map((row) => row.user_id)
          .filter((id): id is string => Boolean(id))
      ),
    ];

    let usersById: Record<string, UserRow> = {};

    if (userIds.length > 0) {
      const { data: users, error: usersError } = await admin.adminClient
        .from("moneyzap_users")
        .select("id, name, email, phone")
        .in("id", userIds);

      if (usersError) throw new Error(usersError.message);

      usersById = Object.fromEntries(
        ((users || []) as UserRow[]).map((user) => [user.id, user])
      );
    }

    return json({
      subscriptions: rows.map((row) => ({
        ...row,
        user: row.user_id ? usersById[row.user_id] ?? null : null,
      })),
    });
  } catch (error) {
    console.error("admin-subscriptions error:", error);
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao listar assinaturas",
      },
      500
    );
  }
});
