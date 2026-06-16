import { Teacher, Section, Subject, TimeSlot, ScheduleEntry, FacultyLoadingSummary } from '../types';

export function computeFacultyLoading({
  teachers,
  sections,
  subjects,
  timeSlots,
  scheduleEntries,
}: {
  teachers: Teacher[];
  sections: Section[];
  subjects: Subject[];
  timeSlots: TimeSlot[];
  scheduleEntries: ScheduleEntry[];
}): FacultyLoadingSummary[] {
  const sectionMap = new Map(sections.map(s => [s.id, s]));
  const subjectMap = new Map(subjects.map(s => [s.id, s]));
  const slotMap = new Map(timeSlots.map(s => [s.id, s]));

  return teachers.map(teacher => {
    // Filter entries for this teacher
    const tEntries = scheduleEntries.filter(e => e.teacher_id === teacher.id);

    // Compute teaching hours per week
    let teachingMinutes = 0;
    for (const entry of tEntries) {
      const slot = slotMap.get(entry.time_slot_id);
      if (slot && !slot.is_recess) {
        teachingMinutes += slot.duration_minutes;
      }
    }
    const teachingHoursPerWeek = teachingMinutes / 60;

    // Get distinct subjects
    const subjectNamesSet = new Set<string>();
    const subjectIdsSet = new Set<string>();
    for (const entry of tEntries) {
      const sub = subjectMap.get(entry.subject_id);
      if (sub) {
        subjectNamesSet.add(sub.name);
        subjectIdsSet.add(sub.id);
      }
    }
    const subjectsTaught = Array.from(subjectNamesSet);
    const noOfPreps = subjectIdsSet.size;

    // Get distinct sections
    const sectionNamesSet = new Set<string>();
    for (const entry of tEntries) {
      const sec = sectionMap.get(entry.section_id);
      if (sec) {
        sectionNamesSet.add(sec.name);
      }
    }
    const sectionsHandled = Array.from(sectionNamesSet);

    const ancillaryHoursPerWeek = teacher.ancillary_hours_per_week || 0;
    const totalHoursPerWeek = teachingHoursPerWeek + ancillaryHoursPerWeek;

    // Determine overload status
    // max_hours_per_week: default is e.g. 30 hours, can be custom
    let loadStatus: 'normal' | 'warning' | 'overloaded' = 'normal';
    const limit = teacher.max_hours_per_week || 30;
    if (totalHoursPerWeek > limit) {
      loadStatus = 'overloaded';
    } else if (totalHoursPerWeek >= limit - 5) {
      loadStatus = 'warning';
    }

    return {
      teacherId: teacher.id,
      teacherName: teacher.name,
      specialization: teacher.specialization,
      subjectsTaught,
      sectionsHandled,
      ancillaryRole: teacher.ancillary_role || 'No Coordinator/Ancillary Role',
      noOfPreps,
      teachingHoursPerWeek,
      ancillaryHoursPerWeek,
      totalHoursPerWeek,
      loadStatus,
    };
  });
}

export function formatTime24To12(time24: string): string {
  if (!time24) return '';
  const [hoursStr, minutesStr] = time24.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  if (isNaN(hours) || isNaN(minutes)) return time24;
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  const minutesPad = minutes < 10 ? `0${minutes}` : minutes;
  return `${hours12}:${minutesPad} ${ampm}`;
}
