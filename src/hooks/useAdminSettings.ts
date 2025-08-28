import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdminSetting {
  value: string | number | boolean | null;
  type: string | null;
  encrypted: boolean | null;
  description: string | null;
  updated_at: string | null;
}

export interface AdminSettings {
  branding: Record<string, AdminSetting>;
  stripe: Record<string, AdminSetting>;
  pricing: Record<string, AdminSetting>;
  system: Record<string, AdminSetting>;
  contact: Record<string, AdminSetting>;
}

export const useAdminSettings = () => {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all settings from moneyzap_settings table
        const { data, error: fetchError } = await supabase
          .from("moneyzap_settings")
          .select(
            "category, key, value, value_type, encrypted, description, updated_at"
          )
          .order("category", { ascending: true })
          .order("key", { ascending: true });

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        // Process settings by category
        const processedSettings: AdminSettings = {
          branding: {},
          stripe: {},
          pricing: {},
          system: {},
          contact: {},
        };

        data?.forEach((setting) => {
          if (setting.category in processedSettings) {
            let value: string | number | boolean | null = setting.value;

            // Convert value based on type
            if (setting.value_type === "number" && value) {
              value = parseFloat(value as string);
            } else if (setting.value_type === "boolean" && value) {
              value = (value as string).toLowerCase() === "true";
            } else if (setting.value_type === "json" && value) {
              try {
                value = JSON.parse(value as string);
              } catch {
                // Keep as string if JSON parse fails
              }
            }

            processedSettings[setting.category as keyof AdminSettings][
              setting.key
            ] = {
              value,
              type: setting.value_type,
              encrypted: setting.encrypted,
              description: setting.description,
              updated_at: setting.updated_at,
            };
          }
        });

        setSettings(processedSettings);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch settings"
        );
        console.error("Error fetching admin settings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Check if a category is properly configured
  const isCategoryConfigured = (category: keyof AdminSettings): boolean => {
    if (!settings || !settings[category]) return false;

    const categorySettings = settings[category];
    const requiredKeys = getRequiredKeysForCategory(category);

    return requiredKeys.every((key) => {
      const setting = categorySettings[key];
      return setting && setting.value !== null && setting.value !== "";
    });
  };

  // Get required keys for each category
  const getRequiredKeysForCategory = (
    category: keyof AdminSettings
  ): string[] => {
    switch (category) {
      case "branding":
        return ["company_name", "logo_url", "favicon_url", "logo_alt_text"];
      case "stripe":
        return ["stripe_secret_key", "stripe_webhook_secret"];
      case "pricing":
        return ["plan_price_monthly", "plan_price_annual"];
      case "contact":
        return ["support_email"];
      case "system":
        return ["supabase_url"];
      default:
        return [];
    }
  };

  // Get configuration status for all categories
  const getConfigurationStatus = () => {
    if (!settings) return null;

    return {
      branding: isCategoryConfigured("branding"),
      stripe: isCategoryConfigured("stripe"),
      pricing: isCategoryConfigured("pricing"),
      contact: isCategoryConfigured("contact"),
      system: isCategoryConfigured("system"),
    };
  };

  return {
    settings,
    isLoading,
    error,
    isCategoryConfigured,
    getConfigurationStatus,
  };
};
