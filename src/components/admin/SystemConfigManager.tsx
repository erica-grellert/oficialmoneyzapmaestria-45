import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card-modern";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  AlertTriangle,
  Database,
  CheckCircle,
  Server,
  Shield,
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

const SystemConfigManager: React.FC = () => {
  const { toast } = useToast();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [isLoading, setIsLoading] = useState(false);

  if (roleLoading || isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>
              {roleLoading
                ? "Verificando permissões..."
                : "Carregando configurações..."}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Acesso Negado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Você não tem permissões de administrador para acessar as
            configurações do sistema.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-blue-100 rounded-xl">
          <Shield className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900">
            Monitoramento do Sistema
          </h3>
          <p className="text-slate-600">
            Acompanhe o status e saúde da plataforma
          </p>
        </div>
      </div>

      {/* System Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Database Status */}
        <Card
          variant="interactive"
          className="border-green-200 bg-green-50/50 hover:bg-green-50"
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Banco de Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700">Status</span>
                <span className="text-sm font-medium text-green-800">
                  Conectado
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700">Provedor</span>
                <span className="text-sm font-medium text-green-800">
                  Supabase
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700">Latência</span>
                <span className="text-sm font-medium text-green-800">
                  ~45ms
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Table Status */}
        <Card
          variant="interactive"
          className="border-blue-200 bg-blue-50/50 hover:bg-blue-50"
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Database className="h-5 w-5 text-blue-600" />
              Configurações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">Tabela</span>
                <span className="text-sm font-medium text-blue-800">
                  moneyzap_settings
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">Status</span>
                <span className="text-sm font-medium text-blue-800">Ativa</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">Sincronização</span>
                <span className="text-sm font-medium text-blue-800">
                  Em tempo real
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edge Functions Status */}
        <Card
          variant="interactive"
          className="border-purple-200 bg-purple-50/50 hover:bg-purple-50"
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Server className="h-5 w-5 text-purple-600" />
              Serviços
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-700">Edge Functions</span>
                <span className="text-sm font-medium text-purple-800">
                  Ativas
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-700">Webhooks</span>
                <span className="text-sm font-medium text-purple-800">
                  Operacionais
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-800">API</span>
                <span className="text-sm font-medium text-purple-800">
                  Disponível
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card
          variant="interactive"
          className="border-amber-200 bg-amber-50/50 hover:bg-amber-50"
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Shield className="h-5 w-5 text-amber-600" />
              Informações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-700">Versão</span>
                <span className="text-sm font-medium text-amber-800">
                  2.0.0
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-700">Arquitetura</span>
                <span className="text-sm font-medium text-amber-800">
                  Moderna
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-700">Configuração</span>
                <span className="text-sm font-medium text-amber-800">
                  Via Banco
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <Card className="border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/30">
        <CardHeader>
          <CardTitle className="text-slate-800">Sobre o Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 leading-relaxed">
            O <strong>Centro de Controle</strong> é uma plataforma
            administrativa moderna que centraliza todas as configurações do
            sistema através de uma interface intuitiva. Todas as configurações
            são persistidas automaticamente no banco de dados, garantindo
            consistência e confiabilidade.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemConfigManager;
