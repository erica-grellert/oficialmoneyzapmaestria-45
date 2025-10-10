import React from "react";
import {
  TrendingUp,
  AlertCircle,
  Target,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Insight {
  id: string;
  title: string;
  description: string;
  cta: string;
  type: "success" | "warning" | "info" | "danger";
  icon: React.ReactNode;
  action: {
    type: "navigate" | "filter";
    route?: string;
    filter?: any;
  };
}

interface InsightsSectionProps {
  insights: Insight[];
  onInsightAction?: (insightId: string, action: any) => void;
}

const InsightsSection: React.FC<InsightsSectionProps> = ({
  insights,
  onInsightAction,
}) => {
  const navigate = useNavigate();

  const getInsightStyles = (type: string) => {
    switch (type) {
      case "success":
        return "border-emerald-600/20 bg-emerald-50 hover:bg-emerald-100";
      case "warning":
        return "border-amber-500/20 bg-amber-50 hover:bg-amber-100";
      case "danger":
        return "border-red-500/20 bg-red-50 hover:bg-red-100";
      default:
        return "border-blue-500/20 bg-blue-50 hover:bg-blue-100";
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-emerald-600";
      case "warning":
        return "text-amber-500";
      case "danger":
        return "text-red-500";
      default:
        return "text-blue-500";
    }
  };

  const handleInsightClick = (insight: Insight) => {
    if (insight.action.type === "navigate" && insight.action.route) {
      if (insight.action.filter) {
        // Aplicar filtro real baseado no tipo de insight
        const searchParams = new URLSearchParams();

        if (insight.action.filter.category) {
          searchParams.set("category", insight.action.filter.category);
        }
        if (insight.action.filter.goalType) {
          searchParams.set("type", insight.action.filter.goalType);
        }
        if (insight.action.filter.dateRange) {
          searchParams.set("range", insight.action.filter.dateRange);
        }

        const queryString = searchParams.toString();
        const url = queryString
          ? `${insight.action.route}?${queryString}`
          : insight.action.route;
        navigate(url);
      } else {
        navigate(insight.action.route);
      }
    }

    onInsightAction?.(insight.id, insight.action);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">
        Insights Financeiros
      </h3>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`bg-white rounded-xl p-4 border-2 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg hover:scale-[1.01] hover:-translate-y-1 ${getInsightStyles(
              insight.type
            )} focus:outline-none focus:ring-2 focus:ring-emerald-600/50`}
            onClick={() => handleInsightClick(insight)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleInsightClick(insight);
              }
            }}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className={`flex-shrink-0 ${getIconColor(insight.type)}`}>
                {insight.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 mb-2 leading-tight text-sm">
                  {insight.title}
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                {insight.cta}
              </span>
              <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        ))}

        {insights.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium mb-1">
              Nenhum insight disponível no momento
            </p>
            <p className="text-sm">
              Continue usando o Meu Controle IA para receber dicas
              personalizadas
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightsSection;
