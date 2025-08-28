import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Smartphone, BarChart3, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingInside = () => {
  const features = [
    {
      emoji: "📱",
      title: "Registro por texto/áudio/foto"
    },
    {
      emoji: "📊",
      title: "Relatórios por categoria e período"
    },
    {
      emoji: "🎯",
      title: "Metas e acompanhamento"
    }
  ];

  const testimonials = [
    {
      rating: "★★★★★",
      quote: "Finalmente consegui acompanhar tudo sem planilha.",
      author: "— Ana M."
    },
    {
      rating: "★★★★★",
      quote: "Só mandar no Whats e pronto. Resolvido.",
      author: "— Paulo R."
    }
  ];

  return (
    <section id="f4-inside" className="py-16 md:py-20 w-full">
      <div className="container max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Veja por dentro
          </h2>
        </motion.div>
        
        {/* Features */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, staggerChildren: 0.1 }}
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-8 text-center">
                  <div className="text-4xl mb-4">{feature.emoji}</div>
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, staggerChildren: 0.2 }}
          viewport={{ once: true }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="h-full bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-8">
                  <div className="text-yellow-400 text-lg mb-3">{testimonial.rating}</div>
                  <blockquote className="text-gray-700 text-lg mb-4 italic">
                    "{testimonial.quote}"
                  </blockquote>
                  <p className="text-gray-600 font-medium">{testimonial.author}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default LandingInside;