import React from "react";
import { Navigate } from "react-router-dom";
import { useAdaptiveContext } from "@/hooks/useAdaptiveContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent } from "@/components/ui/card-modern";
import { Shield, Lock } from "lucide-react";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user } = useAdaptiveContext();
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  // Se ainda está carregando autenticação ou role
  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">
            Carregando Centro de Controle...
          </p>
        </div>
      </div>
    );
  }

  // Se não está logado, redireciona para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se não é admin, mostra página de acesso negado
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20">
        <Card className="w-full max-w-md mx-4 border-red-200 bg-red-50/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 mb-4 shadow-lg">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-red-800 mb-2">
                Acesso Restrito
              </h3>
              <p className="text-sm text-red-700 mb-4">
                Esta área é exclusiva para administradores do sistema. Entre em
                contato com um administrador para solicitar acesso.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-red-600 bg-red-100 px-3 py-2 rounded-lg">
                <Shield className="h-4 w-4" />
                <span>Centro de Controle - Área Restrita</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se é admin, renderiza o conteúdo
  return <>{children}</>;
};

export default AdminRoute;
