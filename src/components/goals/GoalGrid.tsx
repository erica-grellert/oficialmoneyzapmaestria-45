import React from 'react';
import { Goal } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import RingProgress from '@/components/ui/ring-progress';
import { formatCurrency } from '@/utils/transactionUtils';
import { usePreferences } from '@/contexts/PreferencesContext';
import { CalendarDays, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GoalGridProps {
  goals: Goal[];
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onGoalClick: (goal: Goal) => void;
}

const GoalGrid: React.FC<GoalGridProps> = ({ goals, onEdit, onDelete, onGoalClick }) => {
  const { currency } = usePreferences();

  const getStatusColor = (goal: Goal) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const daysToTarget = goal.endDate ? Math.floor((new Date(goal.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
    
    if (progress >= 100) return 'success';
    if (daysToTarget !== null && daysToTarget < 30) return 'warning';
    if (daysToTarget !== null && daysToTarget < 0) return 'danger';
    return 'default';
  };

  const getStatusText = (goal: Goal) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const daysToTarget = goal.endDate ? Math.floor((new Date(goal.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
    
    if (progress >= 100) return 'Atingida';
    if (daysToTarget !== null && daysToTarget < 0) return 'Vencida';
    if (daysToTarget !== null && daysToTarget < 30) return 'Em risco';
    return 'No prazo';
  };

  const getStatusIcon = (goal: Goal) => {
    const status = getStatusText(goal);
    switch (status) {
      case 'Atingida':
        return <Target className="h-4 w-4" />;
      case 'Vencida':
        return <AlertTriangle className="h-4 w-4" />;
      case 'Em risco':
        return <CalendarDays className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  if (goals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <Target className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground mb-4">Nenhuma meta criada ainda</p>
        <p className="text-sm text-muted-foreground">Crie sua primeira meta para começar a acompanhar seus objetivos financeiros</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {goals.map((goal) => {
        const progress = (goal.currentAmount / goal.targetAmount) * 100;
        const remaining = goal.targetAmount - goal.currentAmount;
        const statusColor = getStatusColor(goal);
        const statusText = getStatusText(goal);

        return (
          <Card 
            key={goal.id} 
            className="p-6 hover:shadow-md transition-all duration-200 cursor-pointer group"
            onClick={() => onGoalClick(goal)}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg truncate">{goal.name}</h3>
                <Badge 
                  variant={statusColor === 'success' ? 'default' : statusColor === 'warning' ? 'secondary' : 'destructive'}
                  className="gap-1"
                >
                  {getStatusIcon(goal)}
                  {statusText}
                </Badge>
              </div>

              {/* Progress Ring */}
              <div className="flex items-center justify-center">
                <RingProgress
                  value={Math.min(progress, 100)}
                  size="xl"
                  strokeWidth={8}
                  className="text-primary"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold font-mono">
                      {Math.round(progress)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Concluída
                    </div>
                  </div>
                </RingProgress>
              </div>

              {/* Values */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Atual:</span>
                  <span className="font-mono font-medium">{formatCurrency(goal.currentAmount, currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Meta:</span>
                  <span className="font-mono font-medium">{formatCurrency(goal.targetAmount, currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Restante:</span>
                  <span className="font-mono font-medium text-primary">{formatCurrency(remaining, currency)}</span>
                </div>
              </div>

              {/* Target Date */}
              {goal.endDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>Meta: {new Date(goal.endDate).toLocaleDateString('pt-BR')}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(goal);
                  }}
                  className="flex-1"
                >
                  Editar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(goal);
                  }}
                  className="flex-1 text-red-600 hover:text-red-700"
                >
                  Excluir
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default GoalGrid;