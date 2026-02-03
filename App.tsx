
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, Expense, Category, Budget, ChatMessage } from './types';
import { DEFAULT_BUDGETS } from './constants';
import { Dashboard } from './components/Dashboard';
import { ChatInterface } from './components/ChatInterface';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { ResetPassword } from './components/ResetPassword';
import { apiService } from './services/apiService';
import { supabase } from './services/supabase';

enum ActiveTab {
  DASHBOARD = 'dashboard',
  CHAT = 'chat',
  SETTINGS = 'settings'
}

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);
  const [isRecovering, setIsRecovering] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [state, setState] = useState<AppState>({
    expenses: [],
    budgets: DEFAULT_BUDGETS,
    chatHistory: []
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.CHAT);

  const loadAppData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiService.fetchState();
      setState(data);
    } catch (error) {
      console.error("Failed to load app data", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          if (sessionError.message.toLowerCase().includes('refresh_token_not_found') || 
              sessionError.message.toLowerCase().includes('refresh token')) {
            console.warn("Invalid refresh token detected. Signing out for safety.");
            await supabase.auth.signOut();
            setIsLoading(false);
            return;
          }
          throw sessionError;
        }
        
        if (session) {
          setUser(session.user);
          await loadAppData();
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Initialization error", error);
        await supabase.auth.signOut().catch(() => {});
        setIsLoading(false);
      }
    };

    initializeApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
      }

      if (session) {
        setUser(session.user);
        if (!isRecovering) loadAppData();
      } else {
        setUser(null);
        setState({
          expenses: [],
          budgets: DEFAULT_BUDGETS,
          chatHistory: []
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [loadAppData, isRecovering]);

  const handleAddExpense = useCallback(async (expenseData: Omit<Expense, 'id' | 'date'>, specificDate?: string) => {
    setIsSyncing(true);
    
    try {
      const savedExpense = await apiService.saveExpense(expenseData, specificDate);
      
      if (!savedExpense) {
        setIsSyncing(false);
        return { error: "I couldn't save that expense. Please check your connection." };
      }

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      setState(prev => ({
        ...prev,
        expenses: [...prev.expenses, savedExpense]
      }));

      const spentBefore = state.expenses
        .filter(e => {
          const d = new Date(e.date);
          return e.category === expenseData.category && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum, e) => sum + e.amount, 0);
      
      const budgetLimit = state.budgets.find(b => b.category === expenseData.category)?.limit || 0;
      const budgetLeft = budgetLimit - (spentBefore + expenseData.amount);

      setIsSyncing(false);
      return { expense: savedExpense, budgetLeft };
    } catch (e) {
      console.error("Add expense error:", e);
      setIsSyncing(false);
      return { error: "Something went wrong while adding the expense." };
    }
  }, [state.expenses, state.budgets]);

  const handleAddChatMessage = useCallback(async (message: ChatMessage) => {
    setState(prev => ({
      ...prev,
      chatHistory: [...prev.chatHistory, message]
    }));
    try {
      await apiService.saveChatMessage(message);
    } catch (e) {
      console.warn("Failed to save message to server", e);
    }
  }, []);

  const handleUpdateBudget = async (category: string, limit: number) => {
    setIsSyncing(true);
    setState(prev => {
      let newBudgets;
      const existingIndex = prev.budgets.findIndex(b => b.category.toLowerCase() === category.toLowerCase());
      if (existingIndex > -1) {
        newBudgets = prev.budgets.map((b, i) => i === existingIndex ? { ...b, limit } : b);
      } else {
        newBudgets = [...prev.budgets, { category, limit }];
      }
      apiService.saveBudgets(newBudgets).catch(e => console.warn("Failed to update budgets on server", e));
      return { ...prev, budgets: newBudgets };
    });
    setIsSyncing(false);
  };

  const handleDeleteBudget = async (category: string) => {
    setIsSyncing(true);
    setState(prev => {
      const newBudgets = prev.budgets.filter(b => b.category !== category);
      apiService.deleteBudget(category).catch(e => console.warn("Failed to delete budget on server", e));
      return { ...prev, budgets: newBudgets };
    });
    setIsSyncing(false);
  };

  const handleClearData = async () => {
    if (window.confirm("Wipe all tracking history?")) {
      setIsSyncing(true);
      try {
        await apiService.clearUserData();
      } catch (e) {
        console.warn("Failed to clear server data", e);
      }
      setState({
        expenses: [],
        budgets: DEFAULT_BUDGETS,
        chatHistory: [{
          id: 'reset',
          role: 'assistant' as const,
          text: "All your data has been wiped. Let's start fresh.",
          timestamp: new Date()
        }]
      });
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (isLoading) {
    return (
      <div className="w-full h-[100dvh] bg-indigo-600 flex flex-col items-center justify-center text-white">
        <div className="w-24 h-24 bg-white/20 rounded-[2rem] flex items-center justify-center mb-6 animate-bounce shadow-2xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-2xl font-black tracking-tight">Loading SmartSpend...</h2>
        <p className="text-indigo-100 opacity-60 text-sm mt-2 font-bold uppercase tracking-widest">Checking your profile</p>
      </div>
    );
  }

  if (isRecovering) {
    return <ResetPassword onComplete={() => {
      setIsRecovering(false);
      loadAppData();
    }} />;
  }

  if (!user) {
    return <Login onLogin={() => {}} />;
  }

  const userName = user?.user_metadata?.full_name || user?.email || 'User';

  return (
    <div className="w-full h-[100dvh] bg-white flex flex-col relative overflow-hidden font-sans">
      <header className="px-6 pt-6 pb-4 flex justify-between items-center shrink-0 z-50 bg-white/80 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 ripple">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold text-gray-900 leading-none">SmartSpend</h1>
          </div>
        </div>
        {/* Logout button removed as requested */}
      </header>

      <main className="flex-1 overflow-hidden relative bg-gray-50/30">
        {activeTab === ActiveTab.DASHBOARD && (
          <Dashboard expenses={state.expenses} budgets={state.budgets} />
        )}
        {activeTab === ActiveTab.CHAT && (
          <ChatInterface 
            chatHistory={state.chatHistory} 
            addExpense={handleAddExpense} 
            onAddChatMessage={handleAddChatMessage}
          />
        )}
        {activeTab === ActiveTab.SETTINGS && (
          <Settings 
            budgets={state.budgets} 
            expenses={state.expenses}
            userName={userName}
            onUpdateBudget={handleUpdateBudget} 
            onDeleteBudget={handleDeleteBudget}
            onLogout={handleLogout} 
            onClearData={handleClearData}
          />
        )}
      </main>

      <nav className="h-24 bg-white/90 backdrop-blur-xl border-t border-gray-100 flex items-center justify-around px-4 pb-2 shrink-0 z-50">
        {[
          { tab: ActiveTab.DASHBOARD, label: 'Stats', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
          { tab: ActiveTab.CHAT, label: 'Assistant', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /> },
          { tab: ActiveTab.SETTINGS, label: 'Account', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /> },
        ].map(({ tab, label, icon }) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex flex-col items-center gap-1 w-20 py-2 rounded-3xl transition-all duration-300 active:scale-90 ${activeTab === tab ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-400'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {icon}
            </svg>
            <span className={`text-[10px] font-extrabold uppercase tracking-tighter transition-all ${activeTab === tab ? 'opacity-100' : 'opacity-60'}`}>
              {label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
