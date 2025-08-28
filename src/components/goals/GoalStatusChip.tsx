
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Clock, XCircle } from 'lucide-react';
import { Goal } from '@/types';

interface GoalStatusChipProps {
  goal: Goal;
}

const GoalStatusChip: React.FC<GoalStatusChipProps> = ({ goal }) => {
  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  
  const getStatus = () => {
    if (progress >= 100) {
      return {
        label: 'Concluída',
        variant: 'default' as const,
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: CheckCircle
      };
    }
    
    if (!goal.endDate) {
      return {
        label: 'No prazo',
        variant: 'outline' as const,
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: Clock
      };
    }
    
    const daysRemaining = Math.ceil((new Date(goal.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) {
      return {
        label: 'Atrasada',
        variant: 'destructive' as const,
        className: 'bg-red-50 text-red-700 border-red-200',
        icon: XCircle
      };
    }
    
    // Calcular se está em risco baseado na projeção
    const totalDays = goal.startDate && goal.endDate 
      ? Math.ceil((new Date(goal.endDate).getTime() - new Date(goal.startDate).getTime()) / (1000 * 60 * 60 * 24))
      : 365;
    
    const daysElapsed = totalDays - daysRemaining;
    const timeProgress = (daysElapsed / totalDays) * 100;
    const relativeProgress = timeProgress > 0 ? (progress / timeProgress) : 1;
    
    if (relativeProgress < 0.8 || daysRemaining < 30) {
      return {
        label: 'Em risco',
        variant: 'outline' as const,
        className: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: AlertTriangle
      };
    }
    
    return {
      label: 'No prazo',
      variant: 'outline' as const,
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: Clock
    };
  };

  const status = getStatus();
  const IconComponent = status.icon;

  return (
    <Badge variant={status.variant} className={`text-xs font-medium ${status.className} border`}>
      <IconComponent className="h-3 w-3 mr-1" />
      {status.label}
    </Badge>
  );
};

export default GoalStatusChip;
