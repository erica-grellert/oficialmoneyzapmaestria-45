import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  type AdminClient,
  corsHeaders,
  json,
  requireAdmin,
} from "../_shared/admin.ts";

type VerifyOtpType =
  | "signup"
  | "invite"
  | "magiclink"
  | "recovery"
  | "email_change"
  | "email";

const mintUserSession = async (
  supabaseUrl: string,
  anonKey: string,
  adminClient: AdminClient,
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
  const attempts: Array<VerifyOtpType> = [
    "email",
    "magiclink",
    verificationType,
  ];

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

    if (!admin.anonKey) {
      return json({ error: "Missing SUPABASE_ANON_KEY" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const userId = body?.userId as string | undefined;

    if (!userId) {
      return json({ error: "userId é obrigatório" }, 400);
    }

    if (userId === admin.user.id) {
      return json({ error: "Você já está nesta conta" }, 400);
    }

    const { data: targetProfile, error: targetError } =
      await admin.adminClient
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

    if (!targetProfile.is_active) {
      return json({ error: "Este usuário está inativo" }, 400);
    }

    const { data: authUserData, error: authUserError } =
      await admin.adminClient.auth.admin.getUserById(userId);

    if (authUserError || !authUserData.user?.email) {
      return json(
        { error: "Este usuário não tem e-mail de autenticação válido" },
        400
      );
    }

    const session = await mintUserSession(
      admin.supabaseUrl,
      admin.anonKey,
      admin.adminClient,
      authUserData.user.email
    );

    const { error: auditError } = await admin.adminClient
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
  } catch (error) {
    console.error("impersonate-user error:", error);
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao entrar como usuário",
      },
      500
    );
  }
});
