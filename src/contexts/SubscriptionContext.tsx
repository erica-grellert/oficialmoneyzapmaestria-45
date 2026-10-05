import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  canManageBilling,
  getSubscriptionAccessState,
  isPeriodExpired,
  type SubscriptionAccessState,
} from "@/lib/subscriptionAccess";

interface Subscription {
  id: string;
  status: string;
  plan_type: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  isLoading: boolean;
  checkSubscription: () => Promise<void>;
  hasActiveSubscription: boolean;
  accessState: SubscriptionAccessState;
  canManageSubscription: boolean;
  isSubscriptionExpiring: boolean;
  isSubscriptionExpired: boolean; // Nova propriedade para verificar se está expirado
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSubscription = async () => {
    try {
      setIsLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.log("User not authenticated:", userError?.message);
        setSubscription(null);
        return;
      }

      // Usar a nova edge function para verificar assinatura
      const { data, error } = await supabase.functions.invoke(
        "check-subscription-status"
      );

      if (error) {
        console.error("Error checking subscription via edge function:", error);
        // Fallback: tentar busca direta na tabela
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("moneyzap_subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (fallbackError && fallbackError.code !== "PGRST116") {
          console.error("Error fetching subscription directly:", fallbackError);
        } else {
          setSubscription(fallbackData);
        }
        return;
      }

      setSubscription(data.subscription);
    } catch (error) {
      toast({
        title: "Error checking subscription",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verifica se a assinatura está expirada (data atual é posterior à data de expiração)
  const isSubscriptionExpired = isPeriodExpired(subscription?.current_period_end);

  const accessState = getSubscriptionAccessState(
    subscription?.status,
    subscription?.current_period_end
  );

  // Pagando (active) e em teste (trialing) têm acesso. Em atraso, cancelada ou vencida não.
  const hasActiveSubscription =
    accessState === "paying" || accessState === "trialing";

  const canManageSubscription = canManageBilling(subscription?.status);

  // Verifica se a assinatura está expirando nos próximos 7 dias
  const isSubscriptionExpiring = subscription?.current_period_end
    ? new Date(subscription.current_period_end) <=
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) &&
      new Date(subscription.current_period_end) > new Date()
    : false;

  useEffect(() => {
    checkSubscription();

    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        // Verificação imediata após login
        checkSubscription();
      } else if (event === "SIGNED_OUT") {
        setSubscription(null);
      }
    });

    return () => authListener?.unsubscribe();
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        checkSubscription,
        hasActiveSubscription,
        accessState,
        canManageSubscription,
        isSubscriptionExpiring,
        isSubscriptionExpired,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
};
