import Link from 'next/link';
import NotchReveal from '../../../components/NotchReveal';

export const metadata = {
  title: 'Vialoure — Andy Santamaria',
  description: 'A private group trip concierge for planning and coordinating travel together.',
};

export default function VialoureDetail() {
  return (
    <div className="stand">
      <div className="stand-container">
        <Link href="/stand" className="stand-detail-back">
          <span className="stand-detail-back-arrow">←</span> Back
        </Link>

        <header className="stand-header">
          <h1 className="stand-name">Vialoure</h1>
          <p className="stand-title">Holiday With Friends</p>
          <div className="stand-rule" />
        </header>

        <div className="stand-detail-section">
          <p>
            I built a private group trip concierge for planning and coordinating travel together. Everyone on the trip can see the full picture — who&apos;s arriving when, what&apos;s planned each day, who owes what, and what flights are in the air right now. Instead of juggling group chats, spreadsheets, and forwarded emails, everything lives in one place.
          </p>
          <div className="stand-screenshot-pair" style={{ marginTop: 16, marginBottom: 16 }}>
            <img className="stand-screenshot" src="/stand/vialoure-landing.png" alt="Vialoure landing page — Holiday With Friends" />
            <img className="stand-screenshot" src="/stand/vialoure-app.png" alt="Vialoure logged-in view — trip overview" />
          </div>
        </div>

        <NotchReveal compact />

        <div className="stand-detail-section">
          <h2>Core Features</h2>

          <h3>Trips</h3>
          <ul>
            <li>Create a trip with destination, dates, description, and cover image</li>
            <li>Each trip gets its own trip code (e.g. <span className="stand-detail-code">nice-summer</span>) used for the concierge</li>
            <li>Trip owner manages members and settings; members can view everything and edit their own details</li>
          </ul>

          <h3>Members</h3>
          <ul>
            <li>Add people by email — they don&apos;t need an account right away</li>
            <li>Each member sets their arrival/departure dates and where they&apos;re staying</li>
            <li>Members can claim their spot later when they sign in</li>
            <li>Payment handles (Venmo, CashApp, Zelle) stored for easy settling up</li>
          </ul>

          <h3>Calendar &amp; Events</h3>
          <ul>
            <li>Month grid and day list views</li>
            <li>Event categories: dinner out, dinner home, activity, outing, party, sightseeing</li>
            <li>Each event can have a time, location, Google Maps link, notes, and attendees</li>
            <li>See who&apos;s present each day with overlapping mini avatars on the calendar</li>
            <li>Stay timeline shows arrivals and departures at a glance</li>
          </ul>

          <h3>Logistics</h3>
          <ul>
            <li>Track flights, trains, buses, car rentals, and accommodations</li>
            <li>Logistics appear on the calendar alongside events</li>
            <li>Flight entries connect to live tracking</li>
          </ul>

          <h3>Expenses &amp; Settlements</h3>
          <ul>
            <li>Log expenses by category (food, drinks, transport, activities, groceries, etc.)</li>
            <li>Attach expenses to events or add standalone ones</li>
            <li>Split costs equally, by percentage, or with custom amounts per person</li>
            <li>Settlement panel calculates who owes whom and shows payment handles</li>
          </ul>

          <h3>Travel Journal</h3>
          <ul>
            <li>I set it up to generate an AI journal entry each morning for the previous day</li>
            <li>It pulls from the day&apos;s events, flights, messages, photos, and arrivals</li>
            <li>Literary tone — reads like a travel writer&apos;s notebook</li>
            <li>Photos from the trip woven in</li>
          </ul>
        </div>

        <NotchReveal compact />

        <div className="stand-detail-section">
          <h2>AI Concierge</h2>
          <p>
            I built the concierge as the main way to get information into Vialoure without opening the app. You can forward a confirmation email, text a screenshot, or send a WhatsApp message — the AI reads it and adds the relevant details to your trip.
          </p>

          <h3>Channels</h3>
          <ul>
            <li><strong>Email</strong> — forward booking confirmations, itineraries, or receipts. Include your trip code in the subject or body.</li>
            <li><strong>SMS / MMS</strong> — text details or send photos of confirmations. The concierge detects your trip from your phone number.</li>
            <li><strong>WhatsApp</strong> — same as SMS, with group chat support.</li>
            <li><strong>Voice</strong> — call the concierge number and leave a voicemail.</li>
          </ul>

          <h3>What It Extracts</h3>
          <ul>
            <li><strong>Member stay dates</strong> — &ldquo;I&apos;m arriving Tuesday and leaving Sunday&rdquo;</li>
            <li><strong>New travelers</strong> — &ldquo;My friend Sarah is joining us&rdquo;</li>
            <li><strong>Flights &amp; logistics</strong> — airline, flight number, times, confirmation codes</li>
            <li><strong>Events</strong> — dinner reservations, activities, outings</li>
            <li><strong>Expenses</strong> — receipts, bills, purchases with amounts and categories</li>
            <li><strong>Notes</strong> — anything else relevant to the trip</li>
          </ul>

          <h3>How It Works</h3>
          <div className="stand-detail-flow">
            {`1. Send a message (email, text, WhatsApp) to the concierge
2. AI parses the content — text, images, and PDFs
3. Low-risk items (like a single flight) are auto-applied to the trip
4. Items needing review go to the trip inbox for the owner to approve
5. You get an acknowledgment reply confirming what was picked up`}
          </div>

          <h3>Smart Paste</h3>
          <ul>
            <li>Trip owners can paste text or drop images directly on the members page</li>
            <li>Same AI parsing as the concierge — preview results before applying</li>
            <li>Great for bulk-importing booking confirmations or travel plans</li>
          </ul>
        </div>

        <NotchReveal compact />

        <div className="stand-detail-section">
          <h2>Live Flight Tracking</h2>
          <ul>
            <li>Flights tracked in real time via FlightAware</li>
            <li>See status (scheduled, en route, landed), gate, terminal, delays, and ETA</li>
            <li>Progress bar shows how far along an in-air flight is</li>
            <li>Polls automatically every 60 seconds for active flights</li>
          </ul>

          <h3>Happening Now</h3>
          <ul>
            <li>A floating widget showing what&apos;s going on right now during the trip</li>
            <li>In-progress events, flights in the air, upcoming events within the hour, and arrivals/departures today</li>
            <li>Visible on every trip page so you&apos;re always in the loop</li>
          </ul>
        </div>

        <NotchReveal compact />

        <div className="stand-detail-section">
          <h2>Design System</h2>
          <p>
            I designed every detail of the app — font choice, scaling, animations, UI components — to tell a consistent story. The aesthetic is &ldquo;Grand Tour&rdquo;: mysterious elegance, Côte d&apos;Azur at twilight, Grace Kelly sophistication. Dark-first with Fraunces for display, Crimson Pro for literary body text, and champagne accents throughout.
          </p>
          <img className="stand-screenshot" src="/stand/vialoure-invite.png" alt="Vialoure personal invite — typewriter-styled letter" style={{ marginTop: 16, marginBottom: 16 }} />

          <h3>Animation &amp; Motion</h3>
          <ul>
            <li>Page content fades in with a subtle upward slide on every route change</li>
            <li>Modals animate in with coordinated overlay fade and content entrance</li>
            <li>Motion tokens (<span className="stand-detail-code">--v-micro</span>, <span className="stand-detail-code">--v-standard</span>, <span className="stand-detail-code">--v-dramatic</span>) and a shared easing curve keep timing consistent</li>
          </ul>

          <h3>Responsive Design</h3>
          <ul>
            <li>Three-tier layout: mobile (600px), tablet (900px), desktop</li>
            <li>Calendar auto-switches from month grid to day list on mobile, with manual override</li>
            <li>Overview grid, calendar cells, and navigation adapt at each breakpoint</li>
          </ul>

          <h3>Accessibility</h3>
          <ul>
            <li>All modals trap focus, close on Escape, and warn before discarding unsaved changes</li>
            <li>Destructive actions (delete event, delete expense) require a two-click confirmation with auto-reset</li>
            <li>Form validation blocks submission when custom cost splits don&apos;t add up</li>
          </ul>

          <h3>Design Tokens</h3>
          <ul>
            <li>All colors, spacing, typography, and motion values live in CSS custom properties with a <span className="stand-detail-code">v-</span> namespace</li>
            <li>Utility classes (<span className="stand-detail-code">.v-error</span>, <span className="stand-detail-code">.v-hint</span>) replace repeated inline styles across 20+ components</li>
            <li>Light mode via <span className="stand-detail-code">prefers-color-scheme</span> — no toggle, no flash</li>
          </ul>
        </div>

        <NotchReveal compact />

        <div className="stand-detail-section">
          <h2>The Stack</h2>
          <div className="stand-detail-stack">
            <span className="stand-detail-stack-item">Next.js</span>
            <span className="stand-detail-stack-item">React</span>
            <span className="stand-detail-stack-item">Supabase</span>
            <span className="stand-detail-stack-item">Claude AI</span>
            <span className="stand-detail-stack-item">Twilio</span>
            <span className="stand-detail-stack-item">FlightAware</span>
            <span className="stand-detail-stack-item">Google Maps</span>
            <span className="stand-detail-stack-item">Resend</span>
            <span className="stand-detail-stack-item">Postmark</span>
          </div>
        </div>

        <footer className="stand-footer">
          <svg viewBox="0 0 120 48" width="16" height="7" className="stand-footer-mark" aria-hidden="true">
            <path d="M0 48 L60 0 L120 48 Z" fill="currentColor" />
          </svg>
        </footer>
      </div>
    </div>
  );
}
