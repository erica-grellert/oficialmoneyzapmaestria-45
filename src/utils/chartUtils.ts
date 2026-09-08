
import { Transaction } from '@/types';
import { createLocalDate, isExpense, isIncome, toAmount } from '@/utils/transactionUtils';

export interface ChartData {
  date: string;
  dateNumber?: number;
  receitas: number;
  despesas: number;
}

export type ChartPeriodMode = 'daily' | 'monthly';

const addAmount = (bucket: ChartData, transaction: Transaction) => {
  const amount = toAmount(transaction.amount);
  if (isIncome(transaction.type)) {
    bucket.receitas += amount;
  } else if (isExpense(transaction.type)) {
    bucket.despesas += amount;
  }
};

const generateDailyChartData = (
  transactions: Transaction[],
  start: Date,
  end: Date
): ChartData[] => {
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const sameMonth =
    startDay.getFullYear() === endDay.getFullYear() &&
    startDay.getMonth() === endDay.getMonth();

  const dailyData: ChartData[] = [];
  for (
    let cursor = new Date(startDay);
    cursor.getTime() <= endDay.getTime();
    cursor.setDate(cursor.getDate() + 1)
  ) {
    dailyData.push({
      date: sameMonth
        ? String(cursor.getDate())
        : `${cursor.getDate()}/${cursor.getMonth() + 1}`,
      dateNumber: cursor.getDate(),
      receitas: 0,
      despesas: 0,
    });
  }

  transactions.forEach((transaction) => {
    const transactionDate = createLocalDate(transaction.date);
    if (Number.isNaN(transactionDate.getTime())) return;

    const day = new Date(
      transactionDate.getFullYear(),
      transactionDate.getMonth(),
      transactionDate.getDate()
    );
    if (day < startDay || day > endDay) return;

    const index = Math.round((day.getTime() - startDay.getTime()) / 86_400_000);
    if (index >= 0 && index < dailyData.length) {
      addAmount(dailyData[index], transaction);
    }
  });

  return dailyData;
};

const generateMonthlyChartData = (
  transactions: Transaction[],
  start: Date,
  end: Date
): ChartData[] => {
  const startMonth = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  const monthlyData: ChartData[] = [];

  for (
    let cursor = new Date(startMonth);
    cursor.getTime() <= endMonth.getTime();
    cursor.setMonth(cursor.getMonth() + 1)
  ) {
    monthlyData.push({
      date: cursor.toLocaleDateString('pt-BR', { month: 'short' }),
      receitas: 0,
      despesas: 0,
    });
  }

  transactions.forEach((transaction) => {
    const transactionDate = createLocalDate(transaction.date);
    if (Number.isNaN(transactionDate.getTime())) return;

    const monthStart = new Date(
      transactionDate.getFullYear(),
      transactionDate.getMonth(),
      1
    );
    if (monthStart < startMonth || monthStart > endMonth) return;

    const index =
      (transactionDate.getFullYear() - startMonth.getFullYear()) * 12 +
      (transactionDate.getMonth() - startMonth.getMonth());
    if (index >= 0 && index < monthlyData.length) {
      addAmount(monthlyData[index], transaction);
    }
  });

  return monthlyData;
};

export const getChartPeriodMode = (start: Date, end: Date): ChartPeriodMode => {
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const durationDays =
    Math.round((endDay.getTime() - startDay.getTime()) / 86_400_000) + 1;
  return durationDays <= 45 ? 'daily' : 'monthly';
};

export const generateChartDataFromRange = (
  transactions: Transaction[],
  start: Date,
  end: Date
): { data: ChartData[]; mode: ChartPeriodMode } => {
  const mode = getChartPeriodMode(start, end);
  const data =
    mode === 'daily'
      ? generateDailyChartData(transactions, start, end)
      : generateMonthlyChartData(transactions, start, end);
  return { data, mode };
};

export const generateChartDataFromTransactions = (
  transactions: Transaction[],
  periodType: 'currentMonth' | 'last12Months' = 'currentMonth'
): ChartData[] => {
  const now = new Date();

  if (periodType === 'currentMonth') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return generateDailyChartData(transactions, start, end);
  }

  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return generateMonthlyChartData(transactions, start, end);
};
