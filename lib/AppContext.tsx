'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Teacher, Strand, Section, Subject, TimeSlot, ScheduleEntry, ConflictResult } from '../types';
import { runConflictChecks } from './validations';

interface AppContextType {
  teachers: Teacher[];
  strands: Strand[];
  sections: Section[];
  subjects: Subject[];
  timeSlots: TimeSlot[];
  scheduleEntries: ScheduleEntry[];
  conflicts: ConflictResult[];
  
  // Auth state
  user: { email: string; name: string } | null;
  login: (email: string) => boolean;
  logout: () => void;

  // CRUD actions
  addTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  updateTeacher: (id: string, teacher: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;

  addStrand: (strand: Omit<Strand, 'id'>) => void;
  updateStrand: (id: string, strand: Partial<Strand>) => void;
  deleteStrand: (id: string) => void;

  addSection: (section: Omit<Section, 'id' | 'shift'>) => void;
  updateSection: (id: string, section: Partial<Section>) => void;
  deleteSection: (id: string) => void;

  addSubject: (subject: Omit<Subject, 'id'>) => void;
  updateSubject: (id: string, subject: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;

  saveScheduleEntry: (entry: Omit<ScheduleEntry, 'id'>) => { success: boolean; error?: string };
  clearScheduleEntry: (day: string, timeSlotId: string, criteriaId: string, viewBy: 'teacher' | 'section') => void;
  clearAllSchedules: () => void;
  reseedDatabase: () => void;

  isLoading: boolean;

  // Toast notifications
  toasts: { id: string; message: string; type: 'success' | 'warning' | 'error' }[];
  showToast: (message: string, type?: 'success' | 'warning' | 'error') => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Core default seed datasets (DepEd SHS style)
const defaultTimeSlots: TimeSlot[] = [
  // Morning Shift (Grade 11)
  { id: 'm-slot-1', shift: 'Morning', period_label: 'Period 1', start_time: '06:00', end_time: '07:00', is_recess: false, duration_minutes: 60, sort_order: 1 },
  { id: 'm-slot-2', shift: 'Morning', period_label: 'Period 2', start_time: '07:00', end_time: '08:00', is_recess: false, duration_minutes: 60, sort_order: 2 },
  { id: 'm-slot-recess', shift: 'Morning', period_label: 'Recess', start_time: '08:00', end_time: '08:30', is_recess: true, duration_minutes: 30, sort_order: 3 },
  { id: 'm-slot-3', shift: 'Morning', period_label: 'Period 3', start_time: '08:30', end_time: '09:30', is_recess: false, duration_minutes: 60, sort_order: 4 },
  { id: 'm-slot-4', shift: 'Morning', period_label: 'Period 4', start_time: '09:30', end_time: '10:30', is_recess: false, duration_minutes: 60, sort_order: 5 },
  { id: 'm-slot-5', shift: 'Morning', period_label: 'Period 5', start_time: '10:30', end_time: '12:00', is_recess: false, duration_minutes: 90, sort_order: 6 },

  // Afternoon Shift (Grade 12)
  { id: 'a-slot-1', shift: 'Afternoon', period_label: 'Period 1', start_time: '12:30', end_time: '13:30', is_recess: false, duration_minutes: 60, sort_order: 1 },
  { id: 'a-slot-2', shift: 'Afternoon', period_label: 'Period 2', start_time: '13:30', end_time: '14:30', is_recess: false, duration_minutes: 60, sort_order: 2 },
  { id: 'a-slot-3', shift: 'Afternoon', period_label: 'Period 3', start_time: '14:30', end_time: '15:30', is_recess: false, duration_minutes: 60, sort_order: 3 },
  { id: 'a-slot-recess', shift: 'Afternoon', period_label: 'Recess', start_time: '15:30', end_time: '16:00', is_recess: true, duration_minutes: 30, sort_order: 4 },
  { id: 'a-slot-4', shift: 'Afternoon', period_label: 'Period 4', start_time: '16:00', end_time: '17:00', is_recess: false, duration_minutes: 60, sort_order: 5 },
  { id: 'a-slot-5', shift: 'Afternoon', period_label: 'Period 5', start_time: '17:00', end_time: '18:30', is_recess: false, duration_minutes: 90, sort_order: 6 },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [strands, setStrands] = useState<Strand[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timeSlots] = useState<TimeSlot[]>(defaultTimeSlots);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [conflicts, setConflicts] = useState<ConflictResult[]>([]);
  
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Toast notification state
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

  // Load from local storage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('shs_admin_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      const storedTeachers = localStorage.getItem('shs_teachers');
      const storedStrands = localStorage.getItem('shs_strands');
      const storedSections = localStorage.getItem('shs_sections');
      const storedSubjects = localStorage.getItem('shs_subjects');
      const storedSchedules = localStorage.getItem('shs_schedules');

      if (storedTeachers && storedStrands && storedSections && storedSubjects && storedSchedules) {
        setTeachers(JSON.parse(storedTeachers));
        setStrands(JSON.parse(storedStrands));
        setSections(JSON.parse(storedSections));
        setSubjects(JSON.parse(storedSubjects));
        setScheduleEntries(JSON.parse(storedSchedules));
      } else {
        // Seeding initial realistic Filipino DepEd SHS data
        seedInitialData();
      }
    } catch (e) {
      console.error('Failed to load local storage state:', e);
      seedInitialData();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to local storage on changes and re-validate conflicts
  useEffect(() => {
    if (isLoading) return;
    try {
      localStorage.setItem('shs_teachers', JSON.stringify(teachers));
      localStorage.setItem('shs_strands', JSON.stringify(strands));
      localStorage.setItem('shs_sections', JSON.stringify(sections));
      localStorage.setItem('shs_subjects', JSON.stringify(subjects));
      localStorage.setItem('shs_schedules', JSON.stringify(scheduleEntries));

      // Periodically compute conflict report validation
      const conflictResults = runConflictChecks({
        teachers,
        strands,
        sections,
        subjects,
        timeSlots,
        scheduleEntries,
      });
      setConflicts(conflictResults);
    } catch (e) {
      console.error('Failed to write local storage state:', e);
    }
  }, [teachers, strands, sections, subjects, scheduleEntries, isLoading]);

  const seedInitialData = () => {
    const initialTeachers: Teacher[] = [
      { id: 't-1', name: 'Dr. Ronald M. Santos', specialization: 'Science / STEM', ancillary_role: 'Grade 11 Level Coordinator', max_hours_per_week: 35, ancillary_hours_per_week: 5 },
      { id: 't-2', name: 'Prof. Evelyn G. Cruz', specialization: 'Mathematics', ancillary_role: 'SBM Chairperson', max_hours_per_week: 30, ancillary_hours_per_week: 6 },
      { id: 't-3', name: 'Sir Jester C. Cruz', specialization: 'TVL-ICT / Computer Systems', ancillary_role: 'School ICT Coordinator', max_hours_per_week: 30, ancillary_hours_per_week: 8 },
      { id: 't-4', name: 'Ma\'am Maria L. dela Cruz', specialization: 'English / Communication', ancillary_role: 'L&D Coordinator', max_hours_per_week: 25, ancillary_hours_per_week: 4 },
      { id: 't-5', name: 'Ma\'am Corazon A. Aquino', specialization: 'Filipino / Humanities', ancillary_role: 'Araling Panlipunan Head', max_hours_per_week: 32, ancillary_hours_per_week: 4 },
      { id: 't-6', name: 'Sir Andres B. Bonifacio', specialization: 'ABM / Entrepreneurship', ancillary_role: 'School Property Custodian', max_hours_per_week: 30, ancillary_hours_per_week: 6 },
    ];

    const initialStrands: Strand[] = [
      { id: 'st-1', name: 'STEM (Science, Tech, Eng, Math)', type: 'Academic', grade_level: 11 },
      { id: 'st-2', name: 'ABM (Accountancy & Business Management)', type: 'Academic', grade_level: 11 },
      { id: 'st-3', name: 'TVL-ICT (Information & Communications Tech)', type: 'TechVoc', grade_level: 12 },
      { id: 'st-4', name: 'HUMSS (Humanities & Social Sciences)', type: 'Academic', grade_level: 12 },
    ];

    const initialSections: Section[] = [
      { id: 'sec-1', name: 'Grade 11 STEM - Einstein', strand_id: 'st-1', grade_level: 11, shift: 'Morning' },
      { id: 'sec-2', name: 'Grade 11 ABM - Chevron', strand_id: 'st-2', grade_level: 11, shift: 'Morning' },
      { id: 'sec-3', name: 'Grade 12 ICT - Turing', strand_id: 'st-3', grade_level: 12, shift: 'Afternoon' },
      { id: 'sec-4', name: 'Grade 12 HUMSS - Socrates', strand_id: 'st-4', grade_level: 12, shift: 'Afternoon' },
    ];

    const initialSubjects: Subject[] = [
      // STEM Grades 11
      { id: 'sub-1', name: 'General Mathematics', strand_id: 'st-1', required_specialization: 'Mathematics', hours_per_week: 4 },
      { id: 'sub-2', name: 'Earth and Life Science', strand_id: 'st-1', required_specialization: 'Science / STEM', hours_per_week: 4 },
      { id: 'sub-3', name: 'Oral Communication', strand_id: 'st-1', required_specialization: 'English / Communication', hours_per_week: 4 },
      
      // ABM Grade 11
      { id: 'sub-4', name: 'Business Mathematics', strand_id: 'st-2', required_specialization: 'Mathematics', hours_per_week: 4 },
      { id: 'sub-5', name: 'Principles of Marketing', strand_id: 'st-2', required_specialization: 'ABM / Entrepreneurship', hours_per_week: 4 },
      
      // TVL-ICT Grade 12
      { id: 'sub-6', name: 'Computer Systems Servicing NC II', strand_id: 'st-3', required_specialization: 'TVL-ICT / Computer Systems', hours_per_week: 8 },
      { id: 'sub-7', name: 'English for Academic & Professional Purposes', strand_id: 'st-3', required_specialization: 'English / Communication', hours_per_week: 4 },
      
      // HUMSS Grade 12
      { id: 'sub-8', name: 'Introduction to World Religions', strand_id: 'st-4', required_specialization: 'Filipino / Humanities', hours_per_week: 4 },
      { id: 'sub-9', name: 'Creative Writing', strand_id: 'st-4', required_specialization: 'Filipino / Humanities', hours_per_week: 4 },
    ];

    const initialSchedules: ScheduleEntry[] = [
      // G11 STEM Einstein - Morning (Mondays)
      { id: 'sch-1', teacher_id: 't-2', section_id: 'sec-1', subject_id: 'sub-1', time_slot_id: 'm-slot-1', day: 'Monday' }, // Prof Cruz teaches Gen Math at Period 1
      { id: 'sch-2', teacher_id: 't-1', section_id: 'sec-1', subject_id: 'sub-2', time_slot_id: 'm-slot-2', day: 'Monday' }, // Dr Santos teaches Science at Period 2
      { id: 'sch-3', teacher_id: 't-4', section_id: 'sec-1', subject_id: 'sub-3', time_slot_id: 'm-slot-3', day: 'Monday' }, // Ma'am Maria teaches Oral Comm at Period 3
      
      // Same G11 STEM - Morning (Tuesdays)
      { id: 'sch-4', teacher_id: 't-2', section_id: 'sec-1', subject_id: 'sub-1', time_slot_id: 'm-slot-1', day: 'Tuesday' },
      { id: 'sch-5', teacher_id: 't-1', section_id: 'sec-1', subject_id: 'sub-2', time_slot_id: 'm-slot-2', day: 'Tuesday' },
      { id: 'sch-6', teacher_id: 't-4', section_id: 'sec-1', subject_id: 'sub-3', time_slot_id: 'm-slot-3', day: 'Tuesday' },

      // G11 ABM Chevron - Morning (Mondays) - Let's make a conflict: teacher t-2 (Prof Cruz) is assigned here as well during Monday Period 1!
      // Wait, let's pre-load a classic Teacher Double-Booking on Monday Period 1. Since Prof Cruz is teaching STEM-Einstein Period 1, doing this will raise a visible conflict. This is excellent!
      { id: 'sch-7', teacher_id: 't-2', section_id: 'sec-2', subject_id: 'sub-4', time_slot_id: 'm-slot-1', day: 'Monday' }, // Double Booked on Monday Period 1!
      { id: 'sch-8', teacher_id: 't-6', section_id: 'sec-2', subject_id: 'sub-5', time_slot_id: 'm-slot-2', day: 'Monday' }, // Sir Andres teaches Marketing on Period 2

      // G12 ICT Turing - Afternoon
      { id: 'sch-9', teacher_id: 't-3', section_id: 'sec-3', subject_id: 'sub-6', time_slot_id: 'a-slot-1', day: 'Tuesday' }, // Sir Jester computers Period 1
      { id: 'sch-10', teacher_id: 't-3', section_id: 'sec-3', subject_id: 'sub-6', time_slot_id: 'a-slot-2', day: 'Tuesday' }, // Sir Jester computers Period 2
      { id: 'sch-11', teacher_id: 't-4', section_id: 'sec-3', subject_id: 'sub-7', time_slot_id: 'a-slot-3', day: 'Tuesday' }, // Ma'am Maria teaches English Period 3

      // G12 HUMSS Socrates - Afternoon
      { id: 'sch-12', teacher_id: 't-5', section_id: 'sec-4', subject_id: 'sub-8', time_slot_id: 'a-slot-1', day: 'Wednesday' },
      { id: 'sch-13', teacher_id: 't-5', section_id: 'sec-4', subject_id: 'sub-9', time_slot_id: 'a-slot-2', day: 'Wednesday' },
    ];

    setTeachers(initialTeachers);
    setStrands(initialStrands);
    setSections(initialSections);
    setSubjects(initialSubjects);
    setScheduleEntries(initialSchedules);

    localStorage.setItem('shs_teachers', JSON.stringify(initialTeachers));
    localStorage.setItem('shs_strands', JSON.stringify(initialStrands));
    localStorage.setItem('shs_sections', JSON.stringify(initialSections));
    localStorage.setItem('shs_subjects', JSON.stringify(initialSubjects));
    localStorage.setItem('shs_schedules', JSON.stringify(initialSchedules));

    const conflictResults = runConflictChecks({
      teachers: initialTeachers,
      strands: initialStrands,
      sections: initialSections,
      subjects: initialSubjects,
      timeSlots: defaultTimeSlots,
      scheduleEntries: initialSchedules,
    });
    setConflicts(conflictResults);
  };

  const reseedDatabase = () => {
    seedInitialData();
  };

  const login = (email: string): boolean => {
    // Single admin user, accepts their email or standard jestercruz06@gmail.com
    let name = 'Admin User';
    if (email.toLowerCase() === 'jestercruz06@gmail.com') {
      name = 'Jester Cruz';
    }
    const adminSession = { email, name };
    setUser(adminSession);
    localStorage.setItem('shs_admin_user', JSON.stringify(adminSession));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('shs_admin_user');
  };

  // CRUD Implementations
  const addTeacher = (teacher: Omit<Teacher, 'id'>) => {
    const newTeacher: Teacher = {
      ...teacher,
      id: `t-${Date.now()}`,
    };
    setTeachers(prev => {
      const next = [...prev, newTeacher];
      showToast(`Teacher "${newTeacher.name}" successfully added.`);
      return next;
    });
  };

  const updateTeacher = (id: string, updated: Partial<Teacher>) => {
    setTeachers(prev => {
      const next = prev.map(t => (t.id === id ? { ...t, ...updated } : t));
      const updatedTeacher = next.find(t => t.id === id);
      showToast(`Teacher "${updatedTeacher?.name || ''}" successfully updated.`);
      return next;
    });
  };

  const deleteTeacher = (id: string) => {
    const tToDelete = teachers.find(t => t.id === id);
    setTeachers(prev => prev.filter(t => t.id !== id));
    // Cascade delete schedules
    setScheduleEntries(prev => prev.filter(s => s.teacher_id !== id));
    showToast(`Teacher "${tToDelete?.name || ''}" deleted. Associated schedules removed.`, 'warning');
  };

  const addStrand = (strand: Omit<Strand, 'id'>) => {
    const newStrand: Strand = {
      ...strand,
      id: `st-${Date.now()}`,
    };
    setStrands(prev => {
      const next = [...prev, newStrand];
      showToast(`Strand "${newStrand.name}" successfully added.`);
      return next;
    });
  };

  const updateStrand = (id: string, updated: Partial<Strand>) => {
    setStrands(prev => {
      const next = prev.map(s => (s.id === id ? { ...s, ...updated } : s));
      const str = next.find(s => s.id === id);
      showToast(`Strand "${str?.name || ''}" successfully updated.`);
      return next;
    });
  };

  const deleteStrand = (id: string) => {
    const strToDelete = strands.find(s => s.id === id);
    setStrands(prev => prev.filter(s => s.id !== id));
    // Cascade delete
    const sectionsToDelete = sections.filter(sec => sec.strand_id === id).map(sec => sec.id);
    const subjectsToDelete = subjects.filter(sub => sub.strand_id === id).map(sub => sub.id);

    setSections(prev => prev.filter(s => s.strand_id !== id));
    setSubjects(prev => prev.filter(s => s.strand_id !== id));
    setScheduleEntries(prev => prev.filter(sch => !sectionsToDelete.includes(sch.section_id) && !subjectsToDelete.includes(sch.subject_id)));
    showToast(`Strand "${strToDelete?.name || ''}" deleted along with associated sections & subjects.`, 'warning');
  };

  const addSection = (section: Omit<Section, 'id' | 'shift'>) => {
    const shift = section.grade_level === 11 ? 'Morning' : 'Afternoon';
    const newSec: Section = {
      ...section,
      shift,
      id: `sec-${Date.now()}`,
    };
    setSections(prev => {
      const next = [...prev, newSec];
      showToast(`Section "${newSec.name}" (${shift} Shift) successfully added.`);
      return next;
    });
  };

  const updateSection = (id: string, updated: Partial<Section>) => {
    setSections(prev => {
      const next = prev.map(s => {
        if (s.id === id) {
          const nextS = { ...s, ...updated };
          if (updated.grade_level) {
            nextS.shift = updated.grade_level === 11 ? 'Morning' : 'Afternoon';
          }
          return nextS;
        }
        return s;
      });
      const secObj = next.find(s => s.id === id);
      showToast(`Section "${secObj?.name || ''}" successfully updated.`);
      return next;
    });
  };

  const deleteSection = (id: string) => {
    const secToDelete = sections.find(s => s.id === id);
    setSections(prev => prev.filter(s => s.id !== id));
    setScheduleEntries(prev => prev.filter(sch => sch.section_id !== id));
    showToast(`Section "${secToDelete?.name || ''}" deleted. Timetable cleared.`, 'warning');
  };

  const addSubject = (subject: Omit<Subject, 'id'>) => {
    const newSub: Subject = {
      ...subject,
      id: `sub-${Date.now()}`,
    };
    setSubjects(prev => {
      const next = [...prev, newSub];
      showToast(`Subject "${newSub.name}" successfully added.`);
      return next;
    });
  };

  const updateSubject = (id: string, updated: Partial<Subject>) => {
    setSubjects(prev => {
      const next = prev.map(s => (s.id === id ? { ...s, ...updated } : s));
      const subObj = next.find(s => s.id === id);
      showToast(`Subject "${subObj?.name || ''}" successfully updated.`);
      return next;
    });
  };

  const deleteSubject = (id: string) => {
    const subToDelete = subjects.find(s => s.id === id);
    setSubjects(prev => prev.filter(s => s.id !== id));
    setScheduleEntries(prev => prev.filter(sch => sch.subject_id !== id));
    showToast(`Subject "${subToDelete?.name || ''}" deleted.`, 'warning');
  };

  const saveScheduleEntry = (entry: Omit<ScheduleEntry, 'id'>): { success: boolean; error?: string } => {
    const existingSectionEntryIndex = scheduleEntries.findIndex(
      e => e.day === entry.day && e.time_slot_id === entry.time_slot_id && e.section_id === entry.section_id
    );

    const newEntries = [...scheduleEntries];

    if (existingSectionEntryIndex !== -1) {
      const newEntry: ScheduleEntry = {
        id: `sch-${Date.now()}`,
        ...entry,
      };
      newEntries[existingSectionEntryIndex] = newEntry;
      setScheduleEntries(newEntries);
      showToast('Timetable cell saved successfully.');
      return { success: true };
    } else {
      const newEntry: ScheduleEntry = {
        id: `sch-${Date.now()}`,
        ...entry,
      };
      setScheduleEntries(prev => [...prev, newEntry]);
      showToast('New slot successfully scheduled.');
      return { success: true };
    }
  };

  const clearScheduleEntry = (day: string, timeSlotId: string, criteriaId: string, viewBy: 'teacher' | 'section') => {
    setScheduleEntries(prev => prev.filter(entry => {
      const matchSlot = entry.day === day && entry.time_slot_id === timeSlotId;
      if (!matchSlot) return true;
      
      if (viewBy === 'teacher') {
        return entry.teacher_id !== criteriaId;
      } else {
        return entry.section_id !== criteriaId;
      }
    }));
    showToast('Scheduled entry cleared from timetable.', 'warning');
  };

  const clearAllSchedules = () => {
    setScheduleEntries([]);
    showToast('All timetable schedules have been wiped.', 'error');
  };

  return (
    <AppContext.Provider value={{
      teachers,
      strands,
      sections,
      subjects,
      timeSlots,
      scheduleEntries,
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
      saveScheduleEntry,
      clearScheduleEntry,
      clearAllSchedules,
      reseedDatabase,
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
