'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '../../lib/AppContext';
import {
  LayoutDashboard,
  Users,
  Grid,
  BookOpen,
  Calendar,
  AlertTriangle,
  FileSpreadsheet,
  FileCheck,
  LogOut,
  Menu,
  X,
  School,
  Clock,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { ToastList } from '../ui/ToastList';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout, conflicts, reseedDatabase, isLoading } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [time, setTime] = useState<string>('');

  // Protect client routes
  useEffect(() => {
    if (!isLoading && !user && pathname !== '/auth/login') {
      router.push('/auth/login');
    }
  }, [user, isLoading, pathname, router]);

  // Keep a digital clock of the local Philippine school timezone
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
          <School className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-600 tracking-wider">LOADING DEPED SCHEDULER...</p>
      </div>
    );
  }

  // If redirecting, show white screen
  if (!user && pathname !== '/auth/login') {
    return <div className="min-h-screen bg-white"></div>;
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Teachers', href: '/teachers', icon: Users },
    { name: 'Strands & Sections', href: '/strands', icon: Grid },
    { name: 'Subjects', href: '/subjects', icon: BookOpen },
    { name: 'Schedule Builder', href: '/schedule', icon: Calendar },
    {
      name: 'Conflict Checker',
      href: '/conflicts',
      icon: AlertTriangle,
      badge: conflicts.filter(c => c.severity === 'error').length || undefined,
      warningBadge: conflicts.filter(c => c.severity === 'warning').length || undefined,
    },
    { name: 'Faculty Loading', href: '/faculty-loading', icon: FileSpreadsheet },
    { name: 'Reports', href: '/reports', icon: FileCheck },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 text-slate-800 antialiased font-sans">
      {/* Toast Overlay */}
      <ToastList />

      {/* Primary Sidebar (Desktop) */}
      <aside className="hidden lg:flex flex-col w-72 bg-[#1E3A8A] border-r border-blue-900 shrink-0 text-white/90">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center font-bold text-[#1E3A8A] shrink-0 shadow-sm">
            <School className="w-5 h-5 text-[#1E3A8A]" />
          </div>
          <div>
            <h1 className="text-white font-bold leading-tight text-xs uppercase tracking-wider">
              SHS Schedule &<br/>Faculty Loading
            </h1>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all group ${
                  isActive
                    ? 'bg-white/10 text-white shadow-xs'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 shrink-0 transition-all ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`} />
                  <span>{item.name}</span>
                </div>
                
                {/* Visual badges for conflicts */}
                {(item.badge !== undefined || item.warningBadge !== undefined) && (
                  <div className="flex gap-1.5 shrink-0">
                    {item.badge !== undefined && (
                      <span className="flex h-5 items-center justify-center rounded-full bg-red-500 px-2 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                    {item.warningBadge !== undefined && (
                      <span className="flex h-5 items-center justify-center rounded-full bg-amber-500 px-2 text-[10px] font-bold text-slate-950">
                        {item.warningBadge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* System seed reset button */}
        <div className="px-4 py-3 border-t border-white/10 bg-white/2">
          <button
            type="button"
            onClick={() => {
              if (confirm('Re-seed database to pristine mock records? This overrides current changes.')) {
                reseedDatabase();
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-[10px] text-white/50 hover:text-white hover:bg-white/5 border border-white/10 transition-all font-mono uppercase tracking-wider font-bold"
            title="Restore original DepEd SHS placeholder datasets"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Seeds</span>
          </button>
        </div>

        {/* User Card & Logout button at bottom */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between gap-3 bg-white/5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-white text-[#1E3A8A] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {user?.name.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-white/60 truncate font-mono uppercase">Principal / Admin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            title="Logout and lock portal"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile drawer backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer (Left) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-72 bg-[#1E3A8A] border-r border-blue-900 text-white/90 transform transition-transform duration-300 lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center font-bold text-[#1E3A8A] shrink-0">
              <School className="w-5 h-5 text-[#1E3A8A]" />
            </div>
            <div>
              <h1 className="text-white font-bold leading-tight text-xs uppercase tracking-wider">
                SHS Schedule &<br/>Faculty Loading
              </h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(item.href);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center justify-between px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all group ${
                  isActive ? 'bg-white/10 text-white shadow-xs' : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-white/70'}`} />
                  <span>{item.name}</span>
                </div>
                
                {/* Badges */}
                {(item.badge !== undefined || item.warningBadge !== undefined) && (
                  <div className="flex gap-1.5 shrink-0">
                    {item.badge !== undefined && (
                      <span className="flex h-5 items-center justify-center rounded-full bg-red-500 px-2 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                    {item.warningBadge !== undefined && (
                      <span className="flex h-5 items-center justify-center rounded-full bg-amber-500 px-2 text-[10px] font-bold text-slate-950">
                        {item.warningBadge}
                      </span>
                    )}
                  </div>
                )}
              </a>
            );
          })}
        </nav>

        {/* Setup Reset */}
        <div className="px-4 py-3 border-t border-white/10 bg-white/2">
          <button
            type="button"
            onClick={() => {
              if (confirm('Re-seed database to pristine mock records?')) {
                reseedDatabase();
                setMobileMenuOpen(false);
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md text-[10px] text-white/50 hover:text-white hover:bg-white/5 border border-white/10 transition-all font-mono uppercase tracking-wider font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Seeds</span>
          </button>
        </div>

        {/* User Card at bottom */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between gap-3 bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white text-[#1E3A8A] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {user?.name.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div>
              <p className="text-xs font-semibold text-white">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-white/60 font-mono uppercase">Principal / Admin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Execution Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Header Block */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shrink-0 print:hidden shadow-xs">
          {/* Mobile hamburger icon toggle */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2.5">
              <span className="text-slate-400 font-medium text-sm hidden sm:inline">Republic of the Philippines</span>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <span className="text-[#1E3A8A] font-bold text-[10px] bg-blue-50 px-2.5 py-1 rounded-sm border border-blue-100 tracking-wider uppercase">
                DEPED DEPTH & LOAD MONITOR
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Live timezone clock */}
            <div className="hidden md:flex items-center gap-2 text-slate-500 text-xs font-mono bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg shadow-3xs">
              <Clock className="w-3.5 h-3.5 text-[#1E3A8A]" />
              <span>{time || '--:--:--'}</span>
              <span className="text-slate-400">PST (UTC+8)</span>
            </div>

            {/* School calendar reference */}
            <div className="text-right hidden sm:block">
              <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100 italic">
                S.Y. 2026-2027 (1st Sem)
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Content Container */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
