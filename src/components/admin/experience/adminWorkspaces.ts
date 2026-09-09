import React from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CreditCard,
  DollarSign,
  Gift,
  Palette,
  Phone,
  Repeat,
  Send,
  Users,
} from "lucide-react";
import BrandingConfigManager from "../BrandingConfigManager";
import StripeConfigManager from "../StripeConfigManager";
import PlanPricingManager from "../PlanPricingManager";
import ContactConfigManager from "../ContactConfigManager";
import ReferralAnalytics from "../ReferralAnalytics";
import MassMessageManager from "../MassMessageManager";

export type AdminWorkspaceId =
  | "overview"
  | "users"
  | "subscriptions"
  | "branding"
  | "stripe"
  | "pricing"
  | "contact"
  | "referrals"
  | "mass-message"
  | "profile";

export interface AdminWorkspaceItem {
  id: AdminWorkspaceId;
  label: string;
  description: string;
  icon: LucideIcon;
  group: "principal" | "plataforma";
  component?: React.ComponentType;
}

export const ADMIN_WORKSPACES: AdminWorkspaceItem[] = [
  {
    id: "overview",
    label: "Visão geral",
    description: "Pulso da plataforma e atalhos operacionais",
    icon: Activity,
    group: "principal",
  },
  {
    id: "users",
    label: "Usuários",
    description: "Impersonação, busca e exclusão segura",
    icon: Users,
    group: "principal",
  },
  {
    id: "subscriptions",
    label: "Assinaturas",
    description: "Planos, status e renovação de cada conta",
    icon: Repeat,
    group: "principal",
  },
  {
    id: "branding",
    label: "Branding",
    description: "Identidade visual e assets da marca",
    icon: Palette,
    group: "plataforma",
    component: BrandingConfigManager,
  },
  {
    id: "stripe",
    label: "Stripe",
    description: "Integração e webhooks de pagamento",
    icon: CreditCard,
    group: "plataforma",
    component: StripeConfigManager,
  },
  {
    id: "pricing",
    label: "Planos",
    description: "Preços, benefícios e estrutura comercial",
    icon: DollarSign,
    group: "plataforma",
    component: PlanPricingManager,
  },
  {
    id: "contact",
    label: "Contato",
    description: "Dados de suporte e canais oficiais",
    icon: Phone,
    group: "plataforma",
    component: ContactConfigManager,
  },
  {
    id: "referrals",
    label: "Indicações",
    description: "Performance do programa de growth",
    icon: Gift,
    group: "plataforma",
    component: ReferralAnalytics,
  },
  {
    id: "mass-message",
    label: "Envio em massa",
    description: "Comunicação operacional com usuários",
    icon: Send,
    group: "plataforma",
    component: MassMessageManager,
  },
];

export const ADMIN_GROUPS: Array<{
  id: AdminWorkspaceItem["group"];
  label: string;
}> = [
  { id: "principal", label: "Operação" },
  { id: "plataforma", label: "Plataforma" },
];

export function getAdminWorkspace(id: AdminWorkspaceId) {
  return ADMIN_WORKSPACES.find((item) => item.id === id);
}
