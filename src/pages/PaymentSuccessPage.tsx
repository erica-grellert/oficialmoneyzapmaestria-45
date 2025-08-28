import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Copy,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  supabase,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from "@/integrations/supabase/client";
import { useContactConfig } from "@/hooks/useContactConfig";
import { useAutoLogin } from "@/hooks/useAutoLogin";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { usePreferences } from "@/contexts/PreferencesContext";

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = usePreferences();
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [userExists, setUserExists] = useState(false);
  const [userPlanType, setUserPlanType] = useState<string>("premium");
  const [checkAttempts, setCheckAttempts] = useState(0);
  const [systemStatus, setSystemStatus] = useState<
    "checking" | "ready" | "error"
  >("checking");

  const {
    config: contactConfig,
    isLoading: configLoading,
    formatMessage,
  } = useContactConfig();
  const { performAutoLogin, isLoggingIn } = useAutoLogin();
  const { checkSubscription } = useSubscription();

  const sessionId = searchParams.get("session_id");
  const email = searchParams.get("email") || "user@example.com";

  const checkSystemStatus = async () => {
    try {
      // Verificar se as funções estão respondendo
      const { error: syncError } = await supabase.functions.invoke(
        "sync-subscriptions",
        {
          body: { test: true },
        }
      );

      if (syncError && !syncError.message.includes("test")) {
        throw new Error("Função de sincronização não está respondendo");
      }

      setSystemStatus("ready");
      return true;
    } catch (error) {
      console.error("Erro ao verificar sistema:", error);
      setSystemStatus("error");
      return false;
    }
  };

  const checkUserCreation = async (attempt = 1) => {
    if (!email || email === "user@example.com") {
      setIsCheckingUser(false);
      return;
    }

    try {
      // Chamar a função Edge com email no body
      const { data, error } = await supabase.functions.invoke(
        "check-subscription-status",
        {
          body: { email: email },
        }
      );

      if (error) {
        console.error("Erro ao verificar usuário:", error);
        throw new Error(error.message);
      }

      if (data.exists && data.hasActiveSubscription) {
        setUserExists(true);

        // Capturar tipo de plano da assinatura
        if (data.subscription?.plan_type) {
          setUserPlanType(data.subscription.plan_type);
        }

        setIsCheckingUser(false);
        return;
      }

      // Se não encontrou o usuário ou assinatura e ainda temos tentativas
      if (attempt < 5) {
        const delay = Math.min(2000 * attempt, 8000); // Max 8 segundos
        setTimeout(() => {
          setCheckAttempts(attempt);
          checkUserCreation(attempt + 1);
        }, delay);
      } else {
        setIsCheckingUser(false);
      }
    } catch (error) {
      console.error("Erro ao verificar usuário:", error);
      if (attempt < 5) {
        setTimeout(() => checkUserCreation(attempt + 1), 5000);
      } else {
        setIsCheckingUser(false);
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      // Primeiro verificar se o sistema está funcionando
      const systemOk = await checkSystemStatus();

      if (systemOk) {
        // Sincronização mais rápida - sem delays desnecessários
        try {
          const { data, error } = await supabase.functions.invoke(
            "sync-subscriptions",
            {
              body: {
                email: email,
              },
            }
          );

          if (error) {
            console.error("Erro ao sincronizar assinatura específica:", error);
          } else {
            await checkSubscription();
          }
        } catch (error) {
          console.error("Erro ao sincronizar assinatura:", error);
        }

        checkUserCreation();
      } else {
        setIsCheckingUser(false);
      }
    };

    init();
  }, [email, sessionId]);

  const handleGoToLogin = () => {
    navigate("/login");
  };

  const handleWhatsAppActivation = () => {
    if (configLoading) {
      toast({
        title: t("errors.loadingSettings"),
        description: t("errors.waitMoment"),
      });
      return;
    }

    const userEmail = email !== "user@example.com" ? email : "";

    // Usar tipo de plano da assinatura se disponível, senão usar fallback
    const planType = userPlanType || searchParams.get("plan_type") || "premium";

    const message = encodeURIComponent(formatMessage(userEmail, planType));

    window.open(
      `https://wa.me/${contactConfig.contactPhone}?text=${message}`,
      "_blank"
    );
  };

  const handleAccessApp = () => {
    if (email && email !== "user@example.com") {
      performAutoLogin(email);
    } else {
      navigate("/login");
    }
  };

  const handleGoToHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="shadow-sm border">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
            </div>

            <CardTitle className="text-2xl font-semibold text-foreground mb-2">
              Pagamento Confirmado!
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Sua assinatura foi ativada com sucesso.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Botões de Ação */}
            <div className="space-y-3 pt-2">
              <Button
                onClick={handleWhatsAppActivation}
                className="w-full"
                size="lg"
                disabled={configLoading}
              >
                {configLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 w-4 h-4" />
                    Falar com suporte
                  </>
                )}
              </Button>

              <Button
                onClick={handleAccessApp}
                className="w-full"
                variant="outline"
                size="lg"
                disabled={isLoggingIn || (!userExists && !isCheckingUser)}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Fazendo login...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 w-4 h-4" />
                    {userExists ? "Acessar o App" : "Aguardar Ativação"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
