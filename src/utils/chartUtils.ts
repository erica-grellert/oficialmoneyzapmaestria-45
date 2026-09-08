
import { Transaction } from '@/types';
import { createLocalDate, toAmount } from '@/utils/transactionUtils';

export interface ChartData {
  date: string;
  receitas: number;
  despesas: number;
}

export const generateChartDataFromTransactions = (
  transactions: Transaction[],
  periodType: 'currentMonth' | 'last12Months' = 'currentMonth'
): ChartData[] => {
  const now = new Date();
  
  if (periodType === 'currentMonth') {
    // Generate daily data for current month
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Initialize array with all days of the month
    const dailyData: ChartData[] = Array.from({ length: daysInMonth }, (_, i) => ({
      date: (i + 1).toString(),
      receitas: 0,
      despesas: 0,
    }));
    
    // Process transactions for current month
    transactions.forEach(transaction => {
      const transactionDate = createLocalDate(transaction.date);
      if (Number.isNaN(transactionDate.getTime())) return;
      
      // Check if transaction is in current month
      if (transactionDate.getFullYear() === year && transactionDate.getMonth() === month) {
        const day = transactionDate.getDate();
        const dayIndex = day - 1; // Array is 0-indexed
        const amount = toAmount(transaction.amount);
        
        if (dayIndex >= 0 && dayIndex < daysInMonth) {
          if (String(transaction.type).toLowerCase().trim() === 'income') {
            dailyData[dayIndex].receitas += amount;
          } else {
            dailyData[dayIndex].despesas += amount;
          }
        }
      }
    });
    
    return dailyData;
  } else {
    // Generate monthly data for last 12 months
    const monthlyData: ChartData[] = [];
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = monthDate.toLocaleDateString('pt-BR', { month: 'short' });
      const monthYear = monthDate.getFullYear();
      const monthIndex = monthDate.getMonth();
      
      // Initialize month data
      const monthData: ChartData = {
        date: monthLabel,
        receitas: 0,
        despesas: 0,
      };
      
      // Process transactions for this month
      transactions.forEach(transaction => {
        const transactionDate = createLocalDate(transaction.date);
        if (Number.isNaN(transactionDate.getTime())) return;
        
        if (transactionDate.getFullYear() === monthYear && transactionDate.getMonth() === monthIndex) {
          const amount = toAmount(transaction.amount);
          if (String(transaction.type).toLowerCase().trim() === 'income') {
            monthData.receitas += amount;
          } else {
            monthData.despesas += amount;
          }
        }
      });
      
      monthlyData.push(monthData);
    }
    
    return monthlyData;
  }
};
