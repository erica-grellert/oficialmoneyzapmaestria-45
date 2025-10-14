import React, { useState, useEffect } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  hasActiveReferralBonus,
  getReferralBonusExpiry,
} from "@/services/referralService";

interface SubscriptionGuardProps {
  children: React.ReactNode;
  feature?: string;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  children,
  feature = "esta funcionalidade",
}) => {
  const { subscription, isLoading } = useSubscription();
  const navigate = useNavigate();
  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null);
  const [isCheckingUserDate, setIsCheckingUserDate] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [hasReferralBonus, setHasReferralBonus] = useState(false);
  const [referralBonusExpiry, setReferralBonusExpiry] = useState<Date | null>(
    null
  );

  // Fetch user creation date
  useEffect(() => {
    const fetchUserCreatedAt = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.log("SubscriptionGuard: User not authenticated");
          setIsCheckingUserDate(false);
          return;
        }

        // Set user email for admin check
        setUserEmail(user.email);

        // Get user creation date from moneyzap_users table
        const { data: userData, error: userDataError } = await supabase
          .from("moneyzap_users")
          .select("created_at")
          .eq("id", user.id)
          .single();

        if (userDataError) {
          console.error(
            "SubscriptionGuard: Error fetching user creation date:",
            userDataError
          );
          // Fallback to auth user creation date
          setUserCreatedAt(user.created_at);
        } else {
          setUserCreatedAt(userData.created_at);
        }

        // Check for referral bonus
        const hasBonus = await hasActiveReferralBonus();
        setHasReferralBonus(hasBonus);

        if (hasBonus) {
          const bonusExpiry = await getReferralBonusExpiry();
          setReferralBonusExpiry(bonusExpiry);
        }
      } catch (error) {
        console.error("SubscriptionGuard: Error fetching user data:", error);
      } finally {
        setIsCheckingUserDate(false);
      }
    };

    fetchUserCreatedAt();
  }, []);

  // Check if user is an admin (bypass subscription requirements)
  const isAdminUser = React.useMemo(() => {
    if (!userEmail) return false;

    const adminEmails = [
      "erica@escritoriomovel.com",
      "elianefragasilva@gmail.com",
      "glauber@brack.com.br",
    ];

    return adminEmails.includes(userEmail);
  }, [userEmail]);

  // Check if user is within grace period (30 days + referral bonus)
  const isWithinGracePeriod = React.useMemo(() => {
    if (!userCreatedAt) return false;

    const userCreationDate = new Date(userCreatedAt);
    const currentDate = new Date();
    const daysSinceCreation = Math.floor(
      (currentDate.getTime() - userCreationDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // Base grace period is 30 days
    let gracePeriodDays = 30;

    // Add referral bonus days if active
    if (hasReferralBonus && referralBonusExpiry) {
      const bonusDays = Math.floor(
        (referralBonusExpiry.getTime() - userCreationDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      gracePeriodDays = Math.max(gracePeriodDays, bonusDays);
    }

    console.log(
      "SubscriptionGuard: Days since user creation:",
      daysSinceCreation,
      "Grace period days:",
      gracePeriodDays,
      "Has referral bonus:",
      hasReferralBonus
    );

    return daysSinceCreation <= gracePeriodDays;
  }, [userCreatedAt, hasReferralBonus, referralBonusExpiry]);

  // Verificar se a assinatura está dentro do período válido
  const isSubscriptionValid = React.useMemo(() => {
    // If user is an admin, allow access regardless of subscription
    if (isAdminUser) {
      return true;
    }

    // If user is within 30-day grace period, allow access regardless of subscription
    if (isWithinGracePeriod) {
      return true;
    }

    if (!subscription) {
      console.log("SubscriptionGuard: No subscription found");
      return false;
    }

    if (subscription.status !== "active") {
      return false;
    }

    // Para assinaturas premium, permitir acesso total
    if (subscription.plan_type === "premium") {
      return true;
    }

    // Verificar se current_period_end existe e se a data atual está dentro do período
    if (subscription.current_period_end) {
      const currentDate = new Date();
      const periodEndDate = new Date(subscription.current_period_end);

      // Se a data atual for maior que a data de fim do período, a assinatura expirou
      if (currentDate > periodEndDate) {
        return false;
      }
    }

    return true;
  }, [subscription, isWithinGracePeriod, isAdminUser]);

  if (isLoading || isCheckingUserDate) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSubscriptionValid) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Assinatura Necessária</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {!subscription || subscription.status !== "active"
                ? `Para acessar ${feature}, você precisa de uma assinatura ativa do Meu Controle IA.`
                : `Sua assinatura expirou. Para continuar acessando ${feature}, você precisa renovar sua assinatura.`}
            </p>
            {isWithinGracePeriod && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                <p>
                  Você ainda está no período de teste gratuito após o cadastro.
                </p>
                {hasReferralBonus && referralBonusExpiry && (
                  <p className="mt-1 text-xs">
                    🎉 Bônus de indicação ativo até{" "}
                    {referralBonusExpiry.toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-3">
              <Button
                onClick={() => navigate("/plans")}
                className="w-full"
                size="lg"
              >
                Ver Planos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="w-full"
              >
                Voltar ao Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default SubscriptionGuard;
