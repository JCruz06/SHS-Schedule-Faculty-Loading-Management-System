import React, { useState } from 'react';
import { useApp } from '../../lib/AppContext';
import { TeacherLoad } from '../../types';
import { AlertTriangle, RefreshCw, Trash2, Calendar, LayoutGrid } from 'lucide-react';
import ConflictMiniView from './ConflictMiniView';

interface OutOfSyncPanelProps {
  outOfSyncLoads: TeacherLoad[];
}

export default function OutOfSyncPanel({ outOfSyncLoads }: OutOfSyncPanelProps) {
  const { refreshPortalData, showToast } = useApp();
  const [loadingLoadId, setLoadingLoadId] = useState<string | null>(null);

  // Modal control states
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [gridTeacherId, setGridTeacherId] = useState('');
  const [gridSectionId, setGridSectionId] = useState('');
  const [gridLoadId, setGridLoadId] = useState('');
  const [gridInteractive, setGridInteractive] = useState(false);
  const [excessHours, setExcessHours] = useState(0);

  const handleAddRemaining = async (load: TeacherLoad) => {
    setLoadingLoadId(load.id);
    try {
      const res = await fetch('/api/schedule/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'load',
          teacher_load_id: load.id,
          preserve_existing: true,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshPortalData();
        showToast(`Successfully placed remaining hours for ${load.subject?.name || 'subject'}.`);
      } else {
        showToast(data.error || 'Failed to auto-place remaining hours.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error.', 'error');
    } finally {
      setLoadingLoadId(null);
    }
  };

  const handleRemoveRegenerate = async (load: TeacherLoad) => {
    if (!confirm(`Are you sure you want to remove ALL current schedule entries for ${load.subject?.name} (${load.section?.name}) and reset status to pending?`)) {
      return;
    }
    setLoadingLoadId(load.id);
    try {
      // 1. Wipe schedules
      const delRes = await fetch(`/api/schedule?teacher_load_id=${load.id}`, {
        method: 'DELETE',
      });

      if (!delRes.ok) {
        const delData = await delRes.json();
        showToast(delData.error || 'Failed to clear current schedules.', 'error');
        setLoadingLoadId(null);
        return;
      }

      // 2. Set status to pending in DB
      const updRes = await fetch(`/api/teacher-loads/${load.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placement_status: 'pending',
        }),
      });

      if (updRes.ok) {
        await refreshPortalData();
        showToast(`Schedules cleared. Load status reset to Pending.`);
      } else {
        const updData = await updRes.json();
        showToast(updData.error || 'Failed to update load status.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error.', 'error');
    } finally {
      setLoadingLoadId(null);
    }
  };

  const handleOpenGrid = (load: TeacherLoad, interactive: boolean) => {
    setGridTeacherId(load.teacher_id);
    setGridSectionId(load.section_id);
    setGridLoadId(load.id);
    setGridInteractive(interactive);
    setExcessHours(interactive ? Math.max(0, load.placed_hours - load.required_hours_per_week) : 0);
    setIsGridOpen(true);
  };

  const handleCloseGrid = async () => {
    setIsGridOpen(false);
    await refreshPortalData(); // Refresh to catch any removed slots
  };

  return (
    <div className="space-y-4">
      {outOfSyncLoads.map(load => {
        const isIncreased = load.required_hours_per_week > load.placed_hours;
        const diff = Math.abs(load.required_hours_per_week - load.placed_hours);
        const isLoading = loadingLoadId === load.id;

        return (
          <div
            key={load.id}
            className="bg-white rounded-2xl border border-purple-200 shadow-sm p-5 space-y-4 relative overflow-hidden"
          >
            {/* Accent tag */}
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-purple-500"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-3xs font-extrabold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 uppercase tracking-wide">
                    Out of Sync
                  </span>
                  <h4 className="font-bold text-slate-800 text-sm">
                    {load.teacher?.name || 'Faculty Member'}
                  </h4>
                </div>
                <p className="text-xs text-slate-550">
                  Subject: <strong>{load.subject?.name}</strong> &middot; Section: <strong>{load.section?.name}</strong>
                </p>
                <div className="text-2xs font-semibold text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
                  <span>Required: {load.required_hours_per_week}h</span>
                  <span>&bull;</span>
                  <span>Currently Placed: {load.placed_hours}h</span>
                </div>
              </div>

              {/* Status helper text */}
              <div className="text-right text-xs shrink-0 self-start sm:self-center">
                {isIncreased ? (
                  <span className="inline-flex items-center gap-1.5 text-indigo-750 font-bold bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-indigo-550 shrink-0" />
                    Needs +{diff.toFixed(1)} Hours
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-amber-750 font-bold bg-amber-50 border border-amber-100 px-3 py-1 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-amber-550 shrink-0" />
                    Has -{diff.toFixed(1)} Excess Hours
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons Panel */}
            <div className="flex flex-wrap items-center gap-3 pl-2 pt-2 border-t border-slate-100">
              {isIncreased ? (
                <button
                  onClick={() => handleAddRemaining(load)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Add Remaining {diff.toFixed(1)} Hrs</span>
                </button>
              ) : (
                <button
                  onClick={() => handleOpenGrid(load, true)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>Choose Which Slots to Remove</span>
                </button>
              )}

              <button
                onClick={() => handleRemoveRegenerate(load)}
                disabled={isLoading}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-650 disabled:opacity-50 border border-red-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>Remove & Regenerate</span>
              </button>

              <button
                onClick={() => handleOpenGrid(load, false)}
                disabled={isLoading}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 disabled:opacity-50 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
              >
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                <span>View Current Schedule</span>
              </button>
            </div>
          </div>
        );
      })}

      {/* Grid Modal */}
      <ConflictMiniView
        isOpen={isGridOpen}
        onClose={handleCloseGrid}
        teacherId={gridTeacherId}
        sectionId={gridSectionId}
        targetTeacherLoadId={gridLoadId}
        interactive={gridInteractive}
        excessHours={excessHours}
      />
    </div>
  );
}
