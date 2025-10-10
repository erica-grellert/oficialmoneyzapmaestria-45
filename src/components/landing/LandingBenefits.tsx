import React from 'react';
import { Clock, Brain, Target, Bell, Camera, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
const LandingBenefits = () => {
  const benefits = [{
    emoji: "⏱️",
    title: "Sem burocracia",
    description: "esqueça planilhas e cadastros chatos"
  }, {
    emoji: "🧠",
    title: "IA que ajuda",
    description: "entende seus gastos e categoriza"
  }, {
    emoji: "🎯",
    title: "Metas simples",
    description: "defina objetivos e acompanhe"
  }, {
    emoji: "🔔",
    title: "Lembretes úteis",
    description: "não deixe contas passarem"
  }, {
    emoji: "🧾",
    title: "Foto do recibo",
    description: "a IA extrai os dados pra você"
  }, {
    emoji: "🔐",
    title: "Seus dados, seu controle",
    description: "exporte quando quiser"
  }];
  return <section id="f3-benefits" className="py-20 bg-white w-full">
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
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Por que as pessoas escolhem MeuControle IA?</h2>
        </motion.div>
        
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12" initial={{
        opacity: 0,
        y: 40
      }} whileInView={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.6,
        staggerChildren: 0.1
      }} viewport={{
        once: true
      }}>
          {benefits.map((benefit, index) => <motion.div key={index} className="text-center" initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6,
          delay: index * 0.1
        }} viewport={{
          once: true
        }}>
              <div className="text-4xl mb-4">{benefit.emoji}</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </motion.div>)}
        </motion.div>

        <motion.div className="text-center" initial={{
        opacity: 0
      }} whileInView={{
        opacity: 1
      }} transition={{
        duration: 0.6,
        delay: 0.5
      }} viewport={{
        once: true
      }}>
          <p className="text-lg text-gray-600 italic">
            Feito para o seu dia a dia, não para o laboratório.
          </p>
        </motion.div>
      </div>
    </section>;
};
export default LandingBenefits;