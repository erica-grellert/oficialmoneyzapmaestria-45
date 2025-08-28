import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ContactConfig {
  contactPhone: string;
  whatsappMessage: string;
  supportEmail: string;
}

export const useContactConfig = () => {
  const [config, setConfig] = useState<ContactConfig>({
    contactPhone: "",
    whatsappMessage:
      "Oiee! Acabei de fazer a assinatura do MoneyZap! 🎉\n\nMeu email é: {email}",
    supportEmail: "suporte@moneyzap.com",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContactConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "get-public-settings",
          {
            body: { category: "contact" },
          }
        );

        if (error) {
          console.error("Erro ao buscar configurações:", error);
          setError("Erro ao carregar configurações");
          return;
        }

        if (data?.success && data?.settings) {
          const contactSettings = data.settings.contact || {};

          setConfig((prev) => ({
            contactPhone: contactSettings.contact_phone?.value || "",
            whatsappMessage:
              contactSettings.whatsapp_message?.value || prev.whatsappMessage,
            supportEmail:
              contactSettings.support_email?.value || prev.supportEmail,
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar configurações:", err);
        setError("Erro ao carregar configurações");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContactConfig();
  }, []);

  // Função para formatar mensagem com placeholders dinâmicos
  const formatMessage = (email: string, planType: string) => {
    return config.whatsappMessage
      .replace(/\{email\}/g, email)
      .replace(/\{planType\}/g, planType);
  };

  return { config, isLoading, error, formatMessage };
};
