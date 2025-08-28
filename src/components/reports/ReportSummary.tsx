import React from "react";
import { Card } from "@/components/ui/card";
import { usePreferences } from "@/contexts/PreferencesContext";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface ReportSummaryProps {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

const ReportSummary: React.FC<ReportSummaryProps> = ({
  totalIncome,
  totalExpenses,
  balance,
}) => {
  const { t, currency } = usePreferences();

  // Format currency in BRL
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-emerald-600";
    if (balance < 0) return "text-red-600";
    return "text-slate-600";
  };

  const getBalanceBg = (balance: number) => {
    if (balance > 0) return "bg-emerald-50";
    if (balance < 0) return "bg-red-50";
    return "bg-slate-50";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Income Card */}
      <Card className="p-8 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="h-8 w-8 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-emerald-700">
              {t("reports.totalIncome") || "Total de Receitas"}
            </p>
            <p className="text-3xl font-bold text-emerald-900">
              {formatCurrency(totalIncome)}
            </p>
          </div>
        </div>
      </Card>

      {/* Expenses Card */}
      <Card className="p-8 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center">
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-red-700">
              {t("reports.totalExpenses") || "Total de Despesas"}
            </p>
            <p className="text-3xl font-bold text-red-900">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
        </div>
      </Card>

      {/* Balance Card */}
      <Card
        className={`p-8 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-white`}
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              balance > 0
                ? "bg-emerald-500/20"
                : balance < 0
                ? "bg-red-500/20"
                : "bg-slate-500/20"
            }`}
          >
            <Wallet
              className={`h-8 w-8 ${
                balance > 0
                  ? "text-emerald-600"
                  : balance < 0
                  ? "text-red-600"
                  : "text-slate-600"
              }`}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">
              {t("reports.balance") || "Saldo"}
            </p>
            <p className={`text-3xl font-bold ${getBalanceColor(balance)}`}>
              {formatCurrency(balance)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ReportSummary;
