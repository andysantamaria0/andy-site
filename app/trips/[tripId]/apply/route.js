import { createClient } from '../../../../lib/supabase/server';
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

  const { member_updates, new_travelers, logistics } = await request.json();
  const results = { updated: 0, logistics_added: 0, travelers_noted: 0, errors: [] };

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

  // Note new travelers (they can't be fully added without auth accounts,
  // but we track them so the admin knows they were captured)
  if (new_travelers && new_travelers.length > 0) {
    results.travelers_noted = new_travelers.length;
    results.new_traveler_names = new_travelers.map((t) => t.name);
  }

  // Add logistics entries
  if (logistics && logistics.length > 0) {
    // Get members to match person names to user IDs
    const { data: members } = await supabase
      .from('trip_members')
      .select('user_id, profiles:user_id(display_name, email)')
      .eq('trip_id', tripId);

    for (const entry of logistics) {
      // Try to match person to a member
      const personName = (entry.person_name || '').toLowerCase().trim();
      const matched = personName ? (members || []).find((m) => {
        const name = m.profiles?.display_name?.toLowerCase() || '';
        const email = m.profiles?.email?.toLowerCase() || '';
        return name.includes(personName) || personName.includes(name) || email.includes(personName);
      }) : null;

      if (!matched) {
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

  return NextResponse.json(results);
}
