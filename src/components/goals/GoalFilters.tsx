import React from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Grid3X3, List, Filter } from "lucide-react";
import PillChip from "@/components/ui/pill-chip";

interface GoalFiltersProps {
  statusFilter: string | null;
  onStatusFilterChange: (status: string | null) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusCounts: {
    all: number;
    completed: number;
    ontrack: number;
    atrisk: number;
    overdue: number;
    archived: number;
  };
}

const GoalFilters: React.FC<GoalFiltersProps> = ({
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  statusCounts,
}) => {
  return (
    <div className="space-y-8">
      {/* Search and Controls - Stacked for narrow space */}
      <div className="space-y-6">
        {/* Search */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Search className="h-4 w-4 text-emerald-500" />
            Buscar meta
          </label>
          <div className="relative">
            <Input
              placeholder="Buscar meta..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-12 w-full h-12 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-200"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          </div>
        </div>

        {/* Sort */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            Ordenar por
          </label>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-full h-12 rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-200">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="progress_desc">Maior %</SelectItem>
              <SelectItem value="progress_asc">Menor %</SelectItem>
              <SelectItem value="deadline_asc">Prazo mais próximo</SelectItem>
              <SelectItem value="remaining_desc">Maior restante</SelectItem>
              <SelectItem value="name_asc">Nome A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Mode Toggle */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-500"></div>
            Visualização
          </label>
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("grid")}
              className={`rounded-r-none h-12 flex-1 transition-all duration-200 ${
                viewMode === "grid"
                  ? "bg-emerald-500 text-white shadow-lg"
                  : "hover:bg-slate-50"
              }`}
            >
              <Grid3X3 className="h-5 w-5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("list")}
              className={`rounded-l-none h-12 flex-1 transition-all duration-200 ${
                viewMode === "list"
                  ? "bg-emerald-500 text-white shadow-lg"
                  : "hover:bg-slate-50"
              }`}
            >
              <List className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="space-y-4">
        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          Status das Metas
        </label>
        <div className="flex flex-wrap gap-3">
          <PillChip
            selected={statusFilter === null}
            onClick={() => onStatusFilterChange(null)}
          >
            Todas ({statusCounts.all})
          </PillChip>

          <PillChip
            selected={statusFilter === "completed"}
            onClick={() =>
              onStatusFilterChange(
                statusFilter === "completed" ? null : "completed"
              )
            }
            variant="success"
          >
            Atingidas ({statusCounts.completed})
          </PillChip>

          <PillChip
            selected={statusFilter === "ontrack"}
            onClick={() =>
              onStatusFilterChange(
                statusFilter === "ontrack" ? null : "ontrack"
              )
            }
          >
            No Prazo ({statusCounts.ontrack})
          </PillChip>

          <PillChip
            selected={statusFilter === "atrisk"}
            onClick={() =>
              onStatusFilterChange(statusFilter === "atrisk" ? null : "atrisk")
            }
            variant="warning"
          >
            Em Risco ({statusCounts.atrisk})
          </PillChip>

          <PillChip
            selected={statusFilter === "overdue"}
            onClick={() =>
              onStatusFilterChange(
                statusFilter === "overdue" ? null : "overdue"
              )
            }
            variant="danger"
          >
            Atrasadas ({statusCounts.overdue})
          </PillChip>
        </div>
      </div>
    </div>
  );
};

export default GoalFilters;
