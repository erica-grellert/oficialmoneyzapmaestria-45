import React, { useState } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Edit2, Tag, Target, ChevronDown, Plus } from "lucide-react";
import { usePreferences } from "@/contexts/PreferencesContext";
import { Transaction } from "@/types";
import { createLocalDate } from "@/utils/transactionUtils";

interface TimelineGroup {
  date: string;
  total: number;
  transactions: Transaction[];
}

interface TransactionTimelineProps {
  transactions: Transaction[];
  onEditTransaction?: (transaction: Transaction) => void;
  onRecategorizeTransaction?: (transaction: Transaction) => void;
  onLinkToGoal?: (transaction: Transaction) => void;
  onAddTransaction?: () => void;
}

const TransactionTimeline: React.FC<TransactionTimelineProps> = ({
  transactions,
  onEditTransaction,
  onRecategorizeTransaction,
  onLinkToGoal,
  onAddTransaction,
}) => {
  const { currency } = usePreferences();
  const [visibleCount, setVisibleCount] = useState(10);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency || "BRL",
    }).format(value);
  };

  // Group transactions by date
  const groupedTransactions = React.useMemo(() => {
    const groups: { [key: string]: TimelineGroup } = {};

    transactions.forEach((transaction) => {
      const dateKey = format(createLocalDate(transaction.date), "yyyy-MM-dd");

      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: dateKey,
          total: 0,
          transactions: [],
        };
      }

      groups[dateKey].transactions.push(transaction);
      groups[dateKey].total +=
        transaction.type === "income"
          ? transaction.amount
          : -transaction.amount;
    });

    return Object.values(groups)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, Math.ceil(visibleCount / 3));
  }, [transactions, visibleCount]);

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      Alimentação: "🍽️",
      Transporte: "🚗",
      Moradia: "🏠",
      Lazer: "🎉",
      Saúde: "⚕️",
      Educação: "📚",
      Salário: "💰",
      Freelance: "💻",
    };
    return icons[category] || "💳";
  };

  const loadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  const hasMoreTransactions = transactions.length > visibleCount;

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg hover:scale-[1.01] transition-all duration-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhuma transação encontrada
          </h3>
          <p className="text-gray-600 mb-4">
            Comece adicionando sua primeira transação
          </p>
          <button
            onClick={onAddTransaction}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
          >
            Adicionar Transação
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg hover:scale-[1.01] transition-all duration-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">
        Timeline de Transações
      </h3>
      <div className="space-y-6 max-h-96 overflow-y-auto">
        {groupedTransactions.map((group) => (
          <div
            key={group.date}
            className="border-b border-gray-100 pb-4 last:border-b-0"
          >
            {/* Cabeçalho do dia com subtotal */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900">
                {format(new Date(group.date), "dd MMM", { locale: pt })}
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Saldo do dia:</span>
                <span
                  className={`font-bold text-sm px-3 py-1 rounded-full ${
                    group.total >= 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {group.total >= 0 ? "+" : ""}
                  {formatCurrency(group.total)}
                </span>
              </div>
            </div>

            {/* Lista de transações */}
            <div className="space-y-2">
              {group.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="group flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-all duration-200 relative"
                >
                  {/* Ícone da categoria */}
                  <div className="flex-shrink-0">
                    <span className="text-2xl">
                      {getCategoryIcon(transaction.category || "Outros")}
                    </span>
                  </div>

                  {/* Conteúdo da transação */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900 truncate">
                        {transaction.description || "Transação"}
                      </p>
                      {transaction.goalId && (
                        <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">
                          Meta
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{transaction.category}</span>
                      <span>•</span>
                      <span>
                        {format(createLocalDate(transaction.date), "HH:mm")}
                      </span>
                    </div>
                  </div>

                  {/* Valor */}
                  <div className="flex-shrink-0 text-right">
                    <span
                      className={`font-semibold ${
                        transaction.type === "income"
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>

                  {/* Ações rápidas (aparecem no hover) */}
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                    <button
                      onClick={() => onEditTransaction?.(transaction)}
                      className="p-2 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-600 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
                      title="Editar"
                    >
                      <Edit2 className="h-3 w-3 text-gray-600 hover:text-emerald-600" />
                    </button>
                    <button
                      onClick={() => onRecategorizeTransaction?.(transaction)}
                      className="p-2 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-500 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      title="Recategorizar"
                    >
                      <Tag className="h-3 w-3 text-gray-600 hover:text-blue-500" />
                    </button>
                    <button
                      onClick={() => onLinkToGoal?.(transaction)}
                      className="p-2 bg-white hover:bg-amber-50 border border-gray-200 hover:border-amber-500 rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                      title="Vincular à meta"
                    >
                      <Target className="h-3 w-3 text-gray-600 hover:text-amber-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Botão "Ver mais" */}
        {hasMoreTransactions && (
          <div className="text-center pt-4">
            <button
              onClick={loadMore}
              className="flex items-center gap-2 mx-auto px-6 py-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full transition-all duration-200 font-medium hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
            >
              Ver mais transações
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionTimeline;
