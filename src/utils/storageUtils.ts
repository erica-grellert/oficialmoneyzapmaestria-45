import { Transaction, Goal, User } from "@/types";

// Keys for localStorage
const STORAGE_KEYS = {
  TRANSACTIONS: "moneyzap_transactions",
  GOALS: "moneyzap_goals",

  USER: "moneyzap_user",
  PREFERENCES: "moneyzap_preferences",
  HIDE_VALUES: "moneyzap_hideValues",
};

// Transaction storage
export const getStoredTransactions = (): Transaction[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error retrieving transactions from localStorage:", error);
    return [];
  }
};

export const storeTransactions = (transactions: Transaction[]): void => {
  try {
    localStorage.setItem(
      STORAGE_KEYS.TRANSACTIONS,
      JSON.stringify(transactions)
    );
  } catch (error) {
    console.error("Error storing transactions in localStorage:", error);
  }
};

// Goals storage
export const getStoredGoals = (): Goal[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.GOALS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error retrieving goals from localStorage:", error);
    return [];
  }
};

export const storeGoals = (goals: Goal[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  } catch (error) {
    console.error("Error storing goals in localStorage:", error);
  }
};

// User storage
export const getStoredUser = (): User | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Error retrieving user from localStorage:", error);
    return null;
  }
};

export const storeUser = (user: User): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error("Error storing user in localStorage:", error);
  }
};

// Hide values preference
export const getHideValuesPreference = (): boolean => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.HIDE_VALUES);
    return stored ? JSON.parse(stored) : false;
  } catch (error) {
    console.error(
      "Error retrieving hide values preference from localStorage:",
      error
    );
    return false;
  }
};

export const storeHideValuesPreference = (hideValues: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.HIDE_VALUES, JSON.stringify(hideValues));
  } catch (error) {
    console.error(
      "Error storing hide values preference in localStorage:",
      error
    );
  }
};

// Clear all stored data (for logout)
export const clearAllStoredData = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error("Error clearing stored data from localStorage:", error);
  }
};
