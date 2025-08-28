import React from "react";
import { Transaction } from "@/types";
import { formatCurrency, createLocalDate } from "@/utils/transactionUtils";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Edit, Trash2, Tag, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CategoryIcon from "@/components/categories/CategoryIcon";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useTranslations } from "@/hooks/useTranslations";
import { useDateFormat } from "@/hooks/useDateFormat";
import { cn } from "@/lib/utils";

interface TransactionTimelineProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

const TransactionTimeline: React.FC<TransactionTimelineProps> = ({
  transactions,
  onEdit,
  onDelete,
}) => {
  const { currency } = usePreferences();
  const { t } = useTranslations();
  const { formatDate } = useDateFormat();

  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = format(createLocalDate(transaction.date), "yyyy-MM-dd");
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  const formatDateHeader = (dateStr: string) => {
    const date = createLocalDate(dateStr);
    if (isToday(date)) return t("common.today");
    if (isYesterday(date)) return t("common.yesterday");
    return format(date, "d 'de' MMMM", { locale: ptBR });
  };

  const getDateIcon = (dateStr: string) => {
    const date = createLocalDate(dateStr);
    if (isToday(date)) return <Calendar className="h-4 w-4 text-emerald-500" />;
    if (isYesterday(date))
      return <Calendar className="h-4 w-4 text-blue-500" />;
    return <Calendar className="h-4 w-4 text-slate-400" />;
  };

  return (
    <div className="space-y-8">
      {Object.entries(groupedTransactions)
        .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
        .map(([date, dayTransactions]) => (
          <div key={date} className="space-y-4">
            {/* Enhanced Date Header */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  {getDateIcon(date)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {formatDateHeader(date)}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {format(
                      createLocalDate(date),
                      "EEEE, d 'de' MMMM 'de' yyyy",
                      {
                        locale: ptBR,
                      }
                    )}
                  </p>
                </div>
              </div>

              <div className="flex-1 h-px bg-slate-200"></div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1.5 rounded-full">
                  {dayTransactions.length}{" "}
                  {dayTransactions.length === 1
                    ? t("common.transaction")
                    : t("common.transactions")}
                </Badge>
              </div>
            </div>

            {/* Enhanced Transaction Cards */}
            <div className="space-y-3">
              {dayTransactions
                .sort(
                  (a, b) =>
                    createLocalDate(b.date).getTime() -
                    createLocalDate(a.date).getTime()
                )
                .map((transaction) => (
                  <Card
                    key={transaction.id}
                    className="group p-0 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-white"
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Enhanced Icon Container */}
                          <div
                            className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-200",
                              transaction.type === "income"
                                ? "bg-emerald-100"
                                : "bg-red-100"
                            )}
                          >
                            <CategoryIcon
                              icon={
                                transaction.categoryIcon ||
                                (transaction.type === "income"
                                  ? "trending-up"
                                  : "shopping-bag")
                              }
                              color={
                                transaction.categoryColor ||
                                (transaction.type === "income"
                                  ? "#10b981"
                                  : "#ef4444")
                              }
                              size={24}
                            />
                          </div>

                          {/* Enhanced Content */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900 truncate">
                                {transaction.description ||
                                  t("common.noDescription")}
                              </p>
                              {transaction.goalId && (
                                <Badge
                                  variant="outline"
                                  className="text-xs px-2 py-1 border-emerald-200 text-emerald-700"
                                >
                                  <Tag className="w-3 h-3 mr-1" />
                                  {t("nav.goals")}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge
                                className={cn(
                                  "text-xs font-medium px-2 py-1 rounded-full",
                                  transaction.type === "income"
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                    : "bg-red-100 text-red-700 border-red-200"
                                )}
                              >
                                {transaction.category}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Right Side */}
                        <div className="flex items-center gap-3">
                          {/* Amount Display */}
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <p
                                className={cn(
                                  "font-mono font-bold text-lg",
                                  transaction.type === "income"
                                    ? "text-emerald-600"
                                    : "text-red-600"
                                )}
                              >
                                {transaction.type === "income" ? "+" : "-"}
                                {formatCurrency(transaction.amount, currency)}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons - Always Visible */}
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(transaction)}
                              className="h-9 w-9 p-0 rounded-lg hover:bg-slate-100"
                              title="Editar transação"
                            >
                              <Edit className="h-4 w-4 text-slate-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(transaction.id)}
                              className="h-9 w-9 p-0 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600"
                              title="Excluir transação"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        ))}

      {/* Enhanced Empty State */}
      {transactions.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Tag className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Nenhuma transação encontrada
          </h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Comece adicionando sua primeira transação para acompanhar suas
            receitas e despesas
          </p>
        </div>
      )}

      {/* Enhanced No Results State */}
      {transactions.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Filter className="h-10 w-10 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Nenhuma transação corresponde aos filtros
          </h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Tente ajustar os filtros ou limpar todos para ver todas as
            transações
          </p>
        </div>
      )}
    </div>
  );
};

export default TransactionTimeline;
