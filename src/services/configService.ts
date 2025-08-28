/**
 * Configuration service to control app behavior
 * Only supports production mode - requires proper Supabase configuration
 */

export type AppMode = "production";

/**
 * Get the current app mode - always production
 */
export const getAppMode = (): AppMode => {
  return "production";
};

/**
 * Check if we should use mock mode - always false
 */
export const shouldUseMockAuth = (): boolean => {
  return false;
};

/**
 * Get current configuration info for debugging
 */
export const getConfigInfo = () => {
  return {
    mode: getAppMode(),
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    shouldUseMock: shouldUseMockAuth(),
  };
};
