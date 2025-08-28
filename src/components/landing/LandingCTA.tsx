import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
const LandingCTA = () => {
  const scrollToPlans = useCallback(() => {
    const section = document.getElementById('f6-pricing');
    if (section) {
      section.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }, []);

  // Usar link atual de suporte WhatsApp - manter o existente
  const whatsappSupportUrl = "https://wa.me/5511999999999"; // Manter o link atual

  return <section id="f8-final-cta" className="py-20 bg-primary w-full">
      <div className="container max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.6
      }} viewport={{
        once: true
      }}>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Pronto para organizar seu dinheiro sem planilhas?
          </h2>
          
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Comece agora. Você envia por WhatsApp e a IA faz o resto.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button size="lg" className="text-primary bg-white hover:bg-white/90 text-base px-8 py-6 font-semibold" onClick={scrollToPlans}>
              Começar agora
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 text-base px-8 py-6" asChild>
              
            </Button>
          </div>

          <p className="text-sm text-white/70">
            Qualquer dúvida, estamos no WhatsApp.
          </p>
        </motion.div>
      </div>
    </section>;
};
export default LandingCTA;