
export type Category = string;

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  description: string;
  date: string; // ISO string or YYYY-MM-DD
}

export interface Budget {
  category: Category;
  limit: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  metadata?: {
    addedExpense?: Expense;
    budgetLeft?: number;
  };
}

export interface AppState {
  expenses: Expense[];
  budgets: Budget[];
  chatHistory: ChatMessage[];
}
