import React from "react";
import { Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/contexts/AppContext";

const EntityToggle: React.FC = () => {
  const { entidadeAtiva, setEntidadeAtiva } = useAppContext();

  return (
    <div className="flex items-center bg-muted rounded-lg p-0.5 h-9">
      <button
        onClick={() => setEntidadeAtiva(1)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
          entidadeAtiva === 1
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <User className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Pessoal</span>
        <span className="sm:hidden">PF</span>
      </button>
      <button
        onClick={() => setEntidadeAtiva(2)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
          entidadeAtiva === 2
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Building2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Empresarial</span>
        <span className="sm:hidden">PJ</span>
      </button>
    </div>
  );
};

export default EntityToggle;
