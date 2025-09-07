import React, { useState, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import SubscriptionGuard from "@/components/subscription/SubscriptionGuard";
import TransactionTimeline from "@/components/transactions/TransactionTimeline";
import { TransactionFormV2 } from "@/components/common/TransactionFormV2";
import TransactionFilters from "@/components/filters/TransactionFilters";
import TransactionSummary from "@/components/transactions/TransactionSummary";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAdaptiveContext } from "@/hooks/useAdaptiveContext";
import { Transaction } from "@/types";
import { createLocalDate } from "@/utils/transactionUtils";
import { usePreferences } from "@/contexts/PreferencesContext";
import FloatingActionButton from "@/components/navigation/FloatingActionButton";

const TransactionsPage = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [filters, setFilters] = useState({
    type: "all" as "all" | "income" | "expense",
    category: null as string | null,
    dateRange: null as string | null,
    amount: null as string | null,
  });

  const { transactions, deleteTransaction } = useAdaptiveContext();
  const { currency } = usePreferences();

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setFormOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormOpen(true);
  };

  const handleDeleteTransaction = (id: string) => {
    deleteTransaction(id);
  };

  const handleFilterChange = (filterType: string, value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      type: "all",
      category: null,
      dateRange: null,
      amount: null,
    });
  };

  // Filter transactions based on current filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // Type filter
      if (filters.type !== "all" && transaction.type !== filters.type) {
        return false;
      }

      // Category filter
      if (filters.category && transaction.category !== filters.category) {
        return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const transactionDate = createLocalDate(transaction.date);
        const now = new Date();

        switch (filters.dateRange) {
          case "today": {
            return transactionDate.toDateString() === now.toDateString();
          }
          case "week": {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return transactionDate >= weekAgo;
          }
          case "month": {
            const monthAgo = new Date(
              now.getFullYear(),
              now.getMonth() - 1,
              now.getDate()
            );
            return transactionDate >= monthAgo;
          }
          default:
            return true;
        }
      }

      return true;
    });
  }, [transactions, filters]);

  const availableCategories = Array.from(
    new Set(transactions.map((t) => t.category || "Outros"))
  );

  return (
    <AppLayout>
      <SubscriptionGuard feature="movimentações ilimitadas">
        <div className="w-full min-h-screen bg-white">
          <div className="w-full max-w-none px-3 xs:px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
            {/* Enhanced Header */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col gap-3 xs:gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 xs:gap-3">
                    <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 rounded-xl xs:rounded-2xl bg-primary flex items-center justify-center shadow-lg flex-shrink-0">
                      <Plus className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 truncate">
                        Transações
                      </h1>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        Gerencie suas receitas e despesas
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 xs:gap-3 flex-shrink-0">
                  <Button
                    onClick={handleAddTransaction}
                    className="gap-1.5 xs:gap-2 h-9 xs:h-10 sm:h-11 px-3 xs:px-4 sm:px-6 rounded-lg xs:rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 text-xs xs:text-sm sm:text-base"
                  >
                    <Plus className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                    <span className="hidden xs:inline sm:hidden font-medium">
                      Nova
                    </span>
                    <span className="hidden sm:inline font-medium">
                      Nova Transação
                    </span>
                    <span className="xs:hidden">+</span>
                  </Button>
                </div>
              </div>

              {/* Summary Cards and Filters */}
              <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3 2xl:grid-cols-4 xl:gap-8">
                {/* Summary Cards */}
                <div className="xl:col-span-2 2xl:col-span-3">
                  <TransactionSummary
                    transactions={filteredTransactions}
                    currency={currency}
                  />
                </div>

                {/* Filters Section */}
                <div className="xl:col-span-1">
                  <Card className="border border-slate-200 shadow-lg overflow-hidden h-full bg-white">
                    <div className="bg-slate-50 px-3 xs:px-4 py-2.5 xs:py-3 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 xs:gap-2 min-w-0">
                          <div className="w-5 h-5 xs:w-6 xs:h-6 rounded-md xs:rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Plus className="h-2.5 w-2.5 xs:h-3 xs:w-3 text-primary" />
                          </div>
                          <span className="font-semibold text-xs xs:text-sm text-slate-700 truncate">
                            Filtros
                          </span>
                          {Object.values(filters).some(
                            (v) => v !== null && v !== "all"
                          ) && (
                            <div className="px-1 xs:px-1.5 py-0.5 bg-primary/20 text-primary rounded-full text-[10px] xs:text-xs font-medium flex-shrink-0">
                              Ativos
                            </div>
                          )}
                        </div>
                        {Object.values(filters).some(
                          (v) => v !== null && v !== "all"
                        ) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearFilters}
                            className="gap-1 text-primary hover:text-primary-600 hover:bg-primary/10 text-[10px] xs:text-xs px-1.5 xs:px-2 py-1 h-6 xs:h-7 flex-shrink-0"
                          >
                            Limpar
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="p-2.5 xs:p-3 sm:p-4">
                      <TransactionFilters
                        selectedFilters={filters}
                        onFilterChange={handleFilterChange}
                        onClearFilters={handleClearFilters}
                        availableCategories={availableCategories}
                      />
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            {/* Transaction Count */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium flex-shrink-0">
                {filteredTransactions.length} de {transactions.length}{" "}
                transações
              </div>
              {filteredTransactions.length !== transactions.length && (
                <div className="text-sm text-muted-foreground">
                  Filtros ativos
                </div>
              )}
            </div>

            {/* Timeline Content */}
            <div className="space-y-4 sm:space-y-6">
              <TransactionTimeline
                transactions={filteredTransactions}
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
              />
            </div>
          </div>
        </div>

        <TransactionFormV2
          open={formOpen}
          onOpenChange={setFormOpen}
          initialData={editingTransaction}
          mode={editingTransaction ? "edit" : "create"}
          defaultType="expense"
        />
        <FloatingActionButton onClick={handleAddTransaction} />
      </SubscriptionGuard>
    </AppLayout>
  );
};

export default TransactionsPage;
