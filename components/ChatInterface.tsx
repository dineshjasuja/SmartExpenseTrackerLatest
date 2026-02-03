
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Expense, Category } from '../types';
import { parseExpenseMessage } from '../services/geminiService';
import { CATEGORY_COLORS } from '../constants';

interface ChatInterfaceProps {
  chatHistory: ChatMessage[];
  addExpense: (expense: Omit<Expense, 'id' | 'date'>, specificDate?: string) => Promise<{ expense?: Expense; budgetLeft?: number; error?: string }>;
  onAddChatMessage: (message: ChatMessage) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  chatHistory, 
  addExpense, 
  onAddChatMessage 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory, isTyping]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
        setTimeout(() => handleSend(transcript), 600);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || inputValue;
    if (!textToSend.trim()) return;

    onAddChatMessage({
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date(),
    });
    
    setInputValue('');
    setIsTyping(true);

    try {
      const parsed = await parseExpenseMessage(textToSend);

      if (parsed && typeof parsed.amount === 'number') {
        const result = await addExpense({
          amount: parsed.amount,
          category: parsed.category as Category,
          description: parsed.description,
        }, parsed.date);

        if (result.error) {
          onAddChatMessage({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            text: result.error,
            timestamp: new Date(),
          });
        } else if (result.expense && result.budgetLeft !== undefined) {
          onAddChatMessage({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            text: `Got it! ₹${result.expense.amount.toLocaleString('en-IN')} for "${result.expense.description}" added to ${result.expense.category}. You have ₹${result.budgetLeft.toLocaleString('en-IN')} left there.`,
            timestamp: new Date(),
            metadata: { addedExpense: result.expense, budgetLeft: result.budgetLeft }
          });
        }
      } else {
        onAddChatMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: "I couldn't catch that amount. Try saying 'Spent ₹500 on lunch'.",
          timestamp: new Date(),
        });
      }
    } catch (err) {
      console.error("Chat process error:", err);
      onAddChatMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: "I ran into a technical issue processing your request. Please try again later.",
        timestamp: new Date(),
      });
    }
    setIsTyping(false);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        setIsListening(true);
        recognitionRef.current.start();
      } else {
        alert("Microphone access not supported.");
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {isListening && (
        <div className="absolute inset-0 z-50 bg-indigo-600/95 backdrop-blur-2xl flex flex-col items-center justify-center text-white animate-in fade-in duration-300 px-10 text-center">
          <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mb-8 relative">
            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black mb-2">Listening...</h2>
          <p className="text-indigo-100 font-bold opacity-70">Tell me what you spent your money on.</p>
          <button 
            onClick={toggleListening}
            className="mt-16 bg-white/10 border border-white/20 px-8 py-4 rounded-3xl font-black text-sm uppercase tracking-widest active:scale-95"
          >
            Cancel
          </button>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-40">
        {chatHistory.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-400`}>
            <div className={`max-w-[85%] p-5 rounded-[2.2rem] shadow-xl shadow-gray-200/50 ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-900 border border-gray-100 rounded-tl-none'}`}>
              <p className="text-base font-bold leading-relaxed">{msg.text}</p>
              {msg.metadata?.addedExpense && (
                <div className="mt-4 pt-4 border-t border-black/5 flex items-center gap-3">
                   <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: CATEGORY_COLORS[msg.metadata.addedExpense.category] }} />
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{msg.metadata.addedExpense.category}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-5 rounded-full px-8 animate-pulse text-gray-400 font-black text-xs uppercase tracking-widest">
              SmartSpend is thinking...
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-[96px] left-0 right-0 p-6 bg-transparent pointer-events-none z-40">
        <div className="max-w-md mx-auto pointer-events-auto flex items-center gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Talk or type an expense..."
              className="w-full bg-white/90 backdrop-blur-xl border border-gray-200 rounded-[2.2rem] pl-8 pr-16 py-6 shadow-2xl shadow-indigo-900/10 focus:outline-none focus:ring-4 focus:ring-indigo-100 text-gray-900 text-base font-bold transition-all"
            />
            <button
              onClick={toggleListening}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center text-indigo-600 bg-indigo-50 active:scale-90 transition-all ripple"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isTyping}
            className="w-16 h-16 bg-indigo-600 text-white rounded-[1.8rem] flex items-center justify-center shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 disabled:opacity-20 transition-all active:scale-90 shrink-0 ripple"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
