import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdaptiveContext } from "@/hooks/useAdaptiveContext";
import { isImpersonating, subscribeImpersonation } from "@/lib/impersonation";

export const useUserRole = () => {
  const { user } = useAdaptiveContext();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const lastChecked = useRef<{ userId: string; at: number } | null>(null);

  // Cache role check for 30 minutes per user id
  const CACHE_DURATION = 30 * 60 * 1000;

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      if (isImpersonating()) {
        setIsAdmin(false);
        setIsLoading(false);
        lastChecked.current = null;
        return;
      }

      const now = Date.now();
      if (
        lastChecked.current?.userId === user.id &&
        now - lastChecked.current.at < CACHE_DURATION
      ) {
        setIsLoading(false);
        return;
      }

      const MAX_RETRIES = 2;
      const RETRY_DELAY = 2000;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`Checking user role (attempt ${attempt}/${MAX_RETRIES})`);

          const { data, error } = await supabase
            .from("moneyzap_users")
            .select("role")
            .eq("id", user.id)
            .single();

          if (error) {
            console.error(
              `Error checking user role (attempt ${attempt}):`,
              error
            );

            if (attempt === MAX_RETRIES) {
              console.warn("Failed to verify admin role after max retries:", {
                userId: user.id,
                error: error.message,
                timestamp: new Date().toISOString(),
              });
              setIsAdmin(false);
            } else {
              await new Promise((resolve) =>
                setTimeout(resolve, RETRY_DELAY * attempt)
              );
              continue;
            }
          } else {
            setIsAdmin(data?.role === "admin");
            lastChecked.current = { userId: user.id, at: now };
          }
          break;
        } catch (error) {
          console.error(
            `Exception checking user role (attempt ${attempt}):`,
            error
          );

          if (attempt === MAX_RETRIES) {
            console.warn("Exception verifying admin role:", {
              userId: user.id,
              error: error instanceof Error ? error.message : "Unknown error",
              timestamp: new Date().toISOString(),
            });
            setIsAdmin(false);
          } else {
            await new Promise((resolve) =>
              setTimeout(resolve, RETRY_DELAY * attempt)
            );
          }
        }
      }

      setIsLoading(false);
    };

    setIsLoading(true);
    checkUserRole();

    return subscribeImpersonation(() => {
      if (isImpersonating()) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }
      lastChecked.current = null;
      setIsLoading(true);
      checkUserRole();
    });
  }, [user?.id]);

  const refreshRole = () => {
    lastChecked.current = null;
    setIsLoading(true);
  };

  return { isAdmin, isLoading, refreshRole };
};
