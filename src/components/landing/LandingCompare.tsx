import React from 'react';
import { X, Check } from 'lucide-react';
import { motion } from 'framer-motion';
const LandingCompare = () => {
  const compareItems = [{
    feature: "Registrar por WhatsApp",
    planilha: false,
    moneyzap: true
  }, {
    feature: "Extrair dados de foto",
    planilha: false,
    moneyzap: true
  }, {
    feature: "Relatórios automáticos",
    planilha: false,
    moneyzap: true
  }];
  return <section id="f5-compare" className="py-16 md:py-20 bg-white w-full">
      <div className="container max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        <motion.div className="text-center mb-16" initial={{
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
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Mais simples que app. Muito melhor que planilha.
          </h2>
        </motion.div>
        
        <motion.div className="max-w-4xl mx-auto" initial={{
        opacity: 0,
        y: 40
      }} whileInView={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.6
      }} viewport={{
        once: true
      }}>
          {/* Table Header */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="font-semibold text-lg text-gray-900 p-4">Recurso</div>
            <div className="font-semibold text-lg text-gray-900 p-4 text-center">Planilha</div>
            <div className="font-semibold text-lg text-gray-900 p-4 text-center bg-primary/5 rounded-lg">MeuControle IA</div>
          </div>

          {/* Table Rows */}
          {compareItems.map((item, index) => <motion.div key={index} className={`grid grid-cols-3 gap-4 py-4 border-b border-gray-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`} initial={{
          opacity: 0,
          x: -20
        }} whileInView={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.6,
          delay: index * 0.1
        }} viewport={{
          once: true
        }}>
              <div className="p-4 text-gray-700">{item.feature}</div>
              <div className="p-4 text-center">
                {item.planilha ? <Check className="h-6 w-6 text-green-600 mx-auto" /> : <X className="h-6 w-6 text-red-500 mx-auto" />}
              </div>
              <div className="p-4 text-center">
                {item.moneyzap ? <Check className="h-6 w-6 text-green-600 mx-auto" /> : <X className="h-6 w-6 text-red-500 mx-auto" />}
              </div>
            </motion.div>)}
        </motion.div>

        <motion.div className="text-center mt-12" initial={{
        opacity: 0
      }} whileInView={{
        opacity: 1
      }} transition={{
        duration: 0.6,
        delay: 0.5
      }} viewport={{
        once: true
      }}>
          <p className="text-lg text-gray-600">
            Sem instalar nada novo. Você já sabe usar.
          </p>
        </motion.div>
      </div>
    </section>;
};
export default LandingCompare;