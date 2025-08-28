import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePreferences } from '@/contexts/PreferencesContext';
import { HelpCircle } from 'lucide-react';
import { Tooltip as TooltipPrimitive, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { generateChartDataFromTransactions } from '@/utils/chartUtils';
import { useAdaptiveContext } from '@/hooks/useAdaptiveContext';

interface ChartData {
  date: string;
  dateNumber?: number;
  receitas: number;
  despesas: number;
}

interface FinancialSummaryChartProps {
  isLoading?: boolean;
}

type PeriodType = 'currentMonth' | 'last12Months';

const FinancialSummaryChart: React.FC<FinancialSummaryChartProps> = ({ 
  isLoading = false 
}) => {
  const { currency } = usePreferences();
  const { transactions } = useAdaptiveContext();
  const [periodType, setPeriodType] = useState<PeriodType>('currentMonth');
  const [visibleSeries, setVisibleSeries] = useState({
    receitas: true,
    despesas: true
  });
  const [blockTooltipVisible, setBlockTooltipVisible] = useState(false);

  useEffect(() => {
    const savedPeriodType = localStorage.getItem('chart-period-type') as PeriodType;
    if (savedPeriodType && ['currentMonth', 'last12Months'].includes(savedPeriodType)) {
      setPeriodType(savedPeriodType);
    }
  }, []);

  const handlePeriodChange = (period: PeriodType) => {
    setPeriodType(period);
    localStorage.setItem('chart-period-type', period);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL'
    }).format(value);
  };

  const formatCurrencyAbbreviated = (value: number) => {
    if (value === 0) return '0';
    if (value < 1000) return value.toString();
    if (value < 1000000) {
      const k = value / 1000;
      return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
    }
    const m = value / 1000000;
    return m % 1 === 0 ? `${m}M` : `${m.toFixed(1)}M`;
  };

  // Generate chart data from real transactions
  const chartData = useMemo(() => {
    if (transactions && transactions.length > 0) {
      const baseData = generateChartDataFromTransactions(transactions, periodType);
      
      // For current month, add numeric date for proper X-axis handling
      if (periodType === 'currentMonth') {
        return baseData.map(item => ({
          ...item,
          dateNumber: parseInt(item.date)
        }));
      }
      
      return baseData;
    }
    
    // Return empty data structure if no transactions
    if (periodType === 'currentMonth') {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => ({
        date: (i + 1).toString(),
        dateNumber: i + 1,
        receitas: 0,
        despesas: 0,
      }));
    } else {
      const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 
                         'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      return monthNames.map(month => ({
        date: month,
        receitas: 0,
        despesas: 0,
      }));
    }
  }, [transactions, periodType]);

  // Generate ticks for current month
  const currentMonthTicks = useMemo(() => {
    if (periodType === 'currentMonth') {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      
      // Select key days to show on X-axis
      const ticks = [1]; // Always show first day
      
      // Add intermediate days based on month length
      if (daysInMonth >= 10) ticks.push(5);
      if (daysInMonth >= 15) ticks.push(10);
      if (daysInMonth >= 20) ticks.push(15);
      if (daysInMonth >= 25) ticks.push(20);
      if (daysInMonth >= 28) ticks.push(25);
      
      // Always add the last day if not already included
      if (!ticks.includes(daysInMonth)) {
        ticks.push(daysInMonth);
      }
      
      return ticks;
    }
    return [];
  }, [periodType]);

  const toggleSeries = (seriesKey: keyof typeof visibleSeries) => {
    setVisibleSeries(prev => {
      const next = { ...prev, [seriesKey]: !prev[seriesKey] };
      
      // Prevent both series from being hidden
      if (!next.receitas && !next.despesas) {
        setBlockTooltipVisible(true);
        setTimeout(() => setBlockTooltipVisible(false), 2000);
        return prev;
      }
      
      return next;
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const receitasValue = payload.find((p: any) => p.dataKey === 'receitas')?.value || 0;
      const despesasValue = payload.find((p: any) => p.dataKey === 'despesas')?.value || 0;

      const formattedLabel = periodType === 'currentMonth' 
        ? `${label}/${new Date().getMonth() + 1}/${new Date().getFullYear()}`
        : `${label}/${new Date().getFullYear()}`;

      return (
        <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-lg">
          <p className="font-semibold mb-2 text-slate-900">{formattedLabel}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm mb-1 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="capitalize">{entry.dataKey}: {formatCurrency(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomLegend = () => {
    return (
      <div className="flex items-center justify-center gap-4 mt-4">
        {[
          { key: 'receitas', label: 'Receitas', color: '#10B981' },
          { key: 'despesas', label: 'Despesas', color: '#EF4444' }
        ].map(({ key, label, color }) => {
          const isVisible = visibleSeries[key as keyof typeof visibleSeries];
          return (
            <TooltipProvider key={key}>
              <TooltipPrimitive>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => toggleSeries(key as keyof typeof visibleSeries)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all text-sm font-medium hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 ${
                      isVisible 
                        ? 'bg-slate-100 text-slate-700 border border-slate-300' 
                        : 'bg-slate-50 text-slate-400 border border-slate-200'
                    }`}
                    aria-pressed={isVisible}
                    aria-label={`${isVisible ? 'Ocultar' : 'Mostrar'} ${label}`}
                  >
                    <div
                      className="w-3 h-3 rounded-full transition-colors"
                      style={{ backgroundColor: isVisible ? color : '#cbd5e1' }}
                    />
                    <span className="capitalize">{label}</span>
                  </button>
                </TooltipTrigger>
                {blockTooltipVisible && (
                  <TooltipContent side="top" className="bg-slate-800 text-white text-xs">
                    Mantenha pelo menos uma série visível
                  </TooltipContent>
                )}
              </TooltipPrimitive>
            </TooltipProvider>
          );
        })}
      </div>
    );
  };

  const SkeletonLoader = () => (
    <div className="h-80 flex items-center justify-center">
      <div className="flex gap-4 items-end">
        {[1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i} 
            className="bg-slate-200 rounded animate-pulse" 
            style={{ width: '40px', height: `${60 + (i * 20)}px` }} 
          />
        ))}
      </div>
    </div>
  );

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-900">Resumo Financeiro</h3>
            <TooltipProvider>
              <TooltipPrimitive>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">Receitas vs Despesas ao longo do tempo</p>
                </TooltipContent>
              </TooltipPrimitive>
            </TooltipProvider>
          </div>
          <div className="flex bg-slate-100 rounded-lg p-1">
            <Button
              variant={periodType === 'currentMonth' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePeriodChange('currentMonth')}
              className={`px-3 py-1 text-xs ${
                periodType === 'currentMonth'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mês atual
            </Button>
            <Button
              variant={periodType === 'last12Months' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handlePeriodChange('last12Months')}
              className={`px-3 py-1 text-xs ${
                periodType === 'last12Months'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Últimos 12 meses
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <SkeletonLoader />
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="receitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="despesas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EFF2F6" horizontal={true} vertical={false} />
                
                {/* Different XAxis configuration based on period type */}
                {periodType === 'currentMonth' ? (
                  <XAxis 
                    type="number"
                    dataKey="dateNumber"
                    domain={[1, 'dataMax']}
                    ticks={currentMonthTicks}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                ) : (
                  <XAxis 
                    type="category"
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    interval={0}
                  />
                )}
                
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={formatCurrencyAbbreviated}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
                {visibleSeries.receitas && (
                  <Area
                    type="monotone"
                    dataKey="receitas"
                    stackId="1"
                    stroke="#10B981"
                    fill="url(#receitas)"
                    strokeWidth={2}
                    name="receitas"
                  />
                )}
                {visibleSeries.despesas && (
                  <Area
                    type="monotone"
                    dataKey="despesas"
                    stackId="2"
                    stroke="#EF4444"
                    fill="url(#despesas)"
                    strokeWidth={2}
                    name="despesas"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        <div 
          className="sr-only" 
          aria-live="polite" 
          role="status"
        >
          {blockTooltipVisible && "Mantenha pelo menos uma série visível"}
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialSummaryChart;
