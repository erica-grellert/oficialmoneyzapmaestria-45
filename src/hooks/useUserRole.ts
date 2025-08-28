import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdaptiveContext } from "@/hooks/useAdaptiveContext";

export const useUserRole = () => {
  const { user } = useAdaptiveContext();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<number>(0);

  // Cache role check for 30 minutes to prevent excessive requests
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes (increased from 5)

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      // Check cache first - extended cache duration
      const now = Date.now();
      if (now - lastChecked < CACHE_DURATION && lastChecked > 0) {
        setIsLoading(false);
        return;
      }

      const MAX_RETRIES = 2; // Reduced from 3
      const RETRY_DELAY = 2000; // Increased to 2 seconds

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`Checking user role (attempt ${attempt}/${MAX_RETRIES})`);

          // Query the moneyzap_users table directly to check the user's role
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
              // Log security event for monitoring
              console.warn("Failed to verify admin role after max retries:", {
                userId: user.id,
                error: error.message,
                timestamp: new Date().toISOString(),
              });
              setIsAdmin(false);
            } else {
              // Wait before retry with exponential backoff
              await new Promise((resolve) =>
                setTimeout(resolve, RETRY_DELAY * attempt)
              );
              continue;
            }
          } else {
            // Check if the user's role is 'admin'
            setIsAdmin(data?.role === "admin");
            setLastChecked(now);
          }
          break;
        } catch (error) {
          console.error(
            `Exception checking user role (attempt ${attempt}):`,
            error
          );

          if (attempt === MAX_RETRIES) {
            // Log security event
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

    // Only run the check if user exists and cache is expired
    if (
      user &&
      (Date.now() - lastChecked >= CACHE_DURATION || lastChecked === 0)
    ) {
      checkUserRole();
    } else if (!user) {
      setIsAdmin(false);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [user?.id]); // Only depend on user.id, not the entire user object

  // Force refresh role check (useful after role changes)
  const refreshRole = () => {
    setLastChecked(0);
    setIsLoading(true);
  };

  return { isAdmin, isLoading, refreshRole };
};
