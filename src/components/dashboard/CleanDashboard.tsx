import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import SubscriptionGuard from "@/components/subscription/SubscriptionGuard";
import TopBar from "@/components/navigation/TopBar";
import DashboardHeader from "./DashboardHeader";
import QuickActions from "./QuickActions";
import KPICards from "./KPICards";

import FinancialSummaryChart from "./FinancialSummaryChart";
import LatestTransactions from "./LatestTransactions";
import GoalsSummary from "./GoalsSummary";
import FloatingActionButton from "@/components/navigation/FloatingActionButton";
import { TransactionFormV2 } from "@/components/common/TransactionFormV2";
import { useAdaptiveContext } from "@/hooks/useAdaptiveContext";
import { calculateMonthlyFinancialData } from "@/utils/transactionUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WHATSAPP_NUMBER } from "@/constants/app.constants";

const CleanDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { justRegistered?: boolean } };
  const { transactions, goals } = useAdaptiveContext();
  const [selectedPeriod, setSelectedPeriod] = useState("current-month");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>();
  const [isLoading, setIsLoading] = useState(true);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  // Estado para controlar o TransactionForm
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [transactionFormMode, setTransactionFormMode] = useState<
    "create" | "edit"
  >("create");
  const [transactionDefaultType, setTransactionDefaultType] = useState<
    "income" | "expense"
  >("expense");

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Open welcome modal when redirected after registration
  useEffect(() => {
    if (location.state?.justRegistered) {
      setWelcomeOpen(true);
      // Clear state so the modal does not reopen on refresh/back
      navigate(".", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // Load saved period preference
  useEffect(() => {
    const savedPeriod = localStorage.getItem("dashboard-period");
    if (savedPeriod) {
      setSelectedPeriod(savedPeriod);
    }
  }, []);

  // Save period preference
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    localStorage.setItem("dashboard-period", period);
  };

  // Calculate data based on current period
  const currentMonth = new Date();
  const monthlyData = calculateMonthlyFinancialData(transactions, currentMonth);
  const { monthlyIncome, monthlyExpenses, accumulatedBalance } = monthlyData;

  // Mock KPI data with variations
  const kpiData = useMemo(
    () => ({
      totalBalance: accumulatedBalance,
      totalIncome: monthlyIncome,
      totalExpenses: monthlyExpenses,
      goalsAchieved: {
        achieved: goals.filter((g) => g.currentAmount / g.targetAmount >= 1)
          .length,
        total: goals.length,
      },
      variations: {
        balance: Math.random() * 20 - 10, // Mock variation
        income: Math.random() * 15,
        expenses: Math.random() * -10,
        goals: Math.random() * 25,
      },
    }),
    [accumulatedBalance, monthlyIncome, monthlyExpenses, goals]
  );

  // Quick Actions Handlers
  const handleWithdraw = () => {
    console.log("Opening withdraw (expense) transaction form");
    setTransactionFormOpen(true);
    setTransactionFormMode("create");
    setTransactionDefaultType("expense");
  };

  const handleDeposit = () => {
    console.log("Opening deposit (income) transaction form");
    setTransactionFormOpen(true);
    setTransactionFormMode("create");
    setTransactionDefaultType("income");
  };

  const handleEditTransaction = (transaction) => {
    console.log("Editar transação:", transaction);
  };

  const handleRecategorizeTransaction = (transaction) => {
    console.log("Recategorizar transação:", transaction);
  };

  const handleViewAllTransactions = () => {
    navigate("/transactions");
  };

  const handleAddTransaction = () => {
    console.log("Adicionar transação");
    setTransactionDefaultType("expense");
    setTransactionFormMode("create");
    setTransactionFormOpen(true);
  };

  const handleGoalContribution = (goalId: string) => {
    console.log(`Adicionar aporte à meta ${goalId}`);
  };

  const handleEditGoal = (goalId: string) => {
    console.log(`Editar meta ${goalId}`);
    navigate(`/goals?edit=${goalId}`);
  };

  const handleCreateGoal = () => {
    console.log("Criar nova meta");
    navigate("/goals?create=true");
  };

  const handleMessageAssistant = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}`, "_blank");
    setWelcomeOpen(false);
  };

  const handleCloseWelcome = () => setWelcomeOpen(false);

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
      <TopBar />

      <SubscriptionGuard>
        <div className="min-h-screen bg-slate-50/50">
          <Dialog open={welcomeOpen} onOpenChange={setWelcomeOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Boas vindas ao Meu Controle IA!</DialogTitle>
                <DialogDescription>
                  <div className="space-y-3 text-foreground">
                    <p>
                      Todos os seus lançamentos poderão ser feitos por aqui no
                      seu Dashboard e por mensagens diretamente no WhatsApp.
                    </p>
                    <p>
                      Para sua maior comodidade, prefira usar MeuControle-IA
                      através do seu WhatsApp, enviando áudio ou mensagem de
                      texto para realizar seus lançamentos financeiros. 💰
                    </p>
                    <p>
                      Salve o numero do MeuControle-IA em seus Contatos e deixe
                      ele como Favorito para facilitar a sua localização e
                      sempre ter ele a sua disposição.
                    </p>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCloseWelcome}>
                  Fechar
                </Button>
                <Button onClick={handleMessageAssistant}>Começar agora</Button>
              </div>
            </DialogContent>
          </Dialog>
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="w-full max-w-none px-3 xs:px-4 sm:px-6 lg:px-8 xl:px-10 py-3 xs:py-4 md:py-6 pb-20 md:pb-6"
          >
            {/* Header */}
            <motion.div variants={item}>
              <DashboardHeader
                selectedPeriod={selectedPeriod}
                onPeriodChange={handlePeriodChange}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
              />
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={item}>
              <QuickActions
                onWithdraw={handleWithdraw}
                onDeposit={handleDeposit}
              />
            </motion.div>

            {/* KPI Cards */}
            <motion.div variants={item}>
              <KPICards data={kpiData} isLoading={isLoading} />
            </motion.div>

            {/* Financial Summary + Latest Transactions */}
            <motion.div variants={item}>
              <div className="grid grid-cols-1 gap-3 xs:gap-4 sm:gap-6 xl:grid-cols-12 xl:gap-6 2xl:gap-8 mb-4 xs:mb-6 sm:mb-8">
                {/* Chart */}
                <div className="xl:col-span-7 2xl:col-span-8">
                  <FinancialSummaryChart isLoading={isLoading} />
                </div>

                {/* Transactions */}
                <div className="xl:col-span-5 2xl:col-span-4">
                  <LatestTransactions
                    transactions={transactions.slice(0, 8)}
                    onEditTransaction={handleEditTransaction}
                    onRecategorizeTransaction={handleRecategorizeTransaction}
                    onViewAll={handleViewAllTransactions}
                    onAddTransaction={handleAddTransaction}
                  />
                </div>
              </div>
            </motion.div>

            {/* Goals Summary */}
            <motion.div variants={item}>
              <GoalsSummary
                goals={goals}
                onAddContribution={handleGoalContribution}
                onEditGoal={handleEditGoal}
                onCreateGoal={handleCreateGoal}
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Mobile FAB */}
        <div className="block md:hidden">
          <FloatingActionButton />
        </div>

        <TransactionFormV2
          open={transactionFormOpen}
          onOpenChange={setTransactionFormOpen}
          mode={transactionFormMode}
          defaultType={transactionDefaultType}
        />
      </SubscriptionGuard>
    </>
  );
};

export default CleanDashboard;
