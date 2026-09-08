import React from "react";
import { Eye, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useImpersonation } from "@/hooks/useImpersonation";
import { useToast } from "@/hooks/use-toast";

const ImpersonationBanner: React.FC = () => {
  const { state, isImpersonating, isStopping, stopImpersonation } =
    useImpersonation();
  const { toast } = useToast();

  if (!isImpersonating || !state) return null;

  const handleStop = async () => {
    try {
      await stopImpersonation();
    } catch (error) {
      toast({
        title: "Não foi possível voltar ao admin",
        description:
          error instanceof Error
            ? error.message
            : "Faça login novamente na sua conta de administrador.",
        variant: "destructive",
      });
    }
  };

  return (
    <div
      role="status"
      className="sticky top-0 z-[70] flex items-center justify-between gap-3 bg-amber-500 px-4 py-2 text-amber-950 shadow-md"
    >
      <div className="flex min-w-0 items-center gap-2">
        <Eye className="h-4 w-4 shrink-0" />
        <p className="truncate text-sm font-medium">
          Vendo como {state.targetName} ({state.targetEmail}). Ações nesta
          conta são reais.
        </p>
      </div>
      <Button
        size="sm"
        variant="secondary"
        className="shrink-0 bg-amber-950 text-amber-50 hover:bg-amber-900"
        onClick={handleStop}
        disabled={isStopping}
      >
        {isStopping ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Shield className="mr-2 h-4 w-4" />
        )}
        Voltar ao admin
      </Button>
    </div>
  );
};

export default ImpersonationBanner;
