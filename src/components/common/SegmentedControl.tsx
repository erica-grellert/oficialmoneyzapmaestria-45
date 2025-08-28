import React from "react";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SegmentedControlProps {
  value: "income" | "expense";
  onChange: (value: "income" | "expense") => void;
  className?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  value,
  onChange,
  className,
}) => {
  return (
    <div className={cn("flex bg-slate-100 rounded-full p-1 w-full", className)}>
      <Button
        type="button"
        variant="ghost"
        onClick={() => onChange("income")}
        className={cn(
          "flex-1 h-11 rounded-full transition-all duration-200 font-medium",
          "hover:bg-white",
          value === "income"
            ? "bg-emerald-50 text-emerald-700 shadow-sm ring-2 ring-emerald-200"
            : "text-slate-600 hover:text-slate-900"
        )}
      >
        <TrendingUp className="h-4 w-4 mr-2" />
        Receita
      </Button>

      <Button
        type="button"
        variant="ghost"
        onClick={() => onChange("expense")}
        className={cn(
          "flex-1 h-11 rounded-full transition-all duration-200 font-medium",
          "hover:bg-white",
          value === "expense"
            ? "bg-red-50 text-red-700 shadow-sm ring-2 ring-red-200"
            : "text-slate-600 hover:text-slate-900"
        )}
      >
        <TrendingDown className="h-4 w-4 mr-2" />
        Despesa
      </Button>
    </div>
  );
};
