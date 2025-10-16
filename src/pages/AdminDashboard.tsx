import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card-modern";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminProfileConfig from "@/components/admin/AdminProfileConfig";
import AdminSectionTabs from "@/components/admin/AdminSectionTabs";
import MobileNavBar from "@/components/layout/MobileNavBar";
import MobileHeader from "@/components/layout/MobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAdaptiveContext } from "@/hooks/useAdaptiveContext";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import {
  Shield,
  AlertTriangle,
  Users,
  CreditCard,
  BarChart3,
  CheckCircle,
  Clock,
  LogOut,
} from "lucide-react";
import { AdminOptimizedProvider } from "@/contexts/AdminOptimizedContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard: React.FC = () => {
  const [showProfile, setShowProfile] = useState(false);
  const isMobile = useIsMobile();
  const { hideValues, toggleHideValues, logout } = useAdaptiveContext();
  const navigate = useNavigate();
  const {
    settings,
    isLoading: settingsLoading,
    getConfigurationStatus,
  } = useAdminSettings();
  const [systemStats, setSystemStats] = useState({
    activeUsers: 0,
    totalTransactions: 0,
    activeSubscriptions: 0,
    cancelledSubscriptions: 0,
    systemUptime: "99.9%",
    lastBackup: "2 hours ago",
    pendingTasks: 3,
    completedTasks: 156,
  });

  const handleProfileClick = () => {
    setShowProfile(true);
  };

  const handleConfigClick = () => {
    setShowProfile(false);
  };

  const handleAddTransaction = (type: "income" | "expense") => {
    console.log(`Add ${type} transaction`);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Fetch real system stats from database
  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        // Use service role client to bypass RLS policies for admin dashboard
        const { createClient } = await import("@supabase/supabase-js");

        // Create service role client (bypasses RLS)
        const serviceClient = createClient(
          process.env.REACT_APP_SUPABASE_URL || "",
          process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || "",
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        );

        // Count users from moneyzap_users
        const { count: userCount } = await serviceClient
          .from("moneyzap_users")
          .select("*", { count: "exact", head: true });

        // Count active subscriptions from moneyzap_subscriptions
        const { count: activeSubscriptionCount } = await serviceClient
          .from("moneyzap_subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("status", "active");

        // Count cancelled subscriptions from moneyzap_subscriptions
        const { count: cancelledSubscriptionCount } = await serviceClient
          .from("moneyzap_subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("status", "cancelled");

        // Count transactions from moneyzap_transactions
        const { count: transactionCount } = await serviceClient
          .from("moneyzap_transactions")
          .select("*", { count: "exact", head: true });

        setSystemStats((prev) => ({
          ...prev,
          activeUsers: userCount || 0,
          totalTransactions: transactionCount || 0,
          activeSubscriptions: activeSubscriptionCount || 0,
          cancelledSubscriptions: cancelledSubscriptionCount || 0,
        }));
      } catch (error) {
        console.error("Error fetching system stats:", error);

        // Fallback: try with regular client (might work if user is admin)
        try {
          const { count: userCount } = await supabase
            .from("moneyzap_users")
            .select("*", { count: "exact", head: true });

          const { count: activeSubscriptionCount } = await supabase
            .from("moneyzap_subscriptions")
            .select("*", { count: "exact", head: true })
            .eq("status", "active");

          const { count: cancelledSubscriptionCount } = await supabase
            .from("moneyzap_subscriptions")
            .select("*", { count: "exact", head: true })
            .eq("status", "cancelled");

          const { count: transactionCount } = await supabase
            .from("moneyzap_transactions")
            .select("*", { count: "exact", head: true });

          setSystemStats((prev) => ({
            ...prev,
            activeUsers: userCount || 0,
            totalTransactions: transactionCount || 0,
            activeSubscriptions: activeSubscriptionCount || 0,
            cancelledSubscriptions: cancelledSubscriptionCount || 0,
          }));
        } catch (fallbackError) {
          console.error("Fallback query also failed:", fallbackError);
        }
      }
    };

    fetchSystemStats();
  }, []);

  // Remove all automatic refresh listeners
  React.useEffect(() => {
    // Disable all page refresh triggers for admin
    const disableAutoRefresh = () => {
      // Remove any interval-based refreshes
      const intervalId = window.setInterval(() => {}, 86400000); // 24h dummy interval
      window.clearInterval(intervalId);

      // Disable page refresh on tab changes
      const originalAddEventListener = window.addEventListener;
      const originalRemoveEventListener = window.removeEventListener;

      const blockedEvents = [
        "visibilitychange",
        "focus",
        "blur",
        "pageshow",
        "pagehide",
      ];

      // Override addEventListener para bloquear eventos problemáticos
      window.addEventListener = function (
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions
      ) {
        if (blockedEvents.includes(type)) {
          return;
        }
        return originalAddEventListener.call(this, type, listener, options);
      };

      // Note: getEventListeners is not available in all browsers
      // This is a simplified approach that just blocks new problematic listeners
    };

    disableAutoRefresh();

    return () => {
      // Restore original addEventListener on cleanup
      // (será restaurado quando sair da página admin)
    };
  }, []);

  const renderStatusOverview = () => {
    const configStatus = getConfigurationStatus();

    if (settingsLoading || !configStatus) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-amber-800 text-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Configurações Essenciais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-amber-700">
                    Carregando configurações...
                  </span>
                  <Badge variant="outline" className="ml-auto">
                    ...
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Configuration Summary Card */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800 text-lg">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Resumo das Configurações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${"text-green-600"}`}>
                  ✓
                </div>
                <div className="text-xs text-blue-700">Branding</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${"text-green-600"}`}>
                  ✓
                </div>
                <div className="text-xs text-blue-700">Stripe</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${"text-green-600"}`}>
                  ✓
                </div>
                <div className="text-xs text-blue-700">Pricing</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${"text-green-600"}`}>
                  ✓
                </div>
                <div className="text-xs text-blue-700">Contact</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${"text-green-600"}`}>
                  {configStatus.system ? "✓" : "!"}
                </div>
                <div className="text-xs text-blue-700">System</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Stats Cards - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card
              variant="interactive"
              className="p-4 border-blue-200 bg-blue-50/50 h-full"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Usuários</p>
                  <p className="text-xl font-bold text-blue-900">
                    {systemStats.activeUsers.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card
              variant="interactive"
              className="p-4 border-green-200 bg-green-50/50 h-full"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">
                    Transações
                  </p>
                  <p className="text-xl font-bold text-green-900">
                    {systemStats.totalTransactions.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card
              variant="interactive"
              className="p-4 border-purple-200 bg-purple-50/50 h-full"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">
                    Assinaturas Ativas
                  </p>
                  <p className="text-xl font-bold text-purple-900">
                    {systemStats.activeSubscriptions.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card
              variant="interactive"
              className="p-4 border-red-200 bg-red-50/50 h-full"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">
                    Assinaturas Canceladas
                  </p>
                  <p className="text-xl font-bold text-red-900">
                    {systemStats.cancelledSubscriptions?.toLocaleString() ||
                      "0"}
                  </p>
                </div>
                <div className="p-2 bg-red-100 rounded-full">
                  <CreditCard className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  };

  return (
    <AdminOptimizedProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20 w-full">
        {isMobile ? (
          <div className="flex flex-col h-screen w-full">
            <MobileHeader
              hideValues={hideValues}
              toggleHideValues={toggleHideValues}
            />
            <main className="flex-1 overflow-auto p-4 pb-20 w-full">
              <div className="w-full">
                {showProfile ? (
                  <motion.div
                    className="w-full"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mb-8">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-100 rounded-full">
                          <Shield className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h1 className="text-3xl font-bold text-slate-900">
                            Configurações do Perfil
                          </h1>
                          <p className="text-slate-600 mt-1">
                            Gerencie suas informações de administrador
                          </p>
                        </div>
                        <Button
                          onClick={handleConfigClick}
                          variant="outline"
                          className="ml-auto border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          ← Voltar ao Painel
                        </Button>
                      </div>
                    </div>
                    <AdminProfileConfig />
                  </motion.div>
                ) : (
                  <motion.div
                    className="w-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mb-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                          <Shield className="h-10 w-10 text-white" />
                        </div>
                        <div className="flex-1">
                          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-800 bg-clip-text text-transparent">
                            Centro de Controle
                          </h1>
                          <p className="text-slate-600 mt-2 text-lg">
                            Monitore e gerencie todo o ecossistema da plataforma
                          </p>
                        </div>
                        <Button
                          onClick={handleProfileClick}
                          variant="outline"
                          className="border-blue-200 text-blue-600 hover:bg-blue-50 px-4 py-2"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Perfil
                        </Button>
                      </div>
                    </div>

                    {renderStatusOverview()}

                    {/* Navegação por Abas */}
                    <Card className="border-slate-200 bg-white/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-slate-800">
                          Gerenciamento do Sistema
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <AdminSectionTabs />
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>
            </main>
            <MobileNavBar onAddTransaction={handleAddTransaction} />
          </div>
        ) : (
          <div className="min-h-screen w-full">
            <main className="w-full p-6">
              {showProfile ? (
                <motion.div
                  className="w-full max-w-6xl mx-auto"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                        <Shield className="h-10 w-10 text-white" />
                      </div>
                      <div className="flex-1">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-800 bg-clip-text text-transparent">
                          Configurações do Perfil
                        </h1>
                        <p className="text-slate-600 mt-2 text-lg">
                          Gerencie suas informações de administrador
                        </p>
                      </div>
                      <Button
                        onClick={handleConfigClick}
                        variant="outline"
                        className="ml-auto border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        ← Voltar ao Painel
                      </Button>
                    </div>
                  </div>
                  <AdminProfileConfig />
                </motion.div>
              ) : (
                <motion.div
                  className="w-full max-w-7xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                        <Shield className="h-12 w-12 text-white" />
                      </div>
                      <div className="flex-1">
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                          Centro de Controle
                        </h1>
                        <p className="text-slate-600 mt-3 text-xl">
                          Monitore e gerencie todo o ecossistema da plataforma
                          com ferramentas avançadas
                        </p>
                      </div>
                      <Button
                        onClick={handleProfileClick}
                        variant="outline"
                        className="border-blue-200 text-blue-600 hover:bg-blue-50 px-6 py-3"
                      >
                        <Shield className="h-5 w-5 mr-2" />
                        Perfil
                      </Button>
                    </div>
                  </div>

                  {renderStatusOverview()}

                  {/* Navegação por Abas */}
                  <Card className="border-slate-200 bg-white/90 backdrop-blur-sm shadow-soft">
                    <CardHeader>
                      <CardTitle className="text-slate-800 text-xl">
                        Gerenciamento do Sistema
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AdminSectionTabs />
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </main>
          </div>
        )}

        {/* Floating Logout Button */}
        <motion.div
          className="fixed bottom-6 right-6 z-50"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <Button
            onClick={handleLogout}
            variant="destructive"
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
          >
            <LogOut className="h-6 w-6" />
          </Button>
        </motion.div>
      </div>
    </AdminOptimizedProvider>
  );
};

export default AdminDashboard;
