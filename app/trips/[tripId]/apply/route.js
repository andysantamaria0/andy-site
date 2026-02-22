import { createClient } from '../../../../lib/supabase/server';
import { getNextColor } from '../../../../lib/utils/members';
import { extractPlaceFromUrl } from '../../../../lib/utils/placeFromUrl';
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

  const { member_updates, new_travelers, logistics, events, expenses } = await request.json();
  const results = { updated: 0, members_added: 0, logistics_added: 0, events_added: 0, expenses_added: 0, errors: [] };

  // Apply member stay date updates
  if (member_updates && member_updates.length > 0) {
    for (const update of member_updates) {
      if (!update.member_id || !update.matched_existing) continue;

      const updateData = {};
      if (update.stay_start) updateData.stay_start = update.stay_start;
      if (update.stay_end) updateData.stay_end = update.stay_end;
      if (update.staying_at) updateData.staying_at = update.staying_at;

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
          staying_at: traveler.staying_at || null,
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
    // Get members to match person names to user IDs and member IDs
    const { data: members } = await supabase
      .from('trip_members')
      .select('id, user_id, display_name, email, profiles:user_id(display_name, email)')
      .eq('trip_id', tripId);

    // Get trip legs for leg_destination matching
    const { data: tripLegs } = await supabase
      .from('trip_legs')
      .select('id, destination')
      .eq('trip_id', tripId);

    function matchMember(personName) {
      const nameLower = (personName || '').toLowerCase().trim();
      if (!nameLower) return null;
      return (members || []).find((m) => {
        const name = (m.profiles?.display_name || m.display_name || '').toLowerCase();
        const email = (m.profiles?.email || m.email || '').toLowerCase();
        return name.includes(nameLower) || nameLower.includes(name) || email.includes(nameLower);
      });
    }

    function matchLeg(legDestination) {
      if (!legDestination || !tripLegs) return null;
      const destLower = legDestination.toLowerCase().trim();
      return tripLegs.find((l) => l.destination.toLowerCase().includes(destLower) || destLower.includes(l.destination.toLowerCase()));
    }

    for (const entry of logistics) {
      // Match all person_names (or fall back to person_name)
      const personNames = entry.person_names || (entry.person_name ? [entry.person_name] : []);
      const matchedMembers = personNames.map(matchMember).filter(Boolean);

      // Use first matched person as primary user_id (backward compat)
      const primaryMember = matchedMembers.find((m) => m.user_id) || matchedMembers[0];

      if (!primaryMember || !primaryMember.user_id) {
        results.errors.push(`Could not match "${personNames.join(', ')}" to a trip member for logistics "${entry.title}". Skipped.`);
        continue;
      }

      // Match leg destination
      const matchedLeg = matchLeg(entry.leg_destination);

      const validTypes = ['flight', 'train', 'bus', 'car', 'ferry', 'accommodation', 'other'];
      const type = validTypes.includes(entry.type) ? entry.type : 'other';

      const { data: logisticsRow, error } = await supabase.from('logistics').insert({
        trip_id: tripId,
        user_id: primaryMember.user_id,
        type,
        title: entry.title || `${entry.type || 'Item'} for ${personNames[0] || 'unknown'}`,
        details: entry.details || {},
        start_time: entry.start_time || null,
        end_time: entry.end_time || null,
        notes: entry.notes || null,
        leg_id: matchedLeg?.id || null,
      }).select('id').single();

      if (error) {
        results.errors.push(`Failed to add logistics "${entry.title}": ${error.message}`);
      } else {
        // Insert logistics_travelers for all matched members
        const travelerRows = matchedMembers
          .map((m) => ({ logistics_id: logisticsRow.id, member_id: m.id }))
          .filter((r, i, arr) => arr.findIndex((x) => x.member_id === r.member_id) === i);
        if (travelerRows.length > 0) {
          await supabase.from('logistics_travelers').insert(travelerRows);
        }
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

    // Get trip legs for leg_destination matching (reuse if already fetched above)
    let eventLegs = null;
    const { data: fetchedEventLegs } = await supabase
      .from('trip_legs')
      .select('id, destination')
      .eq('trip_id', tripId);
    eventLegs = fetchedEventLegs;

    function matchEventLeg(legDestination) {
      if (!legDestination || !eventLegs) return null;
      const destLower = legDestination.toLowerCase().trim();
      return eventLegs.find((l) => l.destination.toLowerCase().includes(destLower) || destLower.includes(l.destination.toLowerCase()));
    }

    for (const entry of events) {
      const validCategories = ['dinner_out', 'dinner_home', 'activity', 'outing', 'party', 'sightseeing', 'other'];
      const category = validCategories.includes(entry.category) ? entry.category : 'other';

      // Extract place coordinates from Google Maps URL if provided
      let placeData = {};
      if (entry.place_url) {
        const place = await extractPlaceFromUrl(entry.place_url);
        if (place) {
          placeData = {
            place_lat: place.lat,
            place_lng: place.lng,
            place_address: place.name || place.address || null,
          };
        }
      }

      const matchedLeg = matchEventLeg(entry.leg_destination);

      const { data: newEvent, error: eventError } = await supabase
        .from('events')
        .insert({
          trip_id: tripId,
          title: entry.title || 'Event',
          category,
          event_date: entry.event_date,
          start_time: entry.start_time || null,
          end_time: entry.end_time || null,
          location: placeData.place_address || entry.location || null,
          ...placeData,
          notes: entry.notes || null,
          created_by: user.id,
          leg_id: matchedLeg?.id || null,
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

  // Add expenses
  if (expenses && expenses.length > 0) {
    // Get members for payer name matching
    const { data: expenseMembers } = await supabase
      .from('trip_members')
      .select('id, user_id, display_name, email, profiles:user_id(display_name, email)')
      .eq('trip_id', tripId);

    for (const expense of expenses) {
      // Try to match payer to a member
      let matchedMemberId = expense.payer_member_id || null;

      if (!matchedMemberId && expense.payer_name) {
        const payerName = expense.payer_name.toLowerCase().trim();
        const matched = (expenseMembers || []).find((m) => {
          const name = (m.profiles?.display_name || m.display_name || '').toLowerCase();
          const email = (m.profiles?.email || m.email || '').toLowerCase();
          return name.includes(payerName) || payerName.includes(name) || email.includes(payerName);
        });
        if (matched) matchedMemberId = matched.id;
      }

      if (!matchedMemberId) {
        results.errors.push(`Could not match payer "${expense.payer_name}" to a trip member for expense "${expense.description}". Skipped.`);
        continue;
      }

      const validCategories = ['food','drinks','transport','accommodation','activities','groceries','supplies','other'];
      const category = validCategories.includes(expense.category) ? expense.category : 'other';

      const { error } = await supabase.from('expenses').insert({
        trip_id: tripId,
        paid_by_member_id: matchedMemberId,
        description: expense.description || expense.vendor || 'Expense',
        vendor: expense.vendor || null,
        amount: expense.amount,
        currency: expense.currency || 'USD',
        expense_date: expense.expense_date || new Date().toISOString().slice(0, 10),
        category,
        notes: expense.notes || null,
        created_by: user.id,
      });

      if (error) {
        results.errors.push(`Failed to add expense "${expense.description}": ${error.message}`);
      } else {
        results.expenses_added++;
      }
    }
  }

  return NextResponse.json(results);
}
