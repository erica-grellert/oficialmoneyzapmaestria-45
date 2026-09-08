import { Transaction, TimeRange } from "../types";

// Get today's date at midnight
const getTodayStart = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// Get yesterday's date at midnight
const getYesterdayStart = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  return yesterday;
};

// Get date X days ago at midnight
const getDaysAgoStart = (days: number) => {
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);
  daysAgo.setHours(0, 0, 0, 0);
  return daysAgo;
};

export const toAmount = (amount: unknown): number => {
  const n =
    typeof amount === "number" ? amount : parseFloat(String(amount ?? 0));
  return Number.isFinite(n) ? n : 0;
};

const fromCalendarParts = (year: number, month: number, day: number): Date =>
  new Date(year, month - 1, day);

// Create a local date from string to avoid timezone issues
export const createLocalDate = (dateString: string): Date => {
  if (!dateString) return new Date(NaN);

  const trimmed = String(dateString).trim();

  const dateOnly = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    return fromCalendarParts(
      Number(dateOnly[1]),
      Number(dateOnly[2]),
      Number(dateOnly[3])
    );
  }

  // Midnight UTC is how date-only values are often stored after toISOString()
  const utcMidnight = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})T00:00:00(\.\d+)?Z$/
  );
  if (utcMidnight) {
    return fromCalendarParts(
      Number(utcMidnight[1]),
      Number(utcMidnight[2]),
      Number(utcMidnight[3])
    );
  }

  const brDate = trimmed.match(/^(\d{2})[/-](\d{2})[/-](\d{4})/);
  if (brDate) {
    return fromCalendarParts(
      Number(brDate[3]),
      Number(brDate[2]),
      Number(brDate[1])
    );
  }

  const normalized =
    /^\d{4}-\d{2}-\d{2} \d{2}:/.test(trimmed) && !trimmed.includes("T")
      ? trimmed.replace(" ", "T")
      : trimmed;

  return new Date(normalized);
};

const startOfLocalDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const isTransactionInRange = (
  dateString: string,
  start: Date,
  end: Date
): boolean => {
  const transactionDate = createLocalDate(dateString);
  if (Number.isNaN(transactionDate.getTime())) return false;

  const day = startOfLocalDay(transactionDate);
  const startDay = startOfLocalDay(start);
  const endDay = startOfLocalDay(end);
  return day >= startDay && day <= endDay;
};

export const getDashboardPeriodBounds = (
  period: string,
  dateRange?: { from?: Date; to?: Date }
): { start: Date; end: Date } => {
  const now = new Date();
  const monthStart = (year: number, month: number) => new Date(year, month, 1);
  const monthEnd = (year: number, month: number) =>
    new Date(year, month + 1, 0, 23, 59, 59, 999);

  switch (period) {
    case "last-month": {
      const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      return { start: monthStart(year, month), end: monthEnd(year, month) };
    }
    case "last-3-months":
      return {
        start: monthStart(now.getFullYear(), now.getMonth() - 2),
        end: monthEnd(now.getFullYear(), now.getMonth()),
      };
    case "last-12-months":
      return {
        start: monthStart(now.getFullYear(), now.getMonth() - 11),
        end: monthEnd(now.getFullYear(), now.getMonth()),
      };
    case "custom": {
      if (dateRange?.from) {
        const to = dateRange.to || dateRange.from;
        return {
          start: startOfLocalDay(dateRange.from),
          end: new Date(
            to.getFullYear(),
            to.getMonth(),
            to.getDate(),
            23,
            59,
            59,
            999
          ),
        };
      }
      return {
        start: monthStart(now.getFullYear(), now.getMonth()),
        end: monthEnd(now.getFullYear(), now.getMonth()),
      };
    }
    case "current-month":
    default:
      return {
        start: monthStart(now.getFullYear(), now.getMonth()),
        end: monthEnd(now.getFullYear(), now.getMonth()),
      };
  }
};

export const getPreviousPeriodBounds = (
  start: Date,
  end: Date
): { start: Date; end: Date } => {
  const startDay = startOfLocalDay(start);
  const endDay = startOfLocalDay(end);
  const durationDays = Math.max(
    1,
    Math.round((endDay.getTime() - startDay.getTime()) / 86_400_000) + 1
  );
  const prevEnd = new Date(startDay);
  prevEnd.setDate(prevEnd.getDate() - 1);
  prevEnd.setHours(23, 59, 59, 999);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (durationDays - 1));
  prevStart.setHours(0, 0, 0, 0);
  return { start: prevStart, end: prevEnd };
};

