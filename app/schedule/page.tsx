'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../lib/AppContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import {
  Calendar,
  Layers,
  X,
  AlertTriangle,
  Flame,
  CheckCircle,
  Clock,
  UserSquare,
  BookmarkCheck,
  ChevronRight,
  Info,
  Bot,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { ScheduleEntry, TimeSlot, Teacher, Section, Subject, GenerationResult, TeacherLoad } from '../../types';
import GenerationResultsModal from '../../components/schedule/GenerationResultsModal';
import { formatTime24To12 } from '../../lib/helpers';

export default function ScheduleBuilderPage() {
  const {
    teachers,
    strands,
    sections,
    subjects,
    timeSlots,
    scheduleEntries,
    teacherLoads,
    saveScheduleEntry,
    clearScheduleEntry,
    conflicts,
    regenerateAllSchedules,
  } = useApp();

  // Auto-generate status states
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [generationResults, setGenerationResults] = useState<GenerationResult | null>(null);
  const [lastGenTime, setLastGenTime] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Custom confirmation modal state for Regenerate All
  const [regenConfirmOpen, setRegenConfirmOpen] = useState(false);

  // Overload Warning modal states
  const [showOverloadModal, setShowOverloadModal] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<{
    teacher_id: string;
    section_id: string;
    subject_id: string;
    time_slot_id: string;
    day: string;
    source: 'manual';
    teacher_load_id: string | null;
  } | null>(null);
  const [overloadLoadDetails, setOverloadLoadDetails] = useState<TeacherLoad | null>(null);
  
  // Dropdown status for scheduling engine split button
  const [showGenDropdown, setShowGenDropdown] = useState(false);

  const handleAutoGenerateAll = async (preserveExisting: boolean = false) => {
    setGenerating(true);
    try {
      const res = await regenerateAllSchedules(preserveExisting);
      if (res) {
        setGenerationResults(res);
        setLastGenTime(new Date().toLocaleTimeString());
        setShowResultsModal(true);
      }
    } finally {
      setGenerating(false);
    }
  };

  // Selection state
  const [viewBy, setViewBy] = useState<'section' | 'teacher'>('section');
  const [activeSectionId, setActiveSectionId] = useState<string>(
    sections.length > 0 ? sections[0].id : ''
  );
  const [activeTeacherId, setActiveTeacherId] = useState<string>(
    teachers.length > 0 ? teachers[0].id : ''
  );
  const [selectedShift, setSelectedShift] = useState<'Morning' | 'Afternoon'>('Morning');

  // Side form panel state
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Monday');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');

  // Form Fields inside side-drawer
  const [formTeacherId, setFormTeacherId] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formSectionId, setFormSectionId] = useState('');

  // Local state for dropdown options matching active teacher loads
  const [activeTeacherLoads, setActiveTeacherLoads] = useState<TeacherLoad[]>([]);
  const [loadingLoads, setLoadingLoads] = useState(false);

  // Fetch teaching loads for the selected teacher dynamically
  useEffect(() => {
    if (!formTeacherId) {
      setActiveTeacherLoads([]);
      return;
    }
    
    let isMounted = true;
    const fetchTeacherLoads = async () => {
      setLoadingLoads(true);
      try {
        const res = await fetch(`/api/teacher-loads?teacher_id=${formTeacherId}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setActiveTeacherLoads(data);
        }
      } catch (err) {
        console.error('Error fetching teacher loads:', err);
      } finally {
        if (isMounted) setLoadingLoads(false);
      }
    };
    
    fetchTeacherLoads();
    return () => {
      isMounted = false;
    };
  }, [formTeacherId]);

  // Keep dropdown selections in sync with fetched active teacher loads
  useEffect(() => {
    if (activeTeacherLoads.length > 0) {
      // Check if current formSectionId is in the new loads list
      const isCurrentSectionValid = activeTeacherLoads.some(l => l.section_id === formSectionId);
      let targetSectionId = formSectionId;
      
      if (!isCurrentSectionValid) {
        targetSectionId = activeTeacherLoads[0].section_id;
        setFormSectionId(targetSectionId);
      }
      
      // Check if current formSubjectId is in the loads list for that section
      const isCurrentSubjectValid = activeTeacherLoads.some(
        l => l.section_id === targetSectionId && l.subject_id === formSubjectId
      );
      
      if (!isCurrentSubjectValid) {
        const firstValidLoadForSection = activeTeacherLoads.find(l => l.section_id === targetSectionId);
        if (firstValidLoadForSection) {
          setFormSubjectId(firstValidLoadForSection.subject_id);
        } else {
          setFormSubjectId('');
        }
      }
    } else {
      setFormSectionId('');
      setFormSubjectId('');
    }
  }, [activeTeacherLoads, formSectionId, formSubjectId]);

  // Determine which list of slots to render
  const currentSection = sections.find(s => s.id === activeSectionId);
  const currentTeacher = teachers.find(t => t.id === activeTeacherId);

  const activeShift = viewBy === 'section'
    ? (currentSection?.grade_level === 11 ? 'Morning' : 'Afternoon')
    : selectedShift;

  const currentSlots = timeSlots.filter(s => s.shift === activeShift);
  const days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];

  // Helper: Find schedule entry for given cell
  const findEntry = (day: string, slotId: string) => {
    return scheduleEntries.find(e => {
      if (e.day !== day || e.time_slot_id !== slotId) return false;
      if (viewBy === 'section') {
        return e.section_id === activeSectionId;
      } else {
        return e.teacher_id === activeTeacherId;
      }
    });
  };

  // Open sidebar-drawer for clickable cell
  const handleCellClick = (day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday', slot: TimeSlot) => {
    if (slot.is_recess) return; // Non-clickable recess rows

    setSelectedDay(day);
    setSelectedSlotId(slot.id);

    // See if exists to load pre-fill values
    const existingEntry = findEntry(day, slot.id);

    if (existingEntry) {
      setFormTeacherId(existingEntry.teacher_id);
      setFormSubjectId(existingEntry.subject_id);
      setFormSectionId(existingEntry.section_id);
    } else {
      // Clear out form fields or pre-fill logically
      setFormTeacherId(viewBy === 'teacher' ? activeTeacherId : teachers.length > 0 ? teachers[0].id : '');
      setFormSectionId(viewBy === 'section' ? activeSectionId : sections.length > 0 ? sections[0].id : '');
      
      // Auto pre-fill first subject of section/strand
      const sec = viewBy === 'section' ? currentSection : sections.find(s => s.id === formSectionId);
      const filteredSubjects = sec ? subjects.filter(sub => sub.strand_id === sec.strand_id) : subjects;
      setFormSubjectId(filteredSubjects.length > 0 ? filteredSubjects[0].id : '');
    }

    setSidePanelOpen(true);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTeacherId || !formSubjectId || !formSectionId || !selectedSlotId) return;

    const matchingLoad = teacherLoads.find(
      l => l.teacher_id === formTeacherId &&
           l.subject_id === formSubjectId &&
           l.section_id === formSectionId
    );

    if (!matchingLoad) return;

    const payload = {
      teacher_id: formTeacherId,
      section_id: formSectionId,
      subject_id: formSubjectId,
      time_slot_id: selectedSlotId,
      day: selectedDay,
      source: 'manual' as const,
      teacher_load_id: matchingLoad.id,
    };

    const existingEntry = findEntry(selectedDay, selectedSlotId);
    const isSameLoad = existingEntry && existingEntry.teacher_load_id === matchingLoad.id;

    if (matchingLoad.placement_status === 'fully_placed' && !isSameLoad) {
      setPendingSaveData(payload);
      setOverloadLoadDetails(matchingLoad);
      setShowOverloadModal(true);
      return;
    }

    saveScheduleEntry(payload);
    setSidePanelOpen(false);
  };

  const confirmSaveEntry = () => {
    if (pendingSaveData) {
      saveScheduleEntry(pendingSaveData);
    }
    setShowOverloadModal(false);
    setPendingSaveData(null);
    setOverloadLoadDetails(null);
    setSidePanelOpen(false);
  };

  const handleClearEntry = () => {
    if (!selectedSlotId) return;
    const activeCriteriaId = viewBy === 'teacher' ? activeTeacherId : activeSectionId;
    clearScheduleEntry(selectedDay, selectedSlotId, activeCriteriaId, viewBy);
    setSidePanelOpen(false);
  };

  // Compute live conflicts matching this specific workspace
  const getCellConflicts = (day: string, slotId: string) => {
    const entry = findEntry(day, slotId);
    if (!entry) return [];
    return conflicts.filter(c => c.scheduleEntryId === entry.id);
  };

  // Section options linked to teacher loads
  const eligibleSections = sections.filter(sec =>
    activeTeacherLoads.some(load => load.section_id === sec.id)
  );

  // Subject options linked to teacher loads for the selected section
  const eligibleSubjects = subjects.filter(sub =>
    activeTeacherLoads.some(load => load.section_id === formSectionId && load.subject_id === sub.id)
  );

  const currentCellConflict = conflicts.filter(c => {
    if (viewBy === 'section') {
      return (
        c.affectedSectionId === activeSectionId &&
        c.description.includes(selectedDay) &&
        c.scheduleEntryId !== undefined
      );
    } else {
      return (
        c.affectedTeacherId === activeTeacherId &&
        c.description.includes(selectedDay) &&
        c.scheduleEntryId !== undefined
      );
    }
  });

  return (
    <DashboardLayout>
      <div id="schedule-module-canvas" className="p-6 md:p-8 space-y-6 relative min-h-[calc(100vh-4rem)]">
        
        {/* Auto-Generation Control Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-600 animate-bounce" />
              <span>Automated Scheduling Engine</span>
            </h3>
            <p className="text-2xs text-slate-500 max-w-lg">
              Place teaching loads into open time slots automatically. Respects teacher specializations, shifts, and double-booking constraints.
            </p>
            {lastGenTime && generationResults && (
              <div className="text-3xs text-slate-400 font-semibold mt-1 flex items-center gap-1.5">
                <span>Last generated: {lastGenTime}</span>
                <span>&bull;</span>
                <span className="text-emerald-600 font-bold">{generationResults.fully_placed.length} fully placed</span>
                <span>&bull;</span>
                <span className="text-amber-600 font-bold">{generationResults.partially_placed.length} partially placed</span>
                <span>&bull;</span>
                <span className="text-red-500 font-bold">{generationResults.not_placed.length} not placed</span>
                <span>&bull;</span>
                <button
                  onClick={() => setShowResultsModal(true)}
                  className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  [View Full Report]
                </button>
              </div>
            )}
          </div>

          <div className="relative shrink-0 self-start sm:self-center">
            <div className="inline-flex rounded-lg shadow-sm">
              <button
                onClick={() => handleAutoGenerateAll(true)}
                disabled={generating}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-l-lg text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer transition-colors"
                title="Only schedule remaining slots without wiping existing ones"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                <span>Fill Remaining Only</span>
              </button>
              <button
                type="button"
                onClick={() => setShowGenDropdown(!showGenDropdown)}
                disabled={generating}
                className="px-2.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-r-lg border-l border-blue-500 text-xs flex items-center justify-center disabled:opacity-50 cursor-pointer transition-colors animate-in"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {showGenDropdown && (
              <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-20 animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    setShowGenDropdown(false);
                    handleAutoGenerateAll(true);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <div>
                    <div className="font-bold">Fill Remaining Only</div>
                    <div className="text-[10px] text-slate-400 font-normal">Place missing hours only</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowGenDropdown(false);
                    setRegenConfirmOpen(true);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-red-700 hover:bg-red-50/50 font-semibold flex items-center gap-2 border-t border-slate-100 cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5 text-red-505 shrink-0" />
                  <div>
                    <div className="font-bold text-red-600">Regenerate Everything</div>
                    <div className="text-[10px] text-slate-405 font-normal">Wipe auto & rebuild fresh</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filter Control Bar Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-205 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2.5">
              <Calendar className="w-6 h-6 text-blue-600" />
              <span>Real-time Schedule Timetables</span>
            </h2>
            
            {/* View Mode Grid/Toggle buttons */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
              <button
                onClick={() => setViewBy('section')}
                className={`px-4.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  viewBy === 'section'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-505 hover:text-slate-800'
                }`}
              >
                View by Section Timetable
              </button>
              <button
                onClick={() => setViewBy('teacher')}
                className={`px-4.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  viewBy === 'teacher'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-505 hover:text-slate-800'
                }`}
              >
                View by Teacher Timetable
              </button>
            </div>
          </div>

          {/* Filtering Dropdowns */}
          <div className="flex flex-wrap items-center gap-4.5">
            {viewBy === 'section' ? (
              <div className="space-y-1.5 min-w-56">
                <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-widest">Select Class Section</label>
                <select
                  value={activeSectionId}
                  onChange={(e) => setActiveSectionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500"
                >
                  {sections.map(sec => {
                    const strand = strands.find(s => s.id === sec.strand_id);
                    return (
                      <option key={sec.id} value={sec.id}>
                        {sec.name} (Grade {sec.grade_level} - {sec.shift})
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : (
              <>
                <div className="space-y-1.5 min-w-56">
                  <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-widest">Select Faculty Member</label>
                  <select
                    value={activeTeacherId}
                    onChange={(e) => setActiveTeacherId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500"
                  >
                    {teachers.map(teach => (
                      <option key={teach.id} value={teach.id}>
                        {teach.name} ({teach.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-3xs font-extrabold text-slate-400 uppercase tracking-widest">Shift Window</label>
                  <select
                    value={selectedShift}
                    onChange={(e) => setSelectedShift(e.target.value as any)}
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="Morning">Morning Shift (Grade 11 Slotset)</option>
                    <option value="Afternoon">Afternoon Shift (Grade 12 Slotset)</option>
                  </select>
                </div>
              </>
            )}
            
            {/* Display indicator */}
            <div className="px-4 py-2 bg-blue-50/50 border border-blue-100 rounded-lg text-xs font-semibold text-blue-800 self-end">
              Shift Assigned: <span className="underline">{activeShift} Shift</span>
            </div>
          </div>
        </div>

        {/* TIME GRID TIMETABLE SHEET */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table id="schedule-grid-table" className="min-w-full text-sm border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-250 text-slate-650 text-2xs uppercase tracking-wider font-extrabold font-mono">
                  <th className="py-4.5 px-6 border-r border-slate-200 w-44">Time / Period</th>
                  {days.map(day => (
                    <th key={day} className="py-4.5 px-4 text-center border-r border-slate-150 min-w-44">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentSlots.map(slot => {
                  const label = slot.period_label;
                  const duration = `${formatTime24To12(slot.start_time)} - ${formatTime24To12(slot.end_time)}`;
                  
                  if (slot.is_recess) {
                    return (
                      <tr key={slot.id} className="bg-slate-100 text-slate-400 select-none">
                        <td className="py-3 px-6 border-r border-slate-200 align-middle">
                          <div className="font-extrabold text-2xs tracking-widest">{label.toUpperCase()}</div>
                          <div className="text-4xs mt-0.5">{duration}</div>
                        </td>
                        {days.map(day => (
                          <td key={day} className="py-3 px-4 border-r border-slate-150 text-center font-bold text-xs uppercase tracking-widest relative">
                            Recess Break
                          </td>
                        ))}
                      </tr>
                    );
                  }

                  return (
                    <tr key={slot.id} className="hover:bg-slate-50/40 transition-colors">
                      {/* Left time marker */}
                      <td className="py-5 px-6 border-r border-slate-200 bg-slate-50/30 align-middle">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">{label}</div>
                        <div className="text-3xs text-slate-405 font-medium mt-0.5 font-mono">{duration}</div>
                      </td>

                      {/* Days Cell allocations */}
                      {days.map(day => {
                        const entry = findEntry(day, slot.id);
                        const cellConflicts = getCellConflicts(day, slot.id);
                        const isConflict = cellConflicts.length > 0;

                        let subjectObj = entry ? subjects.find(s => s.id === entry.subject_id) : null;
                        let teacherObj = entry ? teachers.find(t => t.id === entry.teacher_id) : null;
                        let sectionObj = entry ? sections.find(s => s.id === entry.section_id) : null;

                        return (
                          <td
                            key={day}
                            onClick={() => handleCellClick(day, slot)}
                            className={`py-4 px-4 border-r border-slate-150 transition-all cursor-pointer relative group ${
                              isConflict
                                ? 'bg-red-50/60 hover:bg-red-50 border-red-200'
                                : entry
                                ? 'bg-blue-50/10 hover:bg-blue-50/30 border-blue-100'
                                : 'hover:bg-slate-50 border-transparent text-slate-400 text-2xs italic'
                            }`}
                          >
                            {entry ? (
                              <div className="space-y-1.5 text-center">
                                {entry.source === 'auto_generated' && (
                                  <div className="flex justify-center mb-1">
                                    <span className="inline-flex items-center gap-0.5 bg-slate-100 text-slate-600 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full border border-slate-200">
                                      <Bot className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                                      Auto
                                    </span>
                                  </div>
                                )}
                                <h5 className="font-bold text-slate-900 text-xs tracking-tight line-clamp-2">
                                  {subjectObj?.name || 'Invalid Subject'}
                                </h5>
                                
                                <span className="inline-flex items-center text-3xs font-semibold text-slate-505 tracking-wide">
                                  {viewBy === 'section'
                                    ? `Tchr: ${teacherObj?.name || 'Unassigned'}`
                                    : `Sec: ${sectionObj?.name || 'Unassigned'}`}
                                </span>

                                {/* Conflict indicator badges */}
                                {isConflict && (
                                  <div className="mt-1.5 flex justify-center">
                                    <span className="inline-flex items-center gap-1 bg-red-400 text-white text-4xs font-bold uppercase py-0.5 px-2 rounded-full ring-2 ring-white tracking-widest">
                                      <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                                      Conflict
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-5xs uppercase tracking-wider font-extrabold text-blue-500 bg-blue-50 rounded border border-blue-105 px-1.5 py-1">
                                  + Schedule Unit
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SLIDE OUT Form Drawer Panel */}
        {sidePanelOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop slide trigger */}
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-3xs transition-opacity duration-300 pointer-events-auto"
              onClick={() => setSidePanelOpen(false)}
            />
            
            {/* Content Drawer Box */}
            <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full z-10 border-l border-slate-200 transform transition-transform duration-300 translate-x-0">
              
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-250 flex items-center justify-between bg-slate-50">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <UserSquare className="w-5 h-5 text-blue-600" />
                    <span>Timetable Block Setup</span>
                  </h3>
                  <p className="text-3xs text-slate-500 font-mono tracking-wider uppercase">
                    Slot: {selectedDay} · {timeSlots.find(t => t.id === selectedSlotId)?.period_label}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSidePanelOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Input fields */}
              <form onSubmit={handleSaveEntry} className="flex-1 overflow-y-auto p-6 space-y-5">
                
                {/* Field 1: Assign Instructor */}
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Assigned Faculty Instructor <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formTeacherId}
                    onChange={(e) => setFormTeacherId(e.target.value)}
                    disabled={viewBy === 'teacher'} // Lock if viewBy is teacher
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all disabled:opacity-75 disabled:bg-slate-100"
                  >
                    {teachers.map(teach => (
                      <option key={teach.id} value={teach.id}>
                        {teach.name} (Specialty: {teach.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Warning message if selected teacher has no teacher loads */}
                {!loadingLoads && activeTeacherLoads.length === 0 && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4.5 rounded-xl space-y-1 text-xs">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>No Teaching Loads Assigned</span>
                    </div>
                    <p>This teacher has no teaching loads assigned yet. Add a teaching load first from the Teacher Profile page.</p>
                  </div>
                )}

                {/* Loading state indicator for teacher loads */}
                {loadingLoads && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 p-3 rounded-lg animate-pulse">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin" />
                    <span>Syncing loads from database...</span>
                  </div>
                )}

                {/* Field 2: Class Section */}
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Class Section <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formSectionId}
                    onChange={(e) => {
                      const newSecId = e.target.value;
                      setFormSectionId(newSecId);
                      const matchingLoad = activeTeacherLoads.find(l => l.section_id === newSecId);
                      if (matchingLoad) {
                        setFormSubjectId(matchingLoad.subject_id);
                      }
                    }}
                    disabled={viewBy === 'section' || loadingLoads || activeTeacherLoads.length === 0} // Lock if viewBy is section, loading, or no loads
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all disabled:opacity-75 disabled:bg-slate-100"
                  >
                    {activeTeacherLoads.length === 0 ? (
                      <option value="">No sections available</option>
                    ) : (
                      eligibleSections.map(sec => (
                        <option key={sec.id} value={sec.id}>
                          {sec.name} (Grade {sec.grade_level})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Field 3: Select Course Subject */}
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Timetable Subject Course <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    disabled={loadingLoads || activeTeacherLoads.length === 0}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 focus:bg-white transition-all overflow-hidden text-ellipsis disabled:opacity-75 disabled:bg-slate-100"
                  >
                    {eligibleSubjects.length === 0 ? (
                      <option value="">No subjects available</option>
                    ) : (
                      eligibleSubjects.map(sub => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} (Req: {sub.required_specialization} · {sub.hours_per_week}h/wk)
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Real-time warnings helper block */}
                <div className="bg-slate-50 border border-slate-205 p-4.5 rounded-xl space-y-2.5">
                  <h4 className="text-3xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-500" />
                    <span>Real-time Cell Conflict Warnings</span>
                  </h4>
                  
                  {/* Query matches */}
                  {currentCellConflict.length > 0 ? (
                    <div className="space-y-2">
                      {currentCellConflict.map((conf, index) => (
                        <div key={index} className="flex gap-2 text-xs font-medium text-red-700 leading-relaxed bg-red-50 border border-red-105 p-2 rounded-md">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                          <p>{conf.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex gap-2 text-[11px] text-emerald-700 leading-relaxed bg-emerald-50 border border-emerald-100 p-2.5 rounded-md">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <p>Current cell assignments conform to standard constraints. No double-bookings or shift violations.</p>
                    </div>
                  )}
                </div>

              </form>

              {/* Drawer Controls footer */}
              <div className="p-6 border-t border-slate-200 bg-slate-50 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleSaveEntry}
                  disabled={loadingLoads || activeTeacherLoads.length === 0 || !formSectionId || !formSubjectId}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <BookmarkCheck className="w-4 h-4" />
                  <span>Save Cell Assignment</span>
                </button>
                
                <button
                  type="button"
                  onClick={handleClearEntry}
                  className="w-full py-3 bg-white border border-red-200 hover:bg-red-50 text-red-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Wipe Cell From Timetable</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Auto-Generate Results Modal */}
      <GenerationResultsModal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        results={generationResults}
        onRegenerateAll={handleAutoGenerateAll}
      />

      {showOverloadModal && overloadLoadDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">Teaching Load Overload Warning</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  The teaching load for <strong className="text-slate-800">{teachers.find(t => t.id === overloadLoadDetails.teacher_id)?.name}</strong> on <strong className="text-slate-800">{subjects.find(s => s.id === overloadLoadDetails.subject_id)?.name}</strong> in <strong className="text-slate-800">{sections.find(sec => sec.id === overloadLoadDetails.section_id)?.name}</strong> is already <span className="text-amber-600 font-semibold">fully placed</span> ({overloadLoadDetails.placed_hours}/{overloadLoadDetails.required_hours_per_week} hrs).
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Adding this slot will exceed the defined required hours. Would you like to assign this block anyway?
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowOverloadModal(false);
                  setPendingSaveData(null);
                  setOverloadLoadDetails(null);
                }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSaveEntry}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                Add Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={regenConfirmOpen}
        title="Regenerate All Schedules"
        message="Are you sure you want to regenerate everything? This will wipe all auto-generated schedule entries and rebuild from scratch. Manual entries will remain safe."
        confirmLabel="Regenerate All"
        cancelLabel="Cancel"
        severity="warning"
        onConfirm={() => handleAutoGenerateAll(false)}
        onClose={() => setRegenConfirmOpen(false)}
      />

    </DashboardLayout>
  );
}
