'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Teacher, Strand, Section, Subject, TimeSlot, ScheduleEntry, ConflictResult, TeacherLoad } from '../types';
import { runConflictChecks } from './validations';
import { createClient } from './supabase';

interface AppContextType {
  teachers: Teacher[];
  strands: Strand[];
  sections: Section[];
  subjects: Subject[];
  timeSlots: TimeSlot[];
  scheduleEntries: ScheduleEntry[];
  teacherLoads: TeacherLoad[];
  conflicts: ConflictResult[];
  
  // Auth state
  user: { email: string; name: string } | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;

  // CRUD actions
  addTeacher: (teacher: Omit<Teacher, 'id'>) => Promise<void>;
  updateTeacher: (id: string, teacher: Partial<Teacher>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;

  addStrand: (strand: Omit<Strand, 'id'>) => Promise<void>;
  updateStrand: (id: string, strand: Partial<Strand>) => Promise<void>;
  deleteStrand: (id: string) => Promise<void>;

  addSection: (section: Omit<Section, 'id' | 'shift'>) => Promise<void>;
  updateSection: (id: string, section: Partial<Section>) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;

  addSubject: (subject: Omit<Subject, 'id'>) => Promise<void>;
  updateSubject: (id: string, subject: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;

  addTeacherLoad: (load: { teacher_id: string; subject_id: string; section_id: string }) => Promise<void>;
  deleteTeacherLoad: (id: string) => Promise<void>;
  regenerateTeacherSchedule: (teacherId: string, preserveExisting?: boolean) => Promise<any>;
  regenerateAllSchedules: (preserveExisting?: boolean) => Promise<any>;

  saveScheduleEntry: (entry: Omit<ScheduleEntry, 'id'>) => Promise<{ success: boolean; error?: string }>;
  deleteScheduleEntryById: (id: string) => Promise<void>;
  clearScheduleEntry: (day: string, timeSlotId: string, criteriaId: string, viewBy: 'teacher' | 'section') => Promise<void>;
  clearAllSchedules: () => Promise<void>;
  reseedDatabase: () => Promise<void>;
  refreshPortalData: () => Promise<void>;

  isLoading: boolean;

  // Toast notifications
  toasts: { id: string; message: string; type: 'success' | 'warning' | 'error' }[];
  showToast: (message: string, type?: 'success' | 'warning' | 'error') => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const supabase = createClient();

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [strands, setStrands] = useState<Strand[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [teacherLoads, setTeacherLoads] = useState<TeacherLoad[]>([]);
  const [conflicts, setConflicts] = useState<ConflictResult[]>([]);
  
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'warning' | 'error' }[]>([]);

  const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Helper to load all data from API endpoints
  const loadAllData = async () => {
    try {
      const [
        teachersRes,
        strandsRes,
        sectionsRes,
        subjectsRes,
        slotsRes,
        schedulesRes,
        teacherLoadsRes
      ] = await Promise.all([
        fetch('/api/teachers'),
        fetch('/api/strands'),
        fetch('/api/sections'),
        fetch('/api/subjects'),
        fetch('/api/time-slots'),
        fetch('/api/schedule'),
        fetch('/api/teacher-loads'),
      ]);

      if (teachersRes.ok) setTeachers(await teachersRes.json());
      if (strandsRes.ok) setStrands(await strandsRes.json());
      if (sectionsRes.ok) setSections(await sectionsRes.json());
      if (subjectsRes.ok) setSubjects(await subjectsRes.json());
      if (slotsRes.ok) setTimeSlots(await slotsRes.json());
      if (schedulesRes.ok) setScheduleEntries(await schedulesRes.json());
      if (teacherLoadsRes.ok) setTeacherLoads(await teacherLoadsRes.json());
    } catch (err) {
      console.error('Failed to load portal data:', err);
      showToast('Error syncing with backend database.', 'error');
    }
  };

  // Check auth session and fetch initial datasets
  useEffect(() => {
    const initializeAuthAndData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({
            email: session.user.email || '',
            name: session.user.email?.split('@')[0] || 'Admin',
          });
          await loadAllData();
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error during initial session check:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuthAndData();

    // Set up session listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email || '',
          name: session.user.email?.split('@')[0] || 'Admin',
        });
        await loadAllData();
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Compute conflict report validation locally when dependencies change
  useEffect(() => {
    if (isLoading) return;
    const conflictResults = runConflictChecks({
      teachers,
      strands,
      sections,
      subjects,
      timeSlots,
      scheduleEntries,
      teacherLoads,
    });
    setConflicts(conflictResults);
  }, [teachers, strands, sections, subjects, timeSlots, scheduleEntries, teacherLoads, isLoading]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { success: false, error: error.message };
      }
      if (data.user) {
        setUser({
          email: data.user.email || '',
          name: data.user.email?.split('@')[0] || 'Admin',
        });
        await loadAllData();
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Authentication error.' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push('/auth/login');
    } catch (e) {
      console.error('Sign out error:', e);
    }
  };

  // CRUD Implementations
  const addTeacher = async (teacher: Omit<Teacher, 'id'>) => {
    try {
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacher),
      });
      const data = await res.json();
      if (res.ok) {
        setTeachers(prev => [...prev, data]);
        showToast(`Teacher "${data.name}" successfully added.`);
      } else {
        showToast(data.error || 'Failed to add teacher.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error.', 'error');
    }
  };

  const updateTeacher = async (id: string, updated: Partial<Teacher>) => {
    try {
      const res = await fetch(`/api/teachers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (res.ok) {
        setTeachers(prev => prev.map(t => (t.id === id ? data : t)));
        showToast(`Teacher "${data.name}" successfully updated.`);
      } else {
        showToast(data.error || 'Failed to update teacher.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error.', 'error');
    }
  };

  const deleteTeacher = async (id: string) => {
    try {
      const res = await fetch(`/api/teachers/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTeachers(prev => prev.filter(t => t.id !== id));
        setScheduleEntries(prev => prev.filter(s => s.teacher_id !== id));
        const tObj = teachers.find(t => t.id === id);
        showToast(`Teacher "${tObj?.name || ''}" deleted. Associated schedules removed.`, 'warning');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete teacher.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error.', 'error');
    }
  };

  const addStrand = async (strand: Omit<Strand, 'id'>) => {
    try {
      const res = await fetch('/api/strands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(strand),
      });
      const data = await res.json();
      if (res.ok) {
        setStrands(prev => [...prev, data]);
        showToast(`Strand "${data.name}" successfully added.`);
      } else {
        showToast(data.error || 'Failed to add strand.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error.', 'error');
    }
  };

  const updateStrand = async (id: string, updated: Partial<Strand>) => {
    try {
      const res = await fetch(`/api/strands/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (res.ok) {
        setStrands(prev => prev.map(s => (s.id === id ? data : s)));
        showToast(`Strand "${data.name}" successfully updated.`);
      } else {
        showToast(data.error || 'Failed to update strand.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error.', 'error');
    }
  };

  const deleteStrand = async (id: string) => {
    try {
      const res = await fetch(`/api/strands/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setStrands(prev => prev.filter(s => s.id !== id));
        
        // Cascades in local state
        const sectionsToDelete = sections.filter(sec => sec.strand_id === id).map(sec => sec.id);
        const subjectsToDelete = subjects.filter(sub => sub.strand_id === id).map(sub => sub.id);
        setSections(prev => prev.filter(sec => sec.strand_id !== id));
        setSubjects(prev => prev.filter(sub => sub.strand_id !== id));
        setScheduleEntries(prev => prev.filter(sch => !sectionsToDelete.includes(sch.section_id) && !subjectsToDelete.includes(sch.subject_id)));
        
        const strObj = strands.find(s => s.id === id);
        showToast(`Strand "${strObj?.name || ''}" deleted along with associated sections & subjects.`, 'warning');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete strand.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error.', 'error');
    }
  };

  const addSection = async (section: Omit<Section, 'id' | 'shift'>) => {
    try {
      const res = await fetch('/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(section),
      });
      const data = await res.json();
      if (res.ok) {
        setSections(prev => [...prev, data]);
        showToast(`Section "${data.name}" (${data.shift} Shift) successfully added.`);
      } else {
        showToast(data.error || 'Failed to add section.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error.', 'error');
    }
  };

  const updateSection = async (id: string, updated: Partial<Section>) => {
    try {
      const res = await fetch(`/api/sections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (res.ok) {
        setSections(prev => prev.map(s => (s.id === id ? data : s)));
        showToast(`Section "${data.name}" successfully updated.`);
      } else {
        showToast(data.error || 'Failed to update section.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error.', 'error');
    }
  };

  const deleteSection = async (id: string) => {
    try {
      const res = await fetch(`/api/sections/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSections(prev => prev.filter(s => s.id !== id));
        setScheduleEntries(prev => prev.filter(sch => sch.section_id !== id));
        const secObj = sections.find(s => s.id === id);
        showToast(`Section "${secObj?.name || ''}" deleted. Timetable cleared.`, 'warning');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete section.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error.', 'error');
    }
  };

  const addSubject = async (subject: Omit<Subject, 'id'>) => {
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subject),
      });
      const data = await res.json();
      if (res.ok) {
        setSubjects(prev => [...prev, data]);
        showToast(`Subject "${data.name}" successfully added.`);
      } else {
        showToast(data.error || 'Failed to add subject.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error.', 'error');
    }
  };

  const updateSubject = async (id: string, updated: Partial<Subject>) => {
    try {
      const res = await fetch(`/api/subjects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (res.ok) {
        setSubjects(prev => prev.map(s => (s.id === id ? data : s)));
        showToast(`Subject "${data.name}" successfully updated.`);
      } else {
        showToast(data.error || 'Failed to update subject.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error.', 'error');
    }
  };

  const deleteSubject = async (id: string) => {
    try {
      const res = await fetch(`/api/subjects/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSubjects(prev => prev.filter(s => s.id !== id));
        setScheduleEntries(prev => prev.filter(sch => sch.subject_id !== id));
        const subObj = subjects.find(s => s.id === id);
        showToast(`Subject "${subObj?.name || ''}" deleted.`, 'warning');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete subject.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error.', 'error');
    }
  };

  const addTeacherLoad = async (load: { teacher_id: string; subject_id: string; section_id: string }) => {
    try {
      const res = await fetch('/api/teacher-loads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(load),
      });
      const data = await res.json();
      if (res.ok) {
        setTeacherLoads(prev => [...prev, data]);
        showToast('Teaching load added successfully.');
      } else {
        showToast(data.error || 'Failed to add teaching load.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error.', 'error');
    }
  };

  const deleteTeacherLoad = async (id: string) => {
    try {
      const res = await fetch(`/api/teacher-loads/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTeacherLoads(prev => prev.filter(t => t.id !== id));
        // Remove locally deleted schedule entries linked to this teacher load
        setScheduleEntries(prev => prev.filter(s => s.teacher_load_id !== id));
        showToast('Teaching load and associated schedules deleted.', 'warning');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete teaching load.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error.', 'error');
    }
  };

  const regenerateTeacherSchedule = async (teacherId: string, preserveExisting: boolean = false) => {
    try {
      const res = await fetch('/api/schedule/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'teacher',
          teacher_id: teacherId,
          preserve_existing: preserveExisting
        }),
      });
      const data = await res.json();
      if (res.ok) {
        await loadAllData();
        showToast('Schedule regenerated for teacher.');
        return data;
      } else {
        showToast(data.error || 'Failed to regenerate schedule.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error.', 'error');
    }
  };

  const regenerateAllSchedules = async (preserveExisting: boolean = false) => {
    try {
      const res = await fetch('/api/schedule/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'all',
          preserve_existing: preserveExisting
        }),
      });
      const data = await res.json();
      if (res.ok) {
        await loadAllData();
        showToast('All schedules auto-generated successfully.');
        return data;
      } else {
        showToast(data.error || 'Failed to generate schedules.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error.', 'error');
    }
  };


  const saveScheduleEntry = async (entry: Omit<ScheduleEntry, 'id'>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      const data = await res.json();
      if (res.ok) {
        await loadAllData();
        showToast('Schedule cell saved successfully.');
        return { success: true };
      } else {
        showToast(data.error || 'Failed to save schedule.', 'error');
        return { success: false, error: data.error };
      }
    } catch (err: any) {
      showToast(err.message || 'Network error.', 'error');
      return { success: false, error: err.message };
    }
  };

  const deleteScheduleEntryById = async (id: string) => {
    try {
      const res = await fetch(`/api/schedule?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadAllData();
        showToast('Schedule cell cleared.', 'warning');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to clear schedule cell.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error.', 'error');
    }
  };


  const clearScheduleEntry = async (day: string, timeSlotId: string, criteriaId: string, viewBy: 'teacher' | 'section') => {
    try {
      const res = await fetch(`/api/schedule?day=${day}&time_slot_id=${timeSlotId}&criteria_id=${criteriaId}&view_by=${viewBy}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadAllData();
        showToast('Scheduled entry cleared from timetable.', 'warning');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to clear schedule.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error.', 'error');
    }
  };

  const clearAllSchedules = async () => {
    try {
      const res = await fetch('/api/schedule?clearAll=true', {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadAllData();
        showToast('All timetable schedules have been wiped.', 'error');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to wipe schedules.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error.', 'error');
    }
  };

  const reseedDatabase = async () => {
    setIsLoading(true);
    try {
      // 1. Delete all existing records (PostgreSQL ON DELETE CASCADE handles sections, subjects, schedules)
      await supabase.from('schedule_entries').delete().not('id', 'is', null);
      await supabase.from('sections').delete().not('id', 'is', null);
      await supabase.from('subjects').delete().not('id', 'is', null);
      await supabase.from('strands').delete().not('id', 'is', null);
      await supabase.from('teachers').delete().not('id', 'is', null);

      // 2. Insert Teachers
      const teachersToInsert = [
        { name: 'Dr. Ronald M. Santos', specialization: 'Science / STEM', ancillary_role: 'Grade 11 Level Coordinator|5', max_hours_per_week: 35 },
        { name: 'Prof. Evelyn G. Cruz', specialization: 'Mathematics', ancillary_role: 'SBM Chairperson|6', max_hours_per_week: 30 },
        { name: 'Sir Jester C. Cruz', specialization: 'TVL-ICT / Computer Systems', ancillary_role: 'School ICT Coordinator|8', max_hours_per_week: 30 },
        { name: 'Ma\'am Maria L. dela Cruz', specialization: 'English / Communication', ancillary_role: 'L&D Coordinator|4', max_hours_per_week: 25 },
        { name: 'Ma\'am Corazon A. Aquino', specialization: 'Filipino / Humanities', ancillary_role: 'Araling Panlipunan Head|4', max_hours_per_week: 32 },
        { name: 'Sir Andres B. Bonifacio', specialization: 'ABM / Entrepreneurship', ancillary_role: 'School Property Custodian|6', max_hours_per_week: 30 },
      ];
      const { data: insertedTeachers, error: tErr } = await supabase.from('teachers').insert(teachersToInsert).select();
      if (tErr) throw tErr;

      // 3. Insert Strands
      const strandsToInsert = [
        { name: 'STEM (Science, Tech, Eng, Math)', type: 'Academic', grade_level: 11 },
        { name: 'ABM (Accountancy & Business Management)', type: 'Academic', grade_level: 11 },
        { name: 'TVL-ICT (Information & Communications Tech)', type: 'TechVoc', grade_level: 12 },
        { name: 'HUMSS (Humanities & Social Sciences)', type: 'Academic', grade_level: 12 },
      ];
      const { data: insertedStrands, error: stErr } = await supabase.from('strands').insert(strandsToInsert).select();
      if (stErr) throw stErr;

      const strandMap = new Map(insertedStrands.map(s => [s.name, s.id]));

      // 4. Insert Sections
      const sectionsToInsert = [
        { name: 'Grade 11 STEM - Einstein', strand_id: strandMap.get('STEM (Science, Tech, Eng, Math)'), grade_level: 11 },
        { name: 'Grade 11 ABM - Chevron', strand_id: strandMap.get('ABM (Accountancy & Business Management)'), grade_level: 11 },
        { name: 'Grade 12 ICT - Turing', strand_id: strandMap.get('TVL-ICT (Information & Communications Tech)'), grade_level: 12 },
        { name: 'Grade 12 HUMSS - Socrates', strand_id: strandMap.get('HUMSS (Humanities & Social Sciences)'), grade_level: 12 },
      ];
      const { data: insertedSections, error: secErr } = await supabase.from('sections').insert(sectionsToInsert).select();
      if (secErr) throw secErr;

      const sectionMap = new Map(insertedSections.map(s => [s.name, s.id]));

      // 5. Insert Subjects
      const subjectsToInsert = [
        { name: 'General Mathematics', strand_id: strandMap.get('STEM (Science, Tech, Eng, Math)'), required_specialization: 'Mathematics', hours_per_week: 4 },
        { name: 'Earth and Life Science', strand_id: strandMap.get('STEM (Science, Tech, Eng, Math)'), required_specialization: 'Science / STEM', hours_per_week: 4 },
        { name: 'Oral Communication', strand_id: strandMap.get('STEM (Science, Tech, Eng, Math)'), required_specialization: 'English / Communication', hours_per_week: 4 },
        
        { name: 'Business Mathematics', strand_id: strandMap.get('ABM (Accountancy & Business Management)'), required_specialization: 'Mathematics', hours_per_week: 4 },
        { name: 'Principles of Marketing', strand_id: strandMap.get('ABM (Accountancy & Business Management)'), required_specialization: 'ABM / Entrepreneurship', hours_per_week: 4 },
        
        { name: 'Computer Systems Servicing NC II', strand_id: strandMap.get('TVL-ICT (Information & Communications Tech)'), required_specialization: 'TVL-ICT / Computer Systems', hours_per_week: 8 },
        { name: 'English for Academic & Professional Purposes', strand_id: strandMap.get('TVL-ICT (Information & Communications Tech)'), required_specialization: 'English / Communication', hours_per_week: 4 },
        
        { name: 'Introduction to World Religions', strand_id: strandMap.get('HUMSS (Humanities & Social Sciences)'), required_specialization: 'Filipino / Humanities', hours_per_week: 4 },
        { name: 'Creative Writing', strand_id: strandMap.get('HUMSS (Humanities & Social Sciences)'), required_specialization: 'Filipino / Humanities', hours_per_week: 4 },
      ];
      const { data: insertedSubjects, error: subErr } = await supabase.from('subjects').insert(subjectsToInsert).select();
      if (subErr) throw subErr;

      const subjectMap = new Map(insertedSubjects.map(s => [s.name, s.id]));
      const teacherMap = new Map(insertedTeachers.map(t => [t.name, t.id]));

      // Get seeded Time Slots from DB
      const { data: dbSlots, error: slotErr } = await supabase.from('time_slots').select('*');
      if (slotErr) throw slotErr;

      const getSlotId = (label: string, shift: 'Morning' | 'Afternoon') => {
        const found = dbSlots.find(s => s.period_label === label && s.shift === shift);
        return found ? found.id : null;
      };

      // 6. Insert Schedules
      const schedulesToInsert = [
        { teacher_id: teacherMap.get('Prof. Evelyn G. Cruz'), section_id: sectionMap.get('Grade 11 STEM - Einstein'), subject_id: subjectMap.get('General Mathematics'), time_slot_id: getSlotId('Period 1', 'Morning'), day: 'Monday' },
        { teacher_id: teacherMap.get('Dr. Ronald M. Santos'), section_id: sectionMap.get('Grade 11 STEM - Einstein'), subject_id: subjectMap.get('Earth and Life Science'), time_slot_id: getSlotId('Period 2', 'Morning'), day: 'Monday' },
        { teacher_id: teacherMap.get('Ma\'am Maria L. dela Cruz'), section_id: sectionMap.get('Grade 11 STEM - Einstein'), subject_id: subjectMap.get('Oral Communication'), time_slot_id: getSlotId('Period 3', 'Morning'), day: 'Monday' },
        
        { teacher_id: teacherMap.get('Prof. Evelyn G. Cruz'), section_id: sectionMap.get('Grade 11 STEM - Einstein'), subject_id: subjectMap.get('General Mathematics'), time_slot_id: getSlotId('Period 1', 'Morning'), day: 'Tuesday' },
        { teacher_id: teacherMap.get('Dr. Ronald M. Santos'), section_id: sectionMap.get('Grade 11 STEM - Einstein'), subject_id: subjectMap.get('Earth and Life Science'), time_slot_id: getSlotId('Period 2', 'Morning'), day: 'Tuesday' },
        { teacher_id: teacherMap.get('Ma\'am Maria L. dela Cruz'), section_id: sectionMap.get('Grade 11 STEM - Einstein'), subject_id: subjectMap.get('Oral Communication'), time_slot_id: getSlotId('Period 3', 'Morning'), day: 'Tuesday' },

        { teacher_id: teacherMap.get('Prof. Evelyn G. Cruz'), section_id: sectionMap.get('Grade 11 ABM - Chevron'), subject_id: subjectMap.get('Business Mathematics'), time_slot_id: getSlotId('Period 1', 'Morning'), day: 'Monday' }, // Double-booking conflict
        { teacher_id: teacherMap.get('Sir Andres B. Bonifacio'), section_id: sectionMap.get('Grade 11 ABM - Chevron'), subject_id: subjectMap.get('Principles of Marketing'), time_slot_id: getSlotId('Period 2', 'Morning'), day: 'Monday' },

        { teacher_id: teacherMap.get('Sir Jester C. Cruz'), section_id: sectionMap.get('Grade 12 ICT - Turing'), subject_id: subjectMap.get('Computer Systems Servicing NC II'), time_slot_id: getSlotId('Period 1', 'Afternoon'), day: 'Tuesday' },
        { teacher_id: teacherMap.get('Sir Jester C. Cruz'), section_id: sectionMap.get('Grade 12 ICT - Turing'), subject_id: subjectMap.get('Computer Systems Servicing NC II'), time_slot_id: getSlotId('Period 2', 'Afternoon'), day: 'Tuesday' },
        { teacher_id: teacherMap.get('Ma\'am Maria L. dela Cruz'), section_id: sectionMap.get('Grade 12 ICT - Turing'), subject_id: subjectMap.get('English for Academic & Professional Purposes'), time_slot_id: getSlotId('Period 3', 'Afternoon'), day: 'Tuesday' },

        { teacher_id: teacherMap.get('Ma\'am Corazon A. Aquino'), section_id: sectionMap.get('Grade 12 HUMSS - Socrates'), subject_id: subjectMap.get('Introduction to World Religions'), time_slot_id: getSlotId('Period 1', 'Afternoon'), day: 'Wednesday' },
        { teacher_id: teacherMap.get('Ma\'am Corazon A. Aquino'), section_id: sectionMap.get('Grade 12 HUMSS - Socrates'), subject_id: subjectMap.get('Creative Writing'), time_slot_id: getSlotId('Period 2', 'Afternoon'), day: 'Wednesday' },
      ].filter(item => item.time_slot_id !== null);

      const { error: schErr } = await supabase.from('schedule_entries').insert(schedulesToInsert);
      if (schErr) throw schErr;

      showToast('Database successfully seeded with DepEd SHS demo dataset.');
      await loadAllData();
    } catch (e: any) {
      console.error('Seeding error:', e);
      showToast(e.message || 'Seeding failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppContext.Provider value={{
      teachers,
      strands,
      sections,
      subjects,
      timeSlots,
      scheduleEntries,
      teacherLoads,
      conflicts,
      user,
      login,
      logout,
      toasts,
      showToast,
      dismissToast,
      addTeacher,
      updateTeacher,
      deleteTeacher,
      addStrand,
      updateStrand,
      deleteStrand,
      addSection,
      updateSection,
      deleteSection,
      addSubject,
      updateSubject,
      deleteSubject,
      addTeacherLoad,
      deleteTeacherLoad,
      regenerateTeacherSchedule,
      regenerateAllSchedules,
      saveScheduleEntry,
      deleteScheduleEntryById,
      clearScheduleEntry,
      clearAllSchedules,
      reseedDatabase,
      refreshPortalData: loadAllData,
      isLoading,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
