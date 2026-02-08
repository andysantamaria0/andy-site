# Implementation Plan

## 1. Sexy Landing Page (replace root `/`)
- Replace the current portfolio root page with a travel-focused landing page for Vialoure
- Hero section with trip imagery, tagline, and "Sign in with Google" CTA
- Show trip member avatars, upcoming events preview
- After sign-in, redirect to `/trips`

## 2. Trip Claim Flow (Gmail → Member Matching)
- When a user signs in via Google and their email matches a manual member's email on any trip, show a prompt: "You've been added to [Trip Name] — claim your spot"
- On claim: update the `trip_members` row to set `user_id` to the authenticated user, merging the manual member into a real account
- Add this check on the post-login redirect page

## 3. Calendar Enhancements — Member Timeline + Events on Calendar
- Show high-level member icons on each calendar day (who's present that day)
- Show arrival/departure indicators (icons or badges) on the arrival and departure days for each member
- Populate calendar day cells with event cards showing attending members' avatars
- This builds on the existing `CalendarMonthGrid` component

## 4. WhatsApp Integration (Plan Only — Build Later)
- **Approach**: Use Whapi.Cloud API ($35/mo) to connect to an existing WhatsApp group
- **Flow**: Set up webhook to receive messages → filter for photos/media → create calendar events with media attachments for the corresponding day → tag as "travel log" entries
- **Storage**: Media files stored in Supabase Storage, referenced from events
- **UI**: Travel log events appear in the calendar with photo thumbnails
- **Risk**: Unofficial API, WhatsApp ToS considerations
- *This section is planning only — no code changes in this round*

## Build Order
1. Landing page (new root `/`)
2. Trip claim flow
3. Calendar member timeline + arrival/departure indicators
4. Calendar event population with member avatars
