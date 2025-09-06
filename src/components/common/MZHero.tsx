import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Mic,
  Camera,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { usePreferences } from "@/contexts/PreferencesContext";
import { Link } from "react-router-dom";

interface MZHeroProps {
  netValue: number;
  monthlyChange: number;
  income: number;
  expenses: number;
  monthlyProfitGoal?: number;
  monthlyProfitAchieved?: number;
  onWhatsAppCapture?: () => void;
  onAudioCapture?: () => void;
  onImageCapture?: () => void;
}

const MZHero: React.FC<MZHeroProps> = ({
  netValue,
  monthlyChange,
  income,
  expenses,
  monthlyProfitGoal = 2000,
  monthlyProfitAchieved,
  onWhatsAppCapture,
  onAudioCapture,
  onImageCapture,
}) => {
  const { currency } = usePreferences();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "BRL",
    }).format(value);
  };

  const currentMonth = new Date().toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const changeIsPositive = monthlyChange >= 0;

  const profitGoalProgress =
    monthlyProfitGoal > 0
      ? Math.min(
          Math.max((monthlyProfitAchieved || netValue) / monthlyProfitGoal, 0),
          1
        ) * 100
      : 0;

  const shouldShowProfitGoal = monthlyProfitGoal > 0;

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[var(--mz-gold-600)] to-[var(--mz-gold-500)] p-6 lg:p-8 shadow-md">
      {/* Decorative blur shapes for visual identity */}
      <div className="absolute top-0 right-0 w-64 h-64 opacity-10 pointer-events-none">
        <div className="w-32 h-32 bg-white/30 rounded-full blur-2xl transform translate-x-16 -translate-y-8" />
        <div className="w-48 h-48 bg-white/20 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
          <div className="mb-6 lg:mb-0 flex-1">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl lg:text-3xl font-bold text-white drop-shadow-sm">
                Resultado do Mês
              </h1>
              <Link
                to={`/reports?month=${new Date().getFullYear()}-${String(
                  new Date().getMonth() + 1
                ).padStart(2, "0")}`}
                className="flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg px-2 py-1"
              >
                Ver detalhes do mês
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-4xl lg:text-5xl font-bold text-white drop-shadow-sm">
                {formatCurrency(netValue)}
              </span>
              <div
                className={`flex items-center gap-1 ${
                  changeIsPositive ? "text-yellow-200" : "text-red-200"
                }`}
              >
                {changeIsPositive ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
                <span className="text-lg font-medium">
                  {changeIsPositive ? "+" : ""}
                  {monthlyChange.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="flex gap-6 text-white/90 mb-4">
              <div>
                <span className="text-sm opacity-75 block">Receitas</span>
                <div className="font-semibold">{formatCurrency(income)}</div>
              </div>
              <div>
                <span className="text-sm opacity-75 block">Despesas</span>
                <div className="font-semibold">{formatCurrency(expenses)}</div>
              </div>
            </div>

            {/* Meta de lucro do mês */}
            {shouldShowProfitGoal && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white/90">
                    Meta de lucro do mês
                  </span>
                  <span className="text-sm font-bold text-white">
                    {profitGoalProgress.toFixed(0)}% atingido
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2.5">
                  <div
                    className="bg-white rounded-full h-2.5 transition-all duration-500 ease-out"
                    style={{ width: `${profitGoalProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-white/75 mt-2">
                  <span>
                    {formatCurrency(monthlyProfitAchieved || netValue)}
                  </span>
                  <span>{formatCurrency(monthlyProfitGoal)}</span>
                </div>
              </div>
            )}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 lg:ml-6">
            <button
              onClick={onWhatsAppCapture}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-3 rounded-full transition-all duration-200 min-h-[40px] text-sm font-medium text-white hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Capturar no WhatsApp</span>
            </button>

            <button
              onClick={onAudioCapture}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-3 rounded-full transition-all duration-200 min-h-[40px] text-sm font-medium text-white hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <Mic className="h-4 w-4" />
              <span>Áudio</span>
            </button>

            <button
              onClick={onImageCapture}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-3 rounded-full transition-all duration-200 min-h-[40px] text-sm font-medium text-white hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <Camera className="h-4 w-4" />
              <span>Imagem</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MZHero;
