
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Plus, Edit2, Archive, Check } from 'lucide-react';
import { Goal } from '@/types';
import { formatCurrency } from '@/utils/transactionUtils';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useToast } from '@/hooks/use-toast';

interface MetaCardMiniProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onArchive: (goalId: string) => void;
  onAddContribution: (goalId: string, amount: number, description?: string) => void;
}

const MetaCardMini: React.FC<MetaCardMiniProps> = ({ 
  goal, 
  onEdit, 
  onArchive, 
  onAddContribution 
}) => {
  const { currency } = usePreferences();
  const { toast } = useToast();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionDescription, setContributionDescription] = useState('');

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

  const handleAddContribution = () => {
    const amount = parseFloat(contributionAmount);
    if (amount > 0) {
      onAddContribution(goal.id, amount, contributionDescription);
      setContributionAmount('');
      setContributionDescription('');
      setIsPopoverOpen(false);
      
      // Verificar se atingiu 100% para mostrar confete
      const newProgress = Math.min(((goal.currentAmount + amount) / goal.targetAmount) * 100, 100);
      if (newProgress >= 100 && progress < 100) {
        triggerConfetti();
      }
      
      toast({
        title: 'Aporte adicionado',
        description: `${formatCurrency(amount, currency)} adicionado à meta ${goal.name}`,
      });
    }
  };

  const triggerConfetti = () => {
    const confettiCount = 20;
    const colors = ['#10B981', '#22C7A9', '#63D471', '#F59E0B'];
    
    Array.from({ length: confettiCount }, (_, i) => {
      const confetti = document.createElement('div');
      confetti.style.position = 'fixed';
      confetti.style.width = '6px';
      confetti.style.height = '6px';
      confetti.style.backgroundColor = colors[i % colors.length];
      confetti.style.left = Math.random() * window.innerWidth + 'px';
      confetti.style.top = '-10px';
      confetti.style.borderRadius = '50%';
      confetti.style.zIndex = '9999';
      confetti.style.pointerEvents = 'none';
      
      const animation = confetti.animate([
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        { transform: `translateY(${window.innerHeight + 50}px) rotate(360deg)`, opacity: 0 }
      ], {
        duration: 2000,
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

  return (
    <Card className="p-4 bg-white border-[#EDEFF2] shadow-sm rounded-xl hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm truncate pr-2">{goal.name}</h4>
        <Badge 
          variant={status.color === 'success' ? 'default' : status.color === 'warning' ? 'secondary' : 'destructive'}
          className={`text-xs ${status.bgColor} ${status.textColor} border-0`}
        >
          {status.label === 'Concluída' && <Check className="h-3 w-3 mr-1" />}
          {status.label}
        </Badge>
      </div>

      {/* Números em uma linha */}
      <div className="mb-3">
        <div className="text-xs text-[#64748B] font-medium">
          <span className="text-emerald-600 font-semibold">{formatCurrency(goal.currentAmount, currency)}</span>
          <span className="mx-1">/</span>
          <span>{formatCurrency(goal.targetAmount, currency)}</span>
          <span className="mx-2">·</span>
          <span>Restante: <span className="font-semibold">{formatCurrency(remaining, currency)}</span></span>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
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
          <span className="absolute right-2 top-0 text-xs font-medium text-gray-700 leading-none pt-0.5">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Prazo (se existir) */}
      {goal.endDate && (
        <div className="flex items-center text-xs text-[#64748B] mb-3">
          <Calendar className="h-3 w-3 mr-1" />
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

      {/* Ações */}
      {status.label !== 'Concluída' && (
        <div className="flex items-center gap-2">
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 h-8 text-xs"
                title="Adicionar aporte"
              >
                <Plus className="h-3 w-3 mr-1" />
                Aporte
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Valor do aporte</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0,00"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Observação (opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Descrição do aporte..."
                    value={contributionDescription}
                    onChange={(e) => setContributionDescription(e.target.value)}
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddContribution} size="sm" className="flex-1">
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => setIsPopoverOpen(false)} size="sm" className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onEdit(goal)}
            title="Editar meta"
          >
            <Edit2 className="h-3 w-3" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onArchive(goal.id)}
            title="Arquivar meta"
          >
            <Archive className="h-3 w-3" />
          </Button>
        </div>
      )}
    </Card>
  );
};

export default MetaCardMini;
