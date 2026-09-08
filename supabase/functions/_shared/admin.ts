import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export type AdminClient = ReturnType<typeof createClient>;

export const requireAdmin = async (req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return { error: json({ error: "Missing required environment variables" }, 500) };
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { error: json({ error: "Não autenticado" }, 401) };
  }

  const token = authHeader.replace("Bearer ", "");
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userError } =
    await adminClient.auth.getUser(token);

  if (userError || !userData.user) {
    return { error: json({ error: "Não autenticado" }, 401) };
  }

  const { data: profile, error: roleError } = await adminClient
    .from("moneyzap_users")
    .select("id, email, name, role")
    .eq("id", userData.user.id)
    .single();

  if (roleError || profile?.role !== "admin") {
    return {
      error: json(
        { error: "Acesso negado. Apenas administradores." },
        403
      ),
    };
  }

  return {
    adminClient,
    user: userData.user,
    profile,
    supabaseUrl,
    anonKey,
  };
};
