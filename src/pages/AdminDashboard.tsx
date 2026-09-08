import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import {
  ArrowLeft,
  BarChart3,
  CreditCard,
  LogOut,
  RefreshCw,
  Shield,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminProfileConfig from "@/components/admin/AdminProfileConfig";
import UserImpersonationManager from "@/components/admin/UserImpersonationManager";
import AdminConstellation from "@/components/admin/experience/AdminConstellation";
import AdminMetricCard from "@/components/admin/experience/AdminMetricCard";
import AdminWorkspaceNav from "@/components/admin/experience/AdminWorkspaceNav";
import AdminWorkspacePanel from "@/components/admin/experience/AdminWorkspacePanel";
import {
  getAdminWorkspace,
  type AdminWorkspaceId,
} from "@/components/admin/experience/adminWorkspaces";
import { AdminOptimizedProvider } from "@/contexts/AdminOptimizedContext";
import { useAdaptiveContext } from "@/hooks/useAdaptiveContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePrefersReducedMotion } from "@/hooks/useAdminExperience";
import { logoutConsideringImpersonation } from "@/lib/impersonation";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import "@/styles/admin-editorial.css";

interface SystemStats {
  activeUsers: number;
  totalTransactions: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
}

type StatsStatus = "loading" | "ready" | "error";

const EMPTY_STATS: SystemStats = {
  activeUsers: 0,
  totalTransactions: 0,
  activeSubscriptions: 0,
  cancelledSubscriptions: 0,
};

const AdminDashboard: React.FC = () => {
  const isMobile = useIsMobile();
  const reducedMotion = usePrefersReducedMotion();
  const { logout } = useAdaptiveContext();
  const navigate = useNavigate();
  const shellRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [activeWorkspace, setActiveWorkspace] =
    useState<AdminWorkspaceId>("overview");
  const [systemStats, setSystemStats] = useState<SystemStats>(EMPTY_STATS);
  const [statsStatus, setStatsStatus] = useState<StatsStatus>("loading");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentWorkspace = useMemo(
    () => getAdminWorkspace(activeWorkspace),
    [activeWorkspace]
  );

  const fetchSystemStats = useCallback(async (manual = false) => {
    try {
      if (manual) setIsRefreshing(true);
      else setStatsStatus("loading");

      const [
        { count: userCount, error: userError },
        { count: activeSubscriptionCount, error: activeError },
        { count: cancelledSubscriptionCount, error: cancelledError },
        { count: transactionCount, error: transactionError },
      ] = await Promise.all([
        supabase.from("moneyzap_users").select("*", { count: "exact", head: true }),
        supabase
          .from("moneyzap_subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("status", "active"),
        supabase
          .from("moneyzap_subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("status", "cancelled"),
        supabase
          .from("moneyzap_transactions")
          .select("*", { count: "exact", head: true }),
      ]);

      if (userError || activeError || cancelledError || transactionError) {
        throw userError || activeError || cancelledError || transactionError;
      }

      setSystemStats({
        activeUsers: userCount || 0,
        totalTransactions: transactionCount || 0,
        activeSubscriptions: activeSubscriptionCount || 0,
        cancelledSubscriptions: cancelledSubscriptionCount || 0,
      });
      setStatsStatus("ready");
    } catch (error) {
      console.error("Error fetching system stats:", error);
      setStatsStatus("error");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchSystemStats();
  }, [fetchSystemStats]);

  useEffect(() => {
    if (!shellRef.current || reducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-admin-reveal]",
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.08,
          ease: "power3.out",
        }
      );
    }, shellRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  useEffect(() => {
    if (!contentRef.current || reducedMotion) return;

    gsap.fromTo(
      contentRef.current,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
    );
  }, [activeWorkspace, reducedMotion]);

  const handleLogout = async () => {
    const result = await logoutConsideringImpersonation(logout);
    navigate(result === "restored" ? "/admin" : "/");
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <section
        data-admin-reveal
        className="admin-surface relative overflow-hidden p-6 md:p-8"
      >
        <AdminConstellation stats={systemStats} />
        <div className="relative z-[1] grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="admin-gold-chip mb-5">
              <Shield className="h-3.5 w-3.5" />
              Centro de Controle
            </div>
            <h1 className="admin-display text-4xl md:text-6xl">
              Operação com
              <br />
              precisão editorial.
            </h1>
            <p className="mt-4 max-w-xl text-sm text-[var(--admin-muted)] md:text-base">
              Monitore métricas, entre como usuário, ajuste a plataforma e
              recupere falhas operacionais em um único workspace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                type="button"
                className="admin-button-ink rounded-xl"
                onClick={() => setActiveWorkspace("users")}
              >
                <Users className="mr-2 h-4 w-4" />
                Abrir usuários
              </Button>
              <Button
                type="button"
                variant="outline"
                className="admin-button-ghost rounded-xl"
                onClick={() => void fetchSystemStats(true)}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Atualizar métricas
              </Button>
            </div>
          </div>

          <div className="admin-surface-quiet relative min-h-[220px] overflow-hidden p-5">
            <p className="admin-kicker">Constelação do sistema</p>
            <p className="mt-3 max-w-xs text-sm text-[var(--admin-muted)]">
              Densidade e pulso reagem às métricas ao vivo. Em dispositivos
              leves, uma versão estática preserva o clima visual.
            </p>
            <div className="admin-hairline my-5" />
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-[var(--admin-muted)]">Usuários</dt>
                <dd className="mt-1 font-semibold">
                  {statsStatus === "ready" ? systemStats.activeUsers : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--admin-muted)]">Transações</dt>
                <dd className="mt-1 font-semibold">
                  {statsStatus === "ready" ? systemStats.totalTransactions : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--admin-muted)]">Ativas</dt>
                <dd className="mt-1 font-semibold">
                  {statsStatus === "ready"
                    ? systemStats.activeSubscriptions
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--admin-muted)]">Canceladas</dt>
                <dd className="mt-1 font-semibold">
                  {statsStatus === "ready"
                    ? systemStats.cancelledSubscriptions
                    : "—"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {statsStatus === "error" ? (
        <div className="admin-surface border-orange-200 bg-orange-50/70 p-5">
          <p className="font-semibold text-[var(--admin-danger)]">
            Não foi possível carregar as métricas.
          </p>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            Verifique a conexão e tente novamente. Os workspaces operacionais
            continuam disponíveis.
          </p>
          <Button
            type="button"
            variant="outline"
            className="admin-button-ghost mt-4 rounded-xl"
            onClick={() => void fetchSystemStats(true)}
          >
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div
          data-admin-reveal
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <AdminMetricCard
            label="Usuários"
            value={systemStats.activeUsers}
            hint="Contas registradas na plataforma"
            icon={Users}
            loading={statsStatus === "loading"}
          />
          <AdminMetricCard
            label="Transações"
            value={systemStats.totalTransactions}
            hint="Movimentações totais registradas"
            icon={BarChart3}
            loading={statsStatus === "loading"}
            tone="gold"
          />
          <AdminMetricCard
            label="Assinaturas ativas"
            value={systemStats.activeSubscriptions}
            hint="Planos com status ativo"
            icon={CreditCard}
            loading={statsStatus === "loading"}
          />
          <AdminMetricCard
            label="Assinaturas canceladas"
            value={systemStats.cancelledSubscriptions}
            hint="Planos encerrados"
            icon={CreditCard}
            loading={statsStatus === "loading"}
            tone="danger"
          />
        </div>
      )}

      <div data-admin-reveal>
        <UserImpersonationManager />
      </div>
    </div>
  );

  const renderWorkspace = () => {
    if (activeWorkspace === "overview") return renderOverview();
    if (activeWorkspace === "users") return <UserImpersonationManager />;
    if (activeWorkspace === "profile") {
      return (
        <section className="space-y-5">
          <header className="admin-surface p-6">
            <p className="admin-kicker">Conta administrativa</p>
            <h2 className="admin-display mt-2 text-3xl md:text-4xl">
              Configurações do perfil
            </h2>
            <p className="mt-2 text-sm text-[var(--admin-muted)]">
              Gerencie nome, e-mail e senha do administrador.
            </p>
          </header>
          <div className="admin-surface p-4 md:p-6">
            <AdminProfileConfig />
          </div>
        </section>
      );
    }

    return <AdminWorkspacePanel workspaceId={activeWorkspace} />;
  };

  return (
    <AdminOptimizedProvider>
      <div className="admin-editorial">
        <div ref={shellRef} className="admin-shell mx-auto max-w-[1600px]">
          <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside
              data-admin-reveal
              className="hidden border-r border-[var(--admin-line)] px-4 py-6 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col"
            >
              <div className="mb-8 px-2">
                <p className="admin-kicker">Meu Controle.AI</p>
                <h2 className="admin-display mt-2 text-3xl">Admin</h2>
                <p className="mt-2 text-sm text-[var(--admin-muted)]">
                  Workspace operacional
                </p>
              </div>

              <div className="flex-1 overflow-y-auto pr-1">
                <AdminWorkspaceNav
                  activeId={activeWorkspace}
                  onSelect={setActiveWorkspace}
                />
              </div>

              <div className="mt-6 space-y-2 border-t border-[var(--admin-line)] pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="admin-button-ghost w-full justify-start rounded-xl"
                  onClick={() => setActiveWorkspace("profile")}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Perfil
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start rounded-xl border-orange-200 text-[var(--admin-danger)] hover:bg-orange-50"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </div>
            </aside>

            <main className="px-4 py-5 md:px-6 md:py-7 lg:px-8">
              <header
                data-admin-reveal
                className="admin-surface sticky top-3 z-20 mb-5 flex flex-col gap-4 p-4 backdrop-blur-xl md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <p className="admin-kicker">
                    {currentWorkspace?.group === "plataforma"
                      ? "Plataforma"
                      : "Operação"}
                  </p>
                  <h1 className="admin-display mt-1 truncate text-2xl md:text-3xl">
                    {activeWorkspace === "profile"
                      ? "Perfil"
                      : currentWorkspace?.label || "Admin"}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {activeWorkspace !== "overview" && (
                    <Button
                      type="button"
                      variant="outline"
                      className="admin-button-ghost rounded-xl"
                      onClick={() => setActiveWorkspace("overview")}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Visão geral
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="admin-button-ghost rounded-xl lg:hidden"
                    onClick={() => setActiveWorkspace("profile")}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Perfil
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-orange-200 text-[var(--admin-danger)] hover:bg-orange-50 lg:hidden"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </Button>
                </div>
              </header>

              {isMobile && (
                <div data-admin-reveal className="mb-5">
                  <AdminWorkspaceNav
                    activeId={activeWorkspace}
                    onSelect={setActiveWorkspace}
                    compact
                  />
                </div>
              )}

              <div ref={contentRef}>{renderWorkspace()}</div>
            </main>
          </div>
        </div>
      </div>
    </AdminOptimizedProvider>
  );
};

export default AdminDashboard;
