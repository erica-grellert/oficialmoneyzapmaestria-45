
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell } from 'recharts';
import { formatCurrency } from '@/utils/transactionUtils';
import { useAdaptiveContext } from '@/hooks/useAdaptiveContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { calculateCategorySummaries, createLocalDate } from '@/utils/transactionUtils';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface DashboardChartsProps {
  currentMonth?: Date;
  hideValues?: boolean;
  monthTransactions?: any[]; // NEW: Accept month-specific transactions
}

// Generate chart data from the actual transaction data
const generateChartData = (transactions: any[], month: Date) => {
  console.log("Generating chart data for month:", month, "with transactions:", transactions.length);
  
  // Create a map to group transactions by day
  const transactionsByDay = new Map();
  
  // Initialize with all days in the month
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    const day = new Date(month.getFullYear(), month.getMonth(), i);
    transactionsByDay.set(i, {
      day: i,
      income: 0,
      expenses: 0,
      dateLabel: `${i}/${month.getMonth() + 1}`
    });
  }
  
  // Fill with actual transaction data
  transactions.forEach(transaction => {
    const transactionDate = createLocalDate(transaction.date);
    const day = transactionDate.getDate();
    
    // Skip if not from the current month
    if (transactionDate.getMonth() !== month.getMonth() || 
        transactionDate.getFullYear() !== month.getFullYear()) {
      return;
    }
    
    const dayData = transactionsByDay.get(day) || {
      day,
      income: 0, 
      expenses: 0,
      dateLabel: `${day}/${month.getMonth() + 1}`
    };
    
    if (transaction.type === 'income') {
      dayData.income += transaction.amount;
    } else {
      dayData.expenses += transaction.amount;
    }
    
    transactionsByDay.set(day, dayData);
  });
  
  // Convert map to array and calculate balance
  const result = Array.from(transactionsByDay.values());
  result.forEach(item => {
    item.balance = item.income - item.expenses;
  });
  
  // Sort by day
  result.sort((a, b) => a.day - b.day);
  
  // If we have too many days, reduce by grouping
  if (daysInMonth > 10) {
    const condensedData = [];
    const step = Math.ceil(daysInMonth / 10);
    
    for (let i = 0; i < daysInMonth; i += step) {
      const group = result.slice(i, i + step);
      if (group.length > 0) {
        const groupData = {
          day: group[0].day,
          dateLabel: `${group[0].day}-${group[group.length - 1].day}/${month.getMonth() + 1}`,
          income: group.reduce((sum, item) => sum + item.income, 0),
          expenses: group.reduce((sum, item) => sum + item.expenses, 0),
          balance: group.reduce((sum, item) => sum + item.balance, 0)
        };
        condensedData.push(groupData);
      }
    }
    
    return condensedData;
  }
  
  return result;
};

const DashboardCharts: React.FC<DashboardChartsProps> = ({ 
  currentMonth = new Date(), 
  hideValues = false,
  monthTransactions 
}) => {
  const { filteredTransactions } = useAdaptiveContext();
  const { currency, t } = usePreferences();
  
  // Use monthTransactions if provided, otherwise fall back to filteredTransactions
  const transactionsToUse = monthTransactions || filteredTransactions;
  const expenseSummaries = calculateCategorySummaries(transactionsToUse, 'expense');
  
  console.log("Rendering charts with transactions:", transactionsToUse.length, "for month:", currentMonth.toDateString());
  
  // Generate data for the current month using the provided transactions
  const monthData = generateChartData(transactionsToUse, currentMonth);
  const monthName = format(currentMonth, 'MMMM', { locale: pt });
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 border rounded-md shadow-sm">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
              {entry.name === 'income' 
                ? t('common.income') 
                : entry.name === 'expenses' 
                  ? t('common.expense')
                  : t('common.balance')}: {
                    hideValues 
                      ? '******' 
                      : formatCurrency(entry.value, currency)
                  }
            </p>
          ))}
        </div>
      );
    }
  
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Area Chart - Receitas vs Despesas */}
      <Card className="transition-all hover:shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
              <p className="text-sm text-muted-foreground">Receitas vs Despesas ao longo do tempo</p>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                <span className="text-muted-foreground">Receitas</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EF4444' }}></div>
                <span className="text-muted-foreground">Despesas</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="dateLabel" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(value) => 
                    hideValues 
                      ? '***' 
                      : `R$ ${(value / 1000).toFixed(0)}k`
                  } 
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="income"
                  stackId="1"
                  stroke="#10B981"
                  fill="url(#incomeGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stackId="2"
                  stroke="#EF4444"
                  fill="url(#expenseGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bar Chart - Gastos por Categoria */}
      <Card className="transition-all hover:shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Gastos por Categoria - {monthName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {expenseSummaries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={expenseSummaries} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="category" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={(value) => 
                      hideValues 
                        ? '***' 
                        : `R$ ${(value / 1000).toFixed(0)}k`
                    } 
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value) => 
                      hideValues 
                        ? '******' 
                        : formatCurrency(Number(value), currency)
                    } 
                  />
                  <Bar 
                    dataKey="amount" 
                    radius={[8, 8, 0, 0]}
                    maxBarSize={60}
                  >
                    {expenseSummaries.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">{t('common.noData')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCharts;
