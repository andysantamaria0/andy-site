import { createClient } from '../../../../../lib/supabase/server';
import { formatDateRange, formatDateShort, daysInRange, tripDuration } from '../../../../../lib/utils/dates';
import { getMemberDisplayInfo } from '../../../../../lib/utils/members';
import { NextResponse } from 'next/server';
import { format, parseISO, isWithinInterval } from 'date-fns';

const TYPE_EMOJI = {
  flight: '✈️',
  train: '🚆',
  bus: '🚌',
  car: '🚗',
  accommodation: '🏠',
  other: '📦',
};

const CATEGORY_LABELS = {
  dinner_out: 'Dinner Out',
  dinner_home: 'Dinner In',
  activity: 'Activity',
  outing: 'Outing',
  party: 'Party',
  sightseeing: 'Sightseeing',
  other: 'Event',
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatLogisticsTime(startTime) {
  if (!startTime) return null;
  try {
    const d = new Date(startTime);
    const h = d.getHours();
    const m = d.getMinutes();
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, '0')}${suffix}`;
  } catch {
    return null;
  }
}

function formatEventTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return minutes === '00' ? `${h12}${suffix}` : `${h12}:${minutes}${suffix}`;
}

export async function GET(request, { params }) {
  const { tripId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Fetch trip, members, events, logistics
  const [
    { data: trip },
    { data: members },
    { data: events },
    { data: logistics },
  ] = await Promise.all([
    supabase.from('trips').select('*').eq('id', tripId).single(),
    supabase
      .from('trip_members')
      .select('*, profiles:user_id(display_name, avatar_url, email)')
      .eq('trip_id', tripId)
      .order('joined_at', { ascending: true }),
    supabase
      .from('events')
      .select('*, event_attendees(id, member_id), event_cost_splits(id, member_id, amount, percentage), event_invites(id, name, email, phone)')
      .eq('trip_id', tripId)
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true, nullsFirst: false }),
    supabase
      .from('logistics')
      .select('*, profiles:user_id(display_name, avatar_url, email)')
      .eq('trip_id', tripId)
      .order('start_time', { ascending: true, nullsFirst: false }),
  ]);

  if (!trip) {
    return new NextResponse('Trip not found', { status: 404 });
  }

  // Verify user is a trip member
  const membership = (members || []).find((m) => m.user_id === user.id);
  if (!membership) {
    return new NextResponse('Not a trip member', { status: 403 });
  }

  if (!trip.start_date || !trip.end_date) {
    return new NextResponse('Trip dates not set', { status: 400 });
  }

  const days = daysInRange(trip.start_date, trip.end_date);
  const duration = tripDuration(trip.start_date, trip.end_date);
  const dateRange = formatDateRange(trip.start_date, trip.end_date);

  // Index members
  const membersById = {};
  (members || []).forEach((m) => { membersById[m.id] = m; });
  const membersByUserId = {};
  (members || []).forEach((m) => { if (m.user_id) membersByUserId[m.user_id] = m; });

  function getMembersPresent(day) {
    return (members || []).filter((m) => {
      if (!m.stay_start || !m.stay_end) return false;
      try {
        return isWithinInterval(day, {
          start: parseISO(m.stay_start),
          end: parseISO(m.stay_end),
        });
      } catch {
        return false;
      }
    });
  }

  function getEventsForDay(dayStr) {
    return (events || []).filter((e) => e.event_date === dayStr);
  }

  function getLogisticsForDay(dayStr) {
    return (logistics || []).filter((l) => {
      if (l.start_time) {
        try {
          return format(new Date(l.start_time), 'yyyy-MM-dd') === dayStr;
        } catch {
          return false;
        }
      }
      if (l.end_time) {
        try {
          return format(new Date(l.end_time), 'yyyy-MM-dd') === dayStr;
        } catch {
          return false;
        }
      }
      return false;
    });
  }

  // Build member legend
  const memberLegendHtml = (members || []).map((m) => {
    const info = getMemberDisplayInfo(m);
    const stayInfo = m.stay_start && m.stay_end
      ? `${formatDateShort(m.stay_start)} – ${formatDateShort(m.stay_end)}`
      : 'Dates TBD';
    return `<div class="member-legend-item">
      <span class="color-dot" style="background-color:${escapeHtml(m.color || '#4A35D7')}"></span>
      <span class="member-name">${escapeHtml(info.name)}</span>
      <span class="member-dates">${escapeHtml(stayInfo)}</span>
    </div>`;
  }).join('');

  // Build day-by-day HTML
  const daysHtml = days.map((day, i) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayNum = i + 1;
    const present = getMembersPresent(day);
    const dayEvents = getEventsForDay(dayStr);
    const dayLogistics = getLogisticsForDay(dayStr);

    // Arrivals & departures
    const arrivals = (members || []).filter((m) => m.stay_start === dayStr);
    const departures = (members || []).filter((m) => m.stay_end === dayStr);

    const presenceDots = present.map((m) => {
      const info = getMemberDisplayInfo(m);
      return `<span class="color-dot" style="background-color:${escapeHtml(m.color || '#4A35D7')}" title="${escapeHtml(info.name)}"></span>`;
    }).join('');

    let arrivalsHtml = '';
    if (arrivals.length > 0) {
      const names = arrivals.map((m) => escapeHtml(getMemberDisplayInfo(m).name)).join(', ');
      arrivalsHtml = `<div class="movement">📍 Arriving: ${names}</div>`;
    }

    let departuresHtml = '';
    if (departures.length > 0) {
      const names = departures.map((m) => escapeHtml(getMemberDisplayInfo(m).name)).join(', ');
      departuresHtml = `<div class="movement">👋 Departing: ${names}</div>`;
    }

    const logisticsHtml = dayLogistics.map((entry) => {
      const emoji = TYPE_EMOJI[entry.type] || TYPE_EMOJI.other;
      const time = formatLogisticsTime(entry.start_time);
      const member = entry.user_id ? membersByUserId[entry.user_id] : null;
      const memberName = member ? getMemberDisplayInfo(member).name : '';
      const details = entry.details || {};
      const detailParts = [];
      if (details.flight_number) detailParts.push(`Flight ${details.flight_number}`);
      if (details.carrier) detailParts.push(details.carrier);
      const detailStr = detailParts.length > 0 ? ` · ${escapeHtml(detailParts.join(' · '))}` : '';

      return `<div class="logistics-item">
        <span class="logistics-emoji">${emoji}</span>
        <span class="logistics-title">${escapeHtml(entry.title)}</span>
        ${time ? `<span class="logistics-time">${escapeHtml(time)}</span>` : ''}
        ${memberName ? `<span class="logistics-person">${escapeHtml(memberName)}</span>` : ''}
        ${detailStr ? `<span class="logistics-detail">${detailStr}</span>` : ''}
      </div>`;
    }).join('');

    const eventsHtml = dayEvents.map((event) => {
      const time = formatEventTime(event.start_time);
      const category = CATEGORY_LABELS[event.category] || 'Event';
      const attendeeNames = (event.event_attendees || []).map((a) => {
        const m = membersById[a.member_id];
        return m ? getMemberDisplayInfo(m).name : '';
      }).filter(Boolean);

      return `<div class="event-item">
        <div class="event-header">
          ${time ? `<span class="event-time">${escapeHtml(time)}</span>` : ''}
          <span class="event-title">${escapeHtml(event.title)}</span>
          <span class="event-category">${escapeHtml(category)}</span>
        </div>
        ${event.location ? `<div class="event-location">📍 ${escapeHtml(event.location)}</div>` : ''}
        ${attendeeNames.length > 0 ? `<div class="event-attendees">${escapeHtml(attendeeNames.join(', '))}</div>` : ''}
        ${event.notes ? `<div class="event-notes">${escapeHtml(event.notes)}</div>` : ''}
      </div>`;
    }).join('');

    const hasContent = dayLogistics.length > 0 || dayEvents.length > 0 || arrivals.length > 0 || departures.length > 0;

    return `<div class="day">
      <div class="day-header">
        <div class="day-label">
          <span class="day-name">${format(day, 'EEEE, MMMM d')}</span>
          <span class="day-num">Day ${dayNum}</span>
        </div>
        ${presenceDots ? `<div class="presence-dots">${presenceDots}</div>` : ''}
      </div>
      ${arrivalsHtml}
      ${departuresHtml}
      ${logisticsHtml}
      ${eventsHtml}
      ${!hasContent ? '<div class="free-day">Free day</div>' : ''}
    </div>`;
  }).join('');

  const generatedDate = format(new Date(), 'MMMM d, yyyy');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(trip.name)} — Itinerary</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;1,9..144,400&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #F0EDE6;
      color: #0A1628;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 32px;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 24px;
      border-bottom: 2px solid #C4A77D;
    }
    .header h1 {
      font-family: 'Fraunces', serif;
      font-size: 2rem;
      font-weight: 700;
      color: #0A1628;
      margin-bottom: 8px;
    }
    .header .destination {
      font-size: 1.1rem;
      color: #C4A77D;
      font-weight: 500;
      margin-bottom: 4px;
    }
    .header .date-range {
      font-size: 0.95rem;
      color: #5A6B80;
    }
    .member-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 24px;
      margin-bottom: 32px;
      padding: 16px 20px;
      background: #fff;
      border-radius: 6px;
      border: 1px solid #e0ddd6;
    }
    .member-legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
    }
    .color-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .member-name { font-weight: 600; color: #0A1628; }
    .member-dates { color: #5A6B80; }
    .day {
      margin-bottom: 24px;
      background: #fff;
      border-radius: 6px;
      padding: 20px 24px;
      border: 1px solid #e0ddd6;
      break-inside: avoid;
    }
    .day-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    .day-label { display: flex; align-items: baseline; gap: 12px; }
    .day-name {
      font-family: 'Fraunces', serif;
      font-size: 1.1rem;
      font-weight: 700;
      color: #0A1628;
    }
    .day-num {
      font-size: 0.8rem;
      color: #C4A77D;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .presence-dots { display: flex; gap: 4px; align-items: center; }
    .movement {
      font-size: 0.85rem;
      color: #5A6B80;
      margin-bottom: 8px;
      padding: 4px 0;
    }
    .logistics-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
      font-size: 0.9rem;
      border-bottom: 1px solid #f5f4f0;
    }
    .logistics-item:last-child { border-bottom: none; }
    .logistics-emoji { font-size: 1.1rem; flex-shrink: 0; }
    .logistics-title { font-weight: 600; color: #0A1628; }
    .logistics-time { color: #C4A77D; font-weight: 500; }
    .logistics-person { color: #5A6B80; }
    .logistics-detail { color: #5A6B80; font-size: 0.8rem; }
    .event-item {
      padding: 10px 0;
      border-bottom: 1px solid #f5f4f0;
    }
    .event-item:last-child { border-bottom: none; }
    .event-header {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .event-time {
      font-weight: 600;
      color: #C4A77D;
      font-size: 0.9rem;
    }
    .event-title {
      font-weight: 600;
      color: #0A1628;
      font-size: 0.95rem;
    }
    .event-category {
      font-size: 0.75rem;
      background: #F0EDE6;
      color: #5A6B80;
      padding: 2px 8px;
      border-radius: 3px;
      font-weight: 500;
    }
    .event-location {
      font-size: 0.85rem;
      color: #5A6B80;
      margin-top: 4px;
    }
    .event-attendees {
      font-size: 0.8rem;
      color: #7B8FA8;
      margin-top: 2px;
    }
    .event-notes {
      font-size: 0.8rem;
      color: #7B8FA8;
      margin-top: 2px;
      font-style: italic;
    }
    .free-day {
      color: #A0A8B4;
      font-size: 0.9rem;
      font-style: italic;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #C4A77D;
      color: #7B8FA8;
      font-size: 0.8rem;
    }
    .footer .brand {
      font-family: 'Fraunces', serif;
      color: #C4A77D;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    @media print {
      body { background: #fff; }
      .container { padding: 0; max-width: 100%; }
      .day { box-shadow: none; border: 1px solid #ddd; }
      .member-legend { box-shadow: none; border: 1px solid #ddd; }
    }
    @page {
      margin: 1.5cm;
      size: A4;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${escapeHtml(trip.name)}</h1>
      ${trip.destination ? `<div class="destination">${escapeHtml(trip.destination)}</div>` : ''}
      <div class="date-range">${escapeHtml(dateRange)} · ${duration} night${duration !== 1 ? 's' : ''}</div>
    </div>
    <div class="member-legend">
      ${memberLegendHtml}
    </div>
    ${daysHtml}
    <div class="footer">
      Generated by <span class="brand">Vialoure</span> · ${escapeHtml(generatedDate)}
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
