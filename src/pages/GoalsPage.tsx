import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import SubscriptionGuard from "@/components/subscription/SubscriptionGuard";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Filter, Target } from "lucide-react";
import { useAdaptiveContext } from "@/hooks/useAdaptiveContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { Goal } from "@/types";
import { useToast } from "@/hooks/use-toast";
import GoalKPICards from "@/components/goals/GoalKPICards";
import GoalFilters from "@/components/goals/GoalFilters";
import GoalCardV3 from "@/components/goals/GoalCardV3";
import AddContributionModal from "@/components/goals/AddContributionModal";
import GoalDetailsModal from "@/components/goals/GoalDetailsModal";
import GoalForm from "@/components/common/GoalForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";

const GoalsPage = () => {
  const { goals = [], getGoals, deleteGoal, updateGoal } = useAdaptiveContext();
  const { currency } = usePreferences();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Estados do componente
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados dos filtros (com URL sync)
  const [statusFilter, setStatusFilter] = useState<string | null>(
    searchParams.get("status")
  );
  const [sortBy, setSortBy] = useState(
    searchParams.get("sort") || "progress_desc"
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    (searchParams.get("view") as "grid" | "list") || "grid"
  );
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1")
  );

  // Sincronizar URL com filtros
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (sortBy !== "progress_desc") params.set("sort", sortBy);
    if (viewMode !== "grid") params.set("view", viewMode);
    if (searchQuery) params.set("search", searchQuery);
    if (currentPage !== 1) params.set("page", currentPage.toString());

    setSearchParams(params, { replace: true });
  }, [
    statusFilter,
    sortBy,
    viewMode,
    searchQuery,
    currentPage,
    setSearchParams,
  ]);

  // Função para obter status de uma meta
  const getGoalStatus = (goal: Goal) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;

    if (progress >= 100) return "completed";

    if (!goal.endDate) return "ontrack";

    const daysRemaining = Math.ceil(
      (new Date(goal.endDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysRemaining < 0) return "overdue";

    // Calcular se está em risco
    const totalDays =
      goal.startDate && goal.endDate
        ? Math.ceil(
            (new Date(goal.endDate).getTime() -
              new Date(goal.startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 365;

    const daysElapsed = totalDays - daysRemaining;
    const timeProgress = (daysElapsed / totalDays) * 100;
    const relativeProgress = timeProgress > 0 ? progress / timeProgress : 1;

    if (relativeProgress < 0.8 || daysRemaining < 30) return "atrisk";

    return "ontrack";
  };

  // Filtrar e ordenar metas
  const getFilteredAndSortedGoals = () => {
    const filtered = goals.filter((goal) => {
      // Filtro por busca
      if (
        searchQuery &&
        !goal.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Filtro por status
      if (statusFilter) {
        const status = getGoalStatus(goal);
        if (status !== statusFilter) return false;
      }

      return true;
    });

    // Ordenação
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "progress_desc": {
          const progressA = (a.currentAmount / a.targetAmount) * 100;
          const progressB = (b.currentAmount / b.targetAmount) * 100;
          return progressB - progressA;
        }
        case "progress_asc": {
          const progA = (a.currentAmount / a.targetAmount) * 100;
          const progB = (b.currentAmount / b.targetAmount) * 100;
          return progA - progB;
        }
        case "deadline_asc": {
          if (!a.endDate && !b.endDate) return 0;
          if (!a.endDate) return 1;
          if (!b.endDate) return -1;
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        }
        case "remaining_desc": {
          const remainingA = Math.max(a.targetAmount - a.currentAmount, 0);
          const remainingB = Math.max(b.targetAmount - b.currentAmount, 0);
          return remainingB - remainingA;
        }
        case "name_asc": {
          return a.name.localeCompare(b.name);
        }
        default:
          return 0;
      }
    });
  };

  const filteredGoals = getFilteredAndSortedGoals();

  // Paginação
  const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredGoals.length / itemsPerPage);
  const paginatedGoals = filteredGoals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Contar por status
  const statusCounts = {
    all: goals.length,
    completed: goals.filter((g) => getGoalStatus(g) === "completed").length,
    ontrack: goals.filter((g) => getGoalStatus(g) === "ontrack").length,
    atrisk: goals.filter((g) => getGoalStatus(g) === "atrisk").length,
    overdue: goals.filter((g) => getGoalStatus(g) === "overdue").length,
    archived: 0, // TODO: implementar quando houver metas arquivadas
  };

  // Handlers
  const handleRefreshGoals = async () => {
    await getGoals();
  };

  const handleAddGoal = () => {
    setSelectedGoal(null);
    setIsFormOpen(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsFormOpen(true);
  };

  const handleDeleteGoal = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (goal) {
      setSelectedGoal(goal);
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDeleteGoal = async () => {
    if (!selectedGoal) return;

    setIsDeleting(true);
    try {
      await deleteGoal(selectedGoal.id);
      toast({
        title: "Meta excluída",
        description: `Meta "${selectedGoal.name}" foi excluída com sucesso.`,
      });
      setIsDeleteDialogOpen(false);
      setSelectedGoal(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir meta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddContribution = async (goal: Goal, amount?: number) => {
    if (amount) {
      // Quick contribution with predefined amount
      try {
        const newCurrentAmount = goal.currentAmount + amount;

        // Update the goal's current amount directly
        await updateGoal(goal.id, {
          currentAmount: newCurrentAmount,
        });

        console.log("Quick contribution goal updated successfully");

        // Don't refresh goals immediately - rely on local state update
        // Only refresh if there's an error or if needed for consistency

        toast({
          title: "Aporte adicionado",
          description: `${currency === "USD" ? "$" : "R$"}${amount.toFixed(
            2
          )} adicionado à meta ${goal.name}`,
        });
      } catch (error) {
        console.error("Error adding quick contribution:", error);
        // If there's an error, refresh goals to ensure consistency
        await getGoals();
        toast({
          title: "Erro",
          description: "Erro ao adicionar aporte rápido. Tente novamente.",
          variant: "destructive",
        });
      }
    } else {
      setSelectedGoal(goal);
      setIsContributionModalOpen(true);
    }
  };

  const handleContributionConfirm = async (
    goalId: string,
    amount: number,
    description?: string,
    date?: string
  ) => {
    try {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) {
        toast({
          title: "Erro",
          description: "Meta não encontrada.",
          variant: "destructive",
        });
        return;
      }

      const newCurrentAmount = goal.currentAmount + amount;

      console.log("Adding contribution to goal:", {
        goalId,
        goalName: goal.name,
        currentAmount: goal.currentAmount,
        newAmount: amount,
        newTotal: newCurrentAmount,
      });

      // Update the goal's current amount directly
      await updateGoal(goalId, {
        currentAmount: newCurrentAmount,
      });

      setIsContributionModalOpen(false);
    } catch (error) {
      console.error("Error adding contribution:", error);
      // If there's an error, refresh goals to ensure consistency
      await getGoals();
      toast({
        title: "Erro",
        description: "Erro ao adicionar aporte. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout showFAB={false}>
      <SubscriptionGuard>
        <div className="w-full min-h-screen bg-white">
          <div className="w-full max-w-none px-3 xs:px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Enhanced Header */}
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              <div className="flex flex-col gap-3 xs:gap-4 sm:gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2 sm:space-y-3 min-w-0 flex-1">
                  <div className="flex items-center gap-2 xs:gap-3 sm:gap-4">
                    <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl xs:rounded-2xl sm:rounded-3xl bg-primary flex items-center justify-center shadow-lg flex-shrink-0">
                      <Target className="h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-primary-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-slate-900 truncate">
                        Metas Financeiras
                      </h1>
                      <p className="text-xs xs:text-sm sm:text-base text-slate-600 font-medium truncate">
                        {filteredGoals.length} de {goals.length} metas
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 xs:gap-3 flex-shrink-0">
                  <Button
                    variant="outline"
                    onClick={handleRefreshGoals}
                    className="gap-1.5 xs:gap-2 h-9 xs:h-10 sm:h-11 lg:h-12 px-3 xs:px-4 sm:px-6 rounded-lg xs:rounded-xl sm:rounded-2xl border-slate-200 hover:bg-slate-50 font-medium text-xs xs:text-sm sm:text-base"
                  >
                    <RefreshCw className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
                    <span className="hidden xs:inline">Atualizar</span>
                  </Button>
                  <Button
                    onClick={handleAddGoal}
                    className="gap-1.5 xs:gap-2 sm:gap-3 h-9 xs:h-10 sm:h-11 lg:h-12 px-3 xs:px-4 sm:px-6 lg:px-8 rounded-lg xs:rounded-xl sm:rounded-2xl bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-primary-foreground text-xs xs:text-sm sm:text-base"
                  >
                    <Plus className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
                    <span className="hidden xs:inline sm:hidden">Nova</span>
                    <span className="hidden sm:inline">Nova Meta</span>
                    <span className="xs:hidden">+</span>
                  </Button>
                </div>
              </div>

              {/* KPIs and Filters */}
              <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 xl:grid-cols-3 2xl:grid-cols-5">
                {/* KPIs */}
                <div className="xl:col-span-2 2xl:col-span-3">
                  <GoalKPICards goals={goals} />
                </div>

                {/* Filters Section */}
                <div className="xl:col-span-1 2xl:col-span-2">
                  <Card className="border border-slate-200 shadow-lg overflow-hidden h-full bg-white">
                    <div className="bg-primary/5 px-3 xs:px-4 sm:px-6 py-2.5 xs:py-3 sm:py-4 border-b border-primary/10">
                      <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3">
                        <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 rounded-md xs:rounded-lg sm:rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                          <Filter className="h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-xs xs:text-sm sm:text-lg text-slate-800 truncate">
                          Filtros
                        </span>
                        {(statusFilter || searchQuery) && (
                          <div className="px-1.5 xs:px-2 sm:px-3 py-0.5 xs:py-1 sm:py-1.5 bg-primary text-primary-foreground rounded-full text-[10px] xs:text-xs sm:text-sm font-semibold flex-shrink-0">
                            Ativos
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-3 xs:p-4 sm:p-6">
                      <GoalFilters
                        statusFilter={statusFilter}
                        onStatusFilterChange={setStatusFilter}
                        sortBy={sortBy}
                        onSortChange={setSortBy}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        statusCounts={statusCounts}
                      />
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            {/* Grid de Metas */}
            {paginatedGoals.length > 0 ? (
              <div
                className={`grid gap-3 xs:gap-4 sm:gap-6 lg:gap-8 ${
                  viewMode === "grid"
                    ? "grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                    : "grid-cols-1"
                }`}
              >
                {paginatedGoals.map((goal) => (
                  <GoalCardV3
                    key={goal.id}
                    goal={goal}
                    onAddContribution={handleAddContribution}
                    onEdit={handleEditGoal}
                    onDelete={handleDeleteGoal}
                    onArchive={(goalId) => handleDeleteGoal(goalId)}
                    showQuickActions={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                  <Filter className="h-8 w-8 sm:h-10 sm:w-10 text-slate-500" />
                </div>
                <p className="text-base sm:text-lg text-slate-600 mb-4 sm:mb-6 font-medium px-4">
                  {statusFilter || searchQuery
                    ? "Nenhuma meta encontrada com os filtros selecionados"
                    : "Nenhuma meta criada ainda"}
                </p>
                {!statusFilter && !searchQuery && (
                  <Button
                    onClick={handleAddGoal}
                    className="gap-2 sm:gap-3 h-10 sm:h-12 px-6 sm:px-8 rounded-xl sm:rounded-2xl bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-primary-foreground"
                  >
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                    Criar Primeira Meta
                  </Button>
                )}
              </div>
            )}

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-3">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="h-11 px-6 rounded-xl border-slate-200 hover:bg-slate-50 font-medium"
                >
                  Anterior
                </Button>
                <span className="flex items-center px-6 text-base text-slate-600 font-medium">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="h-11 px-6 rounded-xl border-slate-200 hover:bg-slate-50 font-medium"
                >
                  Próxima
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Modais */}
        <AddContributionModal
          goal={selectedGoal}
          open={isContributionModalOpen}
          onOpenChange={setIsContributionModalOpen}
          onConfirm={handleContributionConfirm}
        />

        <GoalDetailsModal
          goal={selectedGoal}
          open={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
          onEdit={handleEditGoal}
          onAddContribution={handleAddContribution}
        />

        <GoalForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          initialData={selectedGoal || undefined}
          mode={selectedGoal ? "edit" : "create"}
        />

        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a meta:{" "}
                <strong>{selectedGoal?.name}</strong>?
                <br />
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteGoal}
                disabled={isDeleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeleting ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SubscriptionGuard>
    </AppLayout>
  );
};

export default GoalsPage;
