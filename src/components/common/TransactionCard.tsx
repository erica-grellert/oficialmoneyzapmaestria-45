import React from "react";
import { Transaction } from "@/types";
import { formatCurrency, formatDate } from "@/utils/transactionUtils";
import { MoreHorizontal, Target, ArrowUp, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdaptiveContext } from "@/hooks/useAdaptiveContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import CategoryIcon from "../categories/CategoryIcon";

interface TransactionCardProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  hideValues?: boolean;
  index?: number;
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onEdit,
  onDelete,
  hideValues = false,
  index = 0,
}) => {
  const { goals } = useAdaptiveContext();
  const { t, currency } = usePreferences();

  // Helper to get goal name
  const getGoalName = (goalId?: string) => {
    if (!goalId) return null;
    const goal = goals.find((g) => g.id === goalId);
    return goal ? goal.name : null;
  };

  // Helper to render masked values
  const renderHiddenValue = () => {
    return "******";
  };

  const iconColor = transaction.type === "income" ? "#50a077" : "#dd7979";
  const isIncome = transaction.type === "income";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header: Type Icon + Amount */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
                     <div
             className={cn(
               "w-10 h-10 rounded-full flex items-center justify-center",
               isIncome ? "bg-[#eff7f2]" : "bg-[#fff1f2]"
             )}
           >
             {isIncome ? (
               <ArrowUp className="w-5 h-5 text-[#50a077]" />
             ) : (
               <ArrowDown className="w-5 h-5 text-[#dd7979]" />
             )}
           </div>
          <div>
                         <span
               className={cn(
                 "text-lg font-semibold",
                 isIncome ? "text-[#50a077]" : "text-[#dd7979]"
               )}
             >
              {isIncome ? "+" : "-"}
              {hideValues
                ? renderHiddenValue()
                : formatCurrency(transaction.amount, currency)}
            </span>
            <p className="text-sm text-muted-foreground">
              {formatDate(transaction.date)}
            </p>
          </div>
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">{t("common.edit")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(transaction)}>
                {t("common.edit")}
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(transaction.id)}
                className="text-red-600"
              >
                {t("common.delete")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Category Icon, Description and Category Name */}
      <div className="flex items-start gap-3 mb-3">
        {/* Category Icon with Color */}
        <div className="flex-shrink-0">
          <CategoryIcon
            icon={
              transaction.categoryIcon ||
              (transaction.type === "income" ? "trending-up" : "shopping-bag")
            }
            color={transaction.categoryColor || iconColor}
            size={20}
          />
        </div>

        {/* Description and Category Name */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground mb-2">
            {transaction.description || t("common.noDescription")}
          </p>
                     <Badge
             variant="outline"
             className={cn(
               "text-xs",
               isIncome
                 ? "text-[#50a077] border-[#50a077] bg-[#eff7f2]"
                 : "text-[#dd7979] border-[#dd7979] bg-[#fff1f2]"
             )}
           >
            {transaction.category}
          </Badge>
        </div>
      </div>

      {/* Goal (if exists) */}
      {transaction.goalId && (
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground">
            {getGoalName(transaction.goalId)}
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default TransactionCard;
