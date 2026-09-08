import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type VerifyOtpType =
  | "signup"
  | "invite"
  | "magiclink"
  | "recovery"
  | "email_change"
  | "email";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const requireAdmin = async (
  adminClient: ReturnType<typeof createClient>,
  token: string
) => {
  const { data: userData, error: userError } = await adminClient.auth.getUser(
    token
  );
  if (userError || !userData.user) {
    return { error: json({ error: "Não autenticado" }, 401) };
  }

  const { data: profile, error: roleError } = await adminClient
    .from("moneyzap_users")
    .select("id, email, name, role")
    .eq("id", userData.user.id)
    .single();

  if (roleError || profile?.role !== "admin") {
    return { error: json({ error: "Acesso negado. Apenas administradores." }, 403) };
  }

  return { user: userData.user, profile };
};

const mintUserSession = async (
  supabaseUrl: string,
  anonKey: string,
  adminClient: ReturnType<typeof createClient>,
  email: string
) => {
  const { data: linkData, error: linkError } =
    await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

  if (linkError || !linkData?.properties?.hashed_token) {
    throw new Error(
      linkError?.message || "Não foi possível gerar a sessão do usuário"
    );
  }

  const anonClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const hashedToken = linkData.properties.hashed_token;
  const verificationType = (linkData.properties.verification_type ||
    "magiclink") as VerifyOtpType;

  const attempts: Array<VerifyOtpType> = ["email", "magiclink", verificationType];

  let lastError: string | null = null;

  for (const type of [...new Set(attempts)]) {
    const { data, error } = await anonClient.auth.verifyOtp({
      token_hash: hashedToken,
      type,
    });
    if (!error && data.session?.access_token && data.session.refresh_token) {
      return data.session;
    }
    lastError = error?.message || lastError;
  }

  if (linkData.properties.email_otp) {
    const { data, error } = await anonClient.auth.verifyOtp({
      email,
      token: linkData.properties.email_otp,
      type: "magiclink",
    });
    if (!error && data.session?.access_token && data.session.refresh_token) {
      return data.session;
    }
    lastError = error?.message || lastError;
  }

  throw new Error(lastError || "Não foi possível criar a sessão do usuário");
};

const isIgnorableMissingRelation = (error: { code?: string; message?: string } | null) => {
  if (!error) return false;
  const message = error.message || "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST204" ||
    error.code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("Could not find the")
  );
};

