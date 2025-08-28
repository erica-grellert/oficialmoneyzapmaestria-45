import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ReportFormat } from "@/types";
import { usePreferences } from "@/contexts/PreferencesContext";

interface ReportFiltersProps {
  reportType: string;
  setReportType: (type: string) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  onDownload: (format: ReportFormat) => void;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
  reportType,
  setReportType,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onDownload,
}) => {
  const { t } = usePreferences();

  const handleClearFilters = () => {
    setReportType("all");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const hasActiveFilters = reportType !== "all" || startDate || endDate;

  return (
    <div className="space-y-6">
      {/* Filter Controls - Single column layout for narrow space */}
      <div className="space-y-6">
        {/* Report Type Filter */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Filter className="h-4 w-4" />
            Tipo de Relatório
          </label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="h-11 rounded-lg border-slate-200 focus:ring-2 focus:ring-primary/20">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Todas as Transações
                </div>
              </SelectItem>
              <SelectItem value="income">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Apenas Receitas
                </div>
              </SelectItem>
              <SelectItem value="expenses">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  Apenas Despesas
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Start Date Filter */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Calendar className="h-4 w-4" />
            Data Inicial
          </label>
          <DatePicker
            date={startDate}
            setDate={setStartDate}
            placeholder="Selecione a data inicial"
          />
        </div>

        {/* End Date Filter */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Calendar className="h-4 w-4" />
            Data Final
          </label>
          <DatePicker
            date={endDate}
            setDate={setEndDate}
            placeholder="Selecione a data final"
          />
        </div>
      </div>

      {/* Filter Actions */}
      <div className="flex flex-col gap-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          {hasActiveFilters && (
            <div className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
              Filtros ativos
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="h-9 px-4 rounded-lg border-slate-200 hover:bg-slate-50"
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;
