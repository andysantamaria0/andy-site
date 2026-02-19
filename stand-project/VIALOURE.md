# Vialoure — Holiday With Friends

## TODO / Testing Notes

- **ElevenLabs SMS voice note** — test the live TTS acknowledgment via SMS. Steps: (1) point Twilio SMS webhook at `/api/concierge/sms`, (2) enable `concierge_sms` feature flag, (3) ensure test phone number is a trip member, (4) text the concierge and verify the reply includes both a text and an MMS voice note.

---

A private group trip concierge for planning and coordinating travel together.

---

## What It Does

Vialoure is a trip planning app where everyone on the trip can see the full picture — who's arriving when, what's planned each day, who owes what, and what flights are in the air right now. Instead of juggling group chats, spreadsheets, and forwarded emails, everything lives in one place.

---

## Core Features

### Trips
- Create a trip with destination, dates, description, and cover image
- Each trip gets its own trip code (e.g. `nice-summer`) used for the concierge
- Trip owner manages members and settings; members can view everything and edit their own details

### Members
- Add people by email — they don't need an account right away
- Each member sets their arrival/departure dates and where they're staying
- Members can claim their spot later when they sign in
- Payment handles (Venmo, CashApp, Zelle) stored for easy settling up

### Calendar & Events
- Month grid and day list views
- Event categories: dinner out, dinner home, activity, outing, party, sightseeing
- Each event can have a time, location, Google Maps link, notes, and attendees
- See who's present each day with member dots on the calendar
- Stay timeline shows arrivals and departures at a glance

### Logistics
- Track flights, trains, buses, car rentals, and accommodations
- Logistics appear on the calendar alongside events
- Flight entries connect to live tracking (see below)

### Expenses & Settlements
- Log expenses by category (food, drinks, transport, activities, groceries, etc.)
- Attach expenses to events or add standalone ones
- Split costs equally, by percentage, or with custom amounts per person
- Settlement panel calculates who owes whom and shows payment handles

### Travel Journal
- An AI-generated journal entry is written automatically each morning for the previous day
- Pulls from the day's events, flights, messages, photos, and arrivals
- Literary tone — reads like a travel writer's notebook
- Photos from the trip are woven in

---

## AI Concierge

The concierge is the main way to get information into Vialoure without opening the app. Forward a confirmation email, text a screenshot, or send a WhatsApp message — the AI reads it and adds the relevant details to your trip.

### Channels
- **Email** — forward booking confirmations, itineraries, or receipts to the concierge address. Include your trip code in the subject or body.
- **SMS / MMS** — text details or send photos of confirmations. The concierge detects your trip from your phone number.
- **WhatsApp** — same as SMS, with group chat support.
- **Voice** — call the concierge number and leave a voicemail.

### What It Extracts
- **Member stay dates** — "I'm arriving Tuesday and leaving Sunday"
- **New travelers** — "My friend Sarah is joining us"
- **Flights & logistics** — airline, flight number, times, confirmation codes
- **Events** — dinner reservations, activities, outings
- **Expenses** — receipts, bills, purchases with amounts and categories
- **Notes** — anything else relevant to the trip

### How It Works
1. Send a message (email, text, WhatsApp) to the concierge
2. AI parses the content — text, images, and PDFs
3. Low-risk items (like a single flight) are auto-applied to the trip
4. Items needing review go to the trip inbox for the owner to approve
5. You get an acknowledgment reply confirming what was picked up

### Smart Paste
- On the members page, trip owners can paste text or drop images directly
- Same AI parsing as the concierge — preview results before applying
- Great for bulk-importing booking confirmations or travel plans

---

## Live Flight Tracking

- Flights added to logistics are tracked in real time via FlightAware
- See status (scheduled, en route, landed), gate, terminal, delays, and ETA
- Progress bar shows how far along an in-air flight is
- Polls automatically every 60 seconds for active flights

### Happening Now
- A floating widget that shows what's going on right now during the trip
- In-progress events, flights in the air, upcoming events within the hour, and arrivals/departures today
- Visible on every trip page so you're always in the loop

---

## Getting Started

1. Sign in with Google at the invite page
2. If you've been added to a trip by email, you'll be prompted to claim your membership
3. Set your arrival and departure dates
4. Add your payment handles (Venmo, CashApp, Zelle) so settling up is easy
5. Forward confirmations to the concierge, or just browse the calendar to see what's planned

---

## The Stack

Next.js, React, Supabase (database + auth + storage), Anthropic Claude (AI), Twilio (SMS/voice/WhatsApp), FlightAware (flights), Google Maps (locations), Resend & Postmark (email).
