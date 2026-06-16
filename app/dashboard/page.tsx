'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../lib/AppContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import {
  Users,
  Grid,
  BookOpen,
  AlertOctagon,
  Calendar,
  Layers,
  FileText,
  BadgeAlert,
  ArrowRight,
  School,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

export default function DashboardPage() {
  const { teachers, strands, sections, subjects, scheduleEntries, conflicts, user } = useApp();
  const router = useRouter();

  // Philippine format date
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate stats
  const totalTeachers = teachers.length;
  const totalSectionsG11 = sections.filter(s => s.grade_level === 11).length;
  const totalSectionsG12 = sections.filter(s => s.grade_level === 12).length;
  const totalSubjects = subjects.length;
  const totalConflicts = conflicts.filter(c => c.severity === 'error').length;
  const totalWarnings = conflicts.filter(c => c.severity === 'warning').length;

  const quickActions = [
    { title: 'Build Schedule', desc: 'Manage time slot assignments & sections', icon: Calendar, href: '/schedule', color: 'bg-[#1E3A8A] text-white shadow-xs hover:bg-blue-900 transition-colors border border-transparent' },
    { title: 'View Faculty Loading', desc: 'Examine weekly loads and ancillaries', icon: Layers, href: '/faculty-loading', color: 'bg-white text-slate-700 border-2 border-slate-100 hover:bg-slate-50 transition-colors shadow-none hover:border-slate-200' },
    { title: 'Generate Reports', desc: 'Individual Teacher & Section schedules', icon: FileText, href: '/reports', color: 'bg-white text-slate-700 border-2 border-slate-100 hover:bg-slate-50 transition-colors shadow-none hover:border-slate-200' },
  ];

  return (
    <DashboardLayout>
      <div id="dashboard-canvas" className="p-6 md:p-8 space-y-6">
        
        {/* Welcome Header bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-150 shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-[#1E3A8A] uppercase tracking-wider bg-blue-50/50 px-2.5 py-1 rounded-sm border border-blue-105 font-mono">
              Welcome back, Administrator
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              Mabuhay, {user?.name || 'Administrator'}!
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Silangan National High School Portal · Senior High School Scheduler
            </p>
          </div>
          <div className="text-left md:text-right shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
            <p className="text-sm font-bold text-slate-800">{currentDate}</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 tracking-wider font-mono">Philippine Standard Time</p>
          </div>
        </div>

        {/* Dynamic Highlights Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Teachers */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex items-center gap-4 hover:border-slate-200 transition-all">
            <div className="w-11 h-11 bg-blue-50 text-[#1E3A8A] rounded-xl flex items-center justify-center shrink-0">
              <Users className="w-5.5 h-5.5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Teachers</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalTeachers}</h3>
              <p className="text-[10px] text-slate-550 font-medium truncate">active profiles</p>
            </div>
          </div>

          {/* Card 2: Sections */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex items-center gap-4 hover:border-slate-200 transition-all">
            <div className="w-11 h-11 bg-blue-50 text-[#1E3A8A] rounded-xl flex items-center justify-center shrink-0">
              <Grid className="w-5.5 h-5.5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Sections</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">
                {totalSectionsG11 + totalSectionsG12} <span className="text-xs font-semibold text-slate-400">({totalSectionsG11}AM / {totalSectionsG12}PM)</span>
              </h3>
              <p className="text-[10px] text-slate-550 font-medium truncate">registered sections</p>
            </div>
          </div>

          {/* Card 3: Subjects */}
          <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm flex items-center gap-4 hover:border-slate-200 transition-all">
            <div className="w-11 h-11 bg-blue-50 text-[#1E3A8A] rounded-xl flex items-center justify-center shrink-0">
              <BookOpen className="w-5.5 h-5.5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Subjects</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalSubjects}</h3>
              <p className="text-[10px] text-slate-550 font-medium truncate font-mono">Core, Spec & Applied</p>
            </div>
          </div>

          {/* Card 4: Conflicts Badge */}
          <div
            onClick={() => router.push('/conflicts')}
            className={`cursor-pointer p-5 rounded-2xl border transition-all flex items-center gap-4 hover:shadow-xs ${
              totalConflicts > 0
                ? 'bg-red-50/50 border-red-200 text-red-900 shadow-3xs'
                : totalWarnings > 0
                ? 'bg-amber-50/55 border-amber-200 text-amber-900 shadow-3xs'
                : 'bg-emerald-50/30 border-emerald-250 text-emerald-900 shadow-3xs'
            }`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              totalConflicts > 0
                ? 'bg-red-650 text-white shadow-xs bg-red-600'
                : totalWarnings > 0
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-emerald-600 text-white shadow-xs'
            }`}>
              {totalConflicts > 0 || totalWarnings > 0 ? (
                <AlertOctagon className="w-5.5 h-5.5" />
              ) : (
                <CheckCircle className="w-5.5 h-5.5" />
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-85">Conflicts Detector</p>
              <h3 className="text-2xl font-black mt-0.5">
                {totalConflicts > 0 ? (
                  <span>{String(totalConflicts).padStart(2, '0')}</span>
                ) : totalWarnings > 0 ? (
                  <span>{String(totalWarnings).padStart(2, '0')}</span>
                ) : (
                  <span>00</span>
                )}
              </h3>
              <p className="text-[10px] font-bold uppercase shrink-0">
                {totalConflicts > 0 ? (
                  <span className="text-red-600">ACTION REQ.</span>
                ) : totalWarnings > 0 ? (
                  <span className="text-amber-600">WARNINGS ACTIVE</span>
                ) : (
                  <span className="text-emerald-700">SYSTEM HEALTHY</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Quick actions panel */}
        <div className="bg-white rounded-2xl border border-slate-150 p-6 md:p-8 shadow-xs">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.title}
                  onClick={() => router.push(action.href)}
                  className={`text-left p-6 rounded-xl ${action.color} transition-all hover:scale-[1.005] flex justify-between items-start cursor-pointer group`}
                >
                  <div className="space-y-4">
                    <div className={`p-2.5 rounded-lg w-fit ${action.color.includes('bg-[#1E3A8A]') ? 'bg-white/10 text-white' : 'bg-[#1E3A8A]/5 text-[#1E3A8A]'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm tracking-wide">{action.title}</h4>
                      <p className={`text-[11px] mt-1 leading-normal ${action.color.includes('bg-white') ? 'text-slate-500' : 'text-white/80'}`}>{action.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className={`w-4.5 h-4.5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${action.color.includes('bg-[#1E3A8A]') ? 'text-white/50' : 'text-slate-400'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Timetable Snapshot or Last Edited */}
        <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-xs">
          <div className="p-6 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50/60 font-sans">
            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Schedule Timetable Preview</h4>
              <p className="text-xs text-slate-500 mt-0.5">Live view of current core schedule entries</p>
            </div>
            <button
              onClick={() => router.push('/schedule')}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 bg-white rounded-lg text-xs font-semibold shadow-3xs flex items-center gap-1.5 self-start sm:self-center transition-all"
            >
              <span>Build Timetables &rarr;</span>
            </button>
          </div>

          <div className="p-6">
            {scheduleEntries.length === 0 ? (
              <div className="py-12 border-2 border-dashed border-slate-250 rounded-xl flex flex-col items-center justify-center text-center">
                <Calendar className="w-10 h-10 text-slate-300" />
                <h5 className="font-bold text-slate-800 text-sm mt-3">No schedule entries made yet</h5>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed mt-1">Start allocating teacher and section schedules using the real-time Schedule Builder.</p>
                <button
                  type="button"
                  onClick={() => router.push('/schedule')}
                  className="mt-4 px-4 py-2.5 bg-[#1E3A8A] text-white hover:bg-blue-900 rounded-lg text-xs font-semibold shadow-xs"
                >
                  Create Initial Entry
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl font-sans">
                <table id="recent-snapshot-table" className="min-w-full text-sm text-left">
                  <thead className="bg-[#1E3A8A]/5 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4 font-mono">Day</th>
                      <th className="py-3.5 px-4">Section / Period</th>
                      <th className="py-3.5 px-4">Subject Course Name</th>
                      <th className="py-3.5 px-4">Assigned Teacher</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {scheduleEntries.slice(0, 5).map((entry, index) => {
                      const teacher = teachers.find(t => t.id === entry.teacher_id);
                      const section = sections.find(s => s.id === entry.section_id);
                      const subject = subjects.find(s => s.id === entry.subject_id);
                      
                      // Check if this specific entry has any associated error conflict
                      const hasConflict = conflicts.some(c => c.scheduleEntryId === entry.id);

                      return (
                        <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-4 font-semibold text-slate-900 border-r border-slate-150 font-mono text-xs">{entry.day}</td>
                          <td className="py-4 px-4">
                            <span className="font-semibold text-slate-800">{section?.name || 'Unknown Section'}</span>
                            <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-0.5">{section?.shift} Shift</div>
                          </td>
                          <td className="py-4 px-4 font-medium text-slate-600">{subject?.name || 'Unknown'}</td>
                          <td className="py-4 px-4 font-semibold text-slate-800">{teacher?.name || 'Unassigned'}</td>
                          <td className="py-4 px-4 text-center">
                            {hasConflict ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100/50 text-red-700 border border-red-200 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                Conflict
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100/50 text-emerald-700 border border-emerald-200 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Live / OK
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
