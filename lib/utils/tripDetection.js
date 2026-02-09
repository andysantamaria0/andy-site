/**
 * Trip detection — routes inbound messages to the right trip.
 * Shared by email webhook and SMS/voice webhooks.
 */

/**
 * Generate a trip code from name/destination (mirrors the SQL trigger).
 */
export function generateTripCode(name, destination) {
  const base = (destination && destination.length <= (name || destination).length)
    ? destination
    : (name || destination || 'trip');
  return base
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20);
}

/**
 * Build a human-friendly disambiguation message.
 */
export function buildDisambiguationMessage(candidates) {
  const lines = candidates.map((t) =>
    `  "${t.trip_code}" — ${t.name}${t.destination ? ` (${t.destination})` : ''}`
  );
  return [
    "I found multiple trips you might mean. Reply with the trip code:",
    "",
    ...lines,
    "",
    'For example, reply with just the code like "amalfi".',
  ].join('\n');
}

/**
 * Core trip detection.
 * Returns { trip, member, ambiguous, candidates }
 */
export async function detectTrip(supabase, { senderEmail, senderPhone, messageText, toAddress }) {
  // Legacy: if toAddress matches trip-*@ pattern, look up directly
  if (toAddress) {
    const legacyMatch = toAddress.match(/^trip-[a-z0-9]+@/i);
    if (legacyMatch) {
      const { data: trip } = await supabase
        .from('trips')
        .select('*')
        .eq('inbound_email', toAddress.toLowerCase().trim())
        .single();

      if (trip) {
        const member = await findMemberInTrip(supabase, trip.id, { senderEmail, senderPhone });
        return { trip, member, ambiguous: false, candidates: [] };
      }
    }
  }

  // Sender lookup — find trips where this sender is a member
  const senderTrips = await findTripsBySender(supabase, { senderEmail, senderPhone });

  if (senderTrips.length === 0) {
    return { trip: null, member: null, ambiguous: false, candidates: [] };
  }

  // Filter to active trips (end_date in the future or null, or within 7 days past)
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const activeTrips = senderTrips.filter((t) => {
    if (!t.trip.end_date) return true;
    return new Date(t.trip.end_date) >= weekAgo;
  });

  const trips = activeTrips.length > 0 ? activeTrips : senderTrips;

  // Single active trip — auto-assign
  if (trips.length === 1) {
    return { trip: trips[0].trip, member: trips[0].member, ambiguous: false, candidates: [] };
  }

  // Code/keyword match from message text
  if (messageText) {
    const text = messageText.toLowerCase();
    for (const t of trips) {
      if (t.trip.trip_code && text.includes(t.trip.trip_code)) {
        return { trip: t.trip, member: t.member, ambiguous: false, candidates: [] };
      }
      if (t.trip.trip_keywords) {
        for (const kw of t.trip.trip_keywords) {
          if (kw && text.includes(kw)) {
            return { trip: t.trip, member: t.member, ambiguous: false, candidates: [] };
          }
        }
      }
    }
  }

  // Ambiguous
  return {
    trip: null,
    member: null,
    ambiguous: true,
    candidates: trips.map((t) => t.trip),
  };
}

/**
 * SMS-specific detection with conversation memory.
 */
export async function detectTripForSms(supabase, { senderPhone, messageText }) {
  const text = (messageText || '').trim();

  // Handle "switch to [code]" commands
  const switchMatch = text.match(/^switch\s+to\s+(\S+)$/i);
  if (switchMatch) {
    const code = switchMatch[1].toLowerCase();
    const { data: trip } = await supabase
      .from('trips')
      .select('*')
      .eq('trip_code', code)
      .single();

    if (trip) {
      // Update conversation context
      await supabase
        .from('sms_conversations')
        .upsert({
          phone_number: senderPhone,
          trip_id: trip.id,
          last_message_at: new Date().toISOString(),
        }, { onConflict: 'phone_number' });

      const member = await findMemberInTrip(supabase, trip.id, { senderPhone });
      return { trip, member, ambiguous: false, candidates: [], switched: true };
    }
  }

  // Check existing conversation context
  const { data: convo } = await supabase
    .from('sms_conversations')
    .select('trip_id')
    .eq('phone_number', senderPhone)
    .single();

  if (convo?.trip_id) {
    const { data: trip } = await supabase
      .from('trips')
      .select('*')
      .eq('id', convo.trip_id)
      .single();

    if (trip) {
      // Update last message time
      await supabase
        .from('sms_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('phone_number', senderPhone);

      const member = await findMemberInTrip(supabase, trip.id, { senderPhone });
      return { trip, member, ambiguous: false, candidates: [] };
    }
  }

  // Fall through to general detection
  const result = await detectTrip(supabase, { senderPhone, messageText: text });

  // If resolved, save conversation context
  if (result.trip) {
    await supabase
      .from('sms_conversations')
      .upsert({
        phone_number: senderPhone,
        trip_id: result.trip.id,
        last_message_at: new Date().toISOString(),
      }, { onConflict: 'phone_number' });
  }

  return result;
}

/**
 * Find all trips where the sender is a member (by email or phone).
 * Returns array of { trip, member }.
 */
async function findTripsBySender(supabase, { senderEmail, senderPhone }) {
  const results = [];

  if (senderEmail) {
    const email = senderEmail.toLowerCase().trim();

    // Check trip_members.email
    const { data: directMembers } = await supabase
      .from('trip_members')
      .select('*, trips(*)')
      .ilike('email', email);

    if (directMembers) {
      for (const m of directMembers) {
        if (m.trips) results.push({ trip: m.trips, member: m });
      }
    }

    // Check profiles.email for linked members
    const { data: profileMembers } = await supabase
      .from('trip_members')
      .select('*, trips(*), profiles:user_id(email)')
      .not('user_id', 'is', null);

    if (profileMembers) {
      for (const m of profileMembers) {
        if (m.profiles?.email?.toLowerCase() === email && !results.find((r) => r.trip.id === m.trips?.id)) {
          results.push({ trip: m.trips, member: m });
        }
      }
    }
  }

  if (senderPhone) {
    const phone = senderPhone.replace(/\D/g, '');
    // Filter server-side to avoid full table scan
    const { data: phoneMembers } = await supabase
      .from('trip_members')
      .select('*, trips(*)')
      .not('phone', 'is', null);

    if (phoneMembers) {
      for (const m of phoneMembers) {
        if (m.phone && m.phone.replace(/\D/g, '') === phone && !results.find((r) => r.trip.id === m.trips?.id)) {
          results.push({ trip: m.trips, member: m });
        }
      }
    }
  }

  return results;
}

/**
 * Find a specific member in a trip by email or phone.
 */
async function findMemberInTrip(supabase, tripId, { senderEmail, senderPhone }) {
  const { data: members } = await supabase
    .from('trip_members')
    .select('*, profiles:user_id(email)')
    .eq('trip_id', tripId);

  if (!members) return null;

  if (senderEmail) {
    const email = senderEmail.toLowerCase().trim();
    const match = members.find((m) =>
      (m.email || '').toLowerCase() === email ||
      (m.profiles?.email || '').toLowerCase() === email
    );
    if (match) return match;
  }

  if (senderPhone) {
    const phone = senderPhone.replace(/\D/g, '');
    const match = members.find((m) => m.phone && m.phone.replace(/\D/g, '') === phone);
    if (match) return match;
  }

  return null;
}
