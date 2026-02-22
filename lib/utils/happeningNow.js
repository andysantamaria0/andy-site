/**
 * Happening Now — compute active/upcoming trip items from real Supabase data
 */

const CATEGORY_EMOJI = {
  dinner_out: '🍽️',
  dinner_home: '🍳',
  activity: '🎯',
  outing: '🚶',
  party: '🎉',
  sightseeing: '🏛️',
  other: '📌',
};

const LOGISTICS_EMOJI = {
  flight: '✈️',
  train: '🚆',
  bus: '🚌',
  car: '🚗',
  ferry: '⛴️',
  accommodation: '🏠',
  other: '📦',
};

/**
 * Build a lookup map from trip_members by ID for resolving event_attendees.
 * Each member entry: { name, avatarUrl, color }
 */
function buildMemberLookup(members) {
  const map = {};
  for (const m of members) {
    const profile = m.profiles;
    map[m.id] = {
      name: profile?.display_name || m.display_name || m.email || 'Guest',
      avatarUrl: profile?.avatar_url || null,
      color: m.color || '#4A35D7',
    };
  }
  return map;
}

/**
 * Compute happening-now items from real Supabase data.
 *
 * @param {Object} params
 * @param {Array} params.events - Today's events with event_attendees nested
 * @param {Array} params.logistics - Today's logistics with profiles nested
 * @param {Array} params.members - All trip_members with profiles nested
 * @param {Date} params.now - Current time
 * @param {Object} params.trip - Trip object with start_date, end_date
 * @returns {Array} Normalized happening-now items
 */
export function computeHappeningNow({ events = [], logistics = [], members = [], now = new Date(), trip = {} } = {}) {
  // Skip if today is outside trip dates
  const today = now.toISOString().split('T')[0];
  if (trip.start_date && today < trip.start_date) return [];
  if (trip.end_date && today > trip.end_date) return [];

  const memberLookup = buildMemberLookup(members);
  const items = [];
  const nowMin = now.getHours() * 60 + now.getMinutes();

  // ---- Events ----
  for (const event of events) {
    if (event.event_date !== today) continue;

    const startMin = event.start_time ? parseTimeToMin(event.start_time) : null;
    const endMin = event.end_time ? parseTimeToMin(event.end_time) : null;

    let status;
    if (startMin !== null && endMin !== null && startMin <= nowMin && nowMin <= endMin) {
      status = 'in_progress';
    } else if (startMin !== null && startMin > nowMin && startMin - nowMin <= 60) {
      status = 'upcoming';
    } else if (startMin !== null && startMin > nowMin) {
      // Future but more than 60 min away — skip (not relevant enough)
      continue;
    } else {
      continue; // past event or no time set
    }

    // Resolve attendees: if no event_attendees rows, assume everyone
    const attendees = event.event_attendees;
    let itemMembers;
    if (!attendees || attendees.length === 0) {
      // Everyone is attending
      itemMembers = members.map((m) => memberLookup[m.id]);
    } else {
      itemMembers = attendees
        .map((a) => memberLookup[a.member_id])
        .filter(Boolean);
    }

    items.push({
      id: `event-${event.id}`,
      type: 'event',
      status,
      title: event.title,
      subtitle: event.location || null,
      emoji: CATEGORY_EMOJI[event.category] || CATEGORY_EMOJI.other,
      startTime: event.start_time ? `${today}T${event.start_time}` : null,
      endTime: event.end_time ? `${today}T${event.end_time}` : null,
      members: itemMembers,
      flightStatus: null,
      sortOrder: status === 'in_progress' ? 0 : 1,
    });
  }

  // ---- Logistics (flights, trains, etc.) ----
  for (const entry of logistics) {
    const startTime = entry.start_time ? new Date(entry.start_time) : null;
    const endTime = entry.end_time ? new Date(entry.end_time) : null;

    let status;
    if (startTime && endTime && startTime <= now && now <= endTime) {
      status = 'in_progress';
    } else if (startTime && startTime > now && (startTime - now) <= 2 * 60 * 60 * 1000) {
      status = 'upcoming';
    } else {
      continue; // past or too far in future
    }

    // Resolve travelers: prefer logistics_travelers, fall back to single profile
    let entryMembers;
    if (entry.logistics_travelers && entry.logistics_travelers.length > 0) {
      entryMembers = entry.logistics_travelers
        .map((lt) => memberLookup[lt.member_id])
        .filter(Boolean);
    }
    if (!entryMembers || entryMembers.length === 0) {
      const profile = entry.profiles;
      entryMembers = [{
        name: profile?.display_name || 'Guest',
        avatarUrl: profile?.avatar_url || null,
        color: '#4A35D7',
      }];
    }

    // For flights, compute progress and build flightStatus
    const details = entry.details || {};
    let flightStatus = null;
    if (entry.type === 'flight' && startTime && endTime) {
      const totalMs = endTime - startTime;
      const elapsedMs = now - startTime;
      const progress = totalMs > 0 ? Math.round(Math.max(0, Math.min(100, (elapsedMs / totalMs) * 100))) : 0;

      flightStatus = {
        flightNumber: details.flight_number || details.flightNumber || entry.title,
        departureCity: details.departure_city || details.from || '???',
        arrivalCity: details.arrival_city || details.to || '???',
        status: status === 'in_progress' ? 'en_route' : 'scheduled',
        progress,
        estimatedArrival: entry.end_time,
        delay: 0,
        gate: details.gate || null,
        terminal: details.terminal || null,
      };
    }

    const subtitle = entry.type === 'flight' && flightStatus
      ? `${flightStatus.departureCity} → ${flightStatus.arrivalCity}`
      : (typeof details === 'string' ? details : details.carrier || null);

    items.push({
      id: `logistics-${entry.id}`,
      type: entry.type === 'flight' ? 'flight' : 'logistics',
      status,
      title: entry.title,
      subtitle,
      emoji: LOGISTICS_EMOJI[entry.type] || LOGISTICS_EMOJI.other,
      startTime: entry.start_time,
      endTime: entry.end_time,
      members: entryMembers,
      flightStatus,
      sortOrder: status === 'in_progress' ? 0 : 1,
    });
  }

  // ---- Arrivals & Departures ----
  for (const member of members) {
    const info = memberLookup[member.id];
    if (member.stay_start === today) {
      items.push({
        id: `arrival-${member.id}`,
        type: 'arrival',
        status: 'today',
        title: `${info.name} arriving today`,
        subtitle: null,
        emoji: '🟢',
        startTime: null,
        endTime: null,
        members: [info],
        flightStatus: null,
        sortOrder: 2,
      });
    }
    if (member.stay_end === today) {
      items.push({
        id: `departure-${member.id}`,
        type: 'departure',
        status: 'today',
        title: `${info.name} departing today`,
        subtitle: null,
        emoji: '🔴',
        startTime: null,
        endTime: null,
        members: [info],
        flightStatus: null,
        sortOrder: 2,
      });
    }
  }

  // Sort: in_progress first, then upcoming, then today
  items.sort((a, b) => a.sortOrder - b.sortOrder);

  return items;
}

function parseTimeToMin(timeStr) {
  const parts = timeStr.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}
