import React, { useState, useEffect } from 'react';
import { useApp } from '../../lib/AppContext';
import { ScheduleEntry, TimeSlot } from '../../types';
import { X, Trash2, AlertTriangle, Info } from 'lucide-react';
import { formatTime24To12 } from '../../lib/helpers';

interface ConflictMiniViewProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
  sectionId: string;
  interactive?: boolean;
  targetTeacherLoadId?: string;
  excessHours?: number;
}

export default function ConflictMiniView({
  isOpen,
  onClose,
  teacherId,
  sectionId,
  interactive = false,
  targetTeacherLoadId,
  excessHours = 0
}: ConflictMiniViewProps) {
  const {
    teachers,
    sections,
    subjects,
    timeSlots,
    scheduleEntries,
    conflicts,
    deleteScheduleEntryById
  } = useApp();

  const [initialHours, setInitialHours] = useState<number | null>(null);

  const teacher = teachers.find(t => t.id === teacherId);
  const section = sections.find(s => s.id === sectionId);

  // Filter entries for target load
  const getLoadHours = (entriesList: ScheduleEntry[]) => {
    return entriesList
      .filter(e => e.teacher_load_id === targetTeacherLoadId)
      .reduce((sum, e) => {
        const slot = timeSlots.find(s => s.id === e.time_slot_id);
        return sum + (slot ? slot.duration_minutes / 60 : 0);
      }, 0);
  };

  useEffect(() => {
    if (isOpen && targetTeacherLoadId && initialHours === null) {
      setInitialHours(getLoadHours(scheduleEntries));
    }
    if (!isOpen) {
      setInitialHours(null);
    }
  }, [isOpen, scheduleEntries, targetTeacherLoadId, initialHours]);

  if (!isOpen || !teacher || !section) return null;

  // Render slots for the section's shift
  const activeSlots = timeSlots.filter(s => s.shift === section.shift && !s.is_recess);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const currentHours = getLoadHours(scheduleEntries);
  const removedHours = initialHours !== null ? Math.max(0, initialHours - currentHours) : 0;

  // Helpers to check entries
  const findTeacherEntry = (day: string, slotId: string) => {
    return scheduleEntries.find(e => e.day === day && e.time_slot_id === slotId && e.teacher_id === teacherId);
  };

  const findSectionEntry = (day: string, slotId: string) => {
    return scheduleEntries.find(e => e.day === day && e.time_slot_id === slotId && e.section_id === sectionId);
  };

  // Check if an entry is in conflict
  const isConflictingEntry = (entryId: string) => {
    return conflicts.some(c => c.scheduleEntryId === entryId);
  };

  const handleCellClick = async (entryId: string) => {
    if (!interactive) return;
    if (confirm('Are you sure you want to remove this specific schedule slot?')) {
      await deleteScheduleEntryById(entryId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-5xl border border-slate-200 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-sm">
              {interactive ? 'Interactive Schedule Adjustment' : 'Schedule Grid Context View'}
            </h3>
            <p className="text-3xs text-slate-500 font-medium">
              Comparing schedule alignments for {teacher.name} and {section.name} ({section.shift} Shift)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Bar */}
        {interactive && excessHours > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between text-xs text-amber-800">
            <div className="flex items-center gap-2 font-semibold">
              <Info className="w-4.5 h-4.5 text-amber-500" />
              <span>Click a highlighted load cell (blue border) to clear that slot.</span>
            </div>
            <span className="font-mono bg-white px-2.5 py-1 rounded border border-amber-250 font-bold shrink-0">
              Removed {removedHours.toFixed(1)} of {excessHours.toFixed(1)} excess hours
            </span>
          </div>
        )}

        {/* Content Grids */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Grid: Teacher Schedule */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs text-center border-b pb-2">
              {teacher.name}'s Current Schedule
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
              <table className="min-w-full text-left text-3xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-2 px-3 border-r border-slate-200 w-24">Time</th>
                    {days.map(d => (
                      <th key={d} className="py-2 px-2 text-center border-r border-slate-150 min-w-20">{d.substring(0, 3)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeSlots.map(slot => {
                    const duration = `${formatTime24To12(slot.start_time)} - ${formatTime24To12(slot.end_time)}`;
                    return (
                      <tr key={slot.id} className="hover:bg-slate-50/20">
                        <td className="py-3 px-3 border-r border-slate-200 bg-slate-50/50 font-medium">
                          <div>{slot.period_label}</div>
                          <div className="text-4xs text-slate-400 font-mono mt-0.5">{duration}</div>
                        </td>
                        {days.map(day => {
                          const entry = findTeacherEntry(day, slot.id);
                          const isConflict = entry ? isConflictingEntry(entry.id) : false;
                          const isTargetLoad = entry ? entry.teacher_load_id === targetTeacherLoadId : false;
                          const subjectName = entry ? subjects.find(s => s.id === entry.subject_id)?.name : null;
                          const sectionName = entry ? sections.find(s => s.id === entry.section_id)?.name : null;

                          let cellClass = 'bg-white';
                          if (isConflict) {
                            cellClass = 'bg-red-50/70 border-red-200 hover:bg-red-100/60';
                          } else if (isTargetLoad) {
                            cellClass = 'bg-blue-50/30 border-blue-200 hover:bg-blue-105/20';
                          }

                          return (
                            <td
                              key={day}
                              onClick={() => entry && isTargetLoad && handleCellClick(entry.id)}
                              className={`p-2 border-r border-slate-150 text-center relative transition-all ${cellClass} ${
                                interactive && entry && isTargetLoad ? 'cursor-pointer border-2 border-blue-400 group' : ''
                              }`}
                            >
                              {entry ? (
                                <div className="space-y-1">
                                  <div className="font-bold text-slate-900 leading-tight line-clamp-2">{subjectName}</div>
                                  <div className="text-4xs text-slate-500 font-semibold">{sectionName}</div>
                                  
                                  {isConflict && (
                                    <span className="inline-flex items-center gap-0.5 bg-red-500 text-white text-[9px] font-extrabold uppercase px-1 rounded-full animate-pulse mt-0.5">
                                      <AlertTriangle className="w-2 h-2 shrink-0" /> Conflict
                                    </span>
                                  )}

                                  {/* Interactive Hover Delete Overlay */}
                                  {interactive && isTargetLoad && (
                                    <div className="absolute inset-0 bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-sm">
                                      <Trash2 className="w-4 h-4 shrink-0" />
                                      <span className="text-[10px] font-bold ml-1">Remove</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-350 italic text-[10px]">Free</span>
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

          {/* Right Grid: Section Schedule */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs text-center border-b pb-2">
              {section.name}'s Current Schedule
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
              <table className="min-w-full text-left text-3xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-2 px-3 border-r border-slate-200 w-24">Time</th>
                    {days.map(d => (
                      <th key={d} className="py-2 px-2 text-center border-r border-slate-150 min-w-20">{d.substring(0, 3)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeSlots.map(slot => {
                    const duration = `${formatTime24To12(slot.start_time)} - ${formatTime24To12(slot.end_time)}`;
                    return (
                      <tr key={slot.id} className="hover:bg-slate-50/20">
                        <td className="py-3 px-3 border-r border-slate-200 bg-slate-50/50 font-medium">
                          <div>{slot.period_label}</div>
                          <div className="text-4xs text-slate-400 font-mono mt-0.5">{duration}</div>
                        </td>
                        {days.map(day => {
                          const entry = findSectionEntry(day, slot.id);
                          const isConflict = entry ? isConflictingEntry(entry.id) : false;
                          const isTargetLoad = entry ? entry.teacher_load_id === targetTeacherLoadId : false;
                          const subjectName = entry ? subjects.find(s => s.id === entry.subject_id)?.name : null;
                          const teacherName = entry ? teachers.find(t => t.id === entry.teacher_id)?.name : null;

                          let cellClass = 'bg-white';
                          if (isConflict) {
                            cellClass = 'bg-red-50/70 border-red-200 hover:bg-red-100/60';
                          } else if (isTargetLoad) {
                            cellClass = 'bg-blue-50/30 border-blue-200 hover:bg-blue-105/20';
                          }

                          return (
                            <td
                              key={day}
                              onClick={() => entry && isTargetLoad && handleCellClick(entry.id)}
                              className={`p-2 border-r border-slate-150 text-center relative transition-all ${cellClass} ${
                                interactive && entry && isTargetLoad ? 'cursor-pointer border-2 border-blue-400 group' : ''
                              }`}
                            >
                              {entry ? (
                                <div className="space-y-1">
                                  <div className="font-bold text-slate-900 leading-tight line-clamp-2">{subjectName}</div>
                                  <div className="text-4xs text-slate-500 font-semibold">{teacherName}</div>
                                  
                                  {isConflict && (
                                    <span className="inline-flex items-center gap-0.5 bg-red-500 text-white text-[9px] font-extrabold uppercase px-1 rounded-full animate-pulse mt-0.5">
                                      <AlertTriangle className="w-2 h-2 shrink-0" /> Conflict
                                    </span>
                                  )}

                                  {/* Interactive Hover Delete Overlay */}
                                  {interactive && isTargetLoad && (
                                    <div className="absolute inset-0 bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-sm">
                                      <Trash2 className="w-4 h-4 shrink-0" />
                                      <span className="text-[10px] font-bold ml-1">Remove</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-350 italic text-[10px]">Free</span>
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

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
          >
            Close Grid
          </button>
        </div>

      </div>
    </div>
  );
}