export const percentChange = (current: number, previous: number): number => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
};

// Filter transactions by time range
export const filterTransactionsByTimeRange = (
  transactions: Transaction[],
  timeRange: TimeRange,
  customStartDate?: Date,
  customEndDate?: Date
): Transaction[] => {
  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const now = new Date();
  now.setHours(23, 59, 59, 999); // End of today

  switch (timeRange) {
    case "today":
      const todayStart = getTodayStart();
      return sortedTransactions.filter(
        (t) => new Date(t.date) >= todayStart && new Date(t.date) <= now
      );

    case "yesterday":
      const yesterdayStart = getYesterdayStart();
      const yesterdayEnd = new Date(yesterdayStart);
      yesterdayEnd.setHours(23, 59, 59, 999);
      return sortedTransactions.filter(
        (t) =>
          new Date(t.date) >= yesterdayStart && new Date(t.date) <= yesterdayEnd
      );

    case "7days":
      const sevenDaysAgo = getDaysAgoStart(7);
      return sortedTransactions.filter(
        (t) => new Date(t.date) >= sevenDaysAgo && new Date(t.date) <= now
      );

    case "14days":
      const fourteenDaysAgo = getDaysAgoStart(14);
      return sortedTransactions.filter(
        (t) => new Date(t.date) >= fourteenDaysAgo && new Date(t.date) <= now
      );

    case "30days":
      const thirtyDaysAgo = getDaysAgoStart(30);
      return sortedTransactions.filter(
        (t) => new Date(t.date) >= thirtyDaysAgo && new Date(t.date) <= now
      );

    case "custom":
      if (!customStartDate || !customEndDate) {
        return sortedTransactions;
      }
      const startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
      return sortedTransactions.filter(
        (t) => new Date(t.date) >= startDate && new Date(t.date) <= endDate
      );

    default:
      return sortedTransactions;
  }
};

export const isIncome = (type: string) =>
  String(type).toLowerCase().trim() === "income";

export const isExpense = (type: string) =>
  String(type).toLowerCase().trim() === "expense";

export type TransactionListFilters = {
  type: "all" | "income" | "expense";
  category: string | null;
  dateRange: string | null;
  amount?: string | null;
};

export const applyTransactionListFilters = (
  transactions: Transaction[],
  filters: TransactionListFilters
): Transaction[] => {
  const now = new Date();
  let rangeStart: Date | null = null;
  let rangeEnd: Date | null = null;

  if (filters.dateRange) {
    switch (filters.dateRange) {
      case "today": {
        rangeStart = startOfLocalDay(now);
        rangeEnd = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        );
        break;
      }
      case "week": {
        rangeStart = startOfLocalDay(now);
        rangeStart.setDate(rangeStart.getDate() - 6);
        rangeEnd = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        );
        break;
      }
      case "month": {
        const bounds = getDashboardPeriodBounds("current-month");
        rangeStart = bounds.start;
        rangeEnd = bounds.end;
        break;
      }
      default:
        break;
    }
  }

  return transactions.filter((transaction) => {
    if (filters.type === "income" && !isIncome(transaction.type)) return false;
    if (filters.type === "expense" && !isExpense(transaction.type)) return false;

    if (
      filters.category &&
      String(transaction.category).trim() !== filters.category
    ) {
      return false;
    }

    if (
      rangeStart &&
      rangeEnd &&
      !isTransactionInRange(transaction.date, rangeStart, rangeEnd)
    ) {
      return false;
    }

    return true;
  });
};

// Calculate total income
export const calculateTotalIncome = (transactions: Transaction[]): number => {
  return transactions
    .filter((t) => isIncome(t.type))
    .reduce((sum, t) => sum + toAmount(t.amount), 0);
};

// Calculate total expenses
export const calculateTotalExpenses = (transactions: Transaction[]): number => {
  return transactions
    .filter((t) => isExpense(t.type))
    .reduce((sum, t) => sum + toAmount(t.amount), 0);
};

