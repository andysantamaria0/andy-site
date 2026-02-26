import Link from 'next/link';
import { createClient } from '../../lib/supabase/server';
import { formatDateRange, tripDuration } from '../../lib/utils/dates';
import NotchReveal from '../../components/NotchReveal';
import RequestAccessCTA from '../../components/RequestAccessCTA';

export const metadata = {
  title: 'Vialoure — Holiday With Friends',
  description: "Your group's private concierge — flights tracked, plans shared, every detail handled.",
  openGraph: {
    title: 'Vialoure — Holiday With Friends',
    description: "Your group's private concierge — flights tracked, plans shared, every detail handled.",
    url: 'https://andysantamaria.com/vialoure',
    siteName: 'Vialoure',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vialoure — Holiday With Friends',
    description: "Your group's private concierge — flights tracked, plans shared, every detail handled.",
  },
};

function PhoneMockup({ trip, durationNights }) {
  const dest = trip?.destination || 'CÔTE D\'AZUR';
  const name = trip?.name || 'Summer in Nice';
  const dates = trip?.start_date && trip?.end_date
    ? `${formatDateRange(trip.start_date, trip.end_date)}${durationNights ? ` · ${durationNights} nights` : ''}`
    : 'Jun 15 – Jun 22 · 7 nights';

  return (
    <div className="v-phone">
      <div className="v-phone-notch" />
      <div className="v-phone-screen">
        {/* Greeting */}
        <div className="v-phone-greeting">
          <span>Bonsoir</span>
          <div className="v-phone-avatar-small" />
        </div>
        {/* Trip card */}
        <div className="v-phone-trip-card">
          <div className="v-phone-trip-header">
            <div className="v-phone-trip-dest">{dest.toUpperCase()}</div>
            <div className="v-phone-trip-name">{name}</div>
            <span className="v-phone-live-badge">Live</span>
          </div>
          <div className="v-phone-trip-dates">{dates}</div>
        </div>
        {/* Happening Now */}
        <div className="v-phone-section-label">HAPPENING NOW</div>
        <div className="v-phone-flight-row">
          <span className="v-phone-flight-emoji">✈</span>
          <div className="v-phone-flight-info">
            <div className="v-phone-flight-title">BA 341 · NCE</div>
            <div className="v-phone-flight-bar">
              <div className="v-phone-flight-fill" />
              <div className="v-phone-flight-plane">✈</div>
            </div>
            <div className="v-phone-flight-meta">
              <span>67%</span>
              <span className="v-typewriter-cursor">ETA 2:32 PM</span>
            </div>
          </div>
        </div>
        {/* Second trip */}
        <div className="v-phone-trip-card v-phone-trip-card-secondary">
          <div className="v-phone-trip-header">
            <div className="v-phone-trip-dest">TOSCANA</div>
            <div className="v-phone-trip-name">Autumn Harvest</div>
          </div>
          <div className="v-phone-trip-dates">Oct 3 – Oct 10</div>
        </div>
      </div>
    </div>
  );
}

