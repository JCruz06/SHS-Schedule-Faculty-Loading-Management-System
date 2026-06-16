import { Teacher, Strand, Section, Subject, TimeSlot, ScheduleEntry, ConflictResult } from '../types';

export function runConflictChecks({
  teachers,
  strands,
  sections,
  subjects,
  timeSlots,
  scheduleEntries,
}: {
  teachers: Teacher[];
  strands: Strand[];
  sections: Section[];
  subjects: Subject[];
  timeSlots: TimeSlot[];
  scheduleEntries: ScheduleEntry[];
}): ConflictResult[] {
  const conflicts: ConflictResult[] = [];
  let conflictCounter = 1;

  const nextId = () => `conflict-${conflictCounter++}`;

  // Helper lookups
  const teacherMap = new Map(teachers.map(t => [t.id, t]));
  const sectionMap = new Map(sections.map(s => [s.id, s]));
  const subjectMap = new Map(subjects.map(sub => [sub.id, sub]));
  const slotMap = new Map(timeSlots.map(slot => [slot.id, slot]));
  const strandMap = new Map(strands.map(st => [st.id, st]));

  // 1. TEACHER DOUBLE-BOOKING & 2. SECTION DOUBLE-BOOKING
  // Let's group schedule entries by day + slot
  const teacherTimeMap = new Map<string, ScheduleEntry[]>();
  const sectionTimeMap = new Map<string, ScheduleEntry[]>();

  for (const entry of scheduleEntries) {
    const slot = slotMap.get(entry.time_slot_id);
    if (!slot || slot.is_recess) continue;

    const teacherKey = `${entry.day}-${entry.time_slot_id}-${entry.teacher_id}`;
    const sectionKey = `${entry.day}-${entry.time_slot_id}-${entry.section_id}`;

    if (!teacherTimeMap.has(teacherKey)) teacherTimeMap.set(teacherKey, []);
    teacherTimeMap.get(teacherKey)!.push(entry);

    if (!sectionTimeMap.has(sectionKey)) sectionTimeMap.set(sectionKey, []);
    sectionTimeMap.get(sectionKey)!.push(entry);
  }

  // 1. Check Teacher Double-Bookings
  for (const [key, entries] of teacherTimeMap.entries()) {
    if (entries.length > 1) {
      const teacherId = entries[0].teacher_id;
      const teacherObj = teacherMap.get(teacherId);
      const teacherName = teacherObj?.name || 'Unknown Teacher';
      const slotObj = slotMap.get(entries[0].time_slot_id);
      const timeStr = slotObj ? `${slotObj.period_label} (${slotObj.start_time} - ${slotObj.end_time})` : 'Unknown Period';
      
      const sectionsListed = entries
        .map(e => sectionMap.get(e.section_id)?.name || 'Unknown Section')
        .join(' and ');

      conflicts.push({
        id: nextId(),
        type: 'Teacher Double-Booking',
        description: `Teacher ${teacherName} is double-booked on ${entries[0].day} during ${timeStr} for sections: ${sectionsListed}.`,
        severity: 'error',
        affectedTeacher: teacherName,
        affectedTeacherId: teacherId,
        scheduleEntryId: entries[0].id,
      });
    }
  }

  // 2. Check Section Double-Bookings
  for (const [key, entries] of sectionTimeMap.entries()) {
    if (entries.length > 1) {
      const sectionId = entries[0].section_id;
      const sectionObj = sectionMap.get(sectionId);
      const sectionName = sectionObj?.name || 'Unknown Section';
      const slotObj = slotMap.get(entries[0].time_slot_id);
      const timeStr = slotObj ? `${slotObj.period_label} (${slotObj.start_time} - ${slotObj.end_time})` : 'Unknown Period';

      const subjectsListed = entries
        .map(e => subjectMap.get(e.subject_id)?.name || 'Unknown Subject')
        .join(' and ');

      conflicts.push({
        id: nextId(),
        type: 'Section Double-Booking',
        description: `Section ${sectionName} has multiple classes assigned on ${entries[0].day} during ${timeStr}: ${subjectsListed}.`,
        severity: 'error',
        affectedSection: sectionName,
        affectedSectionId: sectionId,
        scheduleEntryId: entries[0].id,
      });
    }
  }

  // 3. SPECIALIZATION MISMATCH
  for (const entry of scheduleEntries) {
    const teacher = teacherMap.get(entry.teacher_id);
    const subject = subjectMap.get(entry.subject_id);

    if (teacher && subject) {
      // Normalize comparison to be fuzzy (e.g. Science matches General Chemistry, etc.)
      const teachSpec = teacher.specialization.toLowerCase();
      const subReq = subject.required_specialization.toLowerCase();

      // Basic fuzzy matching: if subject's required specialization string is not a substring of the teacher's specialization, and vice versa
      const isMatch = teachSpec.includes(subReq) || subReq.includes(teachSpec) || 
                      (subReq === 'general' || teachSpec === 'general') ||
                      (teachSpec.includes('any') || subReq.includes('any')) ||
                      // Match broad categories
                      (teachSpec.includes('math') && subReq.includes('math')) ||
                      (teachSpec.includes('science') && subReq.includes('science')) ||
                      (teachSpec.includes('ict') && subReq.includes('ict')) ||
                      (teachSpec.includes('tvl') && subReq.includes('tvl')) ||
                      (teachSpec.includes('filipino') && subReq.includes('filipino')) ||
                      (teachSpec.includes('english') && subReq.includes('english')) ||
                      (teachSpec.includes('humanities') && subReq.includes('humanities')) ||
                      (teachSpec.includes('abm') && subReq.includes('abm')) ||
                      (teachSpec.includes('humss') && subReq.includes('humss'));

      if (!isMatch) {
        conflicts.push({
          id: nextId(),
          type: 'Specialization Mismatch',
          description: `Teacher ${teacher.name} (${teacher.specialization}) is assigned to teach ${subject.name}, which requires specialization in "${subject.required_specialization}".`,
          severity: 'warning',
          affectedTeacher: teacher.name,
          affectedTeacherId: teacher.id,
          affectedSubject: subject.name,
          affectedSubjectId: subject.id,
          scheduleEntryId: entry.id,
        });
      }
    }
  }

  // 4. SHIFT VIOLATION
  for (const entry of scheduleEntries) {
    const section = sectionMap.get(entry.section_id);
    const slot = slotMap.get(entry.time_slot_id);

    if (section && slot) {
      if (section.shift !== slot.shift) {
        conflicts.push({
          id: nextId(),
          type: 'Shift Violation',
          description: `Section ${section.name} operates on the ${section.shift} Shift, but has class scheduled in ${slot.period_label} during the ${slot.shift} Shift.`,
          severity: 'error',
          affectedSection: section.name,
          affectedSectionId: section.id,
          scheduleEntryId: entry.id,
        });
      }
    }
  }

  // 5. TEACHER OVERLOAD
  // Compute hours per week for each teacher
  const teacherHours = new Map<string, number>();
  for (const entry of scheduleEntries) {
    const slot = slotMap.get(entry.time_slot_id);
    if (slot && !slot.is_recess) {
      const current = teacherHours.get(entry.teacher_id) || 0;
      teacherHours.set(entry.teacher_id, current + slot.duration_minutes / 60);
    }
  }

  for (const [teacherId, hours] of teacherHours.entries()) {
    const teacher = teacherMap.get(teacherId);
    if (teacher && hours > teacher.max_hours_per_week) {
      conflicts.push({
        id: nextId(),
        type: 'Teacher Overload',
        description: `Teacher ${teacher.name} has a teaching load of ${hours.toFixed(1)} hours per week, which exceeds their designated maximum of ${teacher.max_hours_per_week} hours.`,
        severity: 'error',
        affectedTeacher: teacher.name,
        affectedTeacherId: teacherId,
      });
    }
  }

  // 6. INCOMPLETE SECTION SCHEDULE
  // For each section, check if all subjects linked to its strand have at least one schedule_entry assigned
  for (const section of sections) {
    // Find all subjects for this section's strand
    const strandSubjects = subjects.filter(sub => sub.strand_id === section.strand_id);
    
    // Find assigned subjects in this section's schedule entries
    const sectionEntries = scheduleEntries.filter(e => e.section_id === section.id);
    const assignedSubjectIds = new Set(sectionEntries.map(e => e.subject_id));

    const unassignedSubjects = strandSubjects.filter(sub => !assignedSubjectIds.has(sub.id));

    if (unassignedSubjects.length > 0 && strandSubjects.length > 0) {
      const subjectNames = unassignedSubjects.map(s => s.name).join(', ');
      conflicts.push({
        id: nextId(),
        type: 'Incomplete Section Schedule',
        description: `Section ${section.name} is missing schedules for assigned subjects: ${subjectNames}.`,
        severity: 'warning',
        affectedSection: section.name,
        affectedSectionId: section.id,
      });
    }
  }

  // 7. UNASSIGNED SUBJECT
  // Find subjects that belong to a strand that has sections, but have no schedule_entries at all.
  for (const subject of subjects) {
    // Does this subject's strand have any sections?
    const strandHasSections = sections.some(sec => sec.strand_id === subject.strand_id);
    if (!strandHasSections) continue;

    // Is there any schedule entry for this subject?
    const hasEntry = scheduleEntries.some(e => e.subject_id === subject.id);
    if (!hasEntry) {
      const strandName = strandMap.get(subject.strand_id)?.name || 'Unknown Strand';
      conflicts.push({
        id: nextId(),
        type: 'Unassigned Subject',
        description: `Subject "${subject.name}" (${strandName}) has at least one active section but has not been assigned to any timetable slots.`,
        severity: 'warning',
        affectedSubject: subject.name,
        affectedSubjectId: subject.id,
      });
    }
  }

  return conflicts;
}
