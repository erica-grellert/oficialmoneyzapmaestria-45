
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Goal } from '@/types';
import { formatCurrency } from '@/utils/transactionUtils';
import { usePreferences } from '@/contexts/PreferencesContext';

interface AddContributionModalProps {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (goalId: string, amount: number, description?: string, date?: string) => void;
}

const AddContributionModal: React.FC<AddContributionModalProps> = ({
  goal,
  open,
  onOpenChange,
  onConfirm
}) => {
  const { currency } = usePreferences();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const handleConfirm = () => {
    if (!goal || !amount) return;
    
    const numAmount = parseFloat(amount);
    if (numAmount > 0) {
      onConfirm(goal.id, numAmount, description || undefined, date);
      // Reset form
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      onOpenChange(false);
    }
  };

  const getCurrencySymbol = () => {
    return currency === 'USD' ? '$' : 'R$';
  };

  if (!goal) return null;

  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Aporte</DialogTitle>
          <div className="text-sm text-slate-600">
            Meta: <span className="font-semibold">{goal.name}</span>
          </div>
          <div className="text-sm text-slate-600">
            Restante: <span className="font-semibold text-amber-600">
              {formatCurrency(remaining, currency)}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Valor do aporte</Label>
            <div className="relative mt-1">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                {getCurrencySymbol()}
              </div>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>

          <div>
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Observação (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descrição do aporte..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!amount || parseFloat(amount) <= 0}
          >
            Confirmar aporte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddContributionModal;
