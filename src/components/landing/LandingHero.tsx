
import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const LandingHero = () => {
  const scrollToPlans = useCallback(() => {
    const section = document.getElementById('precos');
    if (section) {
      const offset = 88;
      const elementPosition = section.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  const scrollToSteps = useCallback(() => {
    const section = document.getElementById('funcionalidades');
    if (section) {
      const offset = 88;
      const elementPosition = section.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  return (
    <section id="f1-hero" className="py-20 md:py-32 w-full bg-primary">
      <div className="container max-w-6xl mx-auto px-4 md:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            Organize seu dinheiro direto pelo WhatsApp
          </h1>
          
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Envie suas despesas por texto, áudio ou foto — a IA organiza tudo pra você em um painel simples.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="text-primary bg-white hover:bg-white/90 text-base px-8 py-6 font-semibold" 
              onClick={scrollToPlans}
            >
              Começar agora
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={scrollToSteps} 
              className="border-white text-base px-8 py-6 text-slate-950 bg-green-500 hover:bg-green-400"
            >
              Ver como funciona
            </Button>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white">
              <span className="text-lg">💬</span>
              <span className="font-medium">100% pelo WhatsApp</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white">
              <span className="text-lg">⚡</span>
              <span className="font-medium">Registro em segundos</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white">
              <span className="text-lg">📊</span>
              <span className="font-medium">Relatórios claros</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white">
              <span className="text-lg">🤝</span>
              <span className="font-medium">Suporte via WhatsApp</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LandingHero;
