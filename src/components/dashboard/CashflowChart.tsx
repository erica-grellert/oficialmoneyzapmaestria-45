
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { usePreferences } from '@/contexts/PreferencesContext';

interface CashflowChartProps {
  data: Array<{
    day: string;
    currentMonth: number;
    previousMonth: number;
  }>;
  isLoading?: boolean;
}

const CashflowChart: React.FC<CashflowChartProps> = ({ data, isLoading = false }) => {
  const { currency } = usePreferences();
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('monthly');
  const [visibleSeries, setVisibleSeries] = useState({
    currentMonth: true,
    previousMonth: true
  });
  
  // Persistir preferência do usuário
  useEffect(() => {
    const savedViewMode = localStorage.getItem('cashflow-view-mode') as 'weekly' | 'monthly';
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  const handleViewModeChange = (mode: 'weekly' | 'monthly') => {
    setViewMode(mode);
    localStorage.setItem('cashflow-view-mode', mode);
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL'
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const currentValue = payload.find((p: any) => p.dataKey === 'currentMonth')?.value || 0;
      const previousValue = payload.find((p: any) => p.dataKey === 'previousMonth')?.value || 0;
      const variation = previousValue > 0 ? ((currentValue - previousValue) / previousValue * 100) : 0;

      return (
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-lg">
          <p className="font-semibold mb-2 text-gray-900">Dia {label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm mb-1 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}: {formatCurrency(entry.value)}</span>
            </p>
          ))}
          {variation !== 0 && (
            <p className={`text-xs mt-2 font-medium ${variation >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {variation >= 0 ? '+' : ''}{variation.toFixed(1)}% vs dia anterior
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex items-center justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => {
          const isVisible = visibleSeries[entry.dataKey as keyof typeof visibleSeries];
          return (
            <button
              key={index}
              onClick={() => setVisibleSeries(prev => ({ 
                ...prev, 
                [entry.dataKey]: !prev[entry.dataKey as keyof typeof prev] 
              }))}
              className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all text-sm font-medium hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 ${
                isVisible 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-600/20' 
                  : 'bg-gray-100 text-gray-500 border border-gray-300'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full transition-colors"
                style={{ backgroundColor: isVisible ? entry.color : '#d1d5db' }}
              />
              {entry.value}
            </button>
          );
        })}
      </div>
    );
  };

  const SkeletonLoader = () => (
    <div className="h-80 flex items-end justify-center gap-4 px-6">
      {[1, 2, 3].map((i) => (
        <div 
          key={i} 
          className="bg-gray-200 rounded animate-pulse" 
          style={{
            width: '60px',
            height: `${100 + (i * 30)}px`
          }} 
        />
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg hover:scale-[1.01] transition-all duration-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Fluxo de Caixa</h3>
        <div className="flex bg-gray-100 rounded-full p-1">
          <button
            onClick={() => handleViewModeChange('weekly')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-emerald-600/50 ${
              viewMode === 'weekly'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Semanal
          </button>
          <button
            onClick={() => handleViewModeChange('monthly')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-emerald-600/50 ${
              viewMode === 'monthly'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Mensal
          </button>
        </div>
      </div>

      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="currentMonth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="previousMonth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#71717A" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#71717A" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={true} vertical={false} />
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              {visibleSeries.previousMonth && (
                <Area
                  type="monotone"
                  dataKey="previousMonth"
                  stackId="1"
                  stroke="#71717A"
                  fill="url(#previousMonth)"
                  strokeWidth={2}
                  name="Mês Anterior"
                />
              )}
              {visibleSeries.currentMonth && (
                <Area
                  type="monotone"
                  dataKey="currentMonth"
                  stackId="2"
                  stroke="#10B981"
                  fill="url(#currentMonth)"
                  strokeWidth={2}
                  name="Mês Atual"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default CashflowChart;
