
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Target, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { Goal } from '@/types';
import { formatCurrency } from '@/utils/transactionUtils';
import { usePreferences } from '@/contexts/PreferencesContext';

interface GoalDetailsModalProps {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (goal: Goal) => void;
  onAddContribution: (goal: Goal) => void;
}

const GoalDetailsModal: React.FC<GoalDetailsModalProps> = ({
  goal,
  open,
  onOpenChange,
  onEdit,
  onAddContribution
}) => {
  const { currency } = usePreferences();

  if (!goal) return null;

  // Calcular métricas
  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  
  const daysRemaining = goal.endDate 
    ? Math.ceil((new Date(goal.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Calcular aporte sugerido
  const suggestedMonthlyContribution = daysRemaining && daysRemaining > 0 && remaining > 0
    ? Math.ceil(remaining / Math.max(Math.ceil(daysRemaining / 30), 1))
    : 0;

  // Status
  const getStatus = () => {
    if (progress >= 100) return { label: 'Concluída', color: 'success' };
    if (!daysRemaining) return { label: 'No prazo', color: 'success' };
    
    const totalDays = goal.startDate && goal.endDate 
      ? Math.ceil((new Date(goal.endDate).getTime() - new Date(goal.startDate).getTime()) / (1000 * 60 * 60 * 24))
      : 365;
    
    const daysElapsed = totalDays - daysRemaining;
    const timeProgress = (daysElapsed / totalDays) * 100;
    const relativeProgress = timeProgress > 0 ? (progress / timeProgress) : 1;
    
    if (daysRemaining < 0) return { label: 'Atrasada', color: 'destructive' };
    if (relativeProgress < 0.5) return { label: 'Atrasada', color: 'destructive' };
    if (relativeProgress < 0.8) return { label: 'Em risco', color: 'warning' };
    
    return { label: 'No prazo', color: 'success' };
  };

  const status = getStatus();

  // Mock histórico de aportes
  const contributionHistory = [
    { date: '2024-01-15', amount: 500, description: 'Aporte mensal' },
    { date: '2024-01-08', amount: 200, description: 'Sobra do orçamento' },
    { date: '2024-01-01', amount: 1000, description: 'Aporte inicial' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">{goal.name}</DialogTitle>
            <Badge 
              variant={status.color === 'success' ? 'default' : status.color === 'warning' ? 'secondary' : 'destructive'}
            >
              {status.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Overview */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Visão Geral
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progresso */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progresso atual</span>
                  <span className="text-sm font-bold">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      status.color === 'success' ? 'bg-emerald-600' :
                      status.color === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Valores */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Valor Atual</div>
                  <div className="text-lg font-bold text-emerald-600">
                    {formatCurrency(goal.currentAmount, currency)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Meta</div>
                  <div className="text-lg font-bold">
                    {formatCurrency(goal.targetAmount, currency)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Restante</div>
                  <div className="text-lg font-bold text-amber-600">
                    {formatCurrency(remaining, currency)}
                  </div>
                </div>
                {goal.endDate && (
                  <div>
                    <div className="text-sm text-gray-600">Prazo</div>
                    <div className="text-sm font-medium">
                      {new Date(goal.endDate).toLocaleDateString('pt-BR')}
                    </div>
                    {daysRemaining !== null && (
                      <div className={`text-xs ${daysRemaining < 30 ? 'text-amber-600' : daysRemaining < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {daysRemaining < 0 ? `${Math.abs(daysRemaining)} dias atrasada` : `${daysRemaining} dias restantes`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Forecast */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Previsão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {suggestedMonthlyContribution > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium">Aporte sugerido/mês</span>
                  </div>
                  <div className="text-lg font-bold text-emerald-600">
                    {formatCurrency(suggestedMonthlyContribution, currency)}
                  </div>
                  <div className="text-xs text-gray-600">
                    Para atingir a meta no prazo
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium">Estimativa</span>
                </div>
                <div className="text-sm text-gray-600">
                  {daysRemaining && daysRemaining > 0 && suggestedMonthlyContribution > 0
                    ? `Mantendo o aporte sugerido, você atingirá a meta em ${Math.ceil(daysRemaining / 30)} meses`
                    : 'Configure um prazo para ver estimativas'
                  }
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Aportes */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Histórico de Aportes</CardTitle>
            </CardHeader>
            <CardContent>
              {contributionHistory.length > 0 ? (
                <div className="space-y-3">
                  {contributionHistory.map((contribution, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{contribution.description}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(contribution.date).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <div className="font-bold text-emerald-600">
                        +{formatCurrency(contribution.amount, currency)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>Nenhum aporte registrado ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onEdit(goal)}>
            Editar Meta
          </Button>
          {progress < 100 && (
            <Button onClick={() => onAddContribution(goal)}>
              Adicionar Aporte
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoalDetailsModal;
