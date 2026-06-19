'use client';

import React, { useState } from 'react';
import { useApp } from '../../lib/AppContext';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  X,
  Sparkles,
  BookOpen,
  Laptop,
  GraduationCap,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { Strand, Section } from '../../types';

export default function StrandsSectionsPage() {
  const {
    strands,
    sections,
    addStrand,
    updateStrand,
    deleteStrand,
    addSection,
    updateSection,
    deleteSection,
  } = useApp();

  // Active highlighted strand to filter sections
  const [selectedStrandId, setSelectedStrandId] = useState<string>(
    strands.length > 0 ? strands[0].id : ''
  );

  // Fallback if none selected but items exist
  const activeStrandId = selectedStrandId || (strands.length > 0 ? strands[0].id : '');
  const activeStrand = strands.find(s => s.id === activeStrandId);

  // Modal Control States
  const [strandModalOpen, setStrandModalOpen] = useState(false);
  const [editingStrand, setEditingStrand] = useState<Strand | null>(null);

  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  // Custom confirmation modal states
  const [strandDeleteConfirmOpen, setStrandDeleteConfirmOpen] = useState(false);
  const [strandToDelete, setStrandToDelete] = useState<{ id: string; name: string } | null>(null);
  const [sectionDeleteConfirmOpen, setSectionDeleteConfirmOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<{ id: string; name: string } | null>(null);

  // Strand Form Fields
  const [strandName, setStrandName] = useState('');
  const [strandType, setStrandType] = useState<'Academic' | 'TechVoc' | 'Non-Academic'>('Academic');
  const [strandGrade, setStrandGrade] = useState<11 | 12>(11);

  // Section Form Fields
  const [sectionName, setSectionName] = useState('');
  const [sectionGrade, setSectionGrade] = useState<11 | 12>(11);

  // Strand CRUD handlers
  const openAddStrand = () => {
    setEditingStrand(null);
    setStrandName('');
    setStrandType('Academic');
    setStrandGrade(11);
    setStrandModalOpen(true);
  };

  const openEditStrand = (strand: Strand) => {
    setEditingStrand(strand);
    setStrandName(strand.name);
    setStrandType(strand.type);
    setStrandGrade(strand.grade_level);
    setStrandModalOpen(true);
  };

  const handleStrandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!strandName) return;

    const payload = {
      name: strandName,
      type: strandType,
      grade_level: Number(strandGrade) as 11 | 12,
    };

    if (editingStrand) {
      updateStrand(editingStrand.id, payload);
    } else {
      addStrand(payload);
    }
    setStrandModalOpen(false);
  };

  const handleStrandDelete = (id: string, name: string) => {
    setStrandToDelete({ id, name });
    setStrandDeleteConfirmOpen(true);
  };

  // Section CRUD handlers
  const openAddSection = () => {
    if (!activeStrand) return;
    setEditingSection(null);
    setSectionName('');
    setSectionGrade(activeStrand.grade_level); // Default match focused strand's grade level
    setSectionModalOpen(true);
  };

  const openEditSection = (section: Section) => {
    setEditingSection(section);
    setSectionName(section.name);
    setSectionGrade(section.grade_level);
    setSectionModalOpen(true);
  };

  const handleSectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionName || !activeStrandId) return;

    const payload = {
      name: sectionName,
      strand_id: activeStrandId,
      grade_level: Number(sectionGrade) as 11 | 12,
    };

    if (editingSection) {
      updateSection(editingSection.id, payload);
    } else {
      addSection(payload);
    }
    setSectionModalOpen(false);
  };

  const handleSectionDelete = (id: string, name: string) => {
    setSectionToDelete({ id, name });
    setSectionDeleteConfirmOpen(true);
  };

  // Categorize sections for active strand
  const activeSections = sections.filter(s => s.strand_id === activeStrandId);

  return (
    <DashboardLayout>
      <div id="strands-module-canvas" className="p-6 md:p-8 space-y-6">
        
        {/* Module Header */}
        <div>
          <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2.5">
            <LayoutGrid className="w-6 h-6 text-blue-600" />
            <span>Strands & Sections Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Control courses, grade structures, classes, and shifts.</p>
        </div>

        {/* Two Panel Grid Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: Strands directory */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Layers className="w-4.5 h-4.5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Course Strands</h3>
              </div>
              <button
                onClick={openAddStrand}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 flex items-center gap-1 cursor-pointer transition-colors shadow-3xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Strand</span>
              </button>
            </div>

            <div className="p-4 space-y-3">
              {strands.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <p className="text-xs font-mono">No strands found. Click "Add Strand".</p>
                </div>
              ) : (
                strands.map(strand => {
                  const isActive = strand.id === activeStrandId;
                  const sectionCount = sections.filter(s => s.strand_id === strand.id).length;
                  
                  return (
                    <div
                      key={strand.id}
                      onClick={() => setSelectedStrandId(strand.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer relative group flex justify-between items-start ${
                        isActive
                          ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600/30 shadow-3xs'
                          : 'border-slate-200 bg-white hover:border-slate-350 hover:bg-slate-50/20'
                      }`}
                    >
                      <div className="space-y-1.5 pr-4 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">
                            {strand.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center text-3xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wide">
                            {strand.type}
                          </span>
                          <span className="inline-flex items-center text-3xs font-extrabold bg-blue-100 text-blue-800 px-2 py-0.5 rounded uppercase tracking-wide">
                            Grade {strand.grade_level}
                          </span>
                          <span className="inline-flex items-center text-3xs font-semibold text-slate-500">
                            {sectionCount} Sections handling
                          </span>
                        </div>
                      </div>

                      {/* Strand Action Buttons */}
                      <div className="flex items-center gap-1 relative z-10 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditStrand(strand);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit Strand"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStrandDelete(strand.id, strand.name);
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete Strand"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Sections list of active strand */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-900 text-sm">
                  {activeStrand ? `Sections: ${activeStrand.name}` : 'Sections Timetable'}
                </h3>
                <p className="text-3xs text-slate-500">Classrooms assigned to active courses and shifts</p>
              </div>
              <button
                onClick={openAddSection}
                disabled={!activeStrand}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors shadow-3xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Section</span>
              </button>
            </div>

            <div className="p-6">
              {!activeStrand ? (
                <div className="py-12 border-2 border-dashed border-slate-150 rounded-xl flex flex-col items-center justify-center text-center">
                  <GraduationCap className="w-10 h-10 text-slate-300" />
                  <p className="text-xs text-slate-500 mt-2">Please select or register a strand on the left panel to review its active sections.</p>
                </div>
              ) : activeSections.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-slate-150 rounded-xl flex flex-col items-center justify-center text-center">
                  <GraduationCap className="w-10 h-10 text-slate-300" />
                  <h5 className="font-bold text-slate-800 text-xs mt-3">No sections nested under this strand</h5>
                  <p className="text-3xs text-slate-400 max-w-sm mt-1 leading-relaxed">Sections partition students into morning/afternoon groups. Add your first section.</p>
                  <button
                    onClick={openAddSection}
                    className="mt-4 px-3.5 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-2xs font-semibold shadow-xs"
                  >
                    Add Sec to {activeStrand.name}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeSections.map(section => {
                    // Shift styling
                    const isMorning = section.grade_level === 11;
                    const shiftBadge = isMorning
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-indigo-50 border-indigo-200 text-indigo-800';

                    return (
                      <div
                        key={section.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/20 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-1.5">
                            <h5 className="font-bold text-slate-800 text-xs sm:text-sm tracking-tight">{section.name}</h5>
                            <span className={`inline-flex items-center gap-1.5 text-3xs font-bold border rounded px-1.5 py-0.5 ${shiftBadge} shrink-0`}>
                              <Clock className="w-3 h-3" />
                              {section.shift} ({isMorning ? 'A.M.' : 'P.M.'})
                            </span>
                          </div>
                          
                          <div className="flex gap-2 items-center flex-wrap">
                            <span className="text-3xs text-slate-400 font-mono font-bold leading-none">Grade Level {section.grade_level}</span>
                          </div>
                        </div>

                        {/* Section Actions */}
                        <div className="flex items-center justify-end gap-1.5 border-t border-slate-100 mt-4 pt-3">
                          <button
                            onClick={() => openEditSection(section)}
                            className="p-1 px-2 text-slate-505 hover:text-blue-600 hover:bg-blue-50 text-3xs font-bold border border-slate-150 rounded flex items-center gap-1"
                            title="Edit section"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => handleSectionDelete(section.id, section.name)}
                            className="p-1 px-2 text-slate-505 hover:text-red-600 hover:bg-red-50 text-3xs font-bold border border-slate-150 rounded flex items-center gap-1"
                            title="Delete section"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* STRAND ACTION MODAL */}
        {strandModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingStrand ? `Edit Strand: ${editingStrand.name}` : 'Create Strand Track'}
                </h3>
                <button
                  type="button"
                  className="p-1 text-slate-400 hover:text-slate-600"
                  onClick={() => setStrandModalOpen(false)}
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleStrandSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Strand Track Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. STEM (Science and Tech)"
                    value={strandName}
                    onChange={(e) => setStrandName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Track Classification <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={strandType}
                    onChange={(e) => setStrandType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  >
                    <option value="Academic">Academic (STEM/ABM/HUMSS/GAS)</option>
                    <option value="TechVoc">TechVoc (TVL-ICT/IA/HE)</option>
                    <option value="Non-Academic">Non-Academic (Sports/Arts)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Default Grade Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={strandGrade}
                    onChange={(e) => setStrandGrade(Number(e.target.value) as 11 | 12)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  >
                    <option value={11}>Grade 11 (Morning Shift)</option>
                    <option value={12}>Grade 12 (Afternoon Shift)</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setStrandModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    Save Strand
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SECTION ACTION MODAL */}
        {sectionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingSection ? `Edit Section: ${editingSection.name}` : `Create Section for ${activeStrand?.name}`}
                </h3>
                <button
                  type="button"
                  onClick={() => setSectionModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleSectionSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Section / Room Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Einstein, Chevron, Socrates"
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-2xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Grade & Shift Assignment
                  </label>
                  <select
                    value={sectionGrade}
                    onChange={(e) => setSectionGrade(Number(e.target.value) as 11 | 12)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-250 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  >
                    <option value={11}>Grade 11 - assigned to MORNING Shift (6:00 AM – 12:00 PM)</option>
                    <option value={12}>Grade 12 - assigned to AFTERNOON Shift (12:30 PM – 6:30 PM)</option>
                  </select>
                  <p className="text-3xs text-slate-400 mt-1.5 italic">Note: School administrative shifts are permanently locked: G11 morning, G12 afternoon.</p>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSectionModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    Save Section
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmationModal
          isOpen={strandDeleteConfirmOpen}
          title="Delete Strand Track"
          message={`CRITICAL: Deleting Strand "${strandToDelete?.name}" will permanently clear all associated Sections, Subjects, and timetable entries under this strand. Do you want to proceed?`}
          confirmLabel="Delete Track"
          cancelLabel="Cancel"
          severity="danger"
          onConfirm={() => {
            if (strandToDelete) {
              deleteStrand(strandToDelete.id);
              if (selectedStrandId === strandToDelete.id) {
                setSelectedStrandId('');
              }
            }
          }}
          onClose={() => {
            setStrandDeleteConfirmOpen(false);
            setStrandToDelete(null);
          }}
        />

        <ConfirmationModal
          isOpen={sectionDeleteConfirmOpen}
          title="Delete Class Section"
          message={`Remove Section timetable for "${sectionToDelete?.name}"?`}
          confirmLabel="Delete Section"
          cancelLabel="Cancel"
          severity="danger"
          onConfirm={() => {
            if (sectionToDelete) {
              deleteSection(sectionToDelete.id);
            }
          }}
          onClose={() => {
            setSectionDeleteConfirmOpen(false);
            setSectionToDelete(null);
          }}
        />

      </div>
    </DashboardLayout>
  );
}
