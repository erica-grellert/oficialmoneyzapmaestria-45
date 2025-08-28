import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Filter, Calendar, Tag, DollarSign } from "lucide-react";
import PillChip from "@/components/ui/pill-chip";

interface TransactionFiltersProps {
  selectedFilters: {
    type: "all" | "income" | "expense";
    category: string | null;
    dateRange: string | null;
    amount: string | null;
  };
  onFilterChange: (filterType: string, value: any) => void;
  onClearFilters: () => void;
  availableCategories: string[];
}

const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  selectedFilters,
  onFilterChange,
  onClearFilters,
  availableCategories,
}) => {
  const hasFilters =
    selectedFilters.type !== "all" ||
    selectedFilters.category ||
    selectedFilters.dateRange ||
    selectedFilters.amount;

  const activeFiltersCount = [
    selectedFilters.type !== "all",
    selectedFilters.category,
    selectedFilters.dateRange,
    selectedFilters.amount,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Active Filters Summary */}
      {hasFilters && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <Filter className="h-3 w-3 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-primary">
              {activeFiltersCount} filtro{activeFiltersCount !== 1 ? "s" : ""}{" "}
              ativo{activeFiltersCount !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-primary/70">
              Clique em "Limpar Filtros" para remover todos
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8 px-3 text-primary hover:text-primary-600 hover:bg-primary/10"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        </div>
      )}

      {/* Transaction Type Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          </div>
          <span className="text-sm font-semibold text-slate-700">
            Tipo de Transação
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <PillChip
            selected={selectedFilters.type === "all"}
            onClick={() => onFilterChange("type", "all")}
            variant="default"
            size="md"
            className="font-medium"
          >
            Todas
          </PillChip>

          <PillChip
            selected={selectedFilters.type === "income"}
            onClick={() =>
              onFilterChange(
                "type",
                selectedFilters.type === "income" ? "all" : "income"
              )
            }
            variant="success"
            size="md"
            className="font-medium"
          >
            Receitas
          </PillChip>

          <PillChip
            selected={selectedFilters.type === "expense"}
            onClick={() =>
              onFilterChange(
                "type",
                selectedFilters.type === "expense" ? "all" : "expense"
              )
            }
            variant="destructive"
            size="md"
            className="font-medium"
          >
            Despesas
          </PillChip>
        </div>
      </div>

      {/* Date Range Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-blue-500/20 flex items-center justify-center">
            <Calendar className="h-3 w-3 text-blue-500" />
          </div>
          <span className="text-sm font-semibold text-slate-700">Período</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <PillChip
            selected={selectedFilters.dateRange === "today"}
            onClick={() =>
              onFilterChange(
                "dateRange",
                selectedFilters.dateRange === "today" ? null : "today"
              )
            }
            size="md"
            className="font-medium"
          >
            Hoje
          </PillChip>

          <PillChip
            selected={selectedFilters.dateRange === "week"}
            onClick={() =>
              onFilterChange(
                "dateRange",
                selectedFilters.dateRange === "week" ? null : "week"
              )
            }
            size="md"
            className="font-medium"
          >
            Esta semana
          </PillChip>

          <PillChip
            selected={selectedFilters.dateRange === "month"}
            onClick={() =>
              onFilterChange(
                "dateRange",
                selectedFilters.dateRange === "month" ? null : "month"
              )
            }
            size="md"
            className="font-medium"
          >
            Este mês
          </PillChip>
        </div>
      </div>

      {/* Category Filters */}
      {availableCategories.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-purple-500/20 flex items-center justify-center">
              <Tag className="h-3 w-3 text-purple-500" />
            </div>
            <span className="text-sm font-semibold text-slate-700">
              Categorias ({availableCategories.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableCategories.slice(0, 12).map((category) => (
              <PillChip
                key={category}
                selected={selectedFilters.category === category}
                onClick={() =>
                  onFilterChange(
                    "category",
                    selectedFilters.category === category ? null : category
                  )
                }
                size="sm"
                className="font-medium"
              >
                {category}
              </PillChip>
            ))}
            {availableCategories.length > 12 && (
              <div className="px-3 py-1.5 text-xs text-muted-foreground bg-muted/50 rounded-full">
                +{availableCategories.length - 12} mais
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="pt-4 border-t border-border/50">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Use os filtros para encontrar transações específicas
          </p>
          {hasFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="h-8 px-3 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar Tudo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionFilters;
