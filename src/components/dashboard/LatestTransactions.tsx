
import React from 'react';
import { ArrowRight, Edit2, Tag, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Transaction } from '@/types';
import { formatCurrency, createLocalDate } from '@/utils/transactionUtils';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useTranslations } from '@/hooks/useTranslations';

interface LatestTransactionsProps {
  transactions: Transaction[];
  onEditTransaction: (transaction: Transaction) => void;
  onRecategorizeTransaction: (transaction: Transaction) => void;
  onViewAll: () => void;
  onAddTransaction: () => void;
}

const LatestTransactions: React.FC<LatestTransactionsProps> = ({
  transactions,
  onEditTransaction,
  onRecategorizeTransaction,
  onViewAll,
  onAddTransaction
}) => {
  const { currency } = usePreferences();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL'
    }).format(value);
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Alimentação': '🍽️',
      'Transporte': '🚗',
      'Moradia': '🏠',
      'Lazer': '🎉',
      'Saúde': '⚕️',
      'Educação': '📚',
      'Salário': '💰',
      'Freelance': '💻',
      'Salary': '💰',
      'Rent': '🏠',
      'Utilities': '⚡',
      'Groceries': '🛒',
      'Dining': '🍽️',
    };
    return icons[category] || '💳';
  };

  const translateCategory = (category: string) => {
    const translations: { [key: string]: string } = {
      'Salary': 'Salário',
      'Rent': 'Aluguel',
      'Utilities': 'Utilidades',
      'Groceries': 'Compras',
      'Dining': 'Alimentação',
    };
    return translations[category] || category;
  };

  const translateDescription = (description: string) => {
    const translations: { [key: string]: string } = {
      'Monthly salary': 'Salário mensal',
      'Monthly rent payment': 'Pagamento do aluguel',
      'Electricity bill': 'Conta de luz',
      'Weekly groceries': 'Compras semanais',
      'Restaurant dinner': 'Jantar no restaurante',
    };
    return translations[description] || description;
  };

  if (transactions.length === 0) {
    return (
      <Card className="bg-white border-[#EDEFF2] shadow-sm h-fit">
        <CardHeader className="pb-4">
          <h3 className="text-lg font-semibold text-[#0F172A]">Últimas Transações</h3>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-slate-400" />
            </div>
            <h4 className="text-sm font-medium text-[#0F172A] mb-2">Nenhuma transação encontrada</h4>
            <p className="text-xs text-[#64748B] mb-4">Comece adicionando sua primeira transação</p>
            <Button
              onClick={onAddTransaction}
              size="sm"
              className="bg-[#10B981] hover:bg-[#059669] text-white"
            >
              Adicionar Transação
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-[#EDEFF2] shadow-sm h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#0F172A]">Últimas Transações</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAll}
            className="text-[#10B981] hover:text-[#059669] hover:bg-green-50 p-2"
          >
            Ver todas
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {transactions.slice(0, 8).map((transaction) => (
            <div 
              key={transaction.id}
              className="group flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-all duration-200 relative"
            >
              {/* Ícone da categoria */}
              <div className="flex-shrink-0">
                <span className="text-2xl">
                  {getCategoryIcon(transaction.category || 'Outros')}
                </span>
              </div>
              
              {/* Conteúdo da transação */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-[#0F172A] truncate text-sm">
                    {translateDescription(transaction.description || 'Transação')}
                  </p>
                  {transaction.goalId && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Meta</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#64748B]">
                  <span>{translateCategory(transaction.category)}</span>
                  <span>•</span>
                  <span>{format(createLocalDate(transaction.date), 'HH:mm')}</span>
                </div>
              </div>
              
              {/* Valor */}
              <div className="flex-shrink-0 text-right">
                <span className={`font-semibold text-sm ${
                  transaction.type === 'income' ? 'text-[#10B981]' : 'text-[#EF4444]'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </span>
              </div>

              {/* Ações rápidas (aparecem no hover) */}
              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                <button
                  onClick={() => onEditTransaction(transaction)}
                  className="p-1.5 bg-white hover:bg-green-50 border border-[#EDEFF2] hover:border-green-300 rounded-md transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-600/50"
                  title="Editar"
                >
                  <Edit2 className="h-3 w-3 text-[#475569] hover:text-[#10B981]" />
                </button>
                <button
                  onClick={() => onRecategorizeTransaction(transaction)}
                  className="p-1.5 bg-white hover:bg-blue-50 border border-[#EDEFF2] hover:border-blue-300 rounded-md transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  title="Recategorizar"
                >
                  <Tag className="h-3 w-3 text-[#475569] hover:text-blue-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LatestTransactions;
