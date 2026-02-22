import { createClient } from '../../../../../../../lib/supabase/server';
import { extractPlaceFromUrl } from '../../../../../../../lib/utils/placeFromUrl';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  const { tripId, suggestionId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only owners can approve
  const { data: membership } = await supabase
    .from('trip_members')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .single();

  if (!membership || membership.role !== 'owner') {
    return NextResponse.json({ error: 'Only trip owners can approve suggestions' }, { status: 403 });
  }

  // Read suggestion
  const { data: suggestion, error: fetchError } = await supabase
    .from('suggestions')
    .select('*')
    .eq('id', suggestionId)
    .eq('trip_id', tripId)
    .single();

  if (fetchError || !suggestion) {
    return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
  }
  if (suggestion.status !== 'pending') {
    return NextResponse.json({ error: `Suggestion is already ${suggestion.status}` }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const { expense_payer_member_id, dismiss_group = true } = body;
  const payload = suggestion.payload || {};
  let entityId = null;

  // Fetch members and legs for matching
  const { data: members } = await supabase
    .from('trip_members')
    .select('id, user_id, display_name, email, profiles:user_id(display_name, email)')
    .eq('trip_id', tripId);

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
    return tripLegs.find((l) =>
      l.destination.toLowerCase().includes(destLower) || destLower.includes(l.destination.toLowerCase())
    );
  }

  // Create entity based on suggestion type
  if (suggestion.suggestion_type === 'logistics') {
    const personNames = payload.person_names || (payload.person_name ? [payload.person_name] : []);
    const matchedMembers = personNames.map(matchMember).filter(Boolean);
    const primaryMember = matchedMembers.find((m) => m.user_id) || matchedMembers[0];

    if (!primaryMember || !primaryMember.user_id) {
      return NextResponse.json({
        error: `Could not match "${personNames.join(', ')}" to a trip member. Update the suggestion payload with valid person_names.`,
      }, { status: 400 });
    }

    const validTypes = ['flight', 'train', 'bus', 'car', 'ferry', 'accommodation', 'other'];
    const type = validTypes.includes(payload.type) ? payload.type : 'other';
    const legId = suggestion.leg_id || matchLeg(payload.leg_destination)?.id || null;

    const { data: logisticsRow, error } = await supabase.from('logistics').insert({
      trip_id: tripId,
      user_id: primaryMember.user_id,
      type,
      title: payload.title || suggestion.title,
      details: payload.details || {},
      start_time: payload.start_time || null,
      end_time: payload.end_time || null,
      notes: payload.notes || suggestion.notes || null,
      leg_id: legId,
    }).select('id').single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    entityId = logisticsRow.id;

    const travelerRows = matchedMembers
      .map((m) => ({ logistics_id: logisticsRow.id, member_id: m.id }))
      .filter((r, i, arr) => arr.findIndex((x) => x.member_id === r.member_id) === i);
    if (travelerRows.length > 0) {
      await supabase.from('logistics_travelers').insert(travelerRows);
    }

  } else if (suggestion.suggestion_type === 'event') {
    const validCategories = ['dinner_out', 'dinner_home', 'activity', 'outing', 'party', 'sightseeing', 'other'];
    const category = validCategories.includes(payload.category) ? payload.category : 'other';

    let placeData = {};
    if (payload.place_url) {
      const place = await extractPlaceFromUrl(payload.place_url);
      if (place) {
        placeData = {
          place_lat: place.lat,
          place_lng: place.lng,
          place_address: place.name || place.address || null,
        };
      }
    }

    const legId = suggestion.leg_id || matchLeg(payload.leg_destination)?.id || null;

    const { data: newEvent, error: eventError } = await supabase
      .from('events')
      .insert({
        trip_id: tripId,
        title: payload.title || suggestion.title,
        category,
        event_date: payload.event_date || null,
        start_time: payload.start_time || null,
        end_time: payload.end_time || null,
        location: placeData.place_address || payload.location || null,
        ...placeData,
        notes: payload.notes || suggestion.notes || null,
        created_by: user.id,
        leg_id: legId,
      })
      .select('id')
      .single();

    if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });
    entityId = newEvent.id;

    if (payload.attendee_names && payload.attendee_names.length > 0 && members) {
      const attendeeRows = [];
      for (const name of payload.attendee_names) {
        const matched = matchMember(name);
        if (matched) attendeeRows.push({ event_id: newEvent.id, member_id: matched.id });
      }
      if (attendeeRows.length > 0) {
        await supabase.from('event_attendees').insert(attendeeRows);
      }
    }

  } else if (suggestion.suggestion_type === 'expense') {
    const payerMemberId = expense_payer_member_id || payload.payer_member_id;
    if (!payerMemberId) {
      return NextResponse.json({ error: 'expense_payer_member_id is required for expense suggestions' }, { status: 400 });
    }

    const validCategories = ['food', 'drinks', 'transport', 'accommodation', 'activities', 'groceries', 'supplies', 'other'];
    const category = validCategories.includes(payload.category) ? payload.category : 'other';

    const { data: newExpense, error: expError } = await supabase.from('expenses').insert({
      trip_id: tripId,
      paid_by_member_id: payerMemberId,
      description: payload.description || suggestion.title,
      vendor: payload.vendor || null,
      amount: suggestion.price_amount || payload.amount,
      currency: suggestion.price_currency || payload.currency || 'USD',
      expense_date: payload.expense_date || new Date().toISOString().slice(0, 10),
      category,
      notes: payload.notes || suggestion.notes || null,
      created_by: user.id,
    }).select('id').single();

    if (expError) return NextResponse.json({ error: expError.message }, { status: 500 });
    entityId = newExpense.id;
  }

  // Auto-create expense for logistics/event if price is set
  if (suggestion.suggestion_type !== 'expense' && suggestion.price_amount && expense_payer_member_id) {
    const categoryMap = { logistics: 'transport', event: 'activities' };
    await supabase.from('expenses').insert({
      trip_id: tripId,
      paid_by_member_id: expense_payer_member_id,
      description: suggestion.title,
      amount: suggestion.price_amount,
      currency: suggestion.price_currency || 'USD',
      expense_date: new Date().toISOString().slice(0, 10),
      category: categoryMap[suggestion.suggestion_type] || 'other',
      notes: suggestion.price_note || null,
      created_by: user.id,
    });
  }

  // Mark suggestion as approved
  await supabase
    .from('suggestions')
    .update({
      status: 'approved',
      approved_entity_id: entityId,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', suggestionId);

  // Dismiss other pending suggestions in the same group
  if (dismiss_group && suggestion.group_key) {
    await supabase
      .from('suggestions')
      .update({ status: 'dismissed' })
      .eq('trip_id', tripId)
      .eq('group_key', suggestion.group_key)
      .eq('status', 'pending')
      .neq('id', suggestionId);
  }

  return NextResponse.json({ ok: true, entity_id: entityId });
}
