import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LandingFAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqItems = [
    {
      question: "Preciso instalar algum app?",
      answer: "Não! Funciona no seu WhatsApp atual. Você só adiciona nosso número e já pode começar a usar."
    },
    {
      question: "É seguro?",
      answer: "Sim. Seus dados são criptografados e você tem controle total. Pode exportar ou excluir tudo quando quiser."
    },
    {
      question: "Funciona com qualquer banco?",
      answer: "Sim. Você envia os dados dos gastos e receitas por WhatsApp, independente do banco que usa."
    },
    {
      question: "E se eu esquecer de lançar?",
      answer: "Pode mandar depois! Você informa a data que gastou e a IA organiza tudo no lugar certo."
    },
    {
      question: "Posso usar com mais alguém?",
      answer: "Cada pessoa precisa da própria conta, mas você pode compartilhar relatórios quando quiser."
    },
    {
      question: "Posso exportar meus dados?",
      answer: "Claro! Você pode baixar seus dados em planilha a qualquer momento. Seus dados são seus."
    },
    {
      question: "Como recebo suporte?",
      answer: "Pelo mesmo WhatsApp! Nossa equipe responde rapidamente e te ajuda com qualquer dúvida."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="f7-faq" className="py-16 md:py-20 bg-white w-full">
      <div className="container max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Perguntas frequentes
          </h2>
        </motion.div>
        
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          {faqItems.map((item, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <button
                className="w-full p-6 text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-primary/20"
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
              >
                <h3 className="text-lg font-semibold text-gray-900 pr-4">
                  {item.question}
                </h3>
                <ChevronDown 
                  className={`h-5 w-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-0 text-gray-600">
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default LandingFAQ;