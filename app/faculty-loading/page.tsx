'use client';

import React, { useState } from 'react';
import { useApp } from '../../lib/AppContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { computeFacultyLoading } from '../../lib/helpers';
import {
  FileSpreadsheet,
  Printer,
  Sliders,
  Bookmark,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  Search,
  BookOpen
} from 'lucide-react';

export default function FacultyLoadingSummaryPage() {
  const { teachers, sections, subjects, timeSlots, scheduleEntries, teacherLoads } = useApp();

  // Filters state
  const [schoolYear, setSchoolYear] = useState('2026-2027');
  const [semester, setSemester] = useState('1st Semester');
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamically compute summaries
  const loadingSummaries = computeFacultyLoading({
    teachers,
    sections,
    subjects,
    timeSlots,
    scheduleEntries,
  });

  const filteredSummaries = loadingSummaries.filter(summary =>
    summary.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    summary.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
    summary.ancillaryRole.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      <div id="faculty-loading-canvas" className="p-6 md:p-8 space-y-6 print:p-0">
        
        {/* Page Title & Print triggers */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2.5">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
              <span>Faculty Loading Summary</span>
            </h2>
            <p className="text-xs text-slate-505 mt-0.5 font-medium">Verify overall workloads, unique course preparations, and coordinator duties.</p>
          </div>
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Loading Summary</span>
          </button>
        </div>

        {/* Filter Toolbar Area */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="w-full md:max-w-xs relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search summaries by teacher, specialization..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">S.Y.</span>
              <input
                type="text"
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-230 rounded-md text-xs font-semibold w-28 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">Semester</span>
              <input
                type="text"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-230 rounded-md text-xs font-semibold w-36 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="text-right text-3xs text-slate-400 font-medium font-mono">
            * Color coding matches total weekly load constraints
          </div>
        </div>

        {/* PRINT HEAD FOR MEDIA PRINT */}
        <div className="hidden print:block text-center border-b pb-5 mb-6">
          <h1 className="text-xl font-bold tracking-tight uppercase">SILANGAN NATIONAL HIGH SCHOOL</h1>
          <p className="text-xs text-slate-500 font-mono">Senior High Department · Silangan Portal</p>
          <h2 className="text-base font-bold uppercase mt-3">FACULTY LOADING & ASSIGNMENTS SUMMARY</h2>
          <p className="text-2xs font-semibold text-slate-600 mt-0.5">School Year {schoolYear} · {semester}</p>
        </div>

        {/* Loading summaries table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs print:border-none print:shadow-none">
          <div className="overflow-x-auto">
            <table id="faculty-loading-table" className="min-w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-605 text-3xs sm:text-2xs uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-4 px-5">Teacher Name / Area</th>
                  <th className="py-4 px-4">Ancillary Coordinator Role</th>
                  <th className="py-4 px-4">Distinct Subjects Taught</th>
                  <th className="py-4 px-4">Sections Handled</th>
                  <th className="py-4 px-3 text-center">Preps</th>
                  <th className="py-4 px-3 text-center">Teach Hrs</th>
                  <th className="py-4 px-3 text-center">Anc Hrs</th>
                  <th className="py-4 px-5 text-center">Total Load</th>
                  <th className="py-4 px-4 text-center">Required vs Placed Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSummaries.map((summary, idx) => {
                  let rowColor = 'hover:bg-slate-50/50';
                  let badgeColor = 'bg-slate-100 text-slate-800 border-slate-200';
                  let barBg = 'bg-blue-500';

                  if (summary.loadStatus === 'overloaded') {
                    rowColor = 'bg-red-50/20 hover:bg-red-55/40 print:bg-transparent';
                    badgeColor = 'bg-red-100 text-red-805 border-red-200';
                    barBg = 'bg-red-500';
                  } else if (summary.loadStatus === 'warning') {
                    rowColor = 'bg-amber-50/20 hover:bg-amber-55/40 print:bg-transparent';
                    badgeColor = 'bg-amber-100 text-amber-805 border-amber-250';
                    barBg = 'bg-amber-500';
                  } else {
                    rowColor = 'bg-emerald-50/10 hover:bg-emerald-55/30 print:bg-transparent';
                    badgeColor = 'bg-emerald-100 text-emerald-805 border-emerald-200';
                    barBg = 'bg-emerald-500';
                  }

                  return (
                    <tr
                      key={summary.teacherId}
                      className={`${rowColor} transition-all duration-150 border-b border-slate-100`}
                    >
                      {/* Name / Specialty */}
                      <td className="py-4.5 px-5 font-bold text-slate-905 border-r border-slate-100 max-w-xs shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span>{summary.teacherName}</span>
                          {teacherLoads.filter(l => l.teacher_id === summary.teacherId).some(l => 
                            l.placement_status === 'out_of_sync' || l.placement_status === 'partially_placed'
                          ) && (
                            <span title="Has Out of Sync or Partially Placed loads">
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                            </span>
                          )}
                        </div>
                        <div className="text-3xs font-semibold text-slate-400 mt-0.5">{summary.specialization}</div>
                      </td>

                      {/* Ancillary Role */}
                      <td className="py-4.5 px-4 font-semibold text-xs text-slate-600">
                        {summary.ancillaryRole !== 'No Coordinator/Ancillary Role' ? (
                          <span className="text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded text-3xs font-bold leading-normal">
                            {summary.ancillaryRole}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-2xs">None</span>
                        )}
                      </td>

                      {/* Subjects list */}
                      <td className="py-4.5 px-4 text-xs text-slate-600 max-w-xs leading-loose pr-4">
                        {summary.subjectsTaught.length === 0 ? (
                          <span className="text-slate-400 italic text-2xs">None scheduled</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 font-medium">
                            {summary.subjectsTaught.map((sub, sIdx) => (
                              <span key={sIdx} className="bg-slate-100 px-1.5 py-0.5 rounded text-3xs border border-slate-200">
                                {sub}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Sections Handled */}
                      <td className="py-4.5 px-4 text-xs text-slate-600">
                        {summary.sectionsHandled.length === 0 ? (
                          <span className="text-slate-400 italic text-2xs">None handled</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 font-medium">
                            {summary.sectionsHandled.map((sec, sIdx) => (
                              <span key={sIdx} className="bg-blue-50 border border-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-3xs uppercase font-extrabold">
                                {sec}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Number of Preps count */}
                      <td className="py-4.5 px-3 text-center text-slate-800 font-semibold font-mono text-xs">
                        {summary.noOfPreps}
                      </td>

                      {/* Teaching hours per week */}
                      <td className="py-4.5 px-3 text-center text-slate-800 font-bold font-mono text-xs">
                        {summary.teachingHoursPerWeek.toFixed(1)}h
                      </td>

                      {/* Ancillary hours per week */}
                      <td className="py-4.5 px-3 text-center text-slate-500 font-medium font-mono text-xs">
                        {summary.ancillaryHoursPerWeek}h
                      </td>

                      {/* Total calculated weekly load hours with badges */}
                      <td className="py-4.5 px-5 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 border rounded-md text-xs font-extrabold font-mono print:font-bold ${badgeColor}`}>
                          {summary.totalHoursPerWeek.toFixed(1)} Hours
                        </span>
                      </td>

                      {/* Required vs Placed Hours progress */}
                      <td className="py-4.5 px-4 text-center border-l border-slate-100">
                        {(() => {
                          const tLoads = teacherLoads.filter(l => l.teacher_id === summary.teacherId);
                          const totalRequired = tLoads.reduce((sum, l) => sum + (l.required_hours_per_week || 0), 0);
                          const totalPlaced = tLoads.reduce((sum, l) => sum + (l.placed_hours || 0), 0);

                          return totalRequired > 0 ? (
                            <div className="space-y-1 inline-block text-left min-w-28 font-semibold">
                              <div className="flex justify-between items-center text-3xs text-slate-600 font-mono">
                                <span>{totalPlaced.toFixed(1)} / {totalRequired} hrs</span>
                                {totalPlaced < totalRequired && (
                                  <span className="text-amber-500 text-[10px] font-extrabold uppercase animate-pulse">Under</span>
                                )}
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${totalPlaced >= totalRequired ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                  style={{ width: `${Math.min((totalPlaced / totalRequired) * 100, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-2xs">No loads defined</span>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* PRINT FOOTER SIGNATURE BLOCKS FOR PRINT MEDIA */}
        <div className="hidden print:grid grid-cols-2 mt-16 pt-8 border-t border-dashed gap-12 font-sans">
          <div className="text-left space-y-9">
            <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500">Prepared and Audited By:</p>
            <div className="border-t border-slate-805 pt-2 max-w-xs">
              <p className="font-bold text-xs uppercase">{teachers[2]?.name || 'Sir Jester C. Cruz'}</p>
              <p className="text-3xs text-slate-502">School ICT Coordinator / Scheduler</p>
            </div>
          </div>
          <div className="text-right space-y-9 flex flex-col items-end">
            <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500 self-start">Approved and Confirmed By:</p>
            <div className="border-t border-slate-805 pt-2 max-w-xs w-full text-left">
              <p className="font-bold text-xs uppercase">Dr. Ronald M. Santos</p>
              <p className="text-3xs text-slate-502">Secondary School Principal II</p>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
