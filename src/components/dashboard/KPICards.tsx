
import React from 'react';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePreferences } from '@/contexts/PreferencesContext';

interface KPIData {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  goalsAchieved: { achieved: number; total: number };
  variations: {
    balance: number;
    income: number;
    expenses: number;
    goals: number;
  };
}

interface KPICardsProps {
  data: KPIData;
  isLoading?: boolean;
}

const KPICards: React.FC<KPICardsProps> = ({ data, isLoading = false }) => {
  const { currency } = usePreferences();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL'
    }).format(value);
  };

  const formatVariation = (value: number) => {
    const isPositive = value >= 0;
    return {
      text: `${isPositive ? '+' : ''}${value.toFixed(1)}%`,
      color: isPositive ? 'text-emerald-600' : 'text-red-500',
      bgColor: isPositive ? 'bg-emerald-50' : 'bg-red-50',
      icon: isPositive ? ArrowUpRight : ArrowDownRight
    };
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const balanceVariation = formatVariation(data.variations.balance);
  const incomeVariation = formatVariation(data.variations.income);
  const expensesVariation = formatVariation(data.variations.expenses);
  const goalsVariation = formatVariation(data.variations.goals);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Saldo Total */}
      <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <CardContent className="p-5 relative">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Wallet className="h-5 w-5 text-slate-600" />
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${balanceVariation.bgColor} ${balanceVariation.color}`}>
              <balanceVariation.icon className="h-3 w-3" />
              {balanceVariation.text}
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Saldo Total</h3>
          <p className={`text-2xl font-bold mb-1 ${data.totalBalance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {formatCurrency(data.totalBalance)}
          </p>
          <p className="text-xs text-slate-500">em relação ao mês anterior</p>
        </CardContent>
      </Card>

      {/* Receita Total */}
      <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <CardContent className="p-5 relative">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${incomeVariation.bgColor} ${incomeVariation.color}`}>
              <incomeVariation.icon className="h-3 w-3" />
              {incomeVariation.text}
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Receita Total</h3>
          <p className="text-2xl font-bold text-emerald-600 mb-1">
            {formatCurrency(data.totalIncome)}
          </p>
          <p className="text-xs text-slate-500">em relação ao mês anterior</p>
        </CardContent>
      </Card>

      {/* Despesa Total */}
      <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <CardContent className="p-5 relative">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-500" />
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${expensesVariation.bgColor} ${expensesVariation.color}`}>
              <expensesVariation.icon className="h-3 w-3" />
              {expensesVariation.text}
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Despesa Total</h3>
          <p className="text-2xl font-bold text-red-500 mb-1">
            {formatCurrency(data.totalExpenses)}
          </p>
          <p className="text-xs text-slate-500">em relação ao mês anterior</p>
        </CardContent>
      </Card>

      {/* Metas Atingidas */}
      <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <CardContent className="p-5 relative">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Target className="h-5 w-5 text-amber-600" />
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${goalsVariation.bgColor} ${goalsVariation.color}`}>
              <goalsVariation.icon className="h-3 w-3" />
              {goalsVariation.text}
            </div>
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Metas Atingidas</h3>
          <p className="text-2xl font-bold text-slate-900 mb-1">
            {data.goalsAchieved.achieved}/{data.goalsAchieved.total}
          </p>
          <p className="text-xs text-slate-500">
            {data.goalsAchieved.total > 0 
              ? `${Math.round((data.goalsAchieved.achieved / data.goalsAchieved.total) * 100)}% do total`
              : 'Nenhuma meta criada'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default KPICards;
