/**
 * FlightAware AeroAPI v4 client
 *
 * Fetches live flight status and normalizes it for the flight_status_cache table.
 */

const AERO_API_BASE = 'https://aeroapi.flightaware.com/aeroapi';

/**
 * Fetch flight status from FlightAware AeroAPI.
 * @param {string} flightNumber - e.g. "UA123"
 * @param {string} date - YYYY-MM-DD
 * @returns {Object|null} Raw flight object from AeroAPI, or null on error
 */
export async function fetchFlightStatus(flightNumber, date) {
  const apiKey = process.env.FLIGHTAWARE_API_KEY;
  if (!apiKey) {
    console.error('[FlightAware] FLIGHTAWARE_API_KEY not configured');
    return null;
  }

  // Bracket the date to get flights for that specific day
  const start = `${date}T00:00:00Z`;
  const end = `${date}T23:59:59Z`;

  const url = `${AERO_API_BASE}/flights/${encodeURIComponent(flightNumber)}?start=${start}&end=${end}&max_pages=1`;

  const res = await fetch(url, {
    headers: { 'x-apikey': apiKey },
  });

  if (!res.ok) {
    console.error(`[FlightAware] API error ${res.status}: ${await res.text()}`);
    return null;
  }

  const data = await res.json();
  const flights = data.flights || [];

  if (flights.length === 0) return null;

  // Return the first (most relevant) flight
  return flights[0];
}

/**
 * Normalize a FlightAware API response into our cache schema shape.
 * @param {Object} flight - Raw flight object from AeroAPI
 * @param {string} flightNumber - Original flight number query
 * @param {string} date - YYYY-MM-DD
 * @returns {Object} Normalized object matching flight_status_cache columns
 */
export function normalizeFlightResponse(flight, flightNumber, date) {
  const status = parseStatus(flight.status);

  // Best available departure time: actual > estimated > scheduled
  const departure = flight.actual_off || flight.estimated_off || flight.actual_out || flight.estimated_out || flight.scheduled_out;
  // Best available arrival time: actual > estimated > scheduled
  const arrival = flight.actual_on || flight.estimated_on || flight.actual_in || flight.estimated_in || flight.scheduled_in;

  // Delay in minutes (API returns seconds)
  const delaySeconds = flight.arrival_delay || flight.departure_delay || 0;
  const delayMinutes = Math.round(delaySeconds / 60);

  // Progress
  const progress = flight.progress_percent ?? computeProgress(departure, arrival, status);

  // Position
  const pos = flight.last_position;

  return {
    flight_number: flightNumber,
    flight_date: date,
    status,
    departure_airport: flight.origin?.code_iata || flight.origin?.code || null,
    arrival_airport: flight.destination?.code_iata || flight.destination?.code || null,
    scheduled_departure: flight.scheduled_out || flight.scheduled_off || null,
    estimated_departure: flight.estimated_out || flight.estimated_off || null,
    actual_departure: flight.actual_out || flight.actual_off || null,
    scheduled_arrival: flight.scheduled_in || flight.scheduled_on || null,
    estimated_arrival: flight.estimated_in || flight.estimated_on || null,
    actual_arrival: flight.actual_in || flight.actual_on || null,
    delay_minutes: delayMinutes,
    gate_departure: flight.gate_origin || null,
    gate_arrival: flight.gate_destination || null,
    terminal_departure: flight.terminal_origin || null,
    terminal_arrival: flight.terminal_destination || null,
    progress_percent: progress,
    latitude: pos?.latitude || null,
    longitude: pos?.longitude || null,
    raw_response: flight,
    fetched_at: new Date().toISOString(),
  };
}

/**
 * Parse FlightAware's free-form status string into a normalized status.
 */
function parseStatus(statusStr) {
  if (!statusStr) return 'unknown';
  const s = statusStr.toLowerCase();
  if (s.includes('cancelled')) return 'cancelled';
  if (s.includes('arrived') || s === 'landed') return 'arrived';
  if (s.includes('landed') || s.includes('taxiing')) return 'landed';
  if (s.includes('en route') || s.includes('airborne')) return 'en_route';
  if (s.includes('scheduled') || s.includes('filed')) return 'scheduled';
  return 'unknown';
}

/**
 * Compute flight progress as a percentage from departure/arrival times.
 * Used as fallback when progress_percent is not provided by the API.
 */
function computeProgress(departure, arrival, status) {
  if (status === 'arrived' || status === 'landed') return 100;
  if (status === 'scheduled') return 0;
  if (!departure || !arrival) return 0;

  const depMs = new Date(departure).getTime();
  const arrMs = new Date(arrival).getTime();
  const nowMs = Date.now();
  const total = arrMs - depMs;

  if (total <= 0) return 0;
  return Math.round(Math.max(0, Math.min(100, ((nowMs - depMs) / total) * 100)));
}
