import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";

interface SupabaseInitializerProps {
  children: React.ReactNode;
}

export const SupabaseInitializer: React.FC<SupabaseInitializerProps> = ({
  children,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [showConfigWarning, setShowConfigWarning] = useState(false);

  useEffect(() => {
    const initialize = () => {
      const configured = isSupabaseConfigured();

      if (!configured) {
        console.log(
          "Supabase não configurado, executando em modo demonstração"
        );
        setShowConfigWarning(true);
      }

      setIsInitialized(true);
    };

    initialize();
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showConfigWarning && (
        <div className="sticky top-0 z-40 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Você DEVE conectar seu banco de dados!!!
              </p>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
};
