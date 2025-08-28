import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Star, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { usePlanConfig } from "@/hooks/usePlanConfig";

const LandingPricing = () => {
  const { config, isLoading, error } = usePlanConfig();

  if (isLoading) {
    return (
      <section className="py-20 w-full" id="planos">
        <div className="w-full px-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  if (error || !config) {
    return (
      <section className="py-20 w-full" id="planos">
        <div className="w-full px-4">
          <div className="text-center text-red-600">
            Erro ao carregar configurações dos planos
          </div>
        </div>
      </section>
    );
  }

  const plans = [
    {
      name: "Mensal",
      price: `R$ ${config.prices.monthly.price}`,
      period: "/mês",
      features: [
        "Registro via WhatsApp",
        "Painel web",
        "Relatórios",
        "Metas",
        "Suporte por WhatsApp",
      ],
      buttonText: "Começar no mensal",
      linkTo: `/login?priceId=${config.prices.monthly.priceId}&planType=monthly`,
    },
    {
      name: "Anual",
      price: `R$ ${config.prices.annual.price}`,
      period: "/ano",
      features: ["Tudo do Mensal", "Melhor custo-benefício"],
      buttonText: "Começar no anual",
      popular: true,
      linkTo: `/login?priceId=${config.prices.annual.priceId}&planType=annual`,
    },
  ];

  return (
    <section id="f6-pricing" className="py-16 md:py-20 w-full">
      <div className="container max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Escolha seu plano
          </h2>
          <p className="text-lg text-gray-600">
            Você começa hoje e pode trocar o plano depois.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, staggerChildren: 0.1 }}
          viewport={{ once: true }}
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <Card
                className={`h-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${
                  plan.popular ? "ring-2 ring-primary" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                      Mais Popular
                    </div>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {plan.name}
                  </CardTitle>
                  <div className="mt-4">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-4xl font-bold text-gray-900">
                        {plan.price}
                      </span>
                      <span className="text-gray-600">{plan.period}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                    size="lg"
                    asChild
                  >
                    <Link to={plan.linkTo}>{plan.buttonText}</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <p className="text-sm text-gray-600">
            Gerencie sua assinatura na área do cliente.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default LandingPricing;
