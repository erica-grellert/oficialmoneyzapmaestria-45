import React from 'react';
import TopBar from '@/components/navigation/TopBar';
import BottomNav from '@/components/navigation/BottomNav';
import FloatingActionButton from '@/components/navigation/FloatingActionButton';
import { cn } from '@/lib/utils';

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

      <BottomNav />
      
      {showFAB && <FloatingActionButton />}
    </div>
  );
};

export default AppLayout;