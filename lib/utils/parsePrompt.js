export function buildParsePrompt({ trip, memberContext, text }) {
  return `You are helping manage a group trip. Extract structured information from the raw text below.

TRIP CONTEXT:
- Trip: "${trip.name}"
- Destination: ${trip.destination}
- Trip dates: ${trip.start_date || 'not set'} to ${trip.end_date || 'not set'}
- Current members: ${JSON.stringify(memberContext)}

RAW TEXT TO PARSE:
"""
${text}
"""

Extract any of the following you can find:
1. **Member updates**: arrival/departure dates for people (match to existing members by name if possible)
2. **New travelers**: people mentioned who aren't current members (with whatever info is available)
3. **Logistics**: flights, trains, accommodations, car rentals — with dates, confirmation numbers, airlines, etc.
4. **Events**: dinners, parties, activities, outings, sightseeing plans — with dates, times, locations, and who's attending
5. **Expenses**: receipts, bills, purchases — extract vendor, final total (tax+tip included), currency from context, match payer to existing member. Categories: food (restaurants/dining), drinks (bars/coffee), transport (uber/taxi/gas), accommodation (hotel/airbnb), activities (tours/tickets), groceries (supermarket), supplies (pharmacy/drugstore), other
6. **Notes**: anything else relevant to the trip

Respond with ONLY valid JSON in this exact format:
{
  "member_updates": [
    {
      "member_id": "uuid or null if new person",
      "name": "person's name",
      "stay_start": "YYYY-MM-DD or null",
      "stay_end": "YYYY-MM-DD or null",
      "staying_at": "hotel/villa/accommodation name or null",
      "matched_existing": true
    }
  ],
  "new_travelers": [
    {
      "name": "person's name",
      "email": "email or null",
      "stay_start": "YYYY-MM-DD or null",
      "stay_end": "YYYY-MM-DD or null",
      "staying_at": "accommodation name or null"
    }
  ],
  "logistics": [
    {
      "person_name": "who this is for",
      "type": "flight|train|bus|car|accommodation|other",
      "title": "short description",
      "details": {
        "airline": "...",
        "flight_number": "...",
        "confirmation_code": "...",
        "departure_city": "...",
        "arrival_city": "...",
        "address": "..."
      },
      "start_time": "ISO datetime or null",
      "end_time": "ISO datetime or null",
      "notes": "any additional info"
    }
  ],
  "events": [
    {
      "title": "short description",
      "category": "dinner_out|dinner_home|activity|outing|party|sightseeing|other",
      "event_date": "YYYY-MM-DD",
      "start_time": "HH:MM or null",
      "end_time": "HH:MM or null",
      "location": "venue/place name or null",
      "notes": "any additional info or null",
      "attendee_names": ["name1", "name2"]
    }
  ],
  "expenses": [
    {
      "payer_name": "who paid (match to existing member name if possible)",
      "payer_member_id": "member_id if matched, null otherwise",
      "vendor": "store/restaurant name",
      "description": "what was purchased",
      "amount": 123.45,
      "currency": "USD",
      "expense_date": "YYYY-MM-DD",
      "category": "food|drinks|transport|accommodation|activities|groceries|supplies|other",
      "notes": "additional details"
    }
  ],
  "notes": "any other relevant info extracted",
  "summary": "1-2 sentence human-readable summary of what was extracted"
}

If the message mentions where someone is staying (hotel name, villa, Airbnb, etc.), include it in staying_at.
If a field can't be determined, use null. For dates, use the trip year (${trip.start_date ? trip.start_date.slice(0, 4) : new Date().getFullYear()}) if only month/day are given. For event attendee_names, list the names of people attending (empty array means everyone). For event times, use 24-hour HH:MM format.`;
}
