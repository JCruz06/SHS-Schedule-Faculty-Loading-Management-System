'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../../lib/AppContext';
import { School, ShieldAlert, KeyRound, Mail, Sparkles, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPage() {
  const { login, user, isLoading } = useApp();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!email || !password) {
      setErrorMsg('Please enter a valid email and password.');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const res = await login(email, password);
      if (res.success) {
        router.push('/dashboard');
      } else {
        setErrorMsg(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      setErrorMsg('An error occurred during authentication.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="login-screen" className="min-h-screen flex items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(30,58,138,0.3),rgba(255,255,255,0))] font-sans relative overflow-hidden">
      
      {/* Decorative clean background mesh */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-600 to-sky-400"></div>

      <div className="w-full max-w-md p-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-slate-950/70 border border-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 overflow-hidden relative"
        >
          {/* Subtle glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-4 ring-4 ring-blue-500/10 hover:rotate-6 transition-all duration-300">
              <School className="w-7 h-7" />
            </div>
            
            <h2 className="text-xl font-bold text-white tracking-wider text-center">
              SHS SCHEDULE MANAGER
            </h2>
            <p className="text-slate-400 text-xs mt-1 text-center font-medium max-w-xs">
              Senior High School & Faculty Loading Portal
            </p>
            <div className="mt-2.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-3xs text-slate-500 font-mono tracking-wide">SILANGAN NATIONAL HIGH SCHOOL</p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs leading-relaxed flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-2xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                Principal / Administrator Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-900/40 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium"
                  placeholder="name@deped.gov.ph"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-2xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">
                Security Password Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-900/40 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all focus:ring-2 focus:ring-blue-500/20 shadow-md shadow-blue-500/10 active:scale-98 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Authenticating Admin...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4.5 h-4.5" />
                  <span>Access Administration System</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-900/60 flex flex-col items-center gap-2">
            <p className="text-3xs text-slate-500 uppercase tracking-wider font-semibold text-center">
              DEPARTMENT OF EDUCATION · PHILIPPINES
            </p>
            <p className="text-4xs text-slate-600 text-center uppercase tracking-wide leading-relaxed">
              THIS PORTAL HAS SECURITY AUDITING ACTIVATED · COMPLIANT WITH DEPED SCHOOL LOADING STANDARD GUIDELINE SERIES 2026.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
