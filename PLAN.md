# Vialoure — Implementation Plan

## Completed

### Landing Page
- Travel-focused landing page at root `/` with hero, card stack visual, featured trip showcase
- "Sign in with Google" CTA, redirects to `/trips` after auth

### Trip Claim Flow
- Google sign-in auto-matches email to manual trip members
- Claim prompt merges manual member into authenticated account

### Calendar Enhancements
- Member presence dots on each calendar day
- Arrival/departure badges on timeline
- Event cards with attending member avatars
- Month grid + day list views with expanded day panels

### Inbox & Smart Paste
- Email forwarding address per trip for booking confirmations
- AI-powered parsing of forwarded emails into events/logistics
- Inline editing and approval flow for parsed items

### Vialoure Concierge
- Multi-channel communication (email, SMS, voice via Twilio)
- AI-powered trip assistant using Anthropic Claude
- Inbound email processing with trip detection and disambiguation

### Happening Now Widget
- Real-time widget showing concurrent trip activity on the overview page (inline) and all other pages (floating pill)
- Surfaces in-progress events, flights in the air, upcoming events, and member arrivals/departures
- Computed from today's events, logistics, and member stay dates via Supabase queries
- CSS-only animations: pill expand/collapse, pulse glow, staggered fade-in, flight progress bar
- Mobile responsive: pill becomes bottom sheet
- Replaces the old placeholder Logistics tab

### FlightAware AeroAPI Integration
- `GET /api/flights/[flightNumber]?date=YYYY-MM-DD` endpoint
- Calls FlightAware AeroAPI v4, normalizes response, caches in `flight_status_cache` table (5-min TTL)
- Falls back to stale cache on API errors
- Client-side 60s polling for en_route flights with live progress bar updates
- **Requires**: `FLIGHTAWARE_API_KEY` env var (not yet configured)

## Future

### Trip Log
- Chronological feed of everything that happened on the trip
- Past events, completed flights, member arrivals
- Could include inbox actions and member joins as an activity feed
- Would live in a new "Trip Log" tab

### WhatsApp Integration
- Use Whapi.Cloud API to connect to existing WhatsApp groups
- Webhook receives messages, filters for photos/media
- Creates calendar events with media attachments
- Media stored in Supabase Storage
- *Planning only — not yet built*

## Architecture Notes

### Database (Supabase)
- `trips`, `trip_members`, `profiles` — core trip data
- `events`, `event_attendees`, `event_cost_splits`, `event_invites` — calendar
- `logistics` — flights, trains, cars, accommodations
- `inbound_emails` — inbox items from forwarded emails
- `flight_status_cache` — FlightAware API response cache

### Key Patterns
- Next.js App Router with server components for data fetching
- Client components (`'use client'`) for interactivity
- Supabase RLS for auth, service role key for API routes/webhooks
- CSS custom properties with `v-` prefix, no CSS-in-JS
- All styles in `app/trips/trips.css`
