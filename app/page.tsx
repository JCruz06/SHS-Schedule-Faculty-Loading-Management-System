'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../lib/AppContext';

export default function HomeRedirect() {
  const { user, isLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/auth/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500/10 border-t-blue-500 animate-spin"></div>
        <p className="mt-4 text-xs font-mono text-slate-500 tracking-widest uppercase">Directing Session...</p>
      </div>
    </div>
  );
}