function CalendarMockup({ tripName }) {
  const days = [
    { day: 'Mon', date: '15', events: [{ label: 'Arrive Nice', color: 'royal', time: '2:32 PM', icon: '✈' }] },
    { day: 'Tue', date: '16', events: [{ label: 'Beach & Old Town', color: 'champagne', time: 'All day', icon: '☀' }] },
    { day: 'Wed', date: '17', events: [
      { label: 'Matisse Museum', color: 'champagne', time: '10 AM', icon: '🎨' },
      { label: 'Le Plongeoir', color: 'cinnabar', time: '8:30 PM', icon: '🍷' },
    ] },
    { day: 'Thu', date: '18', events: [{ label: 'Monaco day trip', color: 'royal', time: '9 AM', icon: '🚗' }] },
    { day: 'Fri', date: '19', events: [{ label: 'Boat to Île Sainte', color: 'champagne', time: '11 AM', icon: '⛵' }] },
  ];

  return (
    <div className="v-mock v-mock-calendar">
      <div className="v-mock-bar">
        <span className="v-mock-bar-title">June 2026</span>
        <span className="v-mock-bar-sub">{tripName || 'Summer in Nice'}</span>
      </div>
      <div className="v-mock-cal-grid">
        {days.map(d => (
          <div key={d.day} className="v-mock-cal-day">
            <div className="v-mock-cal-day-label">{d.day}</div>
            <div className="v-mock-cal-day-num">{d.date}</div>
            <div className="v-mock-cal-events">
              {d.events.map((e, i) => (
                <div key={i} className={`v-mock-cal-event v-mock-cal-event-${e.color}`}>
                  <span className="v-mock-cal-event-icon">{e.icon}</span>
                  <div>
                    <div className="v-mock-cal-event-name">{e.label}</div>
                    <div className="v-mock-cal-event-time">{e.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConciergeMockup({ tripName }) {
  return (
    <div className="v-mock v-mock-chat">
      <div className="v-mock-bar">
        <span className="v-mock-bar-title">Concierge</span>
        <span className="v-mock-bar-sub">{tripName || 'Summer in Nice'}</span>
      </div>
      <div className="v-mock-chat-body">
        <div className="v-mock-chat-msg v-mock-chat-user">
          <div className="v-mock-chat-bubble">What time does Sarah land?</div>
          <div className="v-mock-chat-time">6:42 PM</div>
        </div>
        <div className="v-mock-chat-msg v-mock-chat-ai">
          <div className="v-mock-chat-bubble">BA 341 from London Heathrow lands at Nice at <strong>2:32 PM</strong> tomorrow. She&apos;s seat 14A.</div>
          <div className="v-mock-chat-time">6:42 PM</div>
        </div>
        <div className="v-mock-chat-msg v-mock-chat-user">
          <div className="v-mock-chat-bubble">Book dinner for 6 tonight</div>
          <div className="v-mock-chat-time">6:43 PM</div>
        </div>
        <div className="v-mock-chat-msg v-mock-chat-ai">
          <div className="v-mock-chat-bubble">Done — Le Plongeoir, 8:30 PM, party of 6. Added to the group calendar.</div>
          <div className="v-mock-chat-time">6:43 PM</div>
        </div>
      </div>
      <div className="v-mock-chat-input">
        <span>Ask anything about your trip…</span>
      </div>
    </div>
  );
}

function FlightsMockup() {
  return (
    <div className="v-mock v-mock-flights">
      <div className="v-mock-bar">
        <span className="v-mock-bar-title">Happening Now</span>
        <span className="v-mock-live-dot" />
      </div>
      <div className="v-mock-flights-body">
        <div className="v-mock-flight-card">
          <div className="v-mock-flight-header">
            <span className="v-mock-flight-icon">✈</span>
            <span className="v-mock-flight-route">BA 341 · LHR → NCE</span>
            <span className="v-mock-flight-badge v-mock-flight-badge-air">In Air</span>
          </div>
          <div className="v-mock-flight-track">
            <div className="v-mock-flight-cities">
              <span>London</span>
              <span>Nice</span>
            </div>
            <div className="v-mock-flight-bar">
              <div className="v-mock-flight-fill" style={{ width: '67%' }} />
              <div className="v-mock-flight-plane" style={{ left: '67%' }}>✈</div>
            </div>
            <div className="v-mock-flight-meta">
              <span>Sarah, James</span>
              <span>ETA 2:32 PM</span>
            </div>
          </div>
        </div>
        <div className="v-mock-flight-card">
          <div className="v-mock-flight-header">
            <span className="v-mock-flight-icon">✈</span>
            <span className="v-mock-flight-route">AF 7702 · CDG → NCE</span>
            <span className="v-mock-flight-badge v-mock-flight-badge-landed">Landed</span>
          </div>
          <div className="v-mock-flight-track">
            <div className="v-mock-flight-cities">
              <span>Paris</span>
              <span>Nice</span>
            </div>
            <div className="v-mock-flight-bar">
              <div className="v-mock-flight-fill" style={{ width: '100%' }} />
            </div>
            <div className="v-mock-flight-meta">
              <span>Alex, Mia</span>
              <span>Arrived 12:15 PM</span>
            </div>
          </div>
        </div>
        <div className="v-mock-flight-card v-mock-flight-card-upcoming">
          <div className="v-mock-flight-header">
            <span className="v-mock-flight-icon">✈</span>
            <span className="v-mock-flight-route">IB 3042 · MAD → NCE</span>
            <span className="v-mock-flight-badge v-mock-flight-badge-sched">Tomorrow</span>
          </div>
          <div className="v-mock-flight-track">
            <div className="v-mock-flight-cities">
              <span>Madrid</span>
              <span>Nice</span>
            </div>
            <div className="v-mock-flight-bar">
              <div className="v-mock-flight-fill" style={{ width: '0%' }} />
            </div>
            <div className="v-mock-flight-meta">
              <span>Dan</span>
              <span>Departs 10:05 AM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SmartPasteMockup() {
  return (
    <div className="v-mock v-mock-paste">
      <div className="v-mock-bar">
        <span className="v-mock-bar-title">Smart Paste</span>
        <span className="v-mock-bar-sub">Summer in Nice</span>
      </div>
      <div className="v-mock-paste-body">
        {/* Input zone */}
        <div className="v-mock-paste-input">
          <div className="v-mock-paste-text">
            Booking Confirmation — British Airways{'\n'}
            Passenger: Sarah Williams{'\n'}
            BA 341 LHR→NCE 15 Jun, 08:20→11:35{'\n'}
            Confirmation: XKRM42
          </div>
          <div className="v-mock-paste-hint">Pasted from clipboard</div>
        </div>
        {/* Parsed results */}
        <div className="v-mock-paste-results">
          <div className="v-mock-paste-result-header">
            <span className="v-mock-paste-check">✓</span>
            <span>1 flight, 1 member update extracted</span>
          </div>
          <div className="v-mock-paste-item">
            <span className="v-mock-paste-badge v-mock-paste-badge-flight">Flight</span>
            <div className="v-mock-paste-item-info">
              <div className="v-mock-paste-item-title">BA 341 · LHR → NCE</div>
              <div className="v-mock-paste-item-meta">Sarah Williams · Jun 15, 08:20</div>
            </div>
          </div>
          <div className="v-mock-paste-item">
            <span className="v-mock-paste-badge v-mock-paste-badge-member">Member</span>
            <div className="v-mock-paste-item-info">
              <div className="v-mock-paste-item-title">Sarah Williams</div>
              <div className="v-mock-paste-item-meta">Arrives Jun 15 · <span className="v-mock-paste-matched">Matched</span></div>
            </div>
          </div>
          <div className="v-mock-paste-actions">
            <span className="v-mock-paste-btn-apply">Apply Now</span>
            <span className="v-mock-paste-btn-suggest">Save as Suggestions</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpensesMockup() {
  return (
    <div className="v-mock v-mock-expenses">
      <div className="v-mock-bar">
        <span className="v-mock-bar-title">Expenses</span>
        <span className="v-mock-bar-sub">Summer in Nice</span>
      </div>
      <div className="v-mock-expenses-body">
        {/* Summary row */}
        <div className="v-mock-expenses-summary">
          <div className="v-mock-expenses-total">
            <div className="v-mock-expenses-total-label">Total</div>
            <div className="v-mock-expenses-total-amount">€1,847</div>
          </div>
          <div className="v-mock-expenses-per-person">
            <div className="v-mock-expenses-pp-label">Per person</div>
            <div className="v-mock-expenses-pp-amount">€307</div>
          </div>
        </div>
        {/* Running tab */}
        <div className="v-mock-expenses-list">
          <div className="v-mock-expenses-row">
            <span className="v-mock-expenses-emoji">🍽️</span>
            <div className="v-mock-expenses-row-info">
              <div className="v-mock-expenses-row-title">Le Plongeoir dinner</div>
              <div className="v-mock-expenses-row-meta">Jun 17 · Paid by James</div>
            </div>
            <div className="v-mock-expenses-row-amount">€294</div>
          </div>
          <div className="v-mock-expenses-row">
            <span className="v-mock-expenses-emoji">🚕</span>
            <div className="v-mock-expenses-row-info">
              <div className="v-mock-expenses-row-title">Airport transfer</div>
              <div className="v-mock-expenses-row-meta">Jun 15 · Paid by Alex</div>
            </div>
            <div className="v-mock-expenses-row-amount">€65</div>
          </div>
          <div className="v-mock-expenses-row">
            <span className="v-mock-expenses-emoji">🛒</span>
            <div className="v-mock-expenses-row-info">
              <div className="v-mock-expenses-row-title">Groceries &amp; wine</div>
              <div className="v-mock-expenses-row-meta">Jun 16 · Paid by Sarah</div>
            </div>
            <div className="v-mock-expenses-row-amount">€112</div>
          </div>
        </div>
        {/* Settlement */}
        <div className="v-mock-expenses-settle">
          <div className="v-mock-expenses-settle-title">Settle up</div>
          <div className="v-mock-expenses-settle-row">
            <span>Mia → James</span>
            <span className="v-mock-expenses-settle-amount">€45.20</span>
          </div>
          <div className="v-mock-expenses-settle-row">
            <span>Dan → Sarah</span>
            <span className="v-mock-expenses-settle-amount">€38.50</span>
          </div>
          <div className="v-mock-expenses-settle-links">Venmo · Cash App · Zelle</div>
        </div>
      </div>
    </div>
  );
}

function TravelLogMockup({ tripName }) {
  return (
    <div className="v-mock v-mock-log">
      <div className="v-mock-bar">
        <span className="v-mock-bar-title">Travel Log</span>
        <span className="v-mock-bar-sub">{tripName || 'Summer in Nice'}</span>
      </div>
      <div className="v-mock-log-body">
        <div className="v-mock-log-entry">
          <div className="v-mock-log-date">Day 5 · Friday, June 19</div>
          <div className="v-mock-log-text">
            It started with champagne at the Negresco — &ldquo;just one,&rdquo; James said, which became four. Sarah wore the white dress. Alex bet he could get us into La Réserve without a reservation and somehow did, armed with nothing but charm and appalling French. Oysters and a Chablis that cost more than the flight.
          </div>
          <div className="v-mock-log-photos">
            <div className="v-mock-log-photo v-mock-log-photo-1" />
            <div className="v-mock-log-photo v-mock-log-photo-2" />
            <div className="v-mock-log-photo v-mock-log-photo-3" />
          </div>
          <div className="v-mock-log-text">
            Somehow we ended up at a piano bar in Villefranche that Mia swears she&apos;s never been to before, though the bartender knew her name. Dan played Cole Porter until they made him stop. The walk back along the Corniche at 4 AM — the sea black and still, the lights of Cap Ferrat across the water, Sarah&apos;s heels in one hand. We watched the sun come up from the terrace with the last of the rosé. Nobody said anything. We didn&apos;t need to.
          </div>
          <div className="v-mock-log-footer">
            <span>📍 Nice · Villefranche</span>
            <span>🌅 5:47 AM</span>
            <span>📸 23 photos</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InboxMockup() {
  return (
    <div className="v-mock v-mock-inbox">
      <div className="v-mock-bar">
        <span className="v-mock-bar-title">Inbox</span>
        <span className="v-mock-bar-sub">3 new</span>
      </div>
      <div className="v-mock-inbox-body">
        <div className="v-mock-inbox-item v-mock-inbox-item-new">
          <div className="v-mock-inbox-item-left">
            <div className="v-mock-inbox-item-channel">✈ EMAIL</div>
            <div className="v-mock-inbox-item-subject">Fwd: Booking Confirmation — BA 341</div>
            <div className="v-mock-inbox-item-snippet">1 flight extracted · Sarah Williams · Jun 15 LHR→NCE</div>
          </div>
          <div className="v-mock-inbox-item-badge">Parsed</div>
        </div>
        <div className="v-mock-inbox-item v-mock-inbox-item-new">
          <div className="v-mock-inbox-item-left">
            <div className="v-mock-inbox-item-channel">🏠 EMAIL</div>
            <div className="v-mock-inbox-item-subject">Airbnb Reservation Confirmed</div>
            <div className="v-mock-inbox-item-snippet">Villa les Oliviers · Jun 15–22 · 4 bedrooms</div>
          </div>
          <div className="v-mock-inbox-item-badge">Parsed</div>
        </div>
        <div className="v-mock-inbox-item">
          <div className="v-mock-inbox-item-left">
            <div className="v-mock-inbox-item-channel">📞 VOICE</div>
            <div className="v-mock-inbox-item-subject">Voice note from James</div>
            <div className="v-mock-inbox-item-snippet">&ldquo;Can we move dinner to 9? Running late from Monaco&rdquo;</div>
          </div>
          <div className="v-mock-inbox-item-badge v-mock-inbox-item-badge-action">Action</div>
        </div>
      </div>
    </div>
  );
}

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let featuredTrip = null;
  try {
    const result = await supabase
      .from('trips')
      .select('*')
      .eq('featured', true)
      .maybeSingle();
    featuredTrip = result.data;
  } catch {
    // Featured trip query failed — skip gracefully
  }

  const duration = featuredTrip?.start_date && featuredTrip?.end_date
    ? tripDuration(featuredTrip.start_date, featuredTrip.end_date)
    : null;

  return (
    <div className="v-landing">
      {/* Nav */}
      <nav className="v-landing-nav">
        <div className="v-landing-nav-brand">
          <svg viewBox="0 0 120 48" width="28" height="12" className="v-landing-nav-logo" aria-hidden="true">
            <path d="M0 48 L60 0 L120 48 Z" fill="currentColor" />
          </svg>
          <span className="v-landing-nav-wordmark">Vialoure</span>
          <span className="v-landing-nav-tagline">For Andy's Friends</span>
        </div>
        {user ? (
          <Link href="/trips" className="v-btn v-btn-primary v-landing-nav-cta">
            Go to Trips
          </Link>
        ) : (
          <a href="#hero" className="v-btn v-btn-primary v-landing-nav-cta">
            Request Access
          </a>
        )}
      </nav>

      {/* Hero */}
      <section id="hero" className="v-landing-hero">
        <div className="v-landing-hero-content">
          <h1 className="v-landing-title">
            Holiday<br />With Friends.
          </h1>
          <p className="v-landing-subtitle">
            Your group&apos;s private concierge — flights tracked, plans shared, every detail handled.
          </p>
          {user ? (
            <Link href="/trips" className="v-btn v-btn-primary v-landing-cta">
              Go to Trips
            </Link>
          ) : (
            <RequestAccessCTA />
          )}
        </div>
        <div className="v-landing-hero-visual">
          <PhoneMockup trip={featuredTrip} durationNights={duration} />
        </div>
      </section>

      {/* Featured Trip */}
      {featuredTrip && (
        <section id="featured" className="v-landing-trip">
          <div
            className="v-landing-trip-inner"
            style={featuredTrip.cover_image_url ? {
              backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.7) 100%), url(${featuredTrip.cover_image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : undefined}
          >
            <div className="v-landing-trip-destination">{featuredTrip.destination}</div>
            <h2 className="v-landing-trip-name">{featuredTrip.name}</h2>
            {featuredTrip.start_date && featuredTrip.end_date && (
              <p className="v-landing-trip-dates">
                {formatDateRange(featuredTrip.start_date, featuredTrip.end_date)}
                {duration !== null && <span> &middot; {duration} nights</span>}
              </p>
            )}
            <Link href={user ? '/trips' : '/trips/login'} className="v-btn v-btn-primary v-landing-trip-cta">
              {user ? 'View trip' : 'Sign in to join'}
            </Link>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="v-landing-how">
        <h2 className="v-landing-how-title">How it works</h2>
        <div className="v-landing-how-steps">
          <div className="v-landing-how-step">
            <div className="v-landing-how-num">1</div>
            <h3 className="v-landing-how-heading">Create a trip</h3>
            <p className="v-landing-how-body">Name it, set the dates, add the destination.</p>
          </div>
          <div className="v-landing-how-step">
            <div className="v-landing-how-num">2</div>
            <h3 className="v-landing-how-heading">Invite your friends</h3>
            <p className="v-landing-how-body">Share a link. They join and add their travel dates.</p>
          </div>
          <div className="v-landing-how-step">
            <div className="v-landing-how-num">3</div>
            <h3 className="v-landing-how-heading">Forward your bookings</h3>
            <p className="v-landing-how-body">Paste a confirmation, drop a screenshot, forward an email. The concierge reads it all.</p>
          </div>
          <div className="v-landing-how-step">
            <div className="v-landing-how-num">4</div>
            <h3 className="v-landing-how-heading">Everything organizes itself</h3>
            <p className="v-landing-how-body">Flights, hotels, events, expenses — extracted and sorted automatically.</p>
          </div>
        </div>
      </section>

      {/* Features — Visual Showcase */}
      <section className="v-landing-showcase">
        {/* 1. Smart Paste */}
        <div className="v-landing-showcase-row">
          <div className="v-landing-showcase-text">
            <h3 className="v-landing-showcase-heading">Paste anything, it just works</h3>
            <p className="v-landing-showcase-body">
              Drop in a booking confirmation, screenshot an Airbnb, forward a flight email. The concierge reads it instantly — extracts flights, hotels, dates, and travellers. One paste replaces twenty minutes of typing.
            </p>
          </div>
          <div className="v-landing-showcase-visual">
            <SmartPasteMockup />
          </div>
        </div>

        <NotchReveal />

        {/* 2. Calendar */}
        <div className="v-landing-showcase-row v-landing-showcase-row-reverse">
          <div className="v-landing-showcase-text">
            <h3 className="v-landing-showcase-heading">The whole trip, at a glance</h3>
            <p className="v-landing-showcase-body">
              Who&apos;s flying in, what&apos;s happening tonight, where everyone&apos;s staying. One calendar with every detail from every person in one place.
            </p>
          </div>
          <div className="v-landing-showcase-visual">
            <CalendarMockup tripName={featuredTrip?.name} />
          </div>
        </div>

        <NotchReveal />

        {/* 3. Concierge + Inbox */}
        <div className="v-landing-showcase-wide">
          <div className="v-landing-showcase-wide-text">
            <h3 className="v-landing-showcase-heading">Your concierge, every channel</h3>
            <p className="v-landing-showcase-body">
              Text a question, forward a flight confirmation, drop in an Airbnb link, leave a voice note — or just mention it in the WhatsApp group. The concierge reads everything, extracts every detail, and answers instantly.
            </p>
          </div>
          <div className="v-landing-showcase-pair">
            <ConciergeMockup tripName={featuredTrip?.name} />
            <InboxMockup />
          </div>
        </div>

        <NotchReveal />

        {/* 4. Expenses & Settlements */}
        <div className="v-landing-showcase-row">
          <div className="v-landing-showcase-text">
            <h3 className="v-landing-showcase-heading">Split everything, settle once</h3>
            <p className="v-landing-showcase-body">
              Track every expense as it happens — dinners, taxis, groceries, tickets. At the end of the trip, one tap shows who owes whom. Settle up over Venmo, Cash App, or Zelle.
            </p>
          </div>
          <div className="v-landing-showcase-visual">
            <ExpensesMockup />
          </div>
        </div>

        <NotchReveal />

        {/* 5. Live Flights */}
        <div className="v-landing-showcase-row v-landing-showcase-row-reverse">
          <div className="v-landing-showcase-text">
            <h3 className="v-landing-showcase-heading">Live flights, happening now</h3>
            <p className="v-landing-showcase-body">
              See every flight in the air in real time. Who just landed, who&apos;s still en route, who departs tomorrow. One glance, no group chat needed.
            </p>
          </div>
          <div className="v-landing-showcase-visual">
            <FlightsMockup />
          </div>
        </div>

        <NotchReveal />

        {/* 6. Travel Log */}
        <div className="v-landing-showcase-row">
          <div className="v-landing-showcase-text">
            <h3 className="v-landing-showcase-heading">Every morning, a travel log</h3>
            <p className="v-landing-showcase-body">
              At 7 AM, the concierge writes up yesterday — where you went, what you ate, the best photos from the group. A proper travel journal, written for you, every single day.
            </p>
          </div>
          <div className="v-landing-showcase-visual">
            <TravelLogMockup tripName={featuredTrip?.name} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="v-landing-footer">
        <svg viewBox="0 0 120 48" width="24" height="10" className="v-landing-footer-mark" aria-hidden="true">
          <path d="M0 48 L60 0 L120 48 Z" fill="currentColor" />
        </svg>
        <span className="v-landing-footer-wordmark">Vialoure</span>
        <span className="v-landing-footer-tagline-italic">for Andy's friends</span>
      </footer>
    </div>
  );
}
