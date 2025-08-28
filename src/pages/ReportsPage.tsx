import React, { useState, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReportFilters from "@/components/reports/ReportFilters";
import ReportSummary from "@/components/reports/ReportSummary";
import TransactionsTable from "@/components/reports/TransactionsTable";
import AuthDebug from "@/components/debug/AuthDebug";
import { useAdaptiveContext } from "@/hooks/useAdaptiveContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import {
  generateReportData,
  downloadCSV,
  downloadPDF,
} from "@/utils/reportUtils";
import { ReportFormat } from "@/types";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  Download,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SubscriptionGuard from "@/components/subscription/SubscriptionGuard";

const ReportsPage: React.FC = () => {
  const { t } = usePreferences();
  const { transactions } = useAdaptiveContext();

  // Report filters state
  const [reportType, setReportType] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Filter transactions based on current filters
  const filteredTransactions = useMemo(() => {
    return generateReportData(transactions, reportType, startDate, endDate);
  }, [transactions, reportType, startDate, endDate]);

  // Calculate summary data
  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses,
    };
  }, [filteredTransactions]);

  // Calculate additional statistics
  const additionalStats = useMemo(() => {
    const transactionCount = filteredTransactions.length;
    const incomeCount = filteredTransactions.filter(
      (t) => t.type === "income"
    ).length;
    const expenseCount = filteredTransactions.filter(
      (t) => t.type === "expense"
    ).length;

    // Calculate average amounts
    const avgIncome = incomeCount > 0 ? totalIncome / incomeCount : 0;
    const avgExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;

    return {
      transactionCount,
      incomeCount,
      expenseCount,
      avgIncome,
      avgExpense,
    };
  }, [filteredTransactions, totalIncome, totalExpenses]);

  // Handle report download
  const handleDownload = (format: ReportFormat) => {
    if (format === "csv") {
      downloadCSV(filteredTransactions);
    } else if (format === "pdf") {
      downloadPDF(filteredTransactions);
    }
  };

  // Get date range display
  const getDateRangeDisplay = () => {
    if (!startDate && !endDate) return "Todas as transações";
    if (startDate && endDate) {
      return `${startDate.toLocaleDateString(
        "pt-BR"
      )} - ${endDate.toLocaleDateString("pt-BR")}`;
    }
    if (startDate)
      return `A partir de ${startDate.toLocaleDateString("pt-BR")}`;
    if (endDate) return `Até ${endDate.toLocaleDateString("pt-BR")}`;
    return "Todas as transações";
  };

  return (
    <AppLayout>
      <SubscriptionGuard>
        <div className="w-full min-h-screen bg-white">
          <div className="w-full max-w-none px-3 xs:px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Enhanced Header */}
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              <div className="flex flex-col gap-3 xs:gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 xs:gap-3">
                    <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 rounded-xl xs:rounded-2xl bg-primary flex items-center justify-center shadow-lg flex-shrink-0">
                      <BarChart3 className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 truncate">
                        {t("reports.title") || "Relatórios"}
                      </h1>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        Analise seus dados financeiros com relatórios detalhados
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 xs:gap-3 flex-shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => handleDownload("csv")}
                    className="gap-1.5 xs:gap-2 h-9 xs:h-10 sm:h-11 px-2.5 xs:px-3 sm:px-4 rounded-lg xs:rounded-xl border-slate-200 hover:bg-slate-50 text-xs xs:text-sm sm:text-base"
                  >
                    <FileText className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                    <span className="hidden xs:inline">CSV</span>
                  </Button>
                  <Button
                    onClick={() => handleDownload("pdf")}
                    className="gap-1.5 xs:gap-2 h-9 xs:h-10 sm:h-11 px-2.5 xs:px-3 sm:px-4 rounded-lg xs:rounded-xl bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200 text-xs xs:text-sm sm:text-base"
                  >
                    <Download className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                    <span className="hidden xs:inline">PDF</span>
                  </Button>
                </div>
              </div>

              {/* Date Range Display */}
              <Card className="border border-slate-200 shadow-lg bg-blue-50">
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700">
                        Período do Relatório
                      </p>
                      <p className="text-lg font-bold text-blue-900">
                        {getDateRangeDisplay()}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Summary Cards and Filters */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 xl:grid-cols-3 2xl:grid-cols-5">
              {/* Summary Cards */}
              <div className="xl:col-span-2 2xl:col-span-3">
                <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                  <ReportSummary
                    totalIncome={totalIncome}
                    totalExpenses={totalExpenses}
                    balance={balance}
                  />

                  {/* Additional Statistics */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                    <Card className="p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-500/20 flex items-center justify-center">
                          <BarChart3 className="h-6 w-6 text-slate-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-slate-700">
                            Total de Transações
                          </p>
                          <p className="text-xl font-bold text-slate-900">
                            {additionalStats.transactionCount}
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-emerald-700">
                            Receitas (Qtd)
                          </p>
                          <p className="text-xl font-bold text-emerald-900">
                            {additionalStats.incomeCount}
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                          <TrendingDown className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-red-700">
                            Despesas (Qtd)
                          </p>
                          <p className="text-xl font-bold text-red-900">
                            {additionalStats.expenseCount}
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                          <Wallet className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-purple-700">
                            Média por Transação
                          </p>
                          <p className="text-xl font-bold text-purple-900">
                            R${" "}
                            {(
                              (totalIncome + totalExpenses) /
                              Math.max(additionalStats.transactionCount, 1)
                            ).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>

              {/* Filters Section */}
              <div className="xl:col-span-1 2xl:col-span-2">
                <Card className="border border-slate-200 shadow-lg overflow-hidden h-full bg-white">
                  <div className="bg-slate-50 px-3 xs:px-4 py-2.5 xs:py-3 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 xs:gap-2 min-w-0">
                        <div className="w-5 h-5 xs:w-6 xs:h-6 rounded-md xs:rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <BarChart3 className="h-2.5 w-2.5 xs:h-3 xs:w-3 text-primary" />
                        </div>
                        <span className="font-semibold text-xs xs:text-sm text-slate-700 truncate">
                          Filtros
                        </span>
                        {(reportType !== "all" || startDate || endDate) && (
                          <div className="px-1 xs:px-1.5 py-0.5 bg-primary/20 text-primary rounded-full text-[10px] xs:text-xs font-medium flex-shrink-0">
                            Ativos
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5 xs:p-3 sm:p-4">
                    <ReportFilters
                      reportType={reportType}
                      setReportType={setReportType}
                      startDate={startDate}
                      setStartDate={setStartDate}
                      endDate={endDate}
                      setEndDate={setEndDate}
                      onDownload={handleDownload}
                    />
                  </div>
                </Card>
              </div>
            </div>

            {/* Transactions Table */}
            <Card className="border border-slate-200 shadow-lg overflow-hidden bg-white">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-semibold text-slate-700">
                    Detalhamento das Transações
                  </span>
                </div>
              </div>
              <div className="p-6">
                <TransactionsTable transactions={filteredTransactions} />
              </div>
            </Card>
          </div>
        </div>
      </SubscriptionGuard>
    </AppLayout>
  );
};

export default ReportsPage;
