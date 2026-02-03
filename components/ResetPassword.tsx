
import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface ResetPasswordProps {
  onComplete: () => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg("Passwords don't match");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.updateUser({ 
        password: password.trim() 
      });
      
      if (error) throw error;
      
      alert('Password updated successfully!');
      onComplete();
    } catch (error: any) {
      setErrorMsg(error.message || 'An error occurred while updating password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-br from-indigo-700 via-indigo-800 to-purple-900 text-white p-8 overflow-y-auto no-scrollbar">
      <div className="flex-1 flex flex-col justify-center items-center py-10">
        <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl border border-white/30 transform rotate-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        
        <h1 className="text-4xl font-black tracking-tight mb-2">New Password</h1>
        <p className="text-indigo-100/70 text-base mb-12 text-center max-w-xs">Secure your account with a fresh password</p>

        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
          {errorMsg && (
            <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-2xl text-sm text-red-100 text-center animate-in fade-in slide-in-from-top-2">
              {errorMsg}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-indigo-200 ml-4">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/10 border border-white/20 rounded-[1.5rem] px-6 py-5 text-lg focus:outline-none focus:ring-4 focus:ring-white/20 transition-all placeholder:text-white/30 shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-indigo-200 ml-4">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/10 border border-white/20 rounded-[1.5rem] px-6 py-5 text-lg focus:outline-none focus:ring-4 focus:ring-white/20 transition-all placeholder:text-white/30 shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-white text-indigo-900 font-black text-xl py-6 rounded-[1.5rem] shadow-2xl hover:bg-indigo-50 transition-all active:scale-95 flex items-center justify-center gap-3 mt-4 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-indigo-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              'Save & Continue'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
