import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "@/contexts/AppContext";
import AppLayout from "@/components/layout/AppLayout";
import SubscriptionGuard from "@/components/subscription/SubscriptionGuard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  Edit,
  TrendingUp,
  TrendingDown,
  Tag,
  BarChart3,
  Palette,
} from "lucide-react";
import { usePreferences } from "@/contexts/PreferencesContext";
import { Category } from "@/types/categories";
import {
  getCategoriesByType,
  addCategory,
  updateCategory,
  deleteCategory,
} from "@/services/categoryService";
import { getCategoryMonthlyTotals } from "@/services/transactionService";
import { formatCurrency } from "@/utils/transactionUtils";
import { useToast } from "@/hooks/use-toast";
import CategoryForm from "@/components/categories/CategoryForm";
import CategoryIcon from "@/components/categories/CategoryIcon";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const CategoriesPage: React.FC = () => {
  const { t } = usePreferences();
  const { toast } = useToast();
  const { entidadeAtiva } = useAppContext();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryType, setCategoryType] = useState<"expense" | "income">(
    "expense"
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [categoryTotals, setCategoryTotals] = useState<{
    [key: string]: number;
  }>({});

  // Helper function to refresh category totals
  const refreshCategoryTotals = useCallback(async () => {
    try {
      const loadedTotals = await getCategoryMonthlyTotals(categoryType);
      const totalsObject = loadedTotals.reduce((acc, item) => {
        acc[item.categoryId] = item.total;
        return acc;
      }, {} as { [key: string]: number });
      setCategoryTotals(totalsObject);
    } catch (error) {
      console.error("Error refreshing category totals:", error);
    }
  }, [categoryType]);

  useEffect(() => {
    // Load categories from Supabase on mount and whenever they change
    const loadCategories = async () => {
      setLoading(true);
      try {
        const loadedCategories = await getCategoriesByType(categoryType, entidadeAtiva);
        setCategories(loadedCategories);

        // Load monthly totals for categories
        await refreshCategoryTotals();
      } catch (error) {
        console.error("Error loading categories:", error);
        toast({
          title: t("common.error"),
          description: t("common.errorFetching"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [categoryType, toast, t, refreshCategoryTotals, entidadeAtiva]);

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryFormOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    // Prevent editing default categories
    if (category.isDefault) {
      toast({
        title: "Categoria padrão",
        description: "Categorias padrão não podem ser editadas.",
        variant: "destructive",
      });
      return;
    }

    setEditingCategory(category);
    setCategoryFormOpen(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (categoryToDelete) {
      try {
        const success = await deleteCategory(categoryToDelete.id);
        if (success) {
          const updatedCategories = await getCategoriesByType(categoryType, entidadeAtiva);
          setCategories(updatedCategories);

          // Refresh category totals
          await refreshCategoryTotals();

          toast({
            title: t("categories.deleted"),
            description: `${categoryToDelete.name} ${t(
              "categories.wasDeleted"
            )}`,
          });
        } else {
          toast({
            title: t("common.error"),
            description: t("categories.defaultCantDelete"),
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error deleting category:", error);
        toast({
          title: t("common.error"),
          description: t("common.somethingWentWrong"),
          variant: "destructive",
        });
      } finally {
        setDeleteDialogOpen(false);
        setCategoryToDelete(null);
      }
    }
  };

  const handleSaveCategory = async (
    category: Omit<Category, "id"> | Category
  ) => {
    try {
      if ("id" in category) {
        // Update existing category
        const updatedCategory = await updateCategory(category as Category);
        if (updatedCategory) {
          toast({
            title: "Categoria atualizada",
            description: `A categoria ${category.name} foi atualizada com sucesso.`,
          });
        }
      } else {
        // Add new category - ensure type is set correctly
        const newCategory = await addCategory({
          ...category,
          type: categoryType, // Make sure to use the current categoryType
        });
        if (newCategory) {
          toast({
            title: "Categoria adicionada",
            description: `A categoria ${category.name} foi adicionada com sucesso.`,
          });
        }
      }

      // Refresh categories list
      const updatedCategories = await getCategoriesByType(categoryType, entidadeAtiva);
      setCategories(updatedCategories);

      // Refresh category totals
      await refreshCategoryTotals();

      setCategoryFormOpen(false);
    } catch (error) {
      console.error("Error saving category:", error);
      toast({
        title: t("common.error"),
        description: t("common.somethingWentWrong"),
        variant: "destructive",
      });
    }
  };

  // Calculate summary statistics
  const summaryStats = React.useMemo(() => {
    const totalAmount = Object.values(categoryTotals).reduce(
      (sum, amount) => sum + amount,
      0
    );
    const categoryCount = categories.length;
    const defaultCount = categories.filter((c) => c.isDefault).length;
    const customCount = categoryCount - defaultCount;

    return { totalAmount, categoryCount, defaultCount, customCount };
  }, [categoryTotals, categories]);

  if (loading) {
    return (
      <AppLayout showFAB={false}>
        <div className="w-full min-h-screen bg-white">
          <div className="flex justify-center items-center py-32">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-slate-600">Carregando categorias...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showFAB={false}>
      <SubscriptionGuard feature="categorias personalizadas">
        <div className="w-full min-h-screen bg-white">
          <div className="px-3 xs:px-4 sm:px-6 lg:px-8 xl:px-10 py-4 xs:py-6 md:py-8 space-y-4 xs:space-y-6 max-w-7xl mx-auto">
            {/* Enhanced Header */}
            <div className="space-y-4 xs:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 xs:gap-4">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 xs:gap-3">
                    <div className="w-10 h-10 xs:w-12 xs:h-12 rounded-xl xs:rounded-2xl bg-primary flex items-center justify-center shadow-lg flex-shrink-0">
                      <Tag className="h-5 w-5 xs:h-6 xs:w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 truncate">
                        {t("categories.title")}
                      </h1>
                      <p className="text-xs xs:text-sm text-muted-foreground truncate">
                        Organize e personalize suas categorias de transações
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 xs:gap-3 flex-shrink-0">
                  <Button
                    onClick={handleAddCategory}
                    className="gap-1.5 xs:gap-2 h-9 xs:h-10 sm:h-11 px-3 xs:px-4 sm:px-6 rounded-lg xs:rounded-xl bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 text-xs xs:text-sm sm:text-base"
                  >
                    <Plus className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                    <span className="hidden xs:inline sm:hidden font-medium">
                      Nova
                    </span>
                    <span className="hidden sm:inline font-medium">
                      Nova Categoria
                    </span>
                    <span className="xs:hidden">+</span>
                  </Button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 xs:gap-4">
                <Card className="p-4 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-emerald-700">
                        Total em Categorias
                      </p>
                      <p className="text-lg font-bold text-emerald-900">
                        {formatCurrency(summaryStats.totalAmount, "BRL")}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Tag className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700">
                        Total de Categorias
                      </p>
                      <p className="text-lg font-bold text-blue-900">
                        {summaryStats.categoryCount}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Palette className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-700">
                        Personalizadas
                      </p>
                      <p className="text-lg font-bold text-purple-900">
                        {summaryStats.customCount}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Enhanced Tabs */}
            <Card className="border border-slate-200 shadow-lg overflow-hidden bg-white">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    {categoryType === "expense" ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                  <span className="font-semibold text-slate-700">
                    {categoryType === "expense"
                      ? "Categorias de Despesas"
                      : "Categorias de Receitas"}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <Tabs
                  defaultValue="expense"
                  value={categoryType}
                  onValueChange={(value) =>
                    setCategoryType(value as "expense" | "income")
                  }
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-2 w-fit bg-slate-100 p-1 rounded-lg">
                    <TabsTrigger
                      value="expense"
                      className="data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                    >
                      <TrendingDown className="h-4 w-4 mr-2" />
                      Despesas
                    </TabsTrigger>
                    <TabsTrigger
                      value="income"
                      className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Receitas
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="expense" className="mt-4 xs:mt-6">
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 xs:gap-4">
                      {categories.map((category) => (
                        <Card
                          key={category.id}
                          className="group p-0 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-white"
                        >
                          <div className="p-4">
                            <div className="flex flex-col items-center space-y-4">
                              {/* Icon Container */}
                              <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all duration-200 group-hover:scale-110"
                                style={{ backgroundColor: category.color }}
                              >
                                <CategoryIcon icon={category.icon} size={28} />
                              </div>

                              {/* Category Info */}
                              <div className="text-center space-y-2">
                                {category.isDefault && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge
                                        variant="outline"
                                        className="text-xs px-2 py-1 border-slate-200 text-slate-600"
                                      >
                                        Padrão
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">
                                        Categorias marcadas como "Padrão" não
                                        podem ser editadas ou excluídas
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}

                                <div className="space-y-1">
                                  <h3 className="font-semibold text-slate-900 text-sm">
                                    {category.name}
                                  </h3>
                                  <p className="text-xs text-slate-500">
                                    {formatCurrency(
                                      categoryTotals[category.id] || 0
                                    )}{" "}
                                    este mês
                                  </p>
                                </div>
                              </div>

                              {/* Action Buttons - Always Visible */}
                              {!category.isDefault && (
                                <div className="flex gap-2 w-full justify-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditCategory(category)}
                                    className="h-8 px-3 rounded-lg border-slate-200 hover:bg-slate-50"
                                    title="Editar categoria"
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Editar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteCategory(category)
                                    }
                                    className="h-8 px-3 rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                                    title="Excluir categoria"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Excluir
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="income" className="mt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {categories.map((category) => (
                        <Card
                          key={category.id}
                          className="group p-0 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-white"
                        >
                          <div className="p-4">
                            <div className="flex flex-col items-center space-y-4">
                              {/* Icon Container */}
                              <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all duration-200 group-hover:scale-110"
                                style={{ backgroundColor: category.color }}
                              >
                                <CategoryIcon icon={category.icon} size={28} />
                              </div>

                              {/* Category Info */}
                              <div className="text-center space-y-2">
                                {category.isDefault && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge
                                        variant="outline"
                                        className="text-xs px-2 py-1 border-slate-200 text-slate-600"
                                      >
                                        Padrão
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">
                                        Categorias marcadas como "Padrão" não
                                        podem ser editadas ou excluídas
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}

                                <div className="space-y-1">
                                  <h3 className="font-semibold text-slate-900 text-sm">
                                    {category.name}
                                  </h3>
                                  <p className="text-xs text-slate-500">
                                    {formatCurrency(
                                      categoryTotals[category.id] || 0
                                    )}{" "}
                                    este mês
                                  </p>
                                </div>
                              </div>

                              {/* Action Buttons - Always Visible */}
                              {!category.isDefault && (
                                <div className="flex gap-2 w-full justify-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditCategory(category)}
                                    className="h-8 px-3 rounded-lg border-slate-200 hover:bg-slate-50"
                                    title="Editar categoria"
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Editar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteCategory(category)
                                    }
                                    className="h-8 px-3 rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                                    title="Excluir categoria"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Excluir
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </Card>
          </div>
        </div>

        <CategoryForm
          open={categoryFormOpen}
          onOpenChange={setCategoryFormOpen}
          initialData={editingCategory}
          onSave={handleSaveCategory}
          categoryType={categoryType}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("categories.deleteConfirmation")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("categories.deleteWarning")}
                {categoryToDelete?.isDefault && (
                  <p className="mt-2 text-destructive font-medium">
                    {t("categories.defaultWarning")}
                  </p>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteCategory}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t("common.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SubscriptionGuard>
    </AppLayout>
  );
};

export default CategoriesPage;
