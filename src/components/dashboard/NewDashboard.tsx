
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import MZHero from '@/components/common/MZHero';
import CashflowChart from './CashflowChart';
import TransactionTimeline from './TransactionTimeline';
import InsightsSection from './InsightsSection';
import GoalsProgressBars from './GoalsProgressBars';
import FloatingActionButton from '@/components/navigation/FloatingActionButton';
import { useAdaptiveContext } from '@/hooks/useAdaptiveContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { calculateMonthlyFinancialData } from '@/utils/transactionUtils';
import { TrendingUp, AlertCircle, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NewDashboard = () => {
  const [currentMonth] = useState(new Date());
  const [isChartLoading, setIsChartLoading] = useState(true);
  const { transactions, goals } = useAdaptiveContext();
  const { currency } = usePreferences();
  const navigate = useNavigate();
  
  const monthlyData = calculateMonthlyFinancialData(transactions, currentMonth);
  const { monthlyIncome, monthlyExpenses, accumulatedBalance } = monthlyData;
  
  // Simular carregamento do gráfico
  React.useEffect(() => {
    const timer = setTimeout(() => setIsChartLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);
  
  // Mock data para demonstração do fluxo de caixa
  const cashflowData = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => ({
      day: `${i + 1}`,
      currentMonth: Math.random() * 5000 + 1000,
      previousMonth: Math.random() * 4000 + 800,
    }));
    return days;
  }, []);

  // Insights com ações que aplicam filtros reais
  const insights = useMemo(() => [
    {
      id: '1',
      title: 'Gastos com Alimentação ↑23% vs jul',
      description: 'Você gastou 23% mais que o mês passado. Considere revisar o orçamento desta categoria.',
      cta: 'Ver categoria Alimentação',
      type: 'warning' as const,
      icon: <AlertCircle className="h-5 w-5" />,
      action: {
        type: 'navigate' as const,
        route: '/reports',
        filter: { category: 'Alimentação', dateRange: 'current-month' }
      }
    },
    {
      id: '2',
      title: 'Meta de Emergência 80% concluída',
      description: 'Você está muito próximo da sua meta de reserva de emergência! Continue assim.',
      cta: 'Ver progresso da meta',
      type: 'success' as const,
      icon: <Target className="h-5 w-5" />,
      action: {
        type: 'navigate' as const,
        route: '/goals',
        filter: { goalType: 'emergency' }
      }
    },
    {
      id: '3',
      title: 'Oportunidade de investimento',
      description: 'Seu fluxo de caixa está positivo. Que tal diversificar seus investimentos?',
      cta: 'Explorar opções',
      type: 'info' as const,
      icon: <TrendingUp className="h-5 w-5" />,
      action: {
        type: 'navigate' as const,
        route: '/goals',
        filter: { goalType: 'investment' }
      }
    }
  ], []);

  const handleCaptureAction = (type: string) => {
    console.log(`Captura ${type} acionada`);
    // Implementar lógica de captura
  };

  const handleInsightAction = (insightId: string, action: any) => {
    console.log(`Insight ${insightId} acionado`, action);
  };

  const handleGoalContribution = (goalId: string) => {
    console.log(`Adicionar aporte à meta ${goalId}`);
    // Implementar modal de aporte
  };

  const handleEditGoal = (goalId: string) => {
    console.log(`Editar meta ${goalId}`);
    navigate(`/goals?edit=${goalId}`);
  };

  const handleCreateGoal = () => {
    console.log('Criar nova meta');
    navigate('/goals?create=true');
  };

  const handleEditTransaction = (transaction: any) => {
    console.log('Editar transação:', transaction);
    // Implementar modal de edição
  };

  const handleRecategorizeTransaction = (transaction: any) => {
    console.log('Recategorizar transação:', transaction);
    // Implementar modal de recategorização
  };

  const handleLinkToGoal = (transaction: any) => {
    console.log('Vincular à meta:', transaction);
    // Implementar modal de vinculação
  };

  const handleAddTransaction = () => {
    console.log('Adicionar transação');
    // Implementar modal de adição
  };

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.3 },
    },
  };

  return (
    <>
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="space-y-8 p-4 md:p-6 max-w-7xl mx-auto pb-20 md:pb-6"
      >
        {/* Hero Section */}
        <motion.div variants={item}>
          <MZHero
            netValue={accumulatedBalance}
            monthlyChange={Math.random() * 20 - 10} // Mock change
            income={monthlyIncome}
            expenses={monthlyExpenses}
            monthlyProfitGoal={2000}
            monthlyProfitAchieved={accumulatedBalance}
            onWhatsAppCapture={() => handleCaptureAction('whatsapp')}
            onAudioCapture={() => handleCaptureAction('audio')}
            onImageCapture={() => handleCaptureAction('image')}
          />
        </motion.div>

        {/* Mobile: Insights em carrossel */}
        <motion.div variants={item} className="block md:hidden">
          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-4">
              {insights.map((insight) => (
                <div key={insight.id} className="flex-shrink-0 w-80">
                  <InsightsSection 
                    insights={[insight]}
                    onInsightAction={handleInsightAction}
                  />
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Desktop: Insights normal */}
        <motion.div variants={item} className="hidden md:block">
          <InsightsSection 
            insights={insights}
            onInsightAction={handleInsightAction}
          />
        </motion.div>

        {/* Metas */}
        <motion.div variants={item}>
          <GoalsProgressBars
            goals={goals}
            onAddContribution={handleGoalContribution}
            onEditGoal={handleEditGoal}
            onCreateGoal={handleCreateGoal}
          />
        </motion.div>

        {/* Mobile: Timeline colapsável */}
        <motion.div variants={item} className="block md:hidden">
          <details className="group">
            <summary className="flex items-center justify-between p-4 bg-white rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-all duration-200">
              <h3 className="text-lg font-semibold text-gray-900">Timeline de Transações</h3>
              <div className="transform group-open:rotate-180 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </summary>
            <div className="mt-4">
              <TransactionTimeline 
                transactions={transactions.slice(0, 10)}
                onEditTransaction={handleEditTransaction}
                onRecategorizeTransaction={handleRecategorizeTransaction}
                onLinkToGoal={handleLinkToGoal}
                onAddTransaction={handleAddTransaction}
              />
            </div>
          </details>
        </motion.div>

        {/* Desktop: Cashflow e Timeline lado a lado */}
        <motion.div variants={item} className="hidden md:grid gap-6 lg:grid-cols-2">
          <CashflowChart 
            data={cashflowData} 
            isLoading={isChartLoading}
          />
          <TransactionTimeline 
            transactions={transactions.slice(0, 15)}
            onEditTransaction={handleEditTransaction}
            onRecategorizeTransaction={handleRecategorizeTransaction}
            onLinkToGoal={handleLinkToGoal}
            onAddTransaction={handleAddTransaction}
          />
        </motion.div>

        {/* Mobile: Fluxo de Caixa em aba separada */}
        <motion.div variants={item} className="block md:hidden">
          <details className="group">
            <summary className="flex items-center justify-between p-4 bg-white rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-all duration-200">
              <h3 className="text-lg font-semibold text-gray-900">Fluxo de Caixa</h3>
              <div className="transform group-open:rotate-180 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </summary>
            <div className="mt-4">
              <CashflowChart 
                data={cashflowData} 
                isLoading={isChartLoading}
              />
            </div>
          </details>
        </motion.div>
      </motion.div>

      {/* FAB para mobile */}
      <div className="block md:hidden">
        <FloatingActionButton />
      </div>
    </>
  );
};

export default NewDashboard;
