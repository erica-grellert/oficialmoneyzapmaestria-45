import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Brain, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingSteps = () => {
  const steps = [
    {
      icon: MessageCircle,
      emoji: "💬",
      title: "1. Envie por WhatsApp",
      description: "Texto, áudio ou foto do recibo."
    },
    {
      icon: Brain,
      emoji: "🧠",
      title: "2. A IA organiza",
      description: "Valor, data e categoria automaticamente."
    },
    {
      icon: BarChart3,
      emoji: "📊",
      title: "3. Veja tudo no painel",
      description: "Relatórios, metas e alertas simples."
    }
  ];

  return (
    <section id="f2-steps" className="py-16 md:py-20 w-full">
      <div className="container max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Como funciona (em 3 passos)
          </h2>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, staggerChildren: 0.1 }}
          viewport={{ once: true }}
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="text-4xl mb-4">{step.emoji}</div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <p className="text-sm text-gray-500 italic">
            Funciona no seu WhatsApp atual. Sem app novo.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default LandingSteps;