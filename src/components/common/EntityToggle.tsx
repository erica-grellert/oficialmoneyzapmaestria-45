import React from "react";
import { Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/contexts/AppContext";

const EntityToggle: React.FC = () => {
  const { entidadeAtiva, setEntidadeAtiva } = useAppContext();

  return (
    <div className="flex shrink-0 items-center bg-muted rounded-lg p-0.5 h-9">
      <button
        type="button"
        onClick={() => setEntidadeAtiva(1)}
        aria-pressed={entidadeAtiva === 1}
        className={cn(
          "flex items-center gap-1.5 whitespace-nowrap px-2 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-medium transition-all duration-150",
          entidadeAtiva === 1
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <User className="h-3.5 w-3.5 shrink-0" />
        <span>Pessoal</span>
      </button>
      <button
        type="button"
        onClick={() => setEntidadeAtiva(2)}
        aria-pressed={entidadeAtiva === 2}
        className={cn(
          "flex items-center gap-1.5 whitespace-nowrap px-2 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-medium transition-all duration-150",
          entidadeAtiva === 2
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Building2 className="h-3.5 w-3.5 shrink-0" />
        <span>Empresarial</span>
      </button>
    </div>
  );
};

export default EntityToggle;
