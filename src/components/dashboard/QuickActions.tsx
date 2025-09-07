
import React from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickActionsProps {
  onWithdraw: () => void;
  onDeposit: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onWithdraw,
  onDeposit
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      <Button 
        variant="outline" 
        size="lg" 
        onClick={onWithdraw}
        className="h-12 bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium"
      >
        <ArrowDownLeft className="mr-2 h-5 w-5" />
        Retirar
      </Button>
      
      <Button 
        size="lg" 
        onClick={onDeposit}
        className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
      >
        <ArrowUpRight className="mr-2 h-5 w-5" />
        Depositar
      </Button>
    </div>
  );
};

export default QuickActions;
