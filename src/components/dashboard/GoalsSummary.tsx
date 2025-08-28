
import React, { useState } from 'react';
import { Target, Plus, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Goal } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import GoalKPICards from '@/components/goals/GoalKPICards';
import GoalCardV3 from '@/components/goals/GoalCardV3';
import AddContributionModal from '@/components/goals/AddContributionModal';

interface GoalsSummaryProps {
  goals: Goal[];
  onAddContribution: (goalId: string, amount: number, description?: string) => void;
  onEditGoal: (goalId: string) => void;
  onCreateGoal: () => void;
  onArchiveGoal?: (goalId: string) => void;
}

const GoalsSummary: React.FC<GoalsSummaryProps> = ({
  goals,
  onAddContribution,
  onEditGoal,
  onCreateGoal,
  onArchiveGoal
}) => {
  const { currency } = usePreferences();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);

  // Filtrar metas ativas para mostrar no dashboard
  const activeGoals = goals.filter(goal => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    return progress < 100;
  }).slice(0, 3); // Mostrar apenas as 3 primeiras

  const handleEditGoal = (goal: Goal) => {
    onEditGoal(goal.id);
  };

  const handleArchiveGoal = (goalId: string) => {
    if (onArchiveGoal) {
      onArchiveGoal(goalId);
    }
  };

  const handleAddContribution = (goal: Goal, amount?: number) => {
    if (amount) {
      // Aporte rápido
      onAddContribution(goal.id, amount, 'Aporte rápido');
      
      // Mostrar toast de sucesso
      toast({
        title: 'Aporte adicionado',
        description: `${currency === 'USD' ? '$' : 'R$'}${amount.toFixed(2)} adicionado à meta ${goal.name}`,
      });

      // Micro-efeito na barra (implementar com animação CSS se necessário)
    } else {
      // Abrir modal para aporte detalhado
      setSelectedGoal(goal);
      setIsContributionModalOpen(true);
    }
  };

  const handleContributionConfirm = (goalId: string, amount: number, description?: string, date?: string) => {
    onAddContribution(goalId, amount, description);
    
    const goal = goals.find(g => g.id === goalId);
    toast({
      title: 'Aporte adicionado',
      description: `${currency === 'USD' ? '$' : 'R$'}${amount.toFixed(2)} adicionado à meta ${goal?.name}`,
    });
  };

  return (
    <>
      <Card className="bg-white border-slate-200 shadow-sm rounded-xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-slate-900">Metas Financeiras</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/goals')}
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              >
                <Eye className="h-4 w-4 mr-1" />
                Ver todas
              </Button>
              <Button
                onClick={onCreateGoal}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nova Meta
              </Button>
            </div>
          </div>

          {/* KPIs */}
          <GoalKPICards goals={goals} />
        </CardHeader>

        <CardContent className="pt-0">
          {activeGoals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeGoals.map((goal) => (
                <GoalCardV3
                  key={goal.id}
                  goal={goal}
                  onAddContribution={handleAddContribution}
                  onEdit={handleEditGoal}
                  onArchive={handleArchiveGoal}
                  showQuickActions={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-emerald-600" />
              </div>
              <p className="text-lg font-medium text-slate-900 mb-2">Crie sua primeira meta financeira</p>
              <p className="text-sm text-slate-600 mb-6">Defina objetivos e acompanhe seu progresso de forma visual</p>
              <Button
                onClick={onCreateGoal}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Meta
              </Button>
            </div>
          )}

          {activeGoals.length >= 3 && goals.length > 3 && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => navigate('/goals')}
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              >
                Ver mais {goals.length - 3} metas
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Contribuição */}
      <AddContributionModal
        goal={selectedGoal}
        open={isContributionModalOpen}
        onOpenChange={setIsContributionModalOpen}
        onConfirm={handleContributionConfirm}
      />
    </>
  );
};

export default GoalsSummary;
