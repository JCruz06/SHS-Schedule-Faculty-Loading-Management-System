import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';
import { TeacherLoad, ScheduleEntry } from '@/types';

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const insertedEntryIds: string[] = [];
  let deletedEntriesBackup: any[] = [];
  try {
    const body = await request.json();
    const { mode, teacher_id, teacher_load_id } = body;
    const preserve_existing = body.preserve_existing === true;

    if (!mode || !['all', 'teacher', 'load'].includes(mode)) {
      return NextResponse.json({ error: 'Invalid mode specified' }, { status: 400 });
    }

    // 1. Fetch backup of existing auto-generated entries before deleting (if not preserving)
    if (!preserve_existing) {
      let query = supabase.from('schedule_entries').select('*');
      if (mode === 'all') {
        query = query.eq('source', 'auto_generated');
      } else if (mode === 'teacher') {
        if (!teacher_id) {
          return NextResponse.json({ error: 'Missing teacher_id for teacher mode' }, { status: 400 });
        }
        query = query.eq('teacher_id', teacher_id).eq('source', 'auto_generated');
      } else if (mode === 'load') {
        if (!teacher_load_id) {
          return NextResponse.json({ error: 'Missing teacher_load_id for load mode' }, { status: 400 });
        }
        query = query.eq('teacher_load_id', teacher_load_id).eq('source', 'auto_generated');
      }
      const { data: backupData, error: backupErr } = await query;
      if (backupErr) throw backupErr;
      deletedEntriesBackup = backupData || [];

      // Perform deletion
      if (deletedEntriesBackup.length > 0) {
        if (mode === 'all') {
          const { error: delErr } = await supabase
            .from('schedule_entries')
            .delete()
            .eq('source', 'auto_generated');
          if (delErr) throw delErr;
        } else if (mode === 'teacher') {
          const { error: delErr } = await supabase
            .from('schedule_entries')
            .delete()
            .eq('teacher_id', teacher_id)
            .eq('source', 'auto_generated');
          if (delErr) throw delErr;
        } else if (mode === 'load') {
          const { error: delErr } = await supabase
            .from('schedule_entries')
            .delete()
            .eq('teacher_load_id', teacher_load_id)
            .eq('source', 'auto_generated');
          if (delErr) throw delErr;
        }
      }
    }

    // 2. Fetch all current schedule entries to keep track of bookings (manual entries + other teachers' entries)
    const { data: dbEntries, error: entriesErr } = await supabase
      .from('schedule_entries')
      .select('*');
    if (entriesErr) throw entriesErr;

    const teacherBookings = new Set<string>();
    const sectionBookings = new Set<string>();

    (dbEntries || []).forEach((e: ScheduleEntry) => {
      teacherBookings.add(`${e.day}-${e.time_slot_id}-${e.teacher_id}`);
      sectionBookings.add(`${e.day}-${e.time_slot_id}-${e.section_id}`);
    });

    // 3. Fetch all teacher loads, sections, and time slots
    const { data: allLoads, error: loadsErr } = await supabase
      .from('teacher_loads')
      .select('*');
    if (loadsErr) throw loadsErr;

    const { data: sections, error: sectionsErr } = await supabase
      .from('sections')
      .select('*');
    if (sectionsErr) throw sectionsErr;

    const { data: timeSlots, error: slotsErr } = await supabase
      .from('time_slots')
      .select('*')
      .order('sort_order', { ascending: true });
    if (slotsErr) throw slotsErr;

    // Filter loads to process
    let loadsToProcess: TeacherLoad[] = [];
    if (mode === 'all') {
      if (!preserve_existing) {
        loadsToProcess = allLoads || [];
      } else {
        loadsToProcess = (allLoads || []).filter(l => 
          ['pending', 'partially_placed', 'not_placed', 'out_of_sync'].includes(l.placement_status)
        );
      }
    } else if (mode === 'teacher') {
      loadsToProcess = (allLoads || []).filter(l => l.teacher_id === teacher_id);
    } else if (mode === 'load') {
      loadsToProcess = (allLoads || []).filter(l => l.id === teacher_load_id);
    }

    if (loadsToProcess.length === 0) {
      return NextResponse.json({
        fully_placed: [],
        partially_placed: [],
        not_placed: [],
        total_processed: 0
      });
    }

    // 4. Calculate total weekly hours for each teacher across all their loads (to establish priority)
    const teacherHoursMap = new Map<string, number>();
    (allLoads || []).forEach(l => {
      const current = teacherHoursMap.get(l.teacher_id) || 0;
      teacherHoursMap.set(l.teacher_id, current + (l.required_hours_per_week || 0));
    });

    // Sort loads by priority:
    // a) teacher_total_hours DESC
    // b) then required_hours_per_week DESC
    loadsToProcess.sort((a, b) => {
      const aTotal = teacherHoursMap.get(a.teacher_id) || 0;
      const bTotal = teacherHoursMap.get(b.teacher_id) || 0;
      if (aTotal !== bTotal) {
        return bTotal - aTotal;
      }
      return b.required_hours_per_week - a.required_hours_per_week;
    });

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    // Helper function for shuffling
    const shuffle = <T>(array: T[]): T[] => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    // 5. Run auto-placement algorithm
    for (const load of loadsToProcess) {
      const { data: currentLoadRow, error: fetchLoadErr } = await supabase
        .from('teacher_loads')
        .select('placed_hours')
        .eq('id', load.id)
        .single();
      if (fetchLoadErr) throw fetchLoadErr;

      const currentPlacedHours = currentLoadRow?.placed_hours || 0;
      let remaining_hours = load.required_hours_per_week - currentPlacedHours;

      const section = (sections || []).find(s => s.id === load.section_id);
      const shift = section?.shift || 'Morning';

      // Find time slots for this shift, excluding recess
      const shiftSlots = (timeSlots || []).filter(s => s.shift === shift && !s.is_recess);

      const newAssignments: any[] = [];
      
      const { data: currentLoadEntries, error: loadEntriesErr } = await supabase
        .from('schedule_entries')
        .select('day')
        .eq('teacher_load_id', load.id);
      if (loadEntriesErr) throw loadEntriesErr;

      const slotsPlacedPerDay = new Map<string, number>();
      days.forEach(d => slotsPlacedPerDay.set(d, 0));
      (currentLoadEntries || []).forEach((e: any) => {
        slotsPlacedPerDay.set(e.day, (slotsPlacedPerDay.get(e.day) || 0) + 1);
      });

      let pass = 1;
      let progressMade = true;

      // Cycle through weekdays placing at most one period per day per pass.
      // Allow multiple periods on the same day as a fallback if weekdays have been cycled and hours remain.
      while (remaining_hours > 0.01 && progressMade) {
        progressMade = false;
        const shuffledDays = shuffle(days);

        for (const day of shuffledDays) {
          if (remaining_hours <= 0.01) break;

          const currentSlotsOnDay = slotsPlacedPerDay.get(day) || 0;
          // In pass P, allow at most P slots per day
          if (currentSlotsOnDay >= pass) {
            continue;
          }

          const shuffledSlots = shuffle(shiftSlots);

          for (const slot of shuffledSlots) {
            const teacherKey = `${day}-${slot.id}-${load.teacher_id}`;
            const sectionKey = `${day}-${slot.id}-${load.section_id}`;

            if (!teacherBookings.has(teacherKey) && !sectionBookings.has(sectionKey)) {
              newAssignments.push({
                teacher_id: load.teacher_id,
                section_id: load.section_id,
                subject_id: load.subject_id,
                time_slot_id: slot.id,
                day,
                source: 'auto_generated',
                teacher_load_id: load.id
              });

              teacherBookings.add(teacherKey);
              sectionBookings.add(sectionKey);
              slotsPlacedPerDay.set(day, currentSlotsOnDay + 1);
              remaining_hours -= (slot.duration_minutes / 60);

              progressMade = true;
              break; // Place at most one slot per day in this pass
            }
          }
        }
        pass++;
      }

      // Save assignments
      if (newAssignments.length > 0) {
        const { data: insertedRows, error: insErr } = await supabase
          .from('schedule_entries')
          .insert(newAssignments)
          .select();
        if (insErr) throw insErr;
        if (insertedRows) {
          insertedRows.forEach((row: any) => insertedEntryIds.push(row.id));
        }
      }

      // Verify actual scheduled hours from database
      const { data: updatedLoadRow, error: checkErr } = await supabase
        .from('teacher_loads')
        .select('placed_hours')
        .eq('id', load.id)
        .single();
      if (checkErr) throw checkErr;

      const verifiedHours = updatedLoadRow?.placed_hours || 0;

      // Update load status in DB based on verified hours
      let finalStatus: 'fully_placed' | 'partially_placed' | 'not_placed' = 'not_placed';
      if (Math.abs(verifiedHours - load.required_hours_per_week) < 0.01) {
        finalStatus = 'fully_placed';
      } else if (verifiedHours > 0) {
        finalStatus = 'partially_placed';
      }

      const { error: updErr } = await supabase
        .from('teacher_loads')
        .update({ placement_status: finalStatus })
        .eq('id', load.id);
      if (updErr) throw updErr;
    }

    // 6. Fetch the updated loads with their related data to return to the client
    const { data: updatedLoads, error: fetchErr } = await supabase
      .from('teacher_loads')
      .select(`
        *,
        teacher:teachers(*),
        subject:subjects(*),
        section:sections(*)
      `)
      .in('id', loadsToProcess.map(l => l.id));

    if (fetchErr) throw fetchErr;

    // Map teacher ancillary role just like we do in fetch
    const formattedLoads = (updatedLoads || []).map(load => {
      if (load.teacher) {
        let role = load.teacher.ancillary_role || '';
        let roleName = role;
        let hours = 0;
        if (role.includes('|')) {
          const parts = role.split('|');
          roleName = parts[0];
          hours = parseInt(parts[1], 10) || 0;
        }
        load.teacher = {
          ...load.teacher,
          ancillary_role: roleName || undefined,
          ancillary_hours_per_week: hours
        };
      }
      return load;
    });

    const fullyPlaced = formattedLoads.filter(l => l.placement_status === 'fully_placed');
    const partiallyPlaced = formattedLoads.filter(l => l.placement_status === 'partially_placed');
    const notPlaced = formattedLoads.filter(l => l.placement_status === 'not_placed');

    return NextResponse.json({
      fully_placed: fullyPlaced,
      partially_placed: partiallyPlaced,
      not_placed: notPlaced,
      total_processed: formattedLoads.length
    });

  } catch (err: any) {
    console.error('Error during auto-scheduling:', err);
    try {
      if (insertedEntryIds.length > 0) {
        await supabase
          .from('schedule_entries')
          .delete()
          .in('id', insertedEntryIds);
      }
      if (deletedEntriesBackup.length > 0) {
        const cleanBackup = deletedEntriesBackup.map(e => ({
          id: e.id,
          teacher_id: e.teacher_id,
          section_id: e.section_id,
          subject_id: e.subject_id,
          time_slot_id: e.time_slot_id,
          day: e.day,
          source: e.source,
          teacher_load_id: e.teacher_load_id,
          created_at: e.created_at
        }));
        await supabase
          .from('schedule_entries')
          .insert(cleanBackup);
      }
    } catch (rollbackErr) {
      console.error('Rollback failed:', rollbackErr);
    }
    return NextResponse.json({ error: err.message || 'Auto-generation failed' }, { status: 500 });
  }
}
