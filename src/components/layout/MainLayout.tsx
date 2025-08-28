
import React from 'react';
import Sidebar from './Sidebar';
import MobileNavBar from './MobileNavBar';
import MobileHeader from './MobileHeader';
import DesktopHeader from './DesktopHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAdaptiveContext } from '@/hooks/useAdaptiveContext';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  onAddTransaction?: (type: 'income' | 'expense') => void;
  onProfileClick?: () => void;
  onConfigClick?: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title,
  onAddTransaction,
  onProfileClick,
  onConfigClick
}) => {
  const isMobile = useIsMobile();
  const { hideValues, toggleHideValues } = useAdaptiveContext();
  
  const handleAddTransaction = (type: 'income' | 'expense') => {
    if (onAddTransaction) {
      onAddTransaction(type);
    } else {
      console.log(`Add ${type} transaction`);
    }
  };
  
  return (
    <div className="min-h-screen bg-background w-full">
      {isMobile ? (
        <div className="flex flex-col h-screen w-full">
          <MobileHeader hideValues={hideValues} toggleHideValues={toggleHideValues} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden px-3 xs:px-4 sm:px-6 pb-20 pt-16 xs:pt-18 sm:pt-20 w-full">
            {title && (
              <div className="mb-3 xs:mb-4 sm:mb-6">
                <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">{title}</h1>
              </div>
            )}
            <div className="w-full max-w-full">
              {children}
            </div>
          </main>
          <MobileNavBar onAddTransaction={handleAddTransaction} />
        </div>
      ) : (
        <div className="flex h-screen w-full overflow-hidden">
          <Sidebar onProfileClick={onProfileClick} onConfigClick={onConfigClick} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden w-full min-w-0 flex flex-col">
            <DesktopHeader hideValues={hideValues} toggleHideValues={toggleHideValues} />
            <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-4 lg:py-6 max-w-none">
              {title && (
                <div className="mb-4 sm:mb-6 lg:mb-8">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-foreground truncate">{title}</h1>
                </div>
              )}
              <div className="w-full max-w-none">
                {children}
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
