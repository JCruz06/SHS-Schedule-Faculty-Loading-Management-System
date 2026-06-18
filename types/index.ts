export interface Teacher {
  id: string;
  name: string;
  specialization: string;
  ancillary_role?: string;
  max_hours_per_week: number;
  ancillary_hours_per_week: number; // Stored on teacher record for manual input or default
  created_at?: string;
}

export interface Strand {
  id: string;
  name: string;
  type: 'Academic' | 'TechVoc' | 'Non-Academic';
  grade_level: 11 | 12;
  created_at?: string;
}

export interface Section {
  id: string;
  name: string;
  strand_id: string;
  grade_level: 11 | 12;
  shift: 'Morning' | 'Afternoon'; // Morning for G11, Afternoon for G12
  created_at?: string;
}

export interface Subject {
  id: string;
  name: string;
  strand_id: string;
  required_specialization: string;
  hours_per_week: number;
  created_at?: string;
}

export interface TimeSlot {
  id: string;
  shift: 'Morning' | 'Afternoon';
  period_label: string;
  start_time: string; // 'HH:MM'
  end_time: string; // 'HH:MM'
  is_recess: boolean;
  duration_minutes: number;
  sort_order: number;
}

export interface ScheduleEntry {
  id: string;
  teacher_id: string;
  section_id: string;
  subject_id: string;
  time_slot_id: string;
  day: string;
  source?: 'auto_generated' | 'manual';
  teacher_load_id?: string | null;
  created_at?: string;
}

export interface ConflictResult {
  id: string;
  type: 'Teacher Double-Booking' | 'Section Double-Booking' | 'Specialization Mismatch' | 'Shift Violation' | 'Teacher Overload' | 'Incomplete Section Schedule' | 'Unassigned Subject' | 'Out of Sync Load';
  description: string;
  severity: 'error' | 'warning';
  affectedTeacher?: string;
  affectedTeacherId?: string;
  affectedSection?: string;
  affectedSectionId?: string;
  affectedSubject?: string;
  affectedSubjectId?: string;
  scheduleEntryId?: string;
}

export interface FacultyLoadingSummary {
  teacherId: string;
  teacherName: string;
  specialization: string;
  subjectsTaught: string[];
  sectionsHandled: string[];
  ancillaryRole: string;
  noOfPreps: number;
  teachingHoursPerWeek: number;
  ancillaryHoursPerWeek: number;
  totalHoursPerWeek: number;
  loadStatus: 'normal' | 'warning' | 'overloaded';
}

export interface TeacherLoad {
  id: string;
  teacher_id: string;
  subject_id: string;
  section_id: string;
  required_hours_per_week: number;
  placement_status: 'pending' | 'fully_placed' | 'partially_placed' | 'not_placed' | 'out_of_sync';
  placed_hours: number;
  priority: number;
  created_at: string;
  updated_at: string;
  // joined data for display
  teacher?: Teacher;
  subject?: Subject;
  section?: Section;
}

export interface GenerationResult {
  fully_placed: TeacherLoad[];
  partially_placed: TeacherLoad[];
  not_placed: TeacherLoad[];
  total_processed: number;
}
