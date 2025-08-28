import React from "react";
import { Transaction } from "@/types";
import { formatCurrency } from "@/utils/transactionUtils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionSummaryProps {
  transactions: Transaction[];
  currency: string;
  className?: string;
}

const TransactionSummary: React.FC<TransactionSummaryProps> = ({
  transactions,
  currency,
  className,
}) => {
  const stats = React.useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpenses;

    const transactionCount = transactions.length;
    const incomeCount = transactions.filter((t) => t.type === "income").length;
    const expenseCount = transactions.filter(
      (t) => t.type === "expense"
    ).length;

    const avgIncome = incomeCount > 0 ? totalIncome / incomeCount : 0;
    const avgExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;

    // Get unique categories
    const categories = Array.from(new Set(transactions.map((t) => t.category)));
    const categoryCount = categories.length;

    // Get most used category
    const categoryUsage = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostUsedCategory = Object.entries(categoryUsage).sort(
      ([, a], [, b]) => b - a
    )[0];

    return {
      totalIncome,
      totalExpenses,
      balance,
      transactionCount,
      incomeCount,
      expenseCount,
      avgIncome,
      avgExpense,
      categoryCount,
      mostUsedCategory: mostUsedCategory
        ? {
            name: mostUsedCategory[0],
            count: mostUsedCategory[1],
          }
        : null,
    };
  }, [transactions]);

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
    <div className={cn("space-y-8", className)}>
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Income Card */}
        <Card className="p-8 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-emerald-700">Receitas</p>
              <p className="text-3xl font-bold text-emerald-900">
                {formatCurrency(stats.totalIncome, currency)}
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Badge
                variant="outline"
                className="text-xs border-emerald-200 text-emerald-700"
              >
                {stats.incomeCount} transação
                {stats.incomeCount !== 1 ? "ões" : ""}
              </Badge>
              {stats.avgIncome > 0 && (
                <span className="text-xs text-emerald-600">
                  Média: {formatCurrency(stats.avgIncome, currency)}
                </span>
              )}
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
              <p className="text-sm font-medium text-red-700">Despesas</p>
              <p className="text-3xl font-bold text-red-900">
                {formatCurrency(stats.totalExpenses, currency)}
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Badge
                variant="outline"
                className="text-xs border-red-200 text-red-700"
              >
                {stats.expenseCount} transação
                {stats.expenseCount !== 1 ? "ões" : ""}
              </Badge>
              {stats.avgExpense > 0 && (
                <span className="text-xs text-red-600">
                  Média: {formatCurrency(stats.avgExpense, currency)}
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Balance Card */}
        <Card
          className={cn(
            "p-8 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-white"
          )}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div
              className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center",
                stats.balance > 0
                  ? "bg-emerald-500/20"
                  : stats.balance < 0
                  ? "bg-red-500/20"
                  : "bg-slate-500/20"
              )}
            >
              <Wallet
                className={cn(
                  "h-8 w-8",
                  stats.balance > 0
                    ? "text-emerald-600"
                    : stats.balance < 0
                    ? "text-red-600"
                    : "text-slate-600"
                )}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Saldo</p>
              <p
                className={cn(
                  "text-3xl font-bold",
                  getBalanceColor(stats.balance)
                )}
              >
                {formatCurrency(stats.balance, currency)}
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Badge
                variant="outline"
                className="text-xs border-slate-200 text-slate-700"
              >
                {stats.transactionCount} total
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Categories & Usage */}
        <Card className="p-6 border border-slate-200 shadow-lg bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-700">Categorias</p>
              <p className="text-xl font-bold text-blue-900">
                {stats.categoryCount} categoria
                {stats.categoryCount !== 1 ? "s" : ""}
              </p>
              {stats.mostUsedCategory && (
                <p className="text-xs text-blue-600 mt-2">
                  Mais usada: {stats.mostUsedCategory.name} (
                  {stats.mostUsedCategory.count}x)
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Transaction Overview */}
        <Card className="p-6 border border-slate-200 shadow-lg bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-purple-700">Visão Geral</p>
              <div className="flex items-center gap-6 mt-3">
                <div className="text-center">
                  <p className="text-xl font-bold text-purple-900">
                    {stats.incomeCount}
                  </p>
                  <p className="text-xs text-purple-600">Receitas</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-purple-900">
                    {stats.expenseCount}
                  </p>
                  <p className="text-xs text-purple-600">Despesas</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-purple-900">
                    {stats.transactionCount}
                  </p>
                  <p className="text-xs text-purple-600">Total</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TransactionSummary;
