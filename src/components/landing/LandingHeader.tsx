
import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';

const LandingHeader = () => {
  const { companyName } = useBrandingConfig();
  
  const scrollToPlans = useCallback(() => {
    const section = document.getElementById('f6-pricing');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <motion.header 
      className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b w-full"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full px-4 py-4 flex items-center justify-between max-w-none">
        <div className="flex items-center space-x-2">
          <img 
            src="/lovable-uploads/4ff12418-1fa6-4e2d-9616-60b1a59be0fc.png" 
            alt="MoneyZap Logo" 
            className="h-12 w-auto"
          />
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-4">
          <Button variant="ghost" asChild>
            <Link to="/login">Entrar</Link>
          </Button>
          <Button 
            asChild={false} 
            onClick={scrollToPlans}
            className="text-xs sm:text-sm md:text-base"
            size="sm"
          >
            Começar agora
          </Button>
        </div>
      </div>
    </motion.header>
  );
};

export default LandingHeader;
