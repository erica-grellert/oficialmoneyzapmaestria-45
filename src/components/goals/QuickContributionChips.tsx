
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePreferences } from '@/contexts/PreferencesContext';

interface QuickContributionChipsProps {
  onContribute: (amount: number) => void;
  className?: string;
}

const QuickContributionChips: React.FC<QuickContributionChipsProps> = ({ 
  onContribute, 
  className = '' 
}) => {
  const { currency } = usePreferences();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  const presetAmounts = [50, 100, 200];

  const handleCustomSubmit = () => {
    const amount = parseFloat(customAmount);
    if (amount > 0) {
      onContribute(amount);
      setCustomAmount('');
      setShowCustomInput(false);
    }
  };

  const getCurrencySymbol = () => {
    return currency === 'USD' ? '$' : 'R$';
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {presetAmounts.map((amount) => (
        <Button
          key={amount}
          variant="outline"
          size="sm"
          onClick={() => onContribute(amount)}
          className="h-8 px-3 text-xs bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
        >
          {getCurrencySymbol()}{amount}
        </Button>
      ))}
      
      {!showCustomInput ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCustomInput(true)}
          className="h-8 px-3 text-xs bg-white hover:bg-slate-50"
        >
          Outro
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Valor"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="h-8 w-20 text-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCustomSubmit();
              if (e.key === 'Escape') {
                setShowCustomInput(false);
                setCustomAmount('');
              }
            }}
            autoFocus
          />
          <Button
            size="sm"
            onClick={handleCustomSubmit}
            className="h-8 px-3 text-xs"
          >
            OK
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuickContributionChips;
