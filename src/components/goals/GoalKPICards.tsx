import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, TrendingUp, Target, Clock, BarChart3 } from "lucide-react";
import { Goal } from "@/types";
import { formatCurrency } from "@/utils/transactionUtils";
import { usePreferences } from "@/contexts/PreferencesContext";

interface GoalKPICardsProps {
  goals: Goal[];
}

const GoalKPICards: React.FC<GoalKPICardsProps> = ({ goals }) => {
  const { currency } = usePreferences();

  // Filtrar metas ativas
  const activeGoals = goals.filter((goal) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    return progress < 100;
  });

  // Calcular KPIs
  const totalRemaining = activeGoals.reduce(
    (sum, goal) => sum + Math.max(goal.targetAmount - goal.currentAmount, 0),
    0
  );

  const suggestedMonthlyContribution = activeGoals.reduce((sum, goal) => {
    const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

    if (!goal.endDate || remaining === 0) {
      // Sem prazo: distribuir em 12 meses
      return sum + Math.max(50, Math.ceil(remaining / 12 / 10) * 10);
    }

    const daysRemaining = Math.ceil(
      (new Date(goal.endDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysRemaining > 0) {
      const monthsRemaining = Math.max(Math.ceil(daysRemaining / 30), 1);
      const monthlyAmount = remaining / monthsRemaining;
      // Aplicar piso R$50 e arredondar para múltiplos de R$10
      return sum + Math.max(50, Math.ceil(monthlyAmount / 10) * 10);
    }

    return sum + Math.max(50, Math.ceil(remaining / 10) * 10);
  }, 0);

  const averageProgress =
    goals.length > 0
      ? activeGoals.reduce((sum, goal) => {
          const progress = Math.min(
            (goal.currentAmount / goal.targetAmount) * 100,
            100
          );
          return sum + progress;
        }, 0) / Math.max(activeGoals.length, 1)
      : 0;

  const kpis = [
    {
      icon: TrendingUp,
      label: "Aporte sugerido/mês",
      value: formatCurrency(suggestedMonthlyContribution, currency),
      tooltip: "Quanto aportar por mês para bater as metas no prazo.",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
    },
    {
      icon: Target,
      label: "Restante total",
      value: formatCurrency(totalRemaining, currency),
      tooltip: "Soma do restante de todas as metas ativas.",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
    },
    {
      icon: Clock,
      label: "Metas ativas",
      value: activeGoals.length.toString(),
      tooltip: "Total de metas em andamento.",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      icon: BarChart3,
      label: "Progresso médio",
      value: `${Math.round(averageProgress)}%`,
      tooltip: "Média das porcentagens de todas as metas ativas.",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {kpis.map((kpi, index) => (
        <Card
          key={index}
          className={`p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden relative group bg-white`}
        >
          {/* Content */}
          <div className="relative z-10 flex flex-col items-center text-center space-y-5">
            {/* Icon container with enhanced styling */}
            <div
              className={`w-16 h-16 rounded-2xl ${kpi.bgColor} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105`}
            >
              <kpi.icon className={`h-8 w-8 ${kpi.color} drop-shadow-sm`} />
            </div>

            {/* Text content */}
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-semibold text-slate-800">
                  {kpi.label}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-slate-500 hover:text-slate-700 transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-900 text-white border-0 shadow-xl">
                      <p className="text-sm max-w-48">{kpi.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Enhanced value display */}
              <div
                className={`text-2xl font-bold ${kpi.color} font-mono tracking-tight drop-shadow-sm`}
              >
                {kpi.value}
              </div>
            </div>
          </div>

          {/* Subtle border accent */}
          <div
            className={`absolute bottom-0 left-0 right-0 h-0.5 ${kpi.borderColor} opacity-50 group-hover:opacity-80 transition-opacity duration-300`}
          />
        </Card>
      ))}
    </div>
  );
};

export default GoalKPICards;
