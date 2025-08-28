import React from "react";
import { Transaction } from "@/types";
import { createLocalDate } from "@/utils/transactionUtils";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Filter, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import TransactionCard from "./TransactionCard";
import { usePreferences } from "@/contexts/PreferencesContext";

interface TransactionGridProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  viewMode?: "grid" | "list";
}

const TransactionGrid: React.FC<TransactionGridProps> = ({
  transactions,
  onEdit,
  onDelete,
  viewMode = "grid",
}) => {
  const { t } = usePreferences();
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
    if (isToday(date)) return "Hoje";
    if (isYesterday(date)) return "Ontem";
    return format(date, "d 'de' MMMM", { locale: ptBR });
  };

  const getDateIcon = (dateStr: string) => {
    const date = createLocalDate(dateStr);
    if (isToday(date)) return <Calendar className="h-4 w-4 text-emerald-500" />;
    if (isYesterday(date))
      return <Calendar className="h-4 w-4 text-blue-500" />;
    return <Calendar className="h-4 w-4 text-slate-400" />;
  };

  const getDateBadgeVariant = (dateStr: string) => {
    const date = createLocalDate(dateStr);
    if (isToday(date)) return "default";
    if (isYesterday(date)) return "secondary";
    return "outline";
  };

  if (viewMode === "list") {
    return (
      <div className="space-y-6">
        {Object.entries(groupedTransactions)
          .sort(
            ([a], [b]) =>
              createLocalDate(b).getTime() - createLocalDate(a).getTime()
          )
          .map(([date, dayTransactions]) => (
            <div key={date} className="space-y-4">
              {/* Date Header */}
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
                <Badge variant={getDateBadgeVariant(date)} className="ml-auto">
                  {dayTransactions.length} transação
                  {dayTransactions.length !== 1 ? "ões" : ""}
                </Badge>
              </div>

              {/* Transaction Cards */}
              <div className="space-y-3">
                {dayTransactions
                  .sort(
                    (a, b) =>
                      createLocalDate(b.date).getTime() -
                      createLocalDate(a.date).getTime()
                  )
                  .map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      compact={true}
                    />
                  ))}
              </div>
            </div>
          ))}

        {/* Empty State */}
        {transactions.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Filter className="h-10 w-10 text-slate-400" />
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
      </div>
    );
  }

  // Grid View
  return (
    <div className="space-y-8">
      {Object.entries(groupedTransactions)
        .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
        .map(([date, dayTransactions]) => (
          <div key={date} className="space-y-6">
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
                    {format(new Date(date), "EEEE, d 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dayTransactions
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    showDate={false}
                    compact={false}
                  />
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
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Filter className="h-10 w-10 text-slate-400" />
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

export default TransactionGrid;
