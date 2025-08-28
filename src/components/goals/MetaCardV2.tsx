
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Edit2, Archive, CheckCircle, TrendingUp } from 'lucide-react';
import { Goal } from '@/types';
import { formatCurrency } from '@/utils/transactionUtils';
import { usePreferences } from '@/contexts/PreferencesContext';

interface MetaCardV2Props {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onArchive: (goalId: string) => void;
  onAddContribution: (goal: Goal) => void;
  onViewDetails: (goal: Goal) => void;
  onComplete?: (goalId: string) => void;
}

const MetaCardV2: React.FC<MetaCardV2Props> = ({ 
  goal, 
  onEdit, 
  onArchive, 
  onAddContribution,
  onViewDetails,
  onComplete
}) => {
  const { currency } = usePreferences();

  // Calcular progresso e status
  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  
  // Calcular dias restantes
  const daysRemaining = goal.endDate 
    ? Math.ceil((new Date(goal.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  // Determinar status
  const getStatus = () => {
    if (progress >= 100) return { label: 'Concluída', color: 'success', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700' };
    
    if (!daysRemaining) return { label: 'No prazo', color: 'success', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700' };
    
    const totalDays = goal.startDate && goal.endDate 
      ? Math.ceil((new Date(goal.endDate).getTime() - new Date(goal.startDate).getTime()) / (1000 * 60 * 60 * 24))
      : 365;
    
    const daysElapsed = totalDays - daysRemaining;
    const timeProgress = (daysElapsed / totalDays) * 100;
    const relativeProgress = timeProgress > 0 ? (progress / timeProgress) : 1;
    
    if (daysRemaining < 0) return { label: 'Atrasada', color: 'destructive', bgColor: 'bg-red-50', textColor: 'text-red-700' };
    if (relativeProgress < 0.5) return { label: 'Atrasada', color: 'destructive', bgColor: 'bg-red-50', textColor: 'text-red-700' };
    if (relativeProgress < 0.8) return { label: 'Em risco', color: 'warning', bgColor: 'bg-amber-50', textColor: 'text-amber-600' };
    
    return { label: 'No prazo', color: 'success', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700' };
  };

  const status = getStatus();

  // Mock sparkline data (últimos 6 aportes)
  const sparklineData = Array.from({ length: 6 }, () => Math.random() * 100);

  return (
    <Card 
      className="p-6 bg-white border-[#EDEFF2] shadow-sm rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={() => onViewDetails(goal)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg truncate pr-2">{goal.name}</h3>
        <div className="flex items-center gap-2">
          <Badge 
            variant={status.color === 'success' ? 'default' : status.color === 'warning' ? 'secondary' : 'destructive'}
            className={`text-xs ${status.bgColor} ${status.textColor} border-0`}
          >
            {status.label}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(goal);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Números */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold text-emerald-600 font-mono">
            {formatCurrency(goal.currentAmount, currency)}
          </span>
          <span className="text-sm text-[#64748B]">
            / {formatCurrency(goal.targetAmount, currency)}
          </span>
        </div>
        <div className="text-sm text-[#64748B]">
          Restante: <span className="font-semibold text-gray-900">{formatCurrency(remaining, currency)}</span>
        </div>
      </div>

      {/* Prazo e dias restantes */}
      {goal.endDate && (
        <div className="flex items-center text-sm text-[#64748B] mb-4">
          <Calendar className="h-4 w-4 mr-2" />
          <span>Até {new Date(goal.endDate).toLocaleDateString('pt-BR')}</span>
          {daysRemaining !== null && (
            <>
              <span className="mx-2">·</span>
              <span className={`font-medium ${daysRemaining < 30 ? 'text-amber-600' : daysRemaining < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                {daysRemaining < 0 ? `${Math.abs(daysRemaining)} dias atrasada` : `${daysRemaining} dias restantes`}
              </span>
            </>
          )}
        </div>
      )}

      {/* Barra de progresso */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progresso</span>
          <span className="text-sm font-bold text-gray-900">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              status.color === 'success' ? 'bg-emerald-600' :
              status.color === 'warning' ? 'bg-amber-500' : 'bg-red-500'
            } ${progress >= 80 ? 'animate-pulse' : ''}`}
            style={{ 
              width: `${progress}%`,
              backgroundImage: progress >= 80 ? 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.2) 4px, rgba(255,255,255,0.2) 8px)' : 'none'
            }}
          />
        </div>
      </div>

      {/* Sparkline (desktop only) */}
      <div className="hidden md:flex items-center justify-end mb-4">
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-[#64748B]" />
          <div className="flex items-end gap-0.5 h-6">
            {sparklineData.map((value, index) => (
              <div
                key={index}
                className="w-1 bg-emerald-400 rounded-sm"
                style={{ height: `${Math.max(value * 0.2, 0.2)}rem` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-2">
        {status.label !== 'Concluída' && progress < 100 && (
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              onAddContribution(goal);
            }}
            size="sm" 
            className="flex-1"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Adicionar Aporte
          </Button>
        )}
        
        {progress >= 100 && status.label !== 'Concluída' && onComplete && (
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              onComplete(goal.id);
            }}
            size="sm" 
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Concluir
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onArchive(goal.id);
          }}
        >
          <Archive className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default MetaCardV2;