const deleteUserCompletely = async (
  adminClient: ReturnType<typeof createClient>,
  userId: string
) => {
  const { data: uploads } = await adminClient
    .from("moneyzap_uploads")
    .select("file_path")
    .eq("user_id", userId);

  const filePaths = (uploads || [])
    .map((row) => row.file_path)
    .filter((path): path is string => Boolean(path));

  if (filePaths.length > 0) {
    const { error: storageError } = await adminClient.storage
      .from("uploads")
      .remove(filePaths);
    if (storageError) {
      console.warn("Failed to remove user uploads from storage:", storageError);
    }
  }

  const { error: unlinkLinesError } = await adminClient
    .from("moneyzap_statement_lines")
    .update({
      created_transaction_id: null,
      match_transaction_id: null,
      category_id: null,
      suggested_category_id: null,
    })
    .eq("user_id", userId);

  if (unlinkLinesError && !isIgnorableMissingRelation(unlinkLinesError)) {
    throw new Error(
      `Falha ao desvincular linhas de extrato: ${unlinkLinesError.message}`
    );
  }

  const { error: unlinkTransactionsError } = await adminClient
    .from("moneyzap_transactions")
    .update({
      statement_line_id: null,
      import_id: null,
      category_id: null,
      goal_id: null,
    })
    .eq("user_id", userId);

  if (
    unlinkTransactionsError &&
    !isIgnorableMissingRelation(unlinkTransactionsError)
  ) {
    throw new Error(
      `Falha ao desvincular transações: ${unlinkTransactionsError.message}`
    );
  }

  const relatedTables: Array<{ table: string; column?: string }> = [
    { table: "moneyzap_statement_lines" },
    { table: "moneyzap_statement_imports" },
    { table: "moneyzap_merchant_rules" },
    { table: "moneyzap_transactions" },
    { table: "moneyzap_goals" },
    { table: "moneyzap_categories" },
    { table: "moneyzap_subscriptions" },
    { table: "moneyzap_uploads" },
    { table: "moneyzap_impersonation_logs", column: "target_user_id" },
  ];

  for (const { table, column } of relatedTables) {
    const { error } = await adminClient
      .from(table)
      .delete()
      .eq(column || "user_id", userId);

    if (error && !isIgnorableMissingRelation(error)) {
      throw new Error(`Falha ao excluir dados em ${table}: ${error.message}`);
    }
  }

  const { error: rolesError } = await adminClient
    .from("user_roles")
    .delete()
    .eq("user_id", userId);

  if (rolesError && !isIgnorableMissingRelation(rolesError)) {
    throw new Error(`Falha ao excluir papéis do usuário: ${rolesError.message}`);
  }

  const { error: referralError } = await adminClient
    .from("moneyzap_users")
    .update({ referred_by: null })
    .eq("referred_by", userId);

  if (referralError && !isIgnorableMissingRelation(referralError)) {
    throw new Error(
      `Falha ao desvincular indicações: ${referralError.message}`
    );
  }

  const { error: profileError } = await adminClient
    .from("moneyzap_users")
    .delete()
    .eq("id", userId);

  if (profileError && !isIgnorableMissingRelation(profileError)) {
    throw new Error(`Falha ao excluir o perfil: ${profileError.message}`);
  }

  const { error: authDeleteError } =
    await adminClient.auth.admin.deleteUser(userId);

  if (
    authDeleteError &&
    !/user not found|not found/i.test(authDeleteError.message || "")
  ) {
    throw new Error(
      `Falha ao excluir o usuário da autenticação: ${authDeleteError.message}`
    );
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      throw new Error("Missing required environment variables");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Não autenticado" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const admin = await requireAdmin(adminClient, token);
    if ("error" in admin) return admin.error;

    const body = await req.json().catch(() => ({}));
    const action = body?.action as string | undefined;

    if (action === "list") {
      const { data: users, error } = await adminClient
        .from("moneyzap_users")
        .select("id, name, email, phone, role, is_active")
        .order("name", { ascending: true })
        .limit(500);

      if (error) {
        throw new Error(error.message);
      }

      return json({
        users: (users || []).map((user) => ({
          ...user,
          canImpersonate: user.role !== "admin" && user.id !== admin.user.id,
          canDelete: user.role !== "admin" && user.id !== admin.user.id,
        })),
      });
    }

    if (action === "start") {
      const userId = body?.userId as string | undefined;
      if (!userId) {
        return json({ error: "userId é obrigatório" }, 400);
      }

      if (userId === admin.user.id) {
        return json({ error: "Você já está nesta conta" }, 400);
      }

      const { data: targetProfile, error: targetError } = await adminClient
        .from("moneyzap_users")
        .select("id, name, email, role, is_active")
        .eq("id", userId)
        .single();

      if (targetError || !targetProfile) {
        return json({ error: "Usuário não encontrado" }, 404);
      }

      if (targetProfile.role === "admin") {
        return json(
          { error: "Não é permitido entrar como outro administrador" },
          403
        );
      }

      const { data: authUserData, error: authUserError } =
        await adminClient.auth.admin.getUserById(userId);

      if (authUserError || !authUserData.user?.email) {
        return json(
          { error: "Este usuário não tem e-mail de autenticação válido" },
          400
        );
      }

      const session = await mintUserSession(
        supabaseUrl,
        anonKey,
        adminClient,
        authUserData.user.email
      );

      const { error: auditError } = await adminClient
        .from("moneyzap_impersonation_logs")
        .insert({
          admin_id: admin.user.id,
          target_user_id: targetProfile.id,
          target_email: authUserData.user.email,
        });

      if (auditError) {
        console.warn("Failed to write impersonation audit log:", auditError);
      }

      return json({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user: {
          id: targetProfile.id,
          name: targetProfile.name,
          email: authUserData.user.email,
        },
      });
    }

    if (action === "delete") {
      const userId = body?.userId as string | undefined;
      if (!userId) {
        return json({ error: "userId é obrigatório" }, 400);
      }

      if (userId === admin.user.id) {
        return json({ error: "Você não pode excluir a própria conta" }, 400);
      }

      const { data: targetProfile, error: targetError } = await adminClient
        .from("moneyzap_users")
        .select("id, name, email, role")
        .eq("id", userId)
        .maybeSingle();

      if (targetError) {
        throw new Error(targetError.message);
      }

      if (targetProfile?.role === "admin") {
        return json(
          { error: "Não é permitido excluir outro administrador" },
          403
        );
      }

      await deleteUserCompletely(adminClient, userId);

      return json({
        success: true,
        user: {
          id: userId,
          email: targetProfile?.email ?? null,
        },
      });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (error) {
    console.error("impersonate-user error:", error);
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao gerenciar usuários",
      },
      500
    );
  }
});