export const calculatePeriodFinancialData = (
  allTransactions: Transaction[],
  start: Date,
  end: Date
) => {
  const monthTransactions = allTransactions.filter((transaction) =>
    isTransactionInRange(transaction.date, start, end)
  );

  const monthlyIncome = calculateTotalIncome(monthTransactions);
  const monthlyExpenses = calculateTotalExpenses(monthTransactions);

  const now = new Date();
  const currentDateEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );
  const transactionsUpToCurrent = allTransactions.filter((transaction) => {
    const transactionDate = createLocalDate(transaction.date);
    return (
      !Number.isNaN(transactionDate.getTime()) &&
      transactionDate <= currentDateEnd
    );
  });
  const accumulatedBalance =
    calculateTotalIncome(transactionsUpToCurrent) -
    calculateTotalExpenses(transactionsUpToCurrent);

  return {
    monthlyIncome,
    monthlyExpenses,
    accumulatedBalance,
    monthTransactions,
  };
};

// NEW: Calculate month-specific financial data
export const calculateMonthlyFinancialData = (
  allTransactions: Transaction[],
  selectedMonth: Date
) => {
  const selectedMonthStart = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth(),
    1
  );
  const selectedMonthEnd = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  return calculatePeriodFinancialData(
    allTransactions,
    selectedMonthStart,
    selectedMonthEnd
  );
};

// NEW: Get transactions for specific month range
export const getTransactionsForMonth = (
  transactions: Transaction[],
  selectedMonth: Date
): Transaction[] => {
  const monthStart = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth(),
    1
  );
  const monthEnd = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() + 1,
    0,
    23,
    59,
    59
  );

  return transactions.filter((transaction) =>
    isTransactionInRange(transaction.date, monthStart, monthEnd)
  );
};

// NEW: Get goals for specific month
export const getGoalsForMonth = (goals: any[], selectedMonth: Date) => {
  return goals.filter((goal) => {
    if (!goal.targetDate) return true; // Goals without deadline are always active

    const goalDate = new Date(goal.targetDate);
    const selectedMonthStart = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth(),
      1
    );
    const selectedMonthEnd = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() + 1,
      0
    );

    // Goal is active if its target date is within or after the selected month
    return goalDate >= selectedMonthStart;
  });
};

// Format currency based on the selected currency type
export const formatCurrency = (amount: number, currency = "BRL"): string => {
  const currencyOptions: {
    [key: string]: { locale: string; currency: string };
  } = {
    USD: { locale: "pt-BR", currency: "USD" },
    BRL: { locale: "pt-BR", currency: "BRL" },
  };

  const options = currencyOptions[currency] || currencyOptions.BRL;

  return new Intl.NumberFormat(options.locale, {
    style: "currency",
    currency: options.currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

// Format date to readable string - fixed to pt-BR with timezone handling
export const formatDate = (dateString: string): string => {
  // Parse the date string manually to avoid timezone issues
  // If the string is in YYYY-MM-DD format, treat it as local date
  if (dateString.includes("-") && dateString.length === 10) {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // For other date formats, use the original logic
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Format time to readable string - fixed to pt-BR
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format date to YYYY-MM-DD (for input[type="date"]) with timezone handling
export const formatDateForInput = (dateString: string): string => {
  // Parse the date string manually to avoid timezone issues
  // If the string is in YYYY-MM-DD format, return as-is
  if (dateString.includes("-") && dateString.length === 10) {
    return dateString;
  }

  // For other date formats, convert properly
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Function to calculate category summaries
export const calculateCategorySummaries = (
  transactions: Transaction[],
  type: "income" | "expense"
) => {
  const filteredTransactions = transactions.filter((t) => t.type === type);
  const totalAmount = filteredTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );

  // Group by category
  const categories = filteredTransactions.reduce((acc, t) => {
    if (!acc[t.category]) {
      acc[t.category] = 0;
    }
    acc[t.category] += t.amount;
    return acc;
  }, {} as Record<string, number>);

  // Generate random colors for categories
  const colors = [
    "#4ECDC4",
    "#FF6B6B",
    "#2C6E7F",
    "#FBBF24",
    "#8B5CF6",
    "#EC4899",
    "#10B981",
    "#94A3B8",
    "#F43F5E",
    "#F59E0B",
  ];

  // Create summaries
  return Object.entries(categories).map(([category, amount], index) => ({
    category,
    amount,
    percentage: totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0,
    color: colors[index % colors.length],
  }));
};
