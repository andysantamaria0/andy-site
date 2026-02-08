import { createClient } from '../../../../lib/supabase/server';
import { getNextColor } from '../../../../lib/utils/members';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user is a trip owner
  const { data: ownership } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (!ownership || ownership.role !== 'owner') {
    return NextResponse.json({ error: 'Only trip owners can apply changes' }, { status: 403 });
  }

  const { member_updates, new_travelers, logistics, events } = await request.json();
  const results = { updated: 0, members_added: 0, logistics_added: 0, events_added: 0, errors: [] };

  // Apply member stay date updates
  if (member_updates && member_updates.length > 0) {
    for (const update of member_updates) {
      if (!update.member_id || !update.matched_existing) continue;

      const updateData = {};
      if (update.stay_start) updateData.stay_start = update.stay_start;
      if (update.stay_end) updateData.stay_end = update.stay_end;

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('trip_members')
          .update(updateData)
          .eq('id', update.member_id)
          .eq('trip_id', tripId);

        if (error) {
          results.errors.push(`Failed to update ${update.name}: ${error.message}`);
        } else {
          results.updated++;
        }
      }
    }
  }

  // Create manual members for new travelers
  if (new_travelers && new_travelers.length > 0) {
    // Get current members for color assignment
    const { data: currentMembers } = await supabase
      .from('trip_members')
      .select('color')
      .eq('trip_id', tripId);

    let membersList = currentMembers || [];

    for (const traveler of new_travelers) {
      const color = getNextColor(membersList);

      const { error } = await supabase
        .from('trip_members')
        .insert({
          trip_id: tripId,
          user_id: null,
          role: 'member',
          display_name: traveler.name,
          email: traveler.email || null,
          phone: traveler.phone || null,
          stay_start: traveler.stay_start || null,
          stay_end: traveler.stay_end || null,
          color,
        });

      if (error) {
        results.errors.push(`Failed to add ${traveler.name}: ${error.message}`);
      } else {
        results.members_added = (results.members_added || 0) + 1;
        membersList = [...membersList, { color }];
      }
    }
  }

  // Add logistics entries
  if (logistics && logistics.length > 0) {
    // Get members to match person names to user IDs
    const { data: members } = await supabase
      .from('trip_members')
      .select('user_id, display_name, email, profiles:user_id(display_name, email)')
      .eq('trip_id', tripId);

    for (const entry of logistics) {
      // Try to match person to a member
      const personName = (entry.person_name || '').toLowerCase().trim();
      const matched = personName ? (members || []).find((m) => {
        const name = (m.profiles?.display_name || m.display_name || '').toLowerCase();
        const email = (m.profiles?.email || m.email || '').toLowerCase();
        return name.includes(personName) || personName.includes(name) || email.includes(personName);
      }) : null;

      if (!matched || !matched.user_id) {
        results.errors.push(`Could not match "${entry.person_name}" to a trip member for logistics "${entry.title}". Skipped.`);
        continue;
      }

      const { error } = await supabase.from('logistics').insert({
        trip_id: tripId,
        user_id: matched.user_id,
        type: entry.type || 'other',
        title: entry.title || `${entry.type || 'Item'} for ${entry.person_name}`,
        details: entry.details || {},
        start_time: entry.start_time || null,
        end_time: entry.end_time || null,
        notes: entry.notes || null,
      });

      if (error) {
        results.errors.push(`Failed to add logistics "${entry.title}": ${error.message}`);
      } else {
        results.logistics_added++;
      }
    }
  }

  // Add events
  if (events && events.length > 0) {
    // Get members for attendee name matching
    const { data: eventMembers } = await supabase
      .from('trip_members')
      .select('id, user_id, display_name, email, profiles:user_id(display_name, email)')
      .eq('trip_id', tripId);

    for (const entry of events) {
      const validCategories = ['dinner_out', 'dinner_home', 'activity', 'outing', 'party', 'sightseeing', 'other'];
      const category = validCategories.includes(entry.category) ? entry.category : 'other';

      const { data: newEvent, error: eventError } = await supabase
        .from('events')
        .insert({
          trip_id: tripId,
          title: entry.title || 'Event',
          category,
          event_date: entry.event_date,
          start_time: entry.start_time || null,
          end_time: entry.end_time || null,
          location: entry.location || null,
          notes: entry.notes || null,
          created_by: user.id,
        })
        .select('id')
        .single();

      if (eventError) {
        results.errors.push(`Failed to create event "${entry.title}": ${eventError.message}`);
        continue;
      }

      // Match attendee names to trip members
      if (entry.attendee_names && entry.attendee_names.length > 0 && eventMembers) {
        const attendeeRows = [];
        for (const attendeeName of entry.attendee_names) {
          const nameLower = attendeeName.toLowerCase().trim();
          const matched = eventMembers.find((m) => {
            const name = (m.profiles?.display_name || m.display_name || '').toLowerCase();
            const email = (m.profiles?.email || m.email || '').toLowerCase();
            return name.includes(nameLower) || nameLower.includes(name) || email.includes(nameLower);
          });
          if (matched) {
            attendeeRows.push({ event_id: newEvent.id, member_id: matched.id });
          }
        }
        if (attendeeRows.length > 0) {
          await supabase.from('event_attendees').insert(attendeeRows);
        }
      }

      results.events_added++;
    }
  }

  return NextResponse.json(results);
}
