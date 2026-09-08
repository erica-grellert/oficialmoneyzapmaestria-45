import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  type AdminClient,
  corsHeaders,
  json,
  requireAdmin,
} from "../_shared/admin.ts";

const isIgnorableMissingRelation = (
  error: { code?: string; message?: string } | null
) => {
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
  adminClient: AdminClient,
  userId: string
) => {
  const { data: uploads } = await adminClient
    .from("moneyzap_uploads")
    .select("file_path")
    .eq("user_id", userId);

  const filePaths = (uploads || [])
    .map((row: { file_path: string | null }) => row.file_path)
    .filter((path: string | null): path is string => Boolean(path));

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

    const body = await req.json().catch(() => ({}));
    const action = body?.action as string | undefined;

    if (action === "list") {
      const { data: users, error } = await admin.adminClient
        .from("moneyzap_users")
        .select("id, name, email, phone, role, is_active")
        .order("name", { ascending: true })
        .limit(500);

      if (error) throw new Error(error.message);

      return json({
        users: (users || []).map((user: {
          id: string;
          name: string | null;
          email: string;
          phone: string | null;
          role: string;
          is_active: boolean;
        }) => ({
          ...user,
          canImpersonate:
            user.is_active &&
            user.role !== "admin" &&
            user.id !== admin.user.id,
          canDelete: user.role !== "admin" && user.id !== admin.user.id,
        })),
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

      const { data: targetProfile, error: targetError } =
        await admin.adminClient
          .from("moneyzap_users")
          .select("id, name, email, role")
          .eq("id", userId)
          .maybeSingle();

      if (targetError) throw new Error(targetError.message);

      if (targetProfile?.role === "admin") {
        return json(
          { error: "Não é permitido excluir outro administrador" },
          403
        );
      }

      await deleteUserCompletely(admin.adminClient, userId);

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
    console.error("admin-users error:", error);
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
