
import { AppState, Expense, Budget, Category, ChatMessage } from '../types';
import { DEFAULT_BUDGETS } from '../constants';
import { supabase } from './supabase';

export const apiService = {
  /**
   * Fetches the entire application state from Supabase.
   * Loads records from the 'expenses' table using the specified schema.
   */
  async fetchState(): Promise<AppState> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const defaultState: AppState = {
      expenses: [],
      budgets: DEFAULT_BUDGETS,
      chatHistory: [{
        id: 'initial',
        role: 'assistant',
        text: "Hi! I'm SmartSpend. I'm ready to track your expenses. Just type or say something like 'Spent 500 on lunch'.",
        timestamp: new Date()
      }]
    };

    if (!user) return defaultState;

    try {
      // 1. Fetch expenses (matching the exact table structure provided)
      const { data: dbExpenses, error: expError } = await supabase
        .from('expenses')
        .select('id, amount, category, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (expError) throw expError;

      // 2. Fetch budgets
      const { data: dbBudgets } = await supabase
        .from('budgets')
        .select('category, limit')
        .eq('user_id', user.id);

      // 3. Fetch chat history
      const { data: chatHistory } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: true });

      // Merge budgets
      // We start with DEFAULT_BUDGETS but filter/update based on DB
      const budgets = [...DEFAULT_BUDGETS];
      
      if (dbBudgets && dbBudgets.length > 0) {
        // If user has custom budgets, we prioritize them
        // Actually, to support "remove category", we should use the DB list if it's been initialized
        // Let's assume if there are ANY budgets in DB, that's the source of truth for categories
        return {
          expenses: (dbExpenses || []).map(e => ({
            id: e.id.toString(),
            amount: parseFloat(e.amount),
            category: e.category as Category,
            description: e.description,
            date: e.created_at
          })),
          budgets: dbBudgets.map(b => ({ category: b.category, limit: b.limit })),
          chatHistory: chatHistory && chatHistory.length > 0 
            ? chatHistory.map(m => ({ ...m, timestamp: new Date(m.timestamp) }))
            : defaultState.chatHistory
        };
      }

      return {
        expenses: (dbExpenses || []).map(e => ({
          id: e.id.toString(),
          amount: parseFloat(e.amount),
          category: e.category as Category,
          description: e.description,
          date: e.created_at
        })),
        budgets,
        chatHistory: chatHistory && chatHistory.length > 0 
          ? chatHistory.map(m => ({ ...m, timestamp: new Date(m.timestamp) }))
          : defaultState.chatHistory
      };
    } catch (e) {
      console.error("Database fetch error", e);
      return defaultState;
    }
  },

  /**
   * Saves a new expense to the 'expenses' table matching the provided structure.
   */
  async saveExpense(expense: Omit<Expense, 'id' | 'date'>, specificDate?: string): Promise<Expense | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const insertData: any = {
      user_id: user.id,
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
    };

    if (specificDate) {
      insertData.created_at = new Date(specificDate).toISOString();
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert([insertData])
      .select('id, amount, category, description, created_at');

    if (error) return null;
    if (!data || data.length === 0) return null;

    const saved = data[0];
    return {
      id: saved.id.toString(),
      amount: parseFloat(saved.amount),
      category: saved.category as Category,
      description: saved.description,
      date: saved.created_at
    };
  },

  async saveBudgets(budgets: Budget[]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const budgetData = budgets.map(b => ({
      user_id: user.id,
      category: b.category,
      limit: b.limit
    }));

    await supabase
      .from('budgets')
      .upsert(budgetData, { onConflict: 'user_id,category' });
  },

  async deleteBudget(category: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('budgets')
      .delete()
      .eq('user_id', user.id)
      .eq('category', category);
  },

  async saveChatMessage(message: ChatMessage): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('chat_history')
      .insert([{
        user_id: user.id,
        role: message.role,
        text: message.text,
        timestamp: message.timestamp.toISOString(),
        metadata: message.metadata || null
      }]);
  },

  async clearUserData(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('expenses').delete().eq('user_id', user.id);
    await supabase.from('chat_history').delete().eq('user_id', user.id);
    await supabase.from('budgets').delete().eq('user_id', user.id);
  }
};
