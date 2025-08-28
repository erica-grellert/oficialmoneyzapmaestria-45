/**
 * Environment-based configuration utilities
 * Only supports production mode - requires proper Supabase configuration
 */

/**
 * Check if we should use mock mode - always false
 */
export const shouldUseMockMode = (): boolean => {
  return false;
};

/**
 * Get the current app mode - always production
 */
export const getAppMode = (): "production" => {
  return "production";
};

/**
 * Get configuration info for debugging
 */
export const getConfigInfo = () => {
  return {
    mode: getAppMode(),
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    shouldUseMock: shouldUseMockMode(),
  };
};
