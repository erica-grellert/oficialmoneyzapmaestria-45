import React, { useState } from 'react';
import TopBar from '@/components/navigation/TopBar';
import MobileNavBar from '@/components/layout/MobileNavBar';
import FloatingActionButton from '@/components/navigation/FloatingActionButton';
import { cn } from '@/lib/utils';
import { TransactionFormV2 } from '@/components/common/TransactionFormV2';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
  showFAB?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  className, 
  showFAB = true 
}) => {
  const [formOpen, setFormOpen] = useState(false);
  const [defaultTransactionType, setDefaultTransactionType] = useState<'income' | 'expense'>('expense');

  const handleAddTransaction = (type: 'income' | 'expense') => {
    setDefaultTransactionType(type);
    setFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      
      <main className={cn(
        'min-h-screen pb-20 md:pb-0',
        'transition-all duration-200',
        className
      )}>
        {children}
      </main>

      <MobileNavBar onAddTransaction={handleAddTransaction} />
      
      {showFAB && <FloatingActionButton />}

      <TransactionFormV2
        open={formOpen}
        onOpenChange={setFormOpen}
        mode="create"
        defaultType={defaultTransactionType}
      />
    </div>
  );
};

export default AppLayout;