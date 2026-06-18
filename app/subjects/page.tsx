'use client';

import React, { useState } from 'react';
import { useApp } from '../../lib/AppContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  BookMarked,
  Layers,
  Award,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Subject } from '../../types';

export default function SubjectsPage() {
  const { subjects, strands, addSubject, updateSubject, deleteSubject, teachers, teacherLoads, refreshPortalData } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Warning Modal States
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [affectedLoads, setAffectedLoads] = useState<any[]>([]);
  const [pendingPayload, setPendingPayload] = useState<any>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [strandId, setStrandId] = useState('');
  const [spec, setSpec] = useState('');
  const [hours, setHours] = useState<number>(4);

  const openAddModal = () => {
    setEditingSubject(null);
    setName('');
    // Prefill with first strand if exists
    setStrandId(strands.length > 0 ? strands[0].id : '');
    setSpec('General');
    setHours(4);
    setModalOpen(true);
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setName(subject.name);
    setStrandId(subject.strand_id);
    setSpec(subject.required_specialization);
    setHours(subject.hours_per_week);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !strandId || !spec) return;

    const payload = {
      name,
      strand_id: strandId,
      required_specialization: spec,
      hours_per_week: Number(hours),
    };

    if (editingSubject) {
      if (Number(hours) !== editingSubject.hours_per_week) {
        const loads = teacherLoads.filter(l => l.subject_id === editingSubject.id);
        if (loads.length > 0) {
          setAffectedLoads(loads);
          setPendingPayload(payload);
          setShowWarningModal(true);
          return;
        }
      }
      updateSubject(editingSubject.id, payload);
    } else {
      addSubject(payload);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove Subject course "${name}"? This will clear any timetable slots representing this course.`)) {
      deleteSubject(id);
    }
  };

  // Fuzzy matches
  const filteredSubjects = subjects.filter(sub => {
    const parentStrand = strands.find(s => s.id === sub.strand_id);
    const strandName = parentStrand ? parentStrand.name : '';
    
    return (
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.required_specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      strandName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <DashboardLayout>
      <div id="subjects-module-canvas" className="p-6 md:p-8 space-y-6">
        
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <span>Subjects Directory</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Configure high school subjects, weekly workloads, and academic specializations.</p>
          </div>
          <button
            onClick={openAddModal}
            className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Add Subject</span>
          </button>
        </div>

        {/* Search filter panel */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search subjects by course name, parent strand, or required specialization area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Subjects Table Area */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          {strands.length === 0 ? (
            <div className="py-16 text-center">
              <Layers className="w-12 h-12 text-slate-350 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm mt-3">Strands List Empty</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mt-1">
                You must configure at least one Strand track (e.g. STEM or ABM) before adding curricular subjects.
              </p>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="py-16 text-center">
              <BookMarked className="w-12 h-12 text-slate-350 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm mt-3">No subjects matching search criteria</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mt-1">Please try modifying your query, or create a brand new subject entry.</p>
              <button
                onClick={openAddModal}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Add Subject Line
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table id="subjects-table" className="min-w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-2xs uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3.5 px-6">Subject Name</th>
                    <th className="py-3.5 px-6">Associated Strand / Track</th>
                    <th className="py-3.5 px-6">Required Instructor Specialization</th>
                    <th className="py-3.5 px-6 text-center">Hours / Week Limit</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubjects.map((sub, idx) => {
                    const parentStrand = strands.find(s => s.id === sub.strand_id);
                    const isAcademic = parentStrand?.type === 'Academic';

                    return (
                      <tr key={sub.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'} hover:bg-slate-50/40 transition-all font-sans`}>
                        {/* Name */}
                        <td className="py-4 px-6 font-bold text-slate-900 border-r border-slate-100">
                          {sub.name}
                        </td>

                        {/* Parent Track */}
                        <td className="py-4 px-6">
                          {parentStrand ? (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold border ${
                              isAcademic
                                ? 'bg-indigo-50 border-indigo-150 text-indigo-700'
                                : 'bg-amber-50 border-amber-150 text-amber-700'
                            }`}>
                              <Layers className="w-3 h-3" />
                              {parentStrand.name} <span className="text-3xs opacity-80">(G{parentStrand.grade_level})</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Strand unlinked</span>
                          )}
                        </td>

                        {/* Specialization Required */}
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded text-xs font-semibold text-slate-700">
                            <Award className="w-3.5 h-3.5 text-blue-500" />
                            {sub.required_specialization}
                          </span>
                        </td>

                        {/* Week Hours */}
                        <td className="py-4 px-6 text-center border-l border-r border-slate-100">
                          <span className="inline-flex items-center gap-1 text-slate-800 bg-sky-50 border border-sky-150 px-2.5 py-0.5 rounded text-xs font-bold font-mono">
                            <Clock className="w-3 h-3 text-sky-600" />
                            {sub.hours_per_week} Hours
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(sub)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(sub.id, sub.name)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Window Overlays */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingSubject ? `Edit Subject: ${editingSubject.name}` : 'Register Curricular Subject'}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Subject Course Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. General Mathematics, Empowerment Technologies"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Associated StrandTrack <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={strandId}
                    onChange={(e) => setStrandId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-bold text-slate-800"
                  >
                    {strands.map(str => (
                      <option key={str.id} value={str.id}>
                        {str.name} (Grade {str.grade_level})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Required Faculty Specialization <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics, Science / STEM, TVL-ICT / Computer Systems"
                    value={spec}
                    onChange={(e) => setSpec(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                  <p className="text-3xs text-slate-400 mt-1">This validates if teacher specializations align with course items.</p>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Required Hours per Week <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={hours}
                    onChange={(e) => setHours(Math.max(1, parseInt(e.target.value) || 4))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-mono"
                  />
                  <p className="text-3xs text-slate-400 mt-1 italic">Standard DepEd subjects generally take 4 or 8 hours per week representation.</p>
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
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    Save Subject
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Out of Sync Warning Modal */}
        {showWarningModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 overflow-hidden shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
                <h3 className="font-bold text-slate-905 text-sm">Curricular Hours Modification</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                This subject is currently assigned to <strong>{affectedLoads.length}</strong> active teacher workloads. 
                Changing weekly hours from <strong>{editingSubject?.hours_per_week}h</strong> to <strong>{pendingPayload?.hours_per_week}h</strong> will mark these workloads as <strong>'Out of Sync'</strong> and require manual adjustments.
              </p>
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Affected Faculty & Sections:</span>
                <ul className="text-3xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-32 overflow-y-auto space-y-1.5">
                  {affectedLoads.map(load => (
                    <li key={load.id} className="flex items-center gap-1.5 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      <span>{load.teacher?.name || 'Unknown Faculty'} &rarr; {load.section?.name || 'Unknown Section'}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowWarningModal(false);
                    setPendingPayload(null);
                    setAffectedLoads([]);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (editingSubject && pendingPayload) {
                      // 1. Update the subject
                      await updateSubject(editingSubject.id, pendingPayload);
                      // 2. Update affected teacher loads
                      await Promise.all(
                        affectedLoads.map(async (load) => {
                          await fetch(`/api/teacher-loads/${load.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              required_hours_per_week: pendingPayload.hours_per_week,
                              placement_status: 'out_of_sync'
                            })
                          });
                        })
                      );
                      // 3. Sync client state
                      await refreshPortalData();
                    }
                    setShowWarningModal(false);
                    setPendingPayload(null);
                    setAffectedLoads([]);
                    setModalOpen(false);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Confirm Change
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
