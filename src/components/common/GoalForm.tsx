
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MzModal } from '@/components/ui/mz-modal';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Goal } from '@/types';
import { useAdaptiveContext } from '@/hooks/useAdaptiveContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Target } from 'lucide-react';

interface GoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Goal;
  mode: 'create' | 'edit';
}

const presetColors = [
  '#4ECDC4', '#FF6B6B', '#2C6E7F', '#FBBF24', '#8B5CF6', 
  '#EC4899', '#10B981', '#94A3B8', '#F43F5E', '#F59E0B'
];

const GoalForm: React.FC<GoalFormProps> = ({
  open,
  onOpenChange,
  initialData,
  mode,
}) => {
  const { addGoal, updateGoal } = useAdaptiveContext();
  const { t, currency } = usePreferences();

  // Create a schema with translated validation messages
  const goalSchema = z.object({
    name: z.string().min(1, t('validation.required')),
    target_amount: z.coerce.number().positive(t('validation.positive')),
    current_amount: z.coerce.number().min(0, t('validation.nonNegative')),
    start_date: z.string().min(1, t('validation.required')),
    end_date: z.string().optional(),
    color: z.string().min(1, t('validation.required')),
  });

  type GoalFormValues = z.infer<typeof goalSchema>;

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: initialData?.name || '',
      target_amount: initialData?.targetAmount || 0,
      current_amount: initialData?.currentAmount || 0,
      start_date: initialData?.startDate
        ? new Date(initialData.startDate).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0],
      end_date: initialData?.endDate
        ? new Date(initialData.endDate).toISOString().split('T')[0] 
        : undefined,
      color: initialData?.color || presetColors[0],
    },
  });

  const onSubmit = (values: GoalFormValues) => {
    if (mode === 'create') {
      addGoal({
        name: values.name,
        targetAmount: values.target_amount,
        currentAmount: values.current_amount,
        startDate: new Date(values.start_date).toISOString(),
        endDate: values.end_date ? new Date(values.end_date).toISOString() : undefined,
        color: values.color,
        transactions: [],
      });
    } else if (initialData) {
      updateGoal(initialData.id, {
        name: values.name,
        targetAmount: values.target_amount,
        currentAmount: values.current_amount,
        startDate: new Date(values.start_date).toISOString(),
        endDate: values.end_date ? new Date(values.end_date).toISOString() : undefined,
        color: values.color,
      });
    }
    onOpenChange(false);
  };

  // Get currency symbol
  const getCurrencySymbol = () => {
    return currency === 'USD' ? '$' : 'R$';
  };

  return (
    <MzModal
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'create' ? 'Criar nova meta' : 'Editar meta'}
      subtitle="Defina seus objetivos financeiros de forma simples e visual"
      icon="wallet"
      badge={{
        label: mode === 'create' ? 'Nova' : 'Editar',
        variant: 'default'
      }}
      variant="form"
      primaryAction={{
        label: mode === 'create' ? 'Criar meta' : 'Salvar alterações',
        onClick: form.handleSubmit(onSubmit),
      }}
      tertiaryAction={{
        label: 'Cancelar',
        onClick: () => onOpenChange(false),
      }}
    >
      <Form {...form}>
        <form className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Nome da meta *
            </label>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input 
                      placeholder="Ex.: Viagem para Europa, Entrada da casa..." 
                      className="h-12 rounded-xl"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Amount Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Valor alvo *
              </label>
              <FormField
                control={form.control}
                name="target_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                          {getCurrencySymbol()}
                        </div>
                        <Input
                          type="number"
                          step="0.01"
                          className="h-12 pl-8 rounded-xl"
                          placeholder="0,00"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Valor atual
              </label>
              <FormField
                control={form.control}
                name="current_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
                          {getCurrencySymbol()}
                        </div>
                        <Input
                          type="number"
                          step="0.01"
                          className="h-12 pl-8 rounded-xl"
                          placeholder="0,00"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Date Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Data de início *
              </label>
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        type="date" 
                        className="h-12 rounded-xl"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Data de conclusão
              </label>
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        type="date" 
                        className="h-12 rounded-xl"
                        placeholder="Opcional"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          field.onChange(e.target.value || undefined);
                        }}
                      />
                    </FormControl>
                    <div className="text-xs text-slate-400">
                      Opcional
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Cor da meta
            </label>
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-12 justify-start text-left font-normal rounded-xl",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <div
                            className="h-4 w-4 rounded-full mr-2"
                            style={{ backgroundColor: field.value }}
                          />
                          <span>
                            {field.value ? 'Cor selecionada' : 'Escolher cor'}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3" align="start">
                        <div className="grid grid-cols-5 gap-2">
                          {presetColors.map((color) => (
                            <div
                              key={color}
                              className="h-10 w-10 rounded-full cursor-pointer border border-gray-200 flex items-center justify-center hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              onClick={() => {
                                form.setValue("color", color);
                              }}
                            >
                              {field.value === color && (
                                <div className="h-2 w-2 rounded-full bg-white" />
                              )}
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </FormControl>
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

export default GoalForm;
