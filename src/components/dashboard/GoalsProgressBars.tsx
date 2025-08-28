
import React, { useState, useEffect } from 'react';
import { Target, Plus, TrendingUp, Edit2, Calendar } from 'lucide-react';
import { usePreferences } from '@/contexts/PreferencesContext';

interface Goal {
  id: string;
  name: string;
  currentAmount: number;
  targetAmount: number;
  deadline?: string;
  color: string;
}

interface GoalsProgressBarsProps {
  goals: Goal[];
  onAddContribution?: (goalId: string) => void;
  onEditGoal?: (goalId: string) => void;
  onCreateGoal?: () => void;
}

const GoalsProgressBars: React.FC<GoalsProgressBarsProps> = ({
  goals,
  onAddContribution,
  onEditGoal,
  onCreateGoal
}) => {
  const { currency } = usePreferences();
  const [completedGoals, setCompletedGoals] = useState<Set<string>>(new Set());
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL'
    }).format(value);
  };

  const getGoalStatus = (current: number, target: number, deadline?: string) => {
    const progress = (current / target) * 100;
    
    if (progress >= 100) return { 
      status: 'completed', 
      color: 'bg-emerald-600', 
      text: 'Concluída',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700'
    };
    
    if (!deadline) return { 
      status: 'normal', 
      color: 'bg-emerald-600', 
      text: 'No prazo',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700'
    };
    
    const daysLeft = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (progress >= 80) return { 
      status: 'on-track', 
      color: 'bg-emerald-600', 
      text: 'No prazo',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700'
    };
    
    if (daysLeft <= 30) return { 
      status: 'at-risk', 
      color: 'bg-amber-500', 
      text: 'Em risco',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600'
    };
    
    return { 
      status: 'normal', 
      color: 'bg-emerald-600', 
      text: 'No prazo',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700'
    };
  };

  const calculateSuggestedContribution = (current: number, target: number, deadline?: string) => {
    if (!deadline || current >= target) return 0;
    
    const remaining = target - current;
    const daysLeft = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
    
    return Math.ceil(remaining / monthsLeft);
  };

  const triggerConfetti = (goalId: string) => {
    setCompletedGoals(prev => new Set([...prev, goalId]));
    
    // Animação de confete simples
    const confettiCount = 30;
    const colors = ['#10B981', '#22C7A9', '#63D471', '#F59E0B'];
    
    Array.from({ length: confettiCount }, (_, i) => {
      const confetti = document.createElement('div');
      confetti.style.position = 'fixed';
      confetti.style.width = '8px';
      confetti.style.height = '8px';
      confetti.style.backgroundColor = colors[i % colors.length];
      confetti.style.left = Math.random() * window.innerWidth + 'px';
      confetti.style.top = '-10px';
      confetti.style.borderRadius = '50%';
      confetti.style.zIndex = '9999';
      confetti.style.pointerEvents = 'none';
      
      const animation = confetti.animate([
        { 
          transform: 'translateY(0) rotate(0deg)', 
          opacity: 1 
        },
        { 
          transform: `translateY(${window.innerHeight + 100}px) rotate(720deg)`, 
          opacity: 0 
        }
      ], {
        duration: 3000,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      });
      
      document.body.appendChild(confetti);
      
      animation.addEventListener('finish', () => {
        if (document.body.contains(confetti)) {
          document.body.removeChild(confetti);
        }
      });
    });
  };

  useEffect(() => {
    goals.forEach(goal => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      if (progress >= 100 && !completedGoals.has(goal.id)) {
        triggerConfetti(goal.id);
      }
    });
  }, [goals, completedGoals]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Metas Financeiras</h3>
        <button
          onClick={onCreateGoal}
          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 rounded-lg px-3 py-2"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm font-medium">Nova Meta</span>
        </button>
      </div>

      <div className="space-y-4">
        {goals.map((goal) => {
          const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
          const { status, color, text, bgColor, textColor } = getGoalStatus(goal.currentAmount, goal.targetAmount, goal.deadline);
          const suggestedContribution = calculateSuggestedContribution(goal.currentAmount, goal.targetAmount, goal.deadline);

          return (
            <div key={goal.id} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg hover:scale-[1.01] transition-all duration-200">
              {/* Cabeçalho da meta */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-emerald-600" />
                  <h4 className="font-semibold text-gray-900">{goal.name}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${bgColor} ${textColor}`}>
                    {text}
                  </span>
                  <button
                    onClick={() => onEditGoal?.(goal.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                    title="Editar meta"
                  >
                    <Edit2 className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {progress.toFixed(0)}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ease-out ${color}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Informações da meta */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Restante:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(remaining)}</span>
                </div>
                
                {suggestedContribution > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Aporte sugerido:</span>
                    <span className="font-medium text-emerald-600">{formatCurrency(suggestedContribution)}/mês</span>
                  </div>
                )}
                
                {goal.deadline && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prazo:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>

              {/* Ações */}
              {status !== 'completed' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => onAddContribution?.(goal.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-full transition-all duration-200 font-medium hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Adicionar Aporte
                  </button>
                  
                  {goal.deadline && (
                    <button
                      onClick={() => {
                        console.log('Agendar aporte para meta:', goal.id);
                        // Navegar para agendamentos com meta pré-preenchida
                      }}
                      className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-full transition-all duration-200 font-medium hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400/50"
                      title="Agendar aporte mensal"
                    >
                      <Calendar className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Target className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">Nenhuma meta criada ainda</p>
            <p className="mb-6">Defina suas metas financeiras e acompanhe seu progresso</p>
            <button
              onClick={onCreateGoal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
            >
              Criar Primeira Meta
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalsProgressBars;
