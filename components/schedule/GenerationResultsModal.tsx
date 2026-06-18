import React, { useState } from 'react';
import { useApp } from '../../lib/AppContext';
import { TeacherLoad, GenerationResult } from '../../types';
import { X, CheckCircle, AlertTriangle, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Calendar, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ConflictMiniView from './ConflictMiniView';

interface GenerationResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: GenerationResult | null;
  onRegenerateAll?: () => Promise<void>;
}

export default function GenerationResultsModal({
  isOpen,
  onClose,
  results,
  onRegenerateAll
}: GenerationResultsModalProps) {
  const router = useRouter();
  const { refreshPortalData, showToast } = useApp();

  const [fullyPlacedCollapsed, setFullyPlacedCollapsed] = useState(true);
  const [loadingLoadId, setLoadingLoadId] = useState<string | null>(null);
  const [regeneratingAll, setRegeneratingAll] = useState(false);

  // Conflict view states
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [gridTeacherId, setGridTeacherId] = useState('');
  const [gridSectionId, setGridSectionId] = useState('');
  const [gridLoadId, setGridLoadId] = useState('');

  if (!isOpen || !results) return null;

  const handleTryDifferentSlots = async (load: TeacherLoad) => {
    setLoadingLoadId(load.id);
    try {
      const res = await fetch('/api/schedule/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'load',
          teacher_load_id: load.id,
          preserve_existing: false // Fresh placement of this load
        }),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshPortalData();
        showToast(`Successfully re-placed slots for ${load.subject?.name}.`);
        // We can update the local results object if needed, but simple toast and refresh is great.
      } else {
        showToast(data.error || 'Failed to find new slots.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error.', 'error');
    } finally {
      setLoadingLoadId(null);
    }
  };

  const handleViewConflict = (load: TeacherLoad) => {
    setGridTeacherId(load.teacher_id);
    setGridSectionId(load.section_id);
    setGridLoadId(load.id);
    setIsGridOpen(true);
  };

  const handleEditLoad = (load: TeacherLoad) => {
    onClose();
    router.push(`/teachers/${load.teacher_id}`);
  };

  const handleRegenerateAllClick = async () => {
    if (onRegenerateAll) {
      setRegeneratingAll(true);
      try {
        await onRegenerateAll();
      } finally {
        setRegeneratingAll(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-3xl border border-slate-200 overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600 animate-pulse" />
            <h3 className="font-bold text-slate-900 text-sm">Schedule Generation Results</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* GREEN SECTION: Fully Placed */}
          <div className="border border-emerald-200 rounded-xl overflow-hidden shadow-3xs">
            <button
              onClick={() => setFullyPlacedCollapsed(!fullyPlacedCollapsed)}
              className="w-full bg-emerald-50/50 hover:bg-emerald-50 px-4 py-3 flex items-center justify-between text-xs font-bold text-emerald-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{results.fully_placed.length} loads fully placed</span>
              </div>
              {fullyPlacedCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            {!fullyPlacedCollapsed && (
              <div className="bg-white divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {results.fully_placed.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs italic">No loads in this category.</div>
                ) : (
                  results.fully_placed.map(load => (
                    <div key={load.id} className="p-3 text-2xs flex justify-between items-center text-slate-600 font-semibold pl-6">
                      <span>{load.teacher?.name} ({load.subject?.name} &rarr; {load.section?.name})</span>
                      <span className="font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{load.required_hours_per_week}h placed</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* YELLOW SECTION: Partially Placed */}
          <div className="border border-amber-200 rounded-xl overflow-hidden shadow-3xs">
            <div className="bg-amber-50/50 px-4 py-3 flex items-center text-xs font-bold text-amber-800 border-b border-amber-100">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mr-2" />
              <span>{results.partially_placed.length} loads partially placed</span>
            </div>

            <div className="bg-white divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {results.partially_placed.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs italic">No loads in this category.</div>
              ) : (
                results.partially_placed.map(load => {
                  const isLoading = loadingLoadId === load.id;
                  return (
                    <div key={load.id} className="p-4 text-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-slate-700">
                      <div className="space-y-0.5 font-semibold">
                        <div className="text-slate-900 font-bold">{load.teacher?.name}</div>
                        <div>Subject: {load.subject?.name} &middot; Section: {load.section?.name}</div>
                        <div className="text-amber-600 mt-1 font-mono">Needed {load.required_hours_per_week} hrs, placed {load.placed_hours} hrs</div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                        <button
                          onClick={() => handleTryDifferentSlots(load)}
                          disabled={isLoading || regeneratingAll}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 disabled:opacity-50 rounded border border-amber-200 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                          <span>Try Different Slots</span>
                        </button>
                        <button
                          onClick={() => handleViewConflict(load)}
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-slate-650 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>View Conflict</span>
                        </button>
                        <button
                          onClick={() => handleEditLoad(load)}
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-slate-655 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit Load</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RED SECTION: Not Placed */}
          <div className="border border-red-200 rounded-xl overflow-hidden shadow-3xs">
            <div className="bg-red-50/50 px-4 py-3 flex items-center text-xs font-bold text-red-800 border-b border-red-100">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mr-2" />
              <span>{results.not_placed.length} loads not placed</span>
            </div>

            <div className="bg-white divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {results.not_placed.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs italic">No loads in this category.</div>
              ) : (
                results.not_placed.map(load => {
                  const isLoading = loadingLoadId === load.id;
                  return (
                    <div key={load.id} className="p-4 text-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-slate-705">
                      <div className="space-y-0.5 font-semibold">
                        <div className="text-slate-900 font-bold">{load.teacher?.name}</div>
                        <div>Subject: {load.subject?.name} &middot; Section: {load.section?.name}</div>
                        <div className="text-red-650 mt-1 font-mono">0 of {load.required_hours_per_week} hrs placed</div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                        <button
                          onClick={() => handleTryDifferentSlots(load)}
                          disabled={isLoading || regeneratingAll}
                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 disabled:opacity-50 rounded border border-red-200 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                          <span>Try Different Slots</span>
                        </button>
                        <button
                          onClick={() => handleViewConflict(load)}
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-slate-655 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>View Conflict</span>
                        </button>
                        <button
                          onClick={() => handleEditLoad(load)}
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded text-slate-655 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit Load</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleRegenerateAllClick}
            disabled={regeneratingAll}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${regeneratingAll ? 'animate-spin' : ''}`} />
            <span>Regenerate All</span>
          </button>
          
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>

      {/* Grid Modal */}
      <ConflictMiniView
        isOpen={isGridOpen}
        onClose={() => setIsGridOpen(false)}
        teacherId={gridTeacherId}
        sectionId={gridSectionId}
        targetTeacherLoadId={gridLoadId}
        interactive={false}
      />
    </div>
  );
}
