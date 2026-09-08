import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "mz_impersonation";
const CHANGE_EVENT = "mz-impersonation-changed";

export interface ImpersonationState {
  adminAccessToken: string;
  adminRefreshToken: string;
  adminEmail: string;
  targetUserId: string;
  targetEmail: string;
  targetName: string;
  startedAt: string;
}

export interface ImpersonationUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  canImpersonate: boolean;
  canDelete: boolean;
}

export interface AdminOverviewStats {
  activeUsers: number;
  totalTransactions: number;
  activeSubscriptions: number;
  nonRenewingSubscriptions: number;
}

const notify = () => {
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

export const getImpersonationState = (): ImpersonationState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ImpersonationState;
    if (!parsed?.adminRefreshToken || !parsed?.targetUserId) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const isImpersonating = (): boolean => getImpersonationState() !== null;

export const saveImpersonationState = (state: ImpersonationState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  notify();
};

export const clearImpersonationState = () => {
  localStorage.removeItem(STORAGE_KEY);
  notify();
};

export const subscribeImpersonation = (callback: () => void) => {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
};

const functionErrorMessage = async (data: unknown, error: unknown) => {
  if (data && typeof data === "object" && "error" in data) {
    const message = (data as { error?: unknown }).error;
    if (typeof message === "string" && message.trim()) return message;
  }

  if (error && typeof error === "object" && "context" in error) {
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === "function") {
      try {
        const body = await context.clone().json();
        if (typeof body?.error === "string" && body.error.trim()) {
          return body.error;
        }
      } catch {
        // Response body may already have been consumed.
      }
    }
  }

  if (error instanceof Error && error.message) return error.message;
  return "Erro inesperado";
};

export const listImpersonationUsers = async (): Promise<ImpersonationUser[]> => {
  const { data, error } = await supabase.functions.invoke("admin-users", {
    body: { action: "list" },
  });

  if (error) {
    throw new Error(await functionErrorMessage(data, error));
  }

  return (data?.users ?? []).map((user: ImpersonationUser) => ({
    ...user,
    canDelete: user.canDelete ?? (user.role !== "admin"),
  }));
};

export const getAdminOverviewStats = async (): Promise<AdminOverviewStats> => {
  const { data, error } = await supabase.functions.invoke(
    "admin-overview-stats"
  );

  if (error || data?.error || !data?.stats) {
    throw new Error(await functionErrorMessage(data, error));
  }

  return data.stats as AdminOverviewStats;
};

export const deleteUserCompletely = async (userId: string) => {
  const { data, error } = await supabase.functions.invoke("admin-users", {
    body: { action: "delete", userId },
  });

  if (error || data?.error) {
    throw new Error(await functionErrorMessage(data, error));
  }

  return data as { success: boolean; user: { id: string; email: string | null } };
};

export const startImpersonation = async (userId: string) => {
  const {
    data: { session: adminSession },
  } = await supabase.auth.getSession();

  if (!adminSession?.access_token || !adminSession.refresh_token) {
    throw new Error("Sessão de administrador não encontrada");
  }

  const { data, error } = await supabase.functions.invoke("impersonate-user", {
    body: { userId },
  });

  if (error) {
    throw new Error(await functionErrorMessage(data, error));
  }

  if (!data?.access_token || !data?.refresh_token || !data?.user) {
    throw new Error("Resposta inválida ao entrar como usuário");
  }

  saveImpersonationState({
    adminAccessToken: adminSession.access_token,
    adminRefreshToken: adminSession.refresh_token,
    adminEmail: adminSession.user.email || "",
    targetUserId: data.user.id,
    targetEmail: data.user.email,
    targetName: data.user.name || data.user.email,
    startedAt: new Date().toISOString(),
  });

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });

  if (sessionError) {
    clearImpersonationState();
    throw new Error(sessionError.message);
  }

  return data.user as { id: string; name: string | null; email: string };
};

export const stopImpersonation = async (): Promise<boolean> => {
  const saved = getImpersonationState();
  if (!saved) return false;

  // Clear first so role checks do not keep treating this session as impersonation.
  clearImpersonationState();

  const { error } = await supabase.auth.setSession({
    access_token: saved.adminAccessToken,
    refresh_token: saved.adminRefreshToken,
  });

  if (error) {
    await supabase.auth.signOut();
    throw new Error(
      "Não foi possível restaurar a sessão de administrador. Faça login novamente."
    );
  }

  return true;
};

export const logoutConsideringImpersonation = async (
  signOut: () => Promise<void>
): Promise<"restored" | "signed-out"> => {
  if (getImpersonationState()) {
    await stopImpersonation();
    return "restored";
  }
  await signOut();
  return "signed-out";
};
