import { useAppContext } from "@/contexts/AppContext";

/**
 * Hook that uses the appropriate context based on environment variables
 * Since the provider selection is deterministic in App.tsx, we can safely
 * call the appropriate hook based on the environment
 */
export const useAdaptiveContext = () => {
  return useAppContext();
};
