'use client';

import React, { useState } from 'react';
import { useApp } from '../../lib/AppContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { formatTime24To12, computeFacultyLoading } from '../../lib/helpers';
import {
  FileText,
  User,
  Layout,
  Layers,
  Printer,
  ChevronRight,
  Sparkles,
  X,
  Clock,
  School,
  FileCheck
} from 'lucide-react';

export default function ReportsPage() {
  const { teachers, strands, sections, subjects, timeSlots, scheduleEntries } = useApp();

  // Active Report Preview states
  const [activeReport, setActiveReport] = useState<'teacher' | 'section' | 'loading' | 'summary' | null>(null);
  
  // Selectors for specific reports
  const [selectedTeacherId, setSelectedTeacherId] = useState(teachers.length > 0 ? teachers[0].id : '');
  const [selectedSectionId, setSelectedSectionId] = useState(sections.length > 0 ? sections[0].id : '');

  const handlePrint = () => {
    window.print();
  };

  const selectedTeacherObj = teachers.find(t => t.id === selectedTeacherId);
  const selectedSectionObj = sections.find(s => s.id === selectedSectionId);

  // Filter schedules matching criteria
  const teacherSchedules = scheduleEntries.filter(e => e.teacher_id === selectedTeacherId);
  const sectionSchedules = scheduleEntries.filter(e => e.section_id === selectedSectionId);

  const days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];

  // Faculty summary
  const loadingSummaries = computeFacultyLoading({
    teachers,
    sections,
    subjects,
    timeSlots,
    scheduleEntries,
  });

  return (
    <DashboardLayout>
      <div id="reports-canvas" className="p-6 md:p-8 space-y-8 print:p-0">
        
        {/* Reports Header (Hidden on print) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2.5">
              <FileCheck className="w-6 h-6 text-blue-600" />
              <span>Timetable & Loading Reports Portal</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Generate compliant documents for administrative archives, faculty reference, and student postings.</p>
          </div>
        </div>

        {/* Report choices grid (Hidden on print) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
          
          {/* Card 1: Individual Teacher Calendar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-xs transition-all space-y-4">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <User className="w-6 h-6" />
              </div>
              <span className="text-4xs font-mono font-bold tracking-widest bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full uppercase">
                Individual
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Individual Teacher Schedule</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">Pristine calendar schedule for a single selected instructor covering all assigned classes and shifts.</p>
            </div>
            <div className="space-y-3 pt-2">
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-55 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.specialization})</option>
                ))}
              </select>
              <button
                onClick={() => setActiveReport('teacher')}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-3xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <span>Preview Document</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2: Section Schedule timetable */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-xs transition-all space-y-4">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Layout className="w-6 h-6" />
              </div>
              <span className="text-4xs font-mono font-bold tracking-widest bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full uppercase">
                Sectional
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Section Schedule Timetable</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">Full weekly timetable mapping lessons for a selected student section. Handy for classroom posters.</p>
            </div>
            <div className="space-y-3 pt-2">
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-55 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
              >
                {sections.map(sec => (
                  <option key={sec.id} value={sec.id}>{sec.name}</option>
                ))}
              </select>
              <button
                onClick={() => setActiveReport('section')}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-3xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <span>Preview Document</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 3: Faculty Loading Report */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-xs transition-all space-y-4">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-4xs font-mono font-bold tracking-widest bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full uppercase">
                Summary
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Full Faculty Loading Summary</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">Comprehensive breakdown of all rostered teacher totals, ancillaries, preparations counts, and overload statuses.</p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setActiveReport('loading')}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-3xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <span>Open Preview Document</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 4: Brief Teaching Load Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-xs transition-all space-y-4">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Layers className="w-6 h-6" />
              </div>
              <span className="text-4xs font-mono font-bold tracking-widest bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full uppercase">
                Consolidated
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Teaching Load Brief</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">A clean, compressed list sheet of teaching-specific hours and preparations for reference in budget planning audits.</p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setActiveReport('summary')}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-3xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <span>Open Preview Document</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* PRINTABLE PREVIEW MODAL LIGHTBOX OVERLAY */}
        {activeReport && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 overflow-y-auto flex items-start justify-center p-4 md:p-8 backdrop-blur-3xs pt-12 print:static print:bg-white print:p-0">
            <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 overflow-hidden shadow-2xl flex flex-col min-h-[500px] animate-in fade-in zoom-in-95 duration-200 print:border-none print:shadow-none print:rounded-none">
              
              {/* Modal controls (Hidden on print) */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
                <span className="text-2xs font-extrabold text-blue-700 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded">
                  Official Report Previewer
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print (CTRL+P)</span>
                  </button>
                  <button
                    onClick={() => setActiveReport(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* REPORT DOCUMENT CANVAS (THE PRINT-SHEET CONTAINER) */}
              <div id="school-report-sheet" className="p-12 md:p-16 text-slate-900 space-y-8 font-serif leading-relaxed text-sm bg-white print:p-0">
                
                {/* Official standard DepEd Letterhead */}
                <div className="text-center flex flex-col items-center border-b-2 border-double border-slate-800 pb-5">
                  <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-lg mb-2">
                    <School className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-3xs uppercase tracking-widest font-semibold text-slate-550 leading-none">Republic of the Philippines</p>
                  <h1 className="text-xs uppercase font-extrabold tracking-wider leading-none mt-1 text-slate-800">Department of Education</h1>
                  <p className="text-11px font-medium italic text-slate-600">Region IV-A (CALABARZON) · Division of Laguna</p>
                  <p className="text-xs uppercase font-extrabold tracking-wide mt-2 text-blue-900 font-sans">SILANGAN NATIONAL HIGH SCHOOL</p>
                  <p className="text-4xs font-mono text-slate-400 mt-0.5">School ID: 301380 · Brgy. San Antonio, San Pedro City</p>
                </div>

                {/* Report Specific Details */}
                {activeReport === 'teacher' && selectedTeacherObj && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-base font-bold uppercase underline font-sans text-slate-800 tracking-wide">
                        FACULTY WEEKLY INSTRUCTIONAL SCHEDULE
                      </h2>
                      <p className="text-3xs ext-slate-500 uppercase tracking-widest mt-1 font-sans font-medium">Academic Year 2026-2027 · First Semester</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-sans pb-4 border-b border-slate-200">
                      <div>
                        <p className="text-slate-400 font-semibold uppercase tracking-wide text-2xs">FACULTY INSTRUCTOR:</p>
                        <p className="font-extrabold text-sm text-slate-900 mt-0.5">{selectedTeacherObj.name}</p>
                        <p className="text-3xs text-slate-500 font-medium">Specialization: {selectedTeacherObj.specialization}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 font-semibold uppercase tracking-wide text-2xs">CONSOLIDATED WEEKLY HOURS:</p>
                        <p className="font-extrabold text-sm text-slate-900 mt-0.5">
                          {(scheduleEntries.filter(e => e.teacher_id === selectedTeacherId).length * 1).toFixed(1)} Hours Scheduled
                        </p>
                        <p className="text-3xs text-slate-500 font-medium">Ancillary Load: {selectedTeacherObj.ancillary_role || 'No Ancillary Duty'}</p>
                      </div>
                    </div>

                    {/* Detailed schedules timeline list */}
                    <div className="space-y-4">
                      <h3 className="font-sans font-bold text-xs text-slate-800 uppercase tracking-wider">CLASSES HANDLED WEEKLY:</h3>
                      <table className="w-full text-xs text-left border border-slate-350 font-sans">
                        <thead className="bg-slate-50 uppercase font-bold text-2xs tracking-tight border-b border-slate-300">
                          <tr>
                            <th className="py-2.5 px-4">Day</th>
                            <th className="py-2.5 px-4 col-span-2">Time Period</th>
                            <th className="py-2.5 px-4 font-semibold">Subject / Course Name</th>
                            <th className="py-2.5 px-4">Section / Room</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {teacherSchedules.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-slate-400 italic">No schedules allocated yet for this faculty member on the active grid.</td>
                            </tr>
                          ) : (
                            teacherSchedules.map((entry) => {
                              const slot = timeSlots.find(s => s.id === entry.time_slot_id);
                              const sub = subjects.find(s => s.id === entry.subject_id);
                              const sec = sections.find(s => s.id === entry.section_id);

                              return (
                                <tr key={entry.id} className="hover:bg-slate-50/50">
                                  <td className="py-2 px-4 font-bold">{entry.day}</td>
                                  <td className="py-2 px-4 font-mono leading-none text-slate-600 shrink-0">
                                    {slot ? `${formatTime24To12(slot.start_time)} - ${formatTime24To12(slot.end_time)}` : '--:--'}
                                    <div className="text-4xs text-slate-400 mt-0.5">{slot?.period_label}</div>
                                  </td>
                                  <td className="py-2 px-4 font-bold text-slate-800">{sub?.name}</td>
                                  <td className="py-2 px-4 font-bold text-blue-900">{sec?.name}</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeReport === 'section' && selectedSectionObj && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-base font-bold uppercase underline font-sans text-slate-800 tracking-wide">
                        SECTIONAL TIMETABLE / CLASS CALENDAR
                      </h2>
                      <p className="text-3xs text-slate-405 uppercase tracking-widest mt-1 font-sans font-medium">Silangan Senior High Department</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-sans pb-4 border-b border-slate-200">
                      <div>
                        <p className="text-slate-400 font-semibold uppercase tracking-wide text-2xs">STUDENT CLASSROOM:</p>
                        <p className="font-extrabold text-sm text-slate-900 mt-0.5">{selectedSectionObj.name}</p>
                        <p className="text-3xs text-slate-500 font-medium">Grade Level {selectedSectionObj.grade_level} · Track: {strands.find(s => s.id === selectedSectionObj.strand_id)?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 font-semibold uppercase tracking-wide text-2xs">SHIFT AND WINDOW LIMIT:</p>
                        <p className="font-extrabold text-sm text-slate-900 mt-0.5">
                          {selectedSectionObj.shift} Shift
                        </p>
                        <p className="text-3xs text-slate-500 font-semibold">{selectedSectionObj.grade_level === 11 ? '06:00 AM – 12:00 PM Only' : '12:30 PM – 06:30 PM Only'}</p>
                      </div>
                    </div>

                    {/* Detailed schedules timeline list */}
                    <div className="space-y-4">
                      <h3 className="font-sans font-bold text-xs text-slate-800 uppercase tracking-wide">WEEKLY TIMETABLE SCHEDULE:</h3>
                      <table className="w-full text-xs text-left border border-slate-350 font-sans">
                        <thead className="bg-slate-55 uppercase font-bold text-2xs tracking-tight border-b border-slate-300">
                          <tr>
                            <th className="py-2.5 px-4 font-mono">Day</th>
                            <th className="py-2.5 px-4 font-bold">Period</th>
                            <th className="py-2.5 px-4 text-center">Time</th>
                            <th className="py-2.5 px-4">Allocated Subject Course name</th>
                            <th className="py-2.5 px-4">Assigned Instructor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-750 font-medium">
                          {sectionSchedules.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-400 italic">No schedule blocks allocated yet for this classroom on the active builder.</td>
                            </tr>
                          ) : (
                            sectionSchedules.map((entry) => {
                              const slot = timeSlots.find(s => s.id === entry.time_slot_id);
                              const sub = subjects.find(s => s.id === entry.subject_id);
                              const teach = teachers.find(t => t.id === entry.teacher_id);

                              return (
                                <tr key={entry.id} className="hover:bg-slate-50/50">
                                  <td className="py-2.5 px-4 font-bold text-slate-900">{entry.day}</td>
                                  <td className="py-2.5 px-4 font-bold text-blue-900">{slot?.period_label}</td>
                                  <td className="py-2.5 px-4 text-center font-mono text-slate-500 shrink-0">
                                    {slot ? `${formatTime24To12(slot.start_time)} - ${formatTime24To12(slot.end_time)}` : '--:--'}
                                  </td>
                                  <td className="py-2.5 px-4 font-bold text-slate-800">{sub?.name}</td>
                                  <td className="py-2.5 px-4 font-bold">{teach?.name || 'Unassigned'}</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeReport === 'loading' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-base font-bold uppercase underline font-sans text-slate-800 tracking-wide">
                        FACULTY LOAD AUDIT SUMMARY REPORT
                      </h2>
                      <p className="text-3xs text-slate-405 uppercase tracking-widest mt-1 font-sans font-medium font-bold">Consolidated Principal's Office Ledger</p>
                    </div>

                    <table className="w-full text-11px text-left border border-slate-350 font-sans">
                      <thead className="bg-slate-50 uppercase font-bold text-3xs tracking-tight border-b border-slate-350">
                        <tr>
                          <th className="py-2 px-3">Teacher Name</th>
                          <th className="py-2 px-3">Specialization Area</th>
                          <th className="py-2 px-2">Assigned Roles</th>
                          <th className="py-2 px-2 text-center font-bold">Subjects Handled</th>
                          <th className="py-2 px-2 text-center">teach Load</th>
                          <th className="py-2 px-2 text-center">Ancil Load</th>
                          <th className="py-2 px-3 text-center">Total LOAD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {loadingSummaries.map((summary) => (
                          <tr key={summary.teacherId}>
                            <td className="py-2 px-3 font-bold text-slate-900">{summary.teacherName}</td>
                            <td className="py-2 px-3">{summary.specialization}</td>
                            <td className="py-2 px-2 font-medium">{summary.ancillaryRole}</td>
                            <td className="py-2 px-2 max-w-xs truncate">{summary.subjectsTaught.join(', ')}</td>
                            <td className="py-2 px-2 text-center font-bold">{summary.teachingHoursPerWeek.toFixed(1)}h</td>
                            <td className="py-2 px-2 text-center">{summary.ancillaryHoursPerWeek}h</td>
                            <td className="py-2 px-3 text-center font-extrabold text-blue-900">{summary.totalHoursPerWeek.toFixed(1)}h</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeReport === 'summary' && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-base font-bold uppercase underline font-sans text-slate-800 tracking-wide">
                        CONSOLIDATED CONFLICT VALIDATION AUDIT SHEET
                      </h2>
                      <p className="text-3xs text-slate-405 uppercase tracking-widest mt-1 font-sans font-semibold">Active Calendar Validation Reports</p>
                    </div>

                    <table className="w-full text-11px text-left border border-slate-350 font-sans">
                      <thead className="bg-slate-50 uppercase font-bold text-3xs tracking-wide border-b border-slate-350">
                        <tr>
                          <th className="py-2 px-3">Ancillary Unit</th>
                          <th className="py-2 px-3 text-center">Max load Limit</th>
                          <th className="py-2 px-3 text-center">Unique Preps</th>
                          <th className="py-2 px-3 text-center">Total load assigned</th>
                          <th className="py-2 px-3 text-center">Compliance Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {loadingSummaries.map((sum) => {
                          const isWarning = sum.totalHoursPerWeek > sum.totalHoursPerWeek - 5 && sum.totalHoursPerWeek <= sum.totalHoursPerWeek;
                          const isOver = sum.totalHoursPerWeek > (sum.totalHoursPerWeek || 30);
                          
                          let statusText = 'Compliant';
                          if (sum.totalHoursPerWeek > 30) {
                            statusText = 'Overloaded Item';
                          } else if (sum.totalHoursPerWeek >= 25) {
                            statusText = 'Approaching Limit';
                          }

                          return (
                            <tr key={sum.teacherId}>
                              <td className="py-2 px-3 font-bold text-slate-900">{sum.teacherName}</td>
                              <td className="py-2 px-3 text-center">{sum.teachingHoursPerWeek.toFixed(1)}h</td>
                              <td className="py-2 px-3 text-center">{sum.noOfPreps} Courses</td>
                              <td className="py-2 px-3 text-center font-extrabold text-slate-800">{sum.totalHoursPerWeek.toFixed(1)} Hours</td>
                              <td className="py-2 px-3 text-center font-bold uppercase text-3xs text-blue-900">{statusText}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* DOUBLE SIGNATURE PLACEHOLDERS FOR COMPLIANCE */}
                <div className="grid grid-cols-2 mt-16 pt-8 border-t border-double border-slate-800 font-sans text-xs">
                  <div className="text-left space-y-10">
                    <p className="text-3xs font-semibold uppercase tracking-wider text-slate-400">Verified and Compiled By:</p>
                    <div>
                      <p className="font-extrabold text-xs uppercase border-b border-slate-400 pb-0.5 inline-block min-w-52">
                        {teachers[2]?.name || 'Sir Jester C. Cruz'}
                      </p>
                      <p className="text-4xs text-slate-405 leading-relaxed font-semibold mt-1 uppercase tracking-wide">SILANGAN HIGH SYSTEM ADMINISTRATOR / COORDINATOR</p>
                    </div>
                  </div>
                  <div className="text-right space-y-10 flex flex-col items-end">
                    <p className="text-3xs font-semibold uppercase tracking-wider text-slate-400 self-start">Approved and Endorsed By:</p>
                    <div className="text-left">
                      <p className="font-extrabold text-xs uppercase border-b border-slate-400 pb-0.5 inline-block min-w-52 text-left">
                        {teachers[0]?.name || 'Dr. Ronald M. Santos'}
                      </p>
                      <p className="text-4xs text-slate-405 leading-relaxed font-semibold mt-1 uppercase tracking-wide text-left">SECONDARY SCHOOL PRINCIPAL II / DEPED OFFICE</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
