'use client';

import React, { useState } from 'react';
import { useApp } from '../../lib/AppContext';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  BookOpen,
  Briefcase,
  Sliders,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Teacher } from '../../types';

export default function TeachersPage() {
  const { teachers, addTeacher, updateTeacher, deleteTeacher, scheduleEntries, timeSlots } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [ancillaryRole, setAncillaryRole] = useState('');
  const [maxHours, setMaxHours] = useState<number>(30);
  const [ancillaryHours, setAncillaryHours] = useState<number>(4);

  const openAddModal = () => {
    setEditingTeacher(null);
    setName('');
    setSpecialization('');
    setAncillaryRole('');
    setMaxHours(30);
    setAncillaryHours(4);
    setModalOpen(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setName(teacher.name);
    setSpecialization(teacher.specialization);
    setAncillaryRole(teacher.ancillary_role || '');
    setMaxHours(teacher.max_hours_per_week);
    setAncillaryHours(teacher.ancillary_hours_per_week || 0);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !specialization) return;

    const payload = {
      name,
      specialization,
      ancillary_role: ancillaryRole || undefined,
      max_hours_per_week: Number(maxHours),
      ancillary_hours_per_week: Number(ancillaryHours),
    };

    if (editingTeacher) {
      updateTeacher(editingTeacher.id, payload);
    } else {
      addTeacher(payload);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete teacher "${name}"? This removes any associated schedules.`)) {
      deleteTeacher(id);
    }
  };

  // Compute teaching hours for each teacher
  const getTeachingHours = (teacherId: string) => {
    const activeEntries = scheduleEntries.filter(e => e.teacher_id === teacherId);
    let mins = 0;
    activeEntries.forEach(entry => {
      const slot = timeSlots.find(s => s.id === entry.time_slot_id);
      if (slot && !slot.is_recess) {
        mins += slot.duration_minutes;
      }
    });
    return mins / 60;
  };

  const filteredTeachers = teachers.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.ancillary_role && t.ancillary_role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div id="teachers-module-canvas" className="p-6 md:p-8 space-y-6">
        
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2.5">
              <Users className="w-6 h-6 text-blue-600" />
              <span>Faculty Directory</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Register, edit, and audit teacher specializations and load allotments.</p>
          </div>
          <button
            onClick={openAddModal}
            className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Add Teacher</span>
          </button>
        </div>

        {/* Filters and search box */}
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-3xs flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search faculty members by name, specialization, or coordinator roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Teachers Directory Board */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          {filteredTeachers.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-12 h-12 text-slate-350 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm mt-3">No teachers matching "{searchQuery}"</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mt-1">Please try searching another name, or add your first master-list record.</p>
              <button
                onClick={openAddModal}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Register Teacher
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table id="teachers-table" className="min-w-full text-sm text-left">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-2xs uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3.5 px-6">Name</th>
                    <th className="py-3.5 px-6">Specialization Area</th>
                    <th className="py-3.5 px-6">Ancillary Role / Assignment</th>
                    <th className="py-3.5 px-6 text-center">Load Status (Hours/Week)</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeachers.map((teacher, idx) => {
                    const teachingHours = getTeachingHours(teacher.id);
                    const ancHours = teacher.ancillary_hours_per_week || 0;
                    const combined = teachingHours + ancHours;
                    const max = teacher.max_hours_per_week || 30;

                    // Compute visual percentages
                    const percent = Math.min((combined / max) * 100, 100);
                    let barColor = 'bg-blue-500';
                    let loadBadge = 'border-blue-200 bg-blue-50 text-blue-800';

                    if (combined > max) {
                      barColor = 'bg-red-500';
                      loadBadge = 'border-red-200 bg-red-50 text-red-800';
                    } else if (combined >= max - 5) {
                      barColor = 'bg-amber-500';
                      loadBadge = 'border-amber-200 bg-amber-50 text-amber-800';
                    }

                    return (
                      <tr key={teacher.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-slate-50/50 transition-colors`}>
                        {/* Name Block */}
                        <td className="py-4.5 px-6 font-semibold text-slate-900 border-r border-slate-100">
                          {teacher.name}
                        </td>
                        
                        {/* Specialization */}
                        <td className="py-4.5 px-6">
                          <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/80 text-xs font-semibold">
                            <BookOpen className="w-3 h-3 text-blue-500" />
                            {teacher.specialization}
                          </span>
                        </td>

                        {/* Ancillary Assignment */}
                        <td className="py-4.5 px-6 font-medium text-slate-500">
                          {teacher.ancillary_role ? (
                            <span className="inline-flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs border border-indigo-100">
                              <Briefcase className="w-3 h-3" />
                              {teacher.ancillary_role} <span className="text-3xs text-indigo-400 font-mono">({ancHours}h)</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">No ancillary assigned</span>
                          )}
                        </td>

                        {/* Loading Hours Tracker progress bar */}
                        <td className="py-4.5 px-6 border-l border-r border-slate-100 max-w-xs">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-3xs font-bold border ${loadBadge}`}>
                                {combined.toFixed(1)} / {max} Hours
                              </span>
                              {combined > max && (
                                <span className="inline-flex items-center gap-0.5 text-red-600 text-3xs font-bold uppercase tracking-wider animate-pulse">
                                  <AlertCircle className="w-3.5 h-3.5" /> Overloaded
                                </span>
                              )}
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${barColor}`} style={{ width: `${percent}%` }}></div>
                            </div>
                            <div className="flex justify-between items-center text-3xs text-slate-400">
                              <span>Teach: {teachingHours}h</span>
                              <span>Ancil: {ancHours}h</span>
                            </div>
                          </div>
                        </td>

                        {/* Action buttons */}
                        <td className="py-4.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(teacher)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit teacher settings"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(teacher.id, teacher.name)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Remove teacher from roster"
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

        {/* Modal Sheet overlay */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600 animate-pulse" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingTeacher ? `Edit Faculty: ${editingTeacher.name}` : 'Register Faculty Member'}
                  </h3>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-full transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Form Input fields */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Teacher Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria Clara Santos, PhD"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Primary Specialization <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Science / STEM, TVL-ICT, Mathematics"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                  <p className="text-3xs text-slate-400 mt-1.5">Input core focus area to run against subject specialization checkers.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Coordinator / Ancillary Role
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Grade 11 Representative"
                      value={ancillaryRole}
                      onChange={(e) => setAncillaryRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Ancillary Weekly Hours
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={40}
                      value={ancillaryHours}
                      onChange={(e) => setAncillaryHours(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Max Allowed Hours Per Week <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Sliders className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="number"
                      required
                      min={10}
                      max={60}
                      value={maxHours}
                      onChange={(e) => setMaxHours(Math.max(10, parseInt(e.target.value) || 30))}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-250 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-mono"
                    />
                  </div>
                  <p className="text-3xs text-slate-400 mt-1.5">Department guideline suggests 30 hours per week maximum for standard teaching items.</p>
                </div>

                {/* Footer submit controls */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Save Faculty Record</span>
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
