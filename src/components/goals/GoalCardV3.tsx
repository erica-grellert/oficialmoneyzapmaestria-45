import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Plus,
  TrendingUp,
  MoreHorizontal,
  Edit2,
  Copy,
  Archive,
  Trash2,
} from "lucide-react";
import { Goal } from "@/types";
import { formatCurrency } from "@/utils/transactionUtils";
import { usePreferences } from "@/contexts/PreferencesContext";
import GoalStatusChip from "./GoalStatusChip";
import QuickContributionChips from "./QuickContributionChips";

interface GoalCardV3Props {
  goal: Goal;
  onAddContribution: (goal: Goal, amount?: number) => void;
  onEdit: (goal: Goal) => void;
  onDuplicate?: (goal: Goal) => void;
  onArchive: (goalId: string) => void;
  onDelete?: (goalId: string) => void;
  showQuickActions?: boolean;
}

const GoalCardV3: React.FC<GoalCardV3Props> = ({
  goal,
  onAddContribution,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  showQuickActions = true,
}) => {
  const { currency } = usePreferences();

  // Calcular progresso e métricas
  const progress = Math.min(
    (goal.currentAmount / goal.targetAmount) * 100,
    100
  );
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

  // Calcular dias restantes
  const daysRemaining = goal.endDate
    ? Math.ceil(
        (new Date(goal.endDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const isCompleted = progress >= 100;
  const isOverdue = daysRemaining !== null && daysRemaining < 0;

  const handleQuickContribution = (amount: number) => {
    onAddContribution(goal, amount);
  };

  return (
    <Card className="p-6 bg-white border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] overflow-hidden relative group">
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-xl truncate pr-2 group-hover:text-mz-gold-700 transition-colors">
              {goal.name}
            </h3>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <GoalStatusChip goal={goal} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => onEdit(goal)}
                  className="gap-3"
                >
                  <Edit2 className="h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                {onDuplicate && (
                  <DropdownMenuItem
                    onClick={() => onDuplicate(goal)}
                    className="gap-3"
                  >
                    <Copy className="h-4 w-4" />
                    Duplicar
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(goal.id)}
                    className="text-red-600 hover:text-red-700 gap-3"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="mb-6 p-4 bg-mz-gold-50 rounded-2xl border border-mz-gold-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-mz-gold-500 flex items-center justify-center shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-600">
                  Progresso
                </div>
                <div className="text-lg font-bold text-slate-900">
                  {Math.round(progress)}%
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-slate-600">Restante</div>
              <div className="text-lg font-bold text-amber-600">
                {formatCurrency(remaining, currency)}
              </div>
            </div>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="relative w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isCompleted
                  ? "bg-mz-gold-500"
                  : isOverdue
                  ? "bg-red-500"
                  : "bg-emerald-500"
              } shadow-lg`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-2 text-sm">
            <span className="text-mz-gold-600 font-semibold">
              {formatCurrency(goal.currentAmount, currency)}
            </span>
            <span className="text-slate-600 font-medium">
              {formatCurrency(goal.targetAmount, currency)}
            </span>
          </div>
        </div>

        {/* Deadline Information */}
        {goal.endDate && (
          <div className="flex items-center text-sm text-slate-600 mb-6 p-3 bg-slate-50 rounded-xl">
            <Calendar className="h-4 w-4 mr-3 text-slate-500" />
            <div className="flex-1">
              <div className="font-medium text-slate-700">
                Até {new Date(goal.endDate).toLocaleDateString("pt-BR")}
              </div>
              {daysRemaining !== null && (
                <div
                  className={`text-xs font-medium mt-1 ${
                    daysRemaining < 0
                      ? "text-red-600"
                      : daysRemaining < 30
                      ? "text-amber-600"
                      : "text-slate-600"
                  }`}
                >
                  {daysRemaining < 0
                    ? `${Math.abs(daysRemaining)} dias atrasada`
                    : `${daysRemaining} dias restantes`}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Contribution Chips */}
        {showQuickActions && !isCompleted && (
          <div className="mb-6">
            <div className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-mz-gold-500"></div>
              Aporte rápido
            </div>
            <QuickContributionChips onContribute={handleQuickContribution} />
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {!isCompleted && (
            <Button
              onClick={() => onAddContribution(goal)}
              className="w-full h-12 bg-mz-gold-500 hover:bg-mz-gold-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            >
              <Plus className="h-5 w-5 mr-2" />
              Adicionar Aporte
            </Button>
          )}

          {isOverdue && (
            <div className="text-center">
              <span className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium bg-red-50 text-red-700 border border-red-200">
                ⚠️ Precisa atenção
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default GoalCardV3;
