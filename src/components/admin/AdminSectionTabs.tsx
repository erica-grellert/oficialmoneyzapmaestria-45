import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Palette,
  CreditCard,
  DollarSign,
  Phone,
  Settings,
  Gift,
} from "lucide-react";
import BrandingConfigManager from "./BrandingConfigManager";
import StripeConfigManager from "./StripeConfigManager";
import PlanPricingManager from "./PlanPricingManager";
import ContactConfigManager from "./ContactConfigManager";
import ReferralAnalytics from "./ReferralAnalytics";

const AdminSectionTabs: React.FC = () => {
  return (
    <Tabs defaultValue="branding" className="w-full">
      {/* Enhanced Tab Navigation */}
      <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 p-2 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-2xl h-auto border border-slate-200/50 shadow-sm">
        <TabsTrigger
          value="branding"
          className="group flex items-center gap-3 px-6 py-4 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-900 data-[state=active]:border-slate-200 rounded-xl transition-all duration-300 hover:bg-white/80 hover:shadow-md border border-transparent data-[state=active]:border-purple-200"
        >
          <div className="p-2.5 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl group-data-[state=active]:from-purple-500 group-data-[state=active]:to-purple-600 group-data-[state=active]:text-white transition-all duration-300 shadow-sm">
            <Palette className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="font-semibold text-sm">Branding</span>
            <p className="text-xs text-slate-500 group-data-[state=active]:text-slate-700">
              Identidade Visual
            </p>
          </div>
        </TabsTrigger>

        <TabsTrigger
          value="stripe"
          className="group flex items-center gap-3 px-6 py-4 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-900 data-[state=active]:border-slate-200 rounded-xl transition-all duration-300 hover:bg-white/80 hover:shadow-md border border-transparent data-[state=active]:border-green-200"
        >
          <div className="p-2.5 bg-gradient-to-br from-green-100 to-green-200 rounded-xl group-data-[state=active]:from-green-500 group-data-[state=active]:to-green-600 group-data-[state=active]:text-white transition-all duration-300 shadow-sm">
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="font-semibold text-sm">Stripe</span>
            <p className="text-xs text-slate-500 group-data-[state=active]:text-slate-700">
              Pagamentos
            </p>
          </div>
        </TabsTrigger>

        <TabsTrigger
          value="pricing"
          className="group flex items-center gap-3 px-6 py-4 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-900 data-[state=active]:border-slate-200 rounded-xl transition-all duration-300 hover:bg-white/80 hover:shadow-md border border-transparent data-[state=active]:border-amber-200"
        >
          <div className="p-2.5 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl group-data-[state=active]:from-amber-500 group-data-[state=active]:to-amber-600 group-data-[state=active]:text-white transition-all duration-300 shadow-sm">
            <DollarSign className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="font-semibold text-sm">Planos</span>
            <p className="text-xs text-slate-500 group-data-[state=active]:text-slate-700">
              Preços
            </p>
          </div>
        </TabsTrigger>

        <TabsTrigger
          value="contact"
          className="group flex items-center gap-3 px-6 py-4 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-900 data-[state=active]:border-slate-200 rounded-xl transition-all duration-300 hover:bg-white/80 hover:shadow-md border border-transparent data-[state=active]:border-indigo-200"
        >
          <div className="p-2.5 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl group-data-[state=active]:from-indigo-500 group-data-[state=active]:to-indigo-600 group-data-[state=active]:text-white transition-all duration-300 shadow-sm">
            <Phone className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="font-semibold text-sm">Contato</span>
            <p className="text-xs text-slate-500 group-data-[state=active]:text-slate-700">
              Suporte
            </p>
          </div>
        </TabsTrigger>

        <TabsTrigger
          value="referrals"
          className="group flex items-center gap-3 px-6 py-4 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-slate-900 data-[state=active]:border-slate-200 rounded-xl transition-all duration-300 hover:bg-white/80 hover:shadow-md border border-transparent data-[state=active]:border-pink-200"
        >
          <div className="p-2.5 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl group-data-[state=active]:from-pink-500 group-data-[state=active]:to-pink-600 group-data-[state=active]:text-white transition-all duration-300 shadow-sm">
            <Gift className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="font-semibold text-sm">Indicações</span>
            <p className="text-xs text-slate-500 group-data-[state=active]:text-slate-700">
              Analytics
            </p>
          </div>
        </TabsTrigger>
      </TabsList>

      {/* Enhanced Tab Content */}
      <TabsContent value="branding" className="mt-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-8 p-6 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-2xl border border-purple-200/50">
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
              <Palette className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-purple-900 bg-clip-text text-transparent">
                Personalização da Marca
              </h3>
              <p className="text-purple-600 text-lg mt-1">
                Configure cores, logos e identidade visual da sua plataforma
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <BrandingConfigManager />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="stripe" className="mt-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-8 p-6 bg-gradient-to-r from-green-50 to-green-100/50 rounded-2xl border border-green-200/50">
            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-green-900 bg-clip-text text-transparent">
                Configurações do Stripe
              </h3>
              <p className="text-green-600 text-lg mt-1">
                Gerencie integrações de pagamento e webhooks
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <StripeConfigManager />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="pricing" className="mt-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-8 p-6 bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-2xl border border-amber-200/50">
            <div className="p-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-amber-700 to-amber-900 bg-clip-text text-transparent">
                Gerenciamento de Planos
              </h3>
              <p className="text-amber-600 text-lg mt-1">
                Configure preços, recursos e estrutura dos planos de assinatura
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <PlanPricingManager />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="contact" className="mt-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-8 p-6 bg-gradient-to-r from-indigo-50 to-indigo-100/50 rounded-2xl border border-indigo-200/50">
            <div className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg">
              <Phone className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-indigo-700 to-indigo-900 bg-clip-text text-transparent">
                Informações de Contato
              </h3>
              <p className="text-indigo-600 text-lg mt-1">
                Configure dados de suporte, contato e informações da empresa
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <ContactConfigManager />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="referrals" className="mt-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-8 p-6 bg-gradient-to-r from-pink-50 to-pink-100/50 rounded-2xl border border-pink-200/50">
            <div className="p-4 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl shadow-lg">
              <Gift className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-pink-700 to-pink-900 bg-clip-text text-transparent">
                Analytics de Indicações
              </h3>
              <p className="text-pink-600 text-lg mt-1">
                Acompanhe o desempenho do programa de indicações e métricas de
                crescimento
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <ReferralAnalytics />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default AdminSectionTabs;
