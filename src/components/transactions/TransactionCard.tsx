import React from "react";
import { Transaction } from "@/types";
import { formatCurrency, createLocalDate } from "@/utils/transactionUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Edit,
  Trash2,
  Tag,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CategoryIcon from "@/components/categories/CategoryIcon";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useTranslations } from "@/hooks/useTranslations";
import { cn } from "@/lib/utils";

interface TransactionCardProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  showDate?: boolean;
  compact?: boolean;
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onEdit,
  onDelete,
  showDate = false,
  compact = false,
}) => {
  const { currency } = usePreferences();
  const { t } = useTranslations();

  const isIncome = transaction.type === "income";
  const amountColor = isIncome ? "text-yellow-600" : "text-red-600";
  const bgColor = isIncome ? "bg-yellow-50" : "bg-red-50";
  const borderColor = isIncome ? "border-yellow-200" : "border-red-200";

  if (compact) {
    return (
      <Card className="group p-3 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
              bgColor
            )}
          >
            <CategoryIcon
              icon={
                transaction.categoryIcon ||
                (isIncome ? "trending-up" : "shopping-bag")
              }
              color={
                transaction.categoryColor || (isIncome ? "#10b981" : "#ef4444")
              }
              size={20}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 truncate text-sm">
              {transaction.description || t("common.noDescription")}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  bgColor,
                  borderColor,
                  isIncome ? "text-yellow-700" : "text-red-700"
                )}
              >
                {transaction.category}
              </Badge>
              {transaction.goalId && (
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-0.5 border-yellow-200 text-yellow-700"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {t("nav.goals")}
                </Badge>
              )}
            </div>
          </div>

          {/* Amount & Actions */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className={cn("font-mono font-bold text-lg", amountColor)}>
                {isIncome ? "+" : "-"}
                {formatCurrency(transaction.amount, currency)}
              </p>
            </div>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(transaction)}
                className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100"
              >
                <Edit className="h-4 w-4 text-slate-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(transaction.id)}
                className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group p-0 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-white">
      <div className="p-4">
        {/* Header with Date if needed */}
        {showDate && (
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-200">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-500">
              {format(
                createLocalDate(transaction.date),
                "EEEE, d 'de' MMMM 'de' yyyy",
                { locale: ptBR }
              )}
            </span>
            <Clock className="h-4 w-4 text-slate-400 ml-auto" />
            <span className="text-sm text-slate-500">
              {format(createLocalDate(transaction.date), "HH:mm")}
            </span>
          </div>
        )}

        <div className="flex items-start gap-4">
          {/* Enhanced Icon Container */}
          <div
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-200",
              bgColor
            )}
          >
            <CategoryIcon
              icon={
                transaction.categoryIcon ||
                (isIncome ? "trending-up" : "shopping-bag")
              }
              color={
                transaction.categoryColor || (isIncome ? "#10b981" : "#ef4444")
              }
              size={28}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900">
                  {transaction.description || t("common.noDescription")}
                </h3>
                {transaction.goalId && (
                  <Badge
                    variant="outline"
                    className="px-2 py-1 border-yellow-200 text-yellow-700"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {t("nav.goals")}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  className={cn(
                    "text-sm font-medium px-3 py-1.5 rounded-full",
                    bgColor,
                    borderColor,
                    isIncome ? "text-yellow-700" : "text-red-700"
                  )}
                >
                  {transaction.category}
                </Badge>

                <div className="flex items-center gap-1 text-slate-500">
                  {isIncome ? (
                    <TrendingUp className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium">
                    {isIncome ? "Receita" : "Despesa"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Amount & Actions */}
          <div className="flex flex-col items-end gap-3">
            {/* Amount Display */}
            <div className="text-right">
              <div className="flex items-center gap-2">
                <p className={cn("font-mono font-bold text-2xl", amountColor)}>
                  {isIncome ? "+" : "-"}
                  {formatCurrency(transaction.amount, currency)}
                </p>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {isIncome ? "Entrada" : "Saída"}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(transaction)}
                className="h-9 px-3 rounded-lg border-slate-200 hover:bg-slate-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(transaction.id)}
                className="h-9 px-3 rounded-lg border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TransactionCard;
