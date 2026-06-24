import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MzModal } from "@/components/ui/mz-modal";
import { SegmentedControl } from "./SegmentedControl";
import { MoneyInput } from "./MoneyInput";
import { CategoryChips } from "./CategoryChips";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Transaction } from "@/types";
import { useAdaptiveContext } from "@/hooks/useAdaptiveContext";
import { useAppContext } from "@/contexts/AppContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import {
  createTransactionSchema,
  TransactionFormValues,
} from "@/schemas/transactionSchema";
import { getCategoriesByType } from "@/services/categoryService";
import { Category } from "@/types/categories";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { createLocalDate } from "@/utils/transactionUtils";

interface TransactionFormV2Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Transaction | null;
  mode: "create" | "edit";
  defaultType?: "income" | "expense";
}

export const TransactionFormV2: React.FC<TransactionFormV2Props> = ({
  open,
  onOpenChange,
  initialData,
  mode,
  defaultType = "expense",
}) => {
  const { t } = usePreferences();
  const { addTransaction, updateTransaction } = useAdaptiveContext();
  const { entidadeAtiva, categories: contextCategories } = useAppContext();
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<"income" | "expense">(
    initialData?.type || defaultType
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveAndContinue, setSaveAndContinue] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialData?.category_id || ""
  );
  const [calendarOpen, setCalendarOpen] = useState(false);

  const transactionSchema = createTransactionSchema(t);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: initialData?.type || defaultType,
      amount: initialData?.amount || 0,
      category: initialData?.category_id || "",
      description: initialData?.description || "",
      date: initialData?.date
        ? format(createLocalDate(initialData.date), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
      goalId: initialData?.goalId || undefined,
    },
  });

  // Load categories when type changes
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoryData = await getCategoriesByType(selectedType, entidadeAtiva);
        setCategories(categoryData);

        // Set default category if none selected and this is a new transaction
        if (
          categoryData.length > 0 &&
          !form.getValues("category") &&
          !initialData
        ) {
          form.setValue("category", categoryData[0].id);
        }
      } catch (error) {
        console.error("Error loading categories:", error);
        setCategories([]);
      }
    };

    loadCategories();
  }, [selectedType, form, initialData, entidadeAtiva]);

  // Reset form when opening/closing
  useEffect(() => {
    if (open && !initialData) {
      form.reset({
        type: defaultType,
        amount: 0,
        category: "",
        description: "",
        date: format(new Date(), "yyyy-MM-dd"),
        goalId: undefined,
      });
      setSelectedType(defaultType);
    } else if (open && initialData) {
      form.reset({
        type: initialData.type,
        amount: initialData.amount,
        category: initialData.category_id || "",
        description: initialData.description || "",
        date: format(createLocalDate(initialData.date), "yyyy-MM-dd"),
        goalId: initialData.goalId,
      });
      setSelectedType(initialData.type);
    }
  }, [open, initialData, defaultType, form]);

  const handleTypeChange = async (type: "income" | "expense") => {
    setSelectedType(type);
    form.setValue("type", type);
    form.setValue("category", ""); // Reset category when type changes
  };

  const handleCategorySelect = (categoryId: string) => {
    console.log("TransactionFormV2 - Category selected:", categoryId);
    form.setValue("category", categoryId, { shouldValidate: true });
    console.log(
      "TransactionFormV2 - Form category value after set:",
      form.getValues("category")
    );
  };

  const onSubmit = async (
    values: TransactionFormValues,
    continueAdding = false
  ) => {
    setLoading(true);
    setSaveAndContinue(continueAdding);

    const processedValues = {
      ...values,
      goalId:
        values.goalId === "none" || values.goalId === null
          ? undefined
          : values.goalId,
    };

    try {
      if (mode === "create") {
        await addTransaction({
          type: processedValues.type,
          amount: processedValues.amount,
          category_id: processedValues.category,
          description: processedValues.description || "",
          date: createLocalDate(processedValues.date).toISOString(),
          goalId: processedValues.goalId,
          category: "",
        });
      } else if (initialData) {
        await updateTransaction(initialData.id, {
          type: processedValues.type,
          amount: processedValues.amount,
          category_id: processedValues.category,
          description: processedValues.description || "",
          date: createLocalDate(processedValues.date).toISOString(),
          goalId: processedValues.goalId,
        });
      }

      toast({
        title:
          mode === "create"
            ? "Movimentação adicionada"
            : "Movimentação atualizada",
        description:
          mode === "create"
            ? "Sua movimentação foi salva com sucesso"
            : "As alterações foram salvas",
      });

      if (continueAdding) {
        // Reset form but keep type and date
        form.reset({
          type: selectedType,
          amount: 0,
          category: "",
          description: "",
          date: form.getValues("date"),
          goalId: undefined,
        });
      } else {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast({
        title: "Erro ao salvar",
        description:
          "Ocorreu um erro ao salvar a movimentação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setSaveAndContinue(false);
    }
  };

  // Get quick date options
  const getQuickDates = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return [
      { label: "Hoje", date: today },
      { label: "Ontem", date: yesterday },
    ];
  };

  const getBadgeInfo = () => {
    return {
      label: selectedType === "income" ? "Receita" : "Despesa",
      variant: selectedType as "income" | "expense",
    };
  };

  return (
    <MzModal
      open={open}
      onOpenChange={onOpenChange}
      title={
        mode === "create" ? "Adicionar movimentação" : "Editar movimentação"
      }
      subtitle="Crie uma movimentação em menos de 10s"
      icon={selectedType === "income" ? "trending-up" : "trending-down"}
      badge={getBadgeInfo()}
      variant="form"
      primaryAction={{
        label: "Salvar",
        onClick: () => form.handleSubmit((data) => onSubmit(data, false))(),
        loading: loading && !saveAndContinue,
      }}
      secondaryAction={{
        label: "Salvar e adicionar outra",
        onClick: () => form.handleSubmit((data) => onSubmit(data, true))(),
        loading: loading && saveAndContinue,
      }}
      tertiaryAction={{
        label: "Cancelar",
        onClick: () => onOpenChange(false),
      }}
    >
      <Form {...form}>
        <form className="space-y-4 xs:space-y-6">
          {/* Type Selector */}
          <div className="space-y-2">
            <label className="text-sm xs:text-base font-medium text-slate-700">
              Tipo de movimentação
            </label>
            <SegmentedControl
              value={selectedType}
              onChange={handleTypeChange}
            />
          </div>

          {/* Amount & Date Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 xs:gap-4">
            <div className="lg:col-span-2 space-y-2">
              <label className="text-sm xs:text-base font-medium text-slate-700">
                Valor *
              </label>
              <FormField
                control={form.control}
                name="amount"
                render={({ field, fieldState }) => (
                  <MoneyInput
                    value={field.value}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm xs:text-base font-medium text-slate-700">
                Data
              </label>
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-11 xs:h-12 justify-start text-left font-normal rounded-xl text-sm xs:text-base min-h-[44px] touch-manipulation",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                            {field.value ? (
                              format(
                                createLocalDate(field.value),
                                "dd/MM/yyyy",
                                {
                                  locale: ptBR,
                                }
                              )
                            ) : (
                              <span>Selecionar data</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="p-2 xs:p-3 border-b">
                          <div className="flex gap-2">
                            {getQuickDates().map((quickDate) => (
                              <Button
                                key={quickDate.label}
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  field.onChange(
                                    format(quickDate.date, "yyyy-MM-dd")
                                  );
                                }}
                                className="text-xs min-h-[36px] touch-manipulation"
                              >
                                {quickDate.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <Calendar
                          mode="single"
                          selected={
                            field.value
                              ? createLocalDate(field.value)
                              : undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(format(date, "yyyy-MM-dd"));
                              setCalendarOpen(false); // Close the popover after selection
                            }
                          }}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Category Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 xs:gap-4">
            <div className="lg:col-span-2 space-y-2 xs:space-y-3">
              <label className="text-sm xs:text-base font-medium text-slate-700">
                Categoria *
              </label>

              {/* Category Chips */}
              <CategoryChips
                categories={categories}
                onSelect={handleCategorySelect}
                selectedId={form.watch("category")}
                key={`category-chips-${form.watch("category")}`} // Force re-render when category changes
              />

              {/* Category form field for validation */}
              <FormField
                control={form.control}
                name="category"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormControl>
                      <input
                        type="hidden"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm xs:text-base font-medium text-slate-700">
              Descrição
            </label>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Ex.: Jantar com clientes, Compra no mercado..."
                      className="min-h-[80px] xs:min-h-[100px] rounded-xl resize-none text-sm xs:text-base"
                      maxLength={140}
                    />
                  </FormControl>
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Opcional</span>
                    <span>{field.value?.length || 0}/140</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    </MzModal>
  );
};
