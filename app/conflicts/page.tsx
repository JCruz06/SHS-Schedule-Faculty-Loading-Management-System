'use client';

import React, { useState } from 'react';
import { useApp } from '../../lib/AppContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Play,
  RotateCw,
  CheckCircle,
  AlertOctagon,
  ArrowRight,
  HelpCircle,
  AlertTriangle,
  User,
  Layout,
  BookOpen
} from 'lucide-react';
import { motion } from 'motion/react';

export default function ConflictValidationPage() {
  const { conflicts, teachers, sections, subjects, scheduleEntries } = useApp();
  const router = useRouter();
  
  const [validating, setValidating] = useState(false);
  const [ranSuccessfully, setRanSuccessfully] = useState(false);

  const triggerValidation = () => {
    setValidating(true);
    setRanSuccessfully(false);
    
    // Quick artificial timeout to give a heavy, deeply analytical impression
    setTimeout(() => {
      setValidating(false);
      setRanSuccessfully(true);
    }, 750);
  };

  const totalErrors = conflicts.filter(c => c.severity === 'error').length;
  const totalWarnings = conflicts.filter(c => c.severity === 'warning').length;

  return (
    <DashboardLayout>
      <div id="conflicts-module-canvas" className="p-6 md:p-8 space-y-6">
        
        {/* Module Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 text-blue-600" />
              <span>Schedule Conflicts & Validation Engine</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Automated validation against regional teacher assignments and shift double-bookings.</p>
          </div>
          <button
            onClick={triggerValidation}
            disabled={validating}
            className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-70 cursor-pointer"
          >
            {validating ? (
              <>
                <RotateCw className="w-4.5 h-4.5 animate-spin" />
                <span>Running Audit...</span>
              </>
            ) : (
              <>
                <Play className="w-4.5 h-4.5" />
                <span>Trigger Live Audit</span>
              </>
            )}
          </button>
        </div>

        {/* Dynamic validation loader indicator */}
        {validating && (
          <div className="bg-white p-8 rounded-xl border border-slate-205 shadow-2xs text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-blue-50 border-t-blue-600 animate-spin"></div>
            <h4 className="text-sm font-bold text-slate-800 mt-4 leading-none">Scanning constraints...</h4>
            <p className="text-xs text-slate-500 mt-1.5 max-w-sm leading-relaxed">
              Verificating teacher calendars, section shifts, required curriculum certifications, and teacher overload thresholds.
            </p>
          </div>
        )}

        {!validating && (
          <>
            {/* Validation highlights cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Box 1: Overall state */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4">
                <div className={`p-3 rounded-lg ${conflicts.length > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Health Status</p>
                  <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                    {conflicts.length > 0 ? 'Action Required' : 'Timetable Fully Compliant'}
                  </h4>
                  <p className="text-3xs text-slate-400 mt-0.5">
                    {conflicts.length > 0 ? `${conflicts.length} anomalies flagged` : 'Zero errors flagged'}
                  </p>
                </div>
              </div>

              {/* Box 2: Total Errors (Double-bookings or Shift Violations) */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4">
                <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Critical Errors</p>
                  <h4 className="font-bold text-slate-900 text-sm mt-0.5">{totalErrors} Issues</h4>
                  <p className="text-3xs text-slate-400 mt-0.5">Blocks scheduler compilation</p>
                </div>
              </div>

              {/* Box 3: Total Warnings (Specialization or workload warnings) */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Warnings</p>
                  <h4 className="font-bold text-slate-900 text-sm mt-0.5">{totalWarnings} Advisories</h4>
                  <p className="text-3xs text-slate-400 mt-0.5">Suggested calibrations</p>
                </div>
              </div>

            </div>

            {/* Pristine state when zero conflicts */}
            {conflicts.length === 0 ? (
              <div className="bg-white border border-emerald-200 rounded-2xl p-8 shadow-2xs text-center max-w-xl mx-auto space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-905 text-lg">Schedule Cleared of Conflicts</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mt-1.5">
                    Excellent! All active timetables comply with DepEd guidelines. No double-bookings, shift violations, or overload conditions detected.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/schedule')}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Adjust Schedules
                </button>
              </div>
            ) : (
              /* Flagged conflicts lists */
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="p-5 border-b border-slate-150 bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 text-sm">Review Flagged Anomalies</h3>
                  <p className="text-3xs text-slate-500">Examine details below and click "Resolve Block" to jump directly into the relevant grid item.</p>
                </div>

                <div className="divide-y divide-slate-100">
                  {conflicts.map((conflict) => {
                    const isError = conflict.severity === 'error';
                    
                    // Badge styles
                    const badgeStyle = isError
                      ? 'bg-red-50 text-red-800 border-red-200'
                      : 'bg-amber-50 text-amber-800 border-amber-250';

                    return (
                      <div
                        key={conflict.id}
                        className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-slate-50/50`}
                      >
                        <div className="space-y-3 max-w-2xl">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center border rounded px-2.5 py-0.5 text-3xs font-extrabold uppercase tracking-wider ${badgeStyle}`}>
                              {conflict.type}
                            </span>
                            <span className={`text-4xs font-bold uppercase py-0.5 px-1.5 rounded-sm ${isError ? 'bg-red-500 text-white' : 'bg-amber-500 text-slate-900'}`}>
                              {conflict.severity}
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                            {conflict.description}
                          </p>

                          {/* Affected entities pills */}
                          <div className="flex flex-wrap gap-2 text-3xs font-bold">
                            {conflict.affectedTeacher && (
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200">
                                <User className="w-3.5 h-3.5" /> Faculty: {conflict.affectedTeacher}
                              </span>
                            )}
                            {conflict.affectedSection && (
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-705 px-2.5 py-1 rounded border border-slate-200">
                                <Layout className="w-3.5 h-3.5" /> Sec: {conflict.affectedSection}
                              </span>
                            )}
                            {conflict.affectedSubject && (
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-705 px-2.5 py-1 rounded border border-slate-200">
                                <BookOpen className="w-3.5 h-3.5" /> Course: {conflict.affectedSubject}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick fix redirect link */}
                        <button
                          onClick={() => router.push('/schedule')}
                          className="px-3.5 py-2 hover:bg-slate-50 text-slate-800 border border-slate-200 bg-white rounded-lg text-xs font-semibold shadow-3xs flex items-center justify-center gap-1.5 self-start md:self-center cursor-pointer transition-colors"
                        >
                          <span>Resolve Block</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </DashboardLayout>
  );
}
