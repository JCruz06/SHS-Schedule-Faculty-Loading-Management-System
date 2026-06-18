'use client';

import React, { useState, use } from 'react';
import { useApp } from '../../../lib/AppContext';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Trash2,
  X,
  AlertTriangle,
  RefreshCw,
  Award,
  Clock,
  Layers,
  Sparkles,
  ChevronDown,
  Bot
} from 'lucide-react';
import Link from 'next/link';
import OutOfSyncPanel from '../../../components/schedule/OutOfSyncPanel';

export default function TeacherProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const {
    teachers,
    subjects,
    sections,
    teacherLoads,
    addTeacherLoad,
    deleteTeacherLoad,
    regenerateTeacherSchedule,
    isLoading
  } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [showSpecWarning, setShowSpecWarning] = useState(false);
  const [pendingLoadPayload, setPendingLoadPayload] = useState<{
    subject_id: string;
    section_id: string;
  } | null>(null);
  const [showGenDropdown, setShowGenDropdown] = useState(false);

  // Retrieve this teacher's details
  const teacher = teachers.find(t => t.id === id);

  // Retrieve this teacher's loads
  const currentLoads = teacherLoads.filter(load => load.teacher_id === id);

  // Calculate sum of required hours for this teacher
  const totalWeeklyLoad = currentLoads.reduce((sum, load) => sum + (load.required_hours_per_week || 0), 0);

  // Check if any load is out of sync
  const outOfSyncLoads = currentLoads.filter(load => load.placement_status === 'out_of_sync');
  const hasOutOfSync = outOfSyncLoads.length > 0;

  // Specialization matching helper
  const checkSpecializationMatch = (teacherSpec: string, subjectSpec: string) => {
    const teachSpec = teacherSpec.toLowerCase();
    const subReq = subjectSpec.toLowerCase();
    return teachSpec.includes(subReq) || subReq.includes(teachSpec) || 
           (subReq === 'general' || teachSpec === 'general') ||
           (teachSpec.includes('any') || subReq.includes('any')) ||
           (teachSpec.includes('math') && subReq.includes('math')) ||
           (teachSpec.includes('science') && subReq.includes('science')) ||
           (teachSpec.includes('ict') && subReq.includes('ict')) ||
           (teachSpec.includes('tvl') && subReq.includes('tvl')) ||
           (teachSpec.includes('filipino') && subReq.includes('filipino')) ||
           (teachSpec.includes('english') && subReq.includes('english')) ||
           (teachSpec.includes('humanities') && subReq.includes('humanities')) ||
           (teachSpec.includes('abm') && subReq.includes('abm')) ||
           (teachSpec.includes('humss') && subReq.includes('humss'));
  };

  // Sort all subjects alphabetically by name
  const sortedSubjects = [...subjects].sort((a, b) => a.name.localeCompare(b.name));

  // Filter sections to the selected subject's strand
  const selectedSubject = subjects.find(sub => sub.id === selectedSubjectId);
  const eligibleSections = selectedSubject
    ? sections.filter(sec => sec.strand_id === selectedSubject.strand_id)
    : [];

  const handleOpenAddModal = () => {
    setSelectedSubjectId(sortedSubjects.length > 0 ? sortedSubjects[0].id : '');
    setSelectedSectionId('');
    setModalOpen(true);
  };

  // Keep section dropdown updated when subject changes
  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    const sub = subjects.find(s => s.id === subjectId);
    const eligibleSecs = sub ? sections.filter(sec => sec.strand_id === sub.strand_id) : [];
    setSelectedSectionId(eligibleSecs.length > 0 ? eligibleSecs[0].id : '');
  };

  // Pre-fill first section when modal opens
  React.useEffect(() => {
    if (selectedSubjectId) {
      const sub = subjects.find(s => s.id === selectedSubjectId);
      const eligibleSecs = sub ? sections.filter(sec => sec.strand_id === sub.strand_id) : [];
      if (eligibleSecs.length > 0 && !selectedSectionId) {
        setSelectedSectionId(eligibleSecs[0].id);
      }
    }
  }, [selectedSubjectId, subjects, sections, selectedSectionId]);

  const handleSaveLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !selectedSectionId || !teacher) return;

    const subject = subjects.find(s => s.id === selectedSubjectId);
    if (subject && !checkSpecializationMatch(teacher.specialization, subject.required_specialization)) {
      setPendingLoadPayload({
        subject_id: selectedSubjectId,
        section_id: selectedSectionId
      });
      setShowSpecWarning(true);
      return;
    }

    await addTeacherLoad({
      teacher_id: id,
      subject_id: selectedSubjectId,
      section_id: selectedSectionId
    });
    setModalOpen(false);
  };

  const confirmSaveLoad = async () => {
    if (pendingLoadPayload) {
      await addTeacherLoad({
        teacher_id: id,
        subject_id: pendingLoadPayload.subject_id,
        section_id: pendingLoadPayload.section_id
      });
    }
    setShowSpecWarning(false);
    setPendingLoadPayload(null);
    setModalOpen(false);
  };

  const handleDeleteLoad = (loadId: string, subjectName: string, sectionName: string) => {
    if (confirm(`Are you sure you want to remove the load for subject "${subjectName}" and section "${sectionName}"? This will clear its assigned schedule entries.`)) {
      deleteTeacherLoad(loadId);
    }
  };

  const handleRegenerateSchedule = async (preserveExisting: boolean) => {
    if (!teacher) return;
    setRegenerating(true);
    try {
      await regenerateTeacherSchedule(teacher.id, preserveExisting);
    } finally {
      setRegenerating(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 mt-3 font-semibold">Loading Faculty Profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!teacher) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Faculty Member Not Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            The teacher record you are trying to view does not exist or has been removed.
          </p>
          <Link
            href="/teachers"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Directory</span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div id="teacher-profile-canvas" className="p-6 md:p-8 space-y-6">
        
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/teachers"
              className="inline-flex items-center gap-1 text-xs text-slate-505 hover:text-blue-600 font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Directory</span>
            </Link>
            <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2.5">
              <span>Faculty Profile: {teacher.name}</span>
            </h2>
          </div>
          
          <div className="relative shrink-0">
            <div className="inline-flex rounded-lg shadow-sm">
              <button
                onClick={() => handleRegenerateSchedule(true)}
                disabled={regenerating || currentLoads.length === 0}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-l-lg text-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer transition-colors"
                title="Only schedule remaining slots without wiping existing ones"
              >
                <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
                <span>Fill Remaining Only</span>
              </button>
              <button
                type="button"
                onClick={() => setShowGenDropdown(!showGenDropdown)}
                disabled={regenerating || currentLoads.length === 0}
                className="px-2.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-r-lg border-l border-indigo-500 text-sm flex items-center justify-center disabled:opacity-50 cursor-pointer transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {showGenDropdown && (
              <div className="absolute right-0 mt-1.5 w-60 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-20 animate-in fade-in slide-in-from-top-1 duration-150 text-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowGenDropdown(false);
                    handleRegenerateSchedule(true);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-705 hover:bg-slate-50 font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <div>
                    <div className="font-bold">Fill Remaining Only</div>
                    <div className="text-[10px] text-slate-400 font-normal">Place missing hours only</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowGenDropdown(false);
                    if (confirm(`Are you sure you want to regenerate all schedules for ${teacher.name}? This will wipe previous auto-generated entries for this teacher. Manual entries remain safe.`)) {
                      handleRegenerateSchedule(false);
                    }
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-red-700 hover:bg-red-50/50 font-semibold flex items-center gap-2 border-t border-slate-100 cursor-pointer"
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

        {/* Teacher Details Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-3xs grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <span className="text-3xs font-extrabold text-slate-400 uppercase tracking-widest">Specialization Area</span>
            <div className="flex items-center gap-2 mt-1">
              <Award className="w-4.5 h-4.5 text-blue-500" />
              <span className="font-semibold text-slate-800 text-sm">{teacher.specialization}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-3xs font-extrabold text-slate-400 uppercase tracking-widest">Ancillary Coordinator Role</span>
            <div className="flex items-center gap-2 mt-1">
              <Layers className="w-4.5 h-4.5 text-indigo-500" />
              <span className="font-semibold text-slate-805 text-sm">
                {teacher.ancillary_role ? (
                  `${teacher.ancillary_role} (${teacher.ancillary_hours_per_week || 0} Hours)`
                ) : (
                  <span className="text-slate-400 italic">None assigned</span>
                )}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-3xs font-extrabold text-slate-400 uppercase tracking-widest">Weekly Max Teaching Hours</span>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-4.5 h-4.5 text-sky-500" />
              <span className="font-semibold text-slate-805 text-sm">{teacher.max_hours_per_week || 30} Hours / Week</span>
            </div>
          </div>
        </div>

        {/* Out of Sync Warning Banner */}
        {hasOutOfSync && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-250 p-4.5 rounded-xl flex gap-3 text-amber-800">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h4 className="font-bold">Teaching Load Out of Sync Detected</h4>
                <p>
                  Some subject weekly hours have been modified in the curriculum. The current placed schedules do not match the required hours. Please review the options below to resolve these issues.
                </p>
              </div>
            </div>
            {/* Render Out of Sync Panel */}
            <OutOfSyncPanel outOfSyncLoads={outOfSyncLoads} />
          </div>
        )}

        {/* Teaching Load Section */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-5 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <BookOpen className="w-4.5 h-4.5 text-blue-600" />
                <span>Teaching Load Definition</span>
              </h3>
              <p className="text-3xs text-slate-500 font-medium">Assign specific subjects and sections to this teacher's load allotment.</p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Load</span>
            </button>
          </div>

          {currentLoads.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">No teaching loads defined</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Add loads for subjects this teacher is specialized to teach. These will be placed by the scheduler.
              </p>
              <button
                onClick={handleOpenAddModal}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold"
              >
                Create First Load
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-2xs uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3.5 px-6">Subject / Course</th>
                    <th className="py-3.5 px-6">Assigned Section</th>
                    <th className="py-3.5 px-6 text-center">Required Hours</th>
                    <th className="py-3.5 px-6 text-center">Status</th>
                    <th className="py-3.5 px-6 text-center">Placed vs Required</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentLoads.map(load => {
                    let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                    let statusLabel = load.placement_status.replace('_', ' ');

                    if (load.placement_status === 'fully_placed') {
                      badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    } else if (load.placement_status === 'partially_placed') {
                      badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                    } else if (load.placement_status === 'not_placed') {
                      badgeClass = 'bg-red-50 text-red-700 border-red-200';
                    } else if (load.placement_status === 'out_of_sync') {
                      badgeClass = 'bg-purple-50 text-purple-700 border-purple-250 animate-pulse';
                    }

                    return (
                      <tr key={load.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4.5 px-6 font-semibold text-slate-900 border-r border-slate-100">
                          {load.subject?.name || 'Loading subject...'}
                        </td>
                        <td className="py-4.5 px-6 text-slate-700">
                          {load.section ? (
                            <span className="inline-flex items-center bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold uppercase">
                              {load.section.name}
                            </span>
                          ) : (
                            'Loading section...'
                          )}
                        </td>
                        <td className="py-4.5 px-6 text-center font-mono font-bold text-slate-800 border-l border-r border-slate-100">
                          {load.required_hours_per_week}h
                        </td>
                        <td className="py-4.5 px-6 text-center">
                          <span className={`inline-flex items-center border px-2 py-0.5 rounded text-3xs font-extrabold uppercase tracking-wide ${badgeClass}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="py-4.5 px-6 text-center font-semibold text-xs border-l border-r border-slate-100">
                          <div className="space-y-1">
                            <span className={load.placed_hours >= load.required_hours_per_week ? 'text-emerald-600' : 'text-amber-600'}>
                              {load.placed_hours} / {load.required_hours_per_week} Hours
                            </span>
                            <div className="h-1.5 w-24 bg-slate-100 rounded-full mx-auto overflow-hidden">
                              <div
                                className={`h-full ${load.placed_hours >= load.required_hours_per_week ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${Math.min((load.placed_hours / load.required_hours_per_week) * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4.5 px-6 text-right">
                          <button
                            onClick={() => handleDeleteLoad(load.id, load.subject?.name || '', load.section?.name || '')}
                            className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded transition-colors"
                            title="Delete Load"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer total sum */}
          <div className="p-5 bg-slate-50 border-t border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-slate-800 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span>Total Defined Weekly Load:</span>
              <span className="font-mono text-sm px-3 py-1 bg-white border border-slate-200 rounded-md">
                {totalWeeklyLoad} Hours / Week
              </span>
            </div>
          </div>
        </div>

        {/* Add Load Modal Dialog */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4.5 h-4.5 text-blue-600" />
                  <span>Define Teacher Load Assignment</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {sortedSubjects.length === 0 ? (
                <div className="p-6 text-center space-y-3">
                  <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-sm">No subjects found</h4>
                  <p className="text-xs text-slate-505 leading-relaxed">
                    There are no curricular subjects defined in the system.
                  </p>
                  <div className="pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveLoad} className="p-6 space-y-4">
                  <div>
                    <label className="block text-2xs font-bold text-slate-750 uppercase tracking-wider mb-1.5">
                      Subject Course <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-800"
                    >
                      {sortedSubjects.map(sub => {
                        const isMatch = teacher ? checkSpecializationMatch(teacher.specialization, sub.required_specialization) : true;
                        return (
                          <option key={sub.id} value={sub.id}>
                            {sub.name} (Req: {sub.required_specialization}){!isMatch ? ' ⚠️ Mismatch' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-2xs font-bold text-slate-705 uppercase tracking-wider mb-1.5">
                      Target Class Section (Strand-Matched) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedSectionId}
                      onChange={(e) => setSelectedSectionId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-800"
                    >
                      {eligibleSections.length === 0 ? (
                        <option value="">* No sections available for subject strand!</option>
                      ) : (
                        eligibleSections.map(sec => (
                          <option key={sec.id} value={sec.id}>
                            {sec.name} (Shift: {sec.shift})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-2xs font-bold text-slate-705 uppercase tracking-wider mb-1.5">
                      Subject Weekly Hours (Display-only)
                    </label>
                    <div className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-sm font-mono font-bold text-slate-500 select-none">
                      {selectedSubject ? `${selectedSubject.hours_per_week} Hours / Week` : 'Select a subject first'}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedSubjectId || !selectedSectionId}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50"
                    >
                      Save Load
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {showSpecWarning && pendingLoadPayload && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-50 rounded-xl text-amber-600 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-900">Specialization Mismatch</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    The subject <strong className="text-slate-800">{subjects.find(s => s.id === pendingLoadPayload.subject_id)?.name}</strong> requires <strong className="text-slate-800">{subjects.find(s => s.id === pendingLoadPayload.subject_id)?.required_specialization}</strong> specialization.
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    This does not match the teacher's specialization of <strong className="text-slate-800">{teacher.specialization}</strong>.
                  </p>
                  <p className="text-xs text-slate-505 leading-relaxed">
                    Do you want to assign this teaching load anyway?
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSpecWarning(false);
                    setPendingLoadPayload(null);
                  }}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmSaveLoad}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Assign Anyway
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
