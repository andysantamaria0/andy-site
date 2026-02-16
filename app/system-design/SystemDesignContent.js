'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import NotchReveal from '../../components/NotchReveal';

const SECTIONS = [
  { id: 'overview', number: 'I', label: 'Overview' },
  { id: 'frontend', number: 'II', label: 'Frontend' },
  { id: 'database', number: 'III', label: 'Database' },
  { id: 'ai', number: 'IV', label: 'AI' },
  { id: 'comms', number: 'V', label: 'Comms' },
  { id: 'data-services', number: 'VI', label: 'Data' },
  { id: 'email', number: 'VII', label: 'Email' },
  { id: 'concierge', number: 'VIII', label: 'Concierge' },
  { id: 'security', number: 'IX', label: 'Security' },
];

function ChevronIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6 L8 10 L12 6" />
    </svg>
  );
}

function Section({ id, number, title, open, onToggle, children }) {
  return (
    <div id={id} className={`stand-section${open ? ' stand-section-open' : ''}`}>
      <button className="stand-section-toggle" onClick={onToggle}>
        <span className="stand-section-label">{number}</span>
        <span className="stand-section-heading">{title}</span>
        <ChevronIcon className="stand-section-chevron" />
      </button>
      <div className="stand-section-body">
        <div className="stand-section-inner">
          <div className="stand-section-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Inline SVG Logos ---- */

function NextjsLogo() {
  return (
    <svg viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 9v10l8-10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 9v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function VercelLogo() {
  return (
    <svg viewBox="0 0 28 28" fill="none">
      <path d="M14 6L25 22H3L14 6Z" fill="currentColor" />
    </svg>
  );
}

function SupabaseLogo() {
  return (
    <svg viewBox="0 0 28 28" fill="none">
      <path d="M15.5 24.5c-.4.5-1.2.1-1.2-.6V16h8.4c.8 0 1.2.9.7 1.5L15.5 24.5z" fill="#3ECF8E" />
      <path d="M12.5 3.5c.4-.5 1.2-.1 1.2.6V12H5.3c-.8 0-1.2-.9-.7-1.5L12.5 3.5z" fill="#3ECF8E" opacity="0.7" />
    </svg>
  );
}

function AnthropicLogo() {
  return (
    <svg viewBox="0 0 28 28" fill="none">
      <path d="M17.2 6h-2.8L8 22h2.8l1.4-3.6h5.6L19.2 22H22L17.2 6zm-3.8 10L15.8 9.6l2.4 6.4h-4.8z" fill="#D4A574" />
    </svg>
  );
}

function ElevenLabsLogo() {
  return (
    <svg viewBox="0 0 28 28" fill="none">
      <rect x="10" y="6" width="2.5" height="16" rx="1" fill="currentColor" />
      <rect x="15.5" y="6" width="2.5" height="16" rx="1" fill="currentColor" />
    </svg>
  );
}

function TwilioLogo() {
  return (
    <svg viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="10" stroke="#F22F46" strokeWidth="1.5" />
      <circle cx="11" cy="11" r="2" fill="#F22F46" />
      <circle cx="17" cy="11" r="2" fill="#F22F46" />
      <circle cx="11" cy="17" r="2" fill="#F22F46" />
      <circle cx="17" cy="17" r="2" fill="#F22F46" />
    </svg>
  );
}

function FlightAwareLogo() {
  return (
    <svg viewBox="0 0 28 28" fill="none">
      <path d="M22 10l-5 2-4-5-1.5 1 2.5 5.5-4.5 2-2-1.5L6 15l3.5 1.5L11 20l1.5-1.5-1.5-2 4.5-2L18 21l1.5-1.5L16 14l5-2.5L22 10z" fill="#0064CB" />
    </svg>
  );
}

function GoogleMapsLogo() {
  return (
    <svg viewBox="0 0 28 28" fill="none">
      <path d="M14 4C10.1 4 7 7.1 7 11c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5S12.6 8.5 14 8.5s2.5 1.1 2.5 2.5S15.4 13.5 14 13.5z" fill="#4285F4" />
    </svg>
  );
}

function ResendLogo() {
  return (
    <svg viewBox="0 0 28 28" fill="none">
      <path d="M8 6h6c2.8 0 5 2.2 5 5s-2.2 5-5 5h-3v6H8V6zm3 7.5h3c1.1 0 2-.9 2-2s-.9-2-2-2h-3v4z" fill="currentColor" />
      <path d="M15 16l4 6h-3.5l-3.5-5" fill="currentColor" />
    </svg>
  );
}

function PostmarkLogo() {
  return (
    <svg viewBox="0 0 28 28" fill="none">
      <rect x="5" y="8" width="18" height="12" rx="1.5" stroke="#FFDE00" strokeWidth="1.5" fill="none" />
      <path d="M5 9l9 6 9-6" stroke="#FFDE00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---- Service Card component ---- */

function ServiceCard({ name, role, logo: Logo, color }) {
  return (
    <div className="sd-service" style={{ borderLeftColor: color }}>
      <div className="sd-service-logo" style={{ color }}>
        <Logo />
      </div>
      <div className="sd-service-info">
        <div className="sd-service-name">{name}</div>
        <div className="sd-service-role">{role}</div>
      </div>
    </div>
  );
}

/* ---- Tradeoff Table ---- */

function TradeoffTable({ headers, rows }) {
  return (
    <div className="stand-table-wrapper">
      <table className="stand-table">
        <thead>
          <tr>
            {headers.map((h, i) => <th key={i}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => <td key={j}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---- Main Content ---- */

export default function SystemDesignContent() {
  const [activeId, setActiveId] = useState('overview');
  const [openSections, setOpenSections] = useState({ overview: true });
  const navRef = useRef(null);
  const isScrollingRef = useRef(false);

  const toggleSection = useCallback((id) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const jumpTo = useCallback((id) => {
    setOpenSections(prev => ({ ...prev, [id]: true }));
    setActiveId(id);
    isScrollingRef.current = true;

    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) {
        const navHeight = navRef.current?.offsetHeight || 0;
        const y = el.getBoundingClientRect().top + window.scrollY - navHeight - 12;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      setTimeout(() => { isScrollingRef.current = false; }, 800);
    });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!navRef.current) return;
    const activeBtn = navRef.current.querySelector('.stand-nav-tab-active');
    if (activeBtn) {
      activeBtn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }
  }, [activeId]);

  return (
    <div className="stand">
      {/* Tab nav */}
      <nav className="stand-nav" ref={navRef}>
        <div className="stand-nav-inner">
          {SECTIONS.map(({ id, number, label }) => (
            <button
              key={id}
              className={`stand-nav-tab${activeId === id ? ' stand-nav-tab-active' : ''}`}
              onClick={() => jumpTo(id)}
            >
              <span className="stand-nav-tab-num">{number}</span>
              {label}
            </button>
          ))}
        </div>
      </nav>

      <div className="stand-container">

        {/* Letterhead */}
        <header className="stand-header">
          <h1 className="stand-name">System Architecture</h1>
          <p className="stand-title">Vialoure &mdash; Holiday With Friends</p>
          <div className="stand-rule" />
        </header>

        {/* I. Architecture Overview */}
        <Section id="overview" number="I" title="Architecture Overview" open={openSections.overview} onToggle={() => toggleSection('overview')}>
          <p>
            This document maps every service in the Vialoure system &mdash; what it does, how it connects, why it was chosen, and what the tradeoffs were. Vialoure is a private group trip concierge built as a Next.js application hosted on Vercel, backed by Supabase for data and auth, with an AI concierge powered by Anthropic Claude that accepts input over SMS, WhatsApp, voice, and email.
          </p>
          <p>
            The architecture follows a simple principle: <strong>use managed services for everything except product logic.</strong> No self-hosted databases, no custom auth, no DIY email infrastructure. Every service below was chosen because it lets us move fast, stay flexible, and keep the blast radius small when something changes.
          </p>

          <h4>Layered Architecture</h4>

          <div className="sd-arch">
            <div className="sd-arch-tier">
              <div className="sd-arch-tier-label">Client</div>
              <div className="sd-arch-badges">
                <span className="sd-arch-badge">Browser</span>
                <span className="sd-arch-badge">SMS / MMS</span>
                <span className="sd-arch-badge">WhatsApp</span>
                <span className="sd-arch-badge">Voice</span>
                <span className="sd-arch-badge">Email</span>
              </div>
            </div>

            <div className="sd-arch-connector" />

            <div className="sd-arch-tier">
              <div className="sd-arch-tier-label">Application</div>
              <div className="sd-arch-badges">
                <span className="sd-arch-badge">
                  <NextjsLogo /> Next.js API Routes
                </span>
                <span className="sd-arch-badge">
                  <NextjsLogo /> React SSR
                </span>
                <span className="sd-arch-badge">
                  <VercelLogo /> Vercel Edge
                </span>
              </div>
            </div>

            <div className="sd-arch-connector" />

            <div className="sd-arch-tier">
              <div className="sd-arch-tier-label">Services</div>
              <div className="sd-arch-badges">
                <span className="sd-arch-badge">
                  <AnthropicLogo /> Claude
                </span>
                <span className="sd-arch-badge">
                  <ElevenLabsLogo /> ElevenLabs
                </span>
                <span className="sd-arch-badge">
                  <TwilioLogo /> Twilio
                </span>
                <span className="sd-arch-badge">
                  <FlightAwareLogo /> FlightAware
                </span>
                <span className="sd-arch-badge">
                  <GoogleMapsLogo /> Google Maps
                </span>
              </div>
            </div>

            <div className="sd-arch-connector" />

            <div className="sd-arch-tier">
              <div className="sd-arch-tier-label">Data</div>
              <div className="sd-arch-badges">
                <span className="sd-arch-badge">
                  <SupabaseLogo /> Postgres
                </span>
                <span className="sd-arch-badge">
                  <SupabaseLogo /> Storage
                </span>
                <span className="sd-arch-badge">
                  <SupabaseLogo /> Auth
                </span>
              </div>
            </div>
          </div>
        </Section>

        <NotchReveal compact />

        {/* II. Frontend & Hosting */}
        <Section id="frontend" number="II" title="Frontend & Hosting" open={openSections.frontend} onToggle={() => toggleSection('frontend')}>
          <div className="sd-service-pair">
            <ServiceCard name="Next.js" role="React framework, SSR, API routes" logo={NextjsLogo} color="var(--text)" />
            <ServiceCard name="Vercel" role="Hosting, edge network, CI/CD" logo={VercelLogo} color="var(--text)" />
          </div>

          <p>
            Next.js is the application framework &mdash; it handles React rendering, file-based routing, and API routes that power the concierge webhooks. Vercel provides zero-config deploys from Git, preview deployments for every branch, and a global edge network.
          </p>
          <p>
            API routes are the backbone of the concierge system. Every inbound message (SMS, WhatsApp, voice, email) hits a Next.js API route that validates, parses, and processes the content. Server components handle the trip pages, calendar, and expense views with no client-side data fetching overhead.
          </p>

          <h4>Decision Table</h4>
          <TradeoffTable
            headers={['Option', 'Strengths', 'Why Not']}
            rows={[
              ['Next.js + Vercel', 'Unified framework, instant deploys, preview branches, API routes co-located with UI', 'Chosen'],
              ['Remix', 'Excellent data loading patterns, nested routes', 'Smaller ecosystem, fewer deployment integrations at the time'],
              ['AWS / Cloudflare', 'More control, potentially cheaper at scale', 'Operational overhead, slower iteration, no preview deploys out of the box'],
            ]}
          />
        </Section>

        <NotchReveal compact />

        {/* III. Database, Auth & Storage */}
        <Section id="database" number="III" title="Database, Auth & Storage" open={openSections.database} onToggle={() => toggleSection('database')}>
          <ServiceCard name="Supabase" role="Postgres database, row-level security, OAuth, file storage" logo={SupabaseLogo} color="#3ECF8E" />

          <p>
            Supabase provides the entire data layer as a single managed service. The Postgres database stores trips, members, events, expenses, logistics, and concierge messages. Row-level security (RLS) policies enforce that trip data is only visible to trip members &mdash; this runs at the database level, not in application code.
          </p>
          <p>
            Auth is handled through Supabase Auth with Google OAuth. When a user signs in, Supabase issues a JWT that the client uses for all subsequent requests. If someone was pre-added to a trip by email before signing up, they&apos;re automatically matched to their membership on first login.
          </p>
          <p>
            Storage buckets hold trip cover images, concierge attachments (photos of receipts, boarding passes), and travel journal photos. Files are linked to specific trips with RLS policies mirroring the database.
          </p>

          <h4>Decision Table</h4>
          <TradeoffTable
            headers={['Option', 'Strengths', 'Why Not']}
            rows={[
              ['Supabase', 'Full Postgres, RLS built-in, auth + storage unified, generous free tier, real-time subscriptions', 'Chosen'],
              ['Firebase', 'Fast prototyping, good mobile SDKs', 'NoSQL (Firestore) makes relational queries painful, vendor lock-in on data model'],
              ['Postgres + Auth0', 'Maximum control, best-in-class auth', 'Two services to manage, auth pricing scales steeply, more integration work'],
            ]}
          />
        </Section>

        <NotchReveal compact />

        {/* IV. AI & Language */}
        <Section id="ai" number="IV" title="AI & Language" open={openSections.ai} onToggle={() => toggleSection('ai')}>
          <div className="sd-service-pair">
            <ServiceCard name="Anthropic Claude" role="Concierge parsing, travel journal, smart paste" logo={AnthropicLogo} color="#D4A574" />
            <ServiceCard name="ElevenLabs" role="Voice greetings, voice note replies" logo={ElevenLabsLogo} color="var(--text)" />
          </div>

          <p>
            Claude is the brain of the concierge. Every inbound message &mdash; text, image, PDF &mdash; is sent to Claude with a structured prompt that extracts travel details: flights, events, expenses, stay dates, new travelers. The response is structured JSON that maps directly to database operations. Claude also writes the daily travel journal entries and powers the smart paste feature on the members page.
          </p>
          <p>
            ElevenLabs provides text-to-speech for the concierge&apos;s voice personality. When the concierge acknowledges a message over SMS or WhatsApp, it can send a voice note in addition to text. For inbound voice calls, ElevenLabs generates the greeting that plays before the caller leaves their message.
          </p>

          <h4>Decision Table</h4>
          <TradeoffTable
            headers={['Option', 'Strengths', 'Why Not']}
            rows={[
              ['Claude (Anthropic)', 'Best at structured extraction, long context window, reliable JSON output, excellent with images', 'Chosen'],
              ['GPT-4 (OpenAI)', 'Large ecosystem, function calling', 'Less reliable structured output in testing, more hallucination on extraction tasks'],
              ['AWS Polly (vs ElevenLabs)', 'Cheaper per character, AWS integration', 'Robotic quality, no personality &mdash; voice notes should feel human'],
            ]}
          />
        </Section>

        <NotchReveal compact />

        {/* V. Communications */}
        <Section id="comms" number="V" title="Communications" open={openSections.comms} onToggle={() => toggleSection('comms')}>
          <ServiceCard name="Twilio" role="SMS/MMS, WhatsApp, Voice &mdash; webhook-driven" logo={TwilioLogo} color="#F22F46" />

          <p>
            Twilio handles all real-time communication channels. SMS and WhatsApp messages arrive as webhooks to Next.js API routes. Voice calls are routed through Twilio&apos;s programmable voice &mdash; the caller hears an ElevenLabs-generated greeting, then their voicemail is transcribed and processed like any other concierge message.
          </p>
          <p>
            MMS attachments (photos of receipts, screenshots of booking confirmations) are downloaded from Twilio&apos;s media URLs and passed to Claude for visual parsing. WhatsApp follows the same flow with Twilio&apos;s WhatsApp Business API.
          </p>

          <h4>Decision Table</h4>
          <TradeoffTable
            headers={['Option', 'Strengths', 'Why Not']}
            rows={[
              ['Twilio', 'Mature APIs, WhatsApp Business integration, programmable voice, excellent docs', 'Chosen'],
              ['Telnyx', 'Lower per-message cost, similar API surface', 'Tried it, migrated, then reverted (see below)'],
            ]}
          />

          <div className="sd-note">
            <strong>Telnyx: tried and reverted.</strong> We fully migrated SMS, WhatsApp, and voice to Telnyx for cost savings. The SMS API worked well, but WhatsApp provisioning was unreliable, voice quality was noticeably worse, and webhook delivery had occasional delays. After two weeks, we reverted the entire migration back to Twilio. The cost savings weren&apos;t worth the reliability tradeoff for a concierge that needs to feel instant.
          </div>
        </Section>

        <NotchReveal compact />

        {/* VI. Data Services */}
        <Section id="data-services" number="VI" title="Data Services" open={openSections['data-services']} onToggle={() => toggleSection('data-services')}>
          <div className="sd-service-pair">
            <ServiceCard name="FlightAware" role="Real-time flight tracking, status polling" logo={FlightAwareLogo} color="#0064CB" />
            <ServiceCard name="Google Maps" role="Place autocomplete, coordinates, map links" logo={GoogleMapsLogo} color="#4285F4" />
          </div>

          <p>
            FlightAware provides real-time flight data via their AeroAPI. When a flight is added to trip logistics (either manually or via the concierge), we poll FlightAware every 60 seconds for active flights. The app shows status (scheduled, en route, landed), gate, terminal, delays, and a progress bar for in-air flights. The &ldquo;Happening Now&rdquo; widget surfaces flights in the air alongside current events.
          </p>
          <p>
            Google Maps Places API powers location autocomplete when creating events. When a user starts typing a restaurant or venue name, we return suggestions with addresses and coordinates. The coordinates are stored with the event for map links and potential future features like proximity-based suggestions.
          </p>

          <h4>Decision Table</h4>
          <TradeoffTable
            headers={['Option', 'Strengths', 'Why Not']}
            rows={[
              ['FlightAware AeroAPI', 'Most comprehensive flight data, good polling API, covers all major airlines', 'Chosen'],
              ['FlightRadar24', 'Consumer-grade tracking', 'No public API, scraping is unreliable and against TOS'],
              ['AviationStack', 'Cheaper, simpler API', 'Less real-time accuracy, missing gate/terminal data'],
              ['Google Maps Places', 'Best autocomplete UX, comprehensive venue database, trusted by users', 'Chosen'],
              ['Mapbox', 'Cheaper, open-source friendly', 'Venue data less comprehensive, users trust Google results more'],
            ]}
          />
        </Section>

        <NotchReveal compact />

        {/* VII. Email */}
        <Section id="email" number="VII" title="Email" open={openSections.email} onToggle={() => toggleSection('email')}>
          <div className="sd-service-pair">
            <ServiceCard name="Resend" role="Outbound transactional email" logo={ResendLogo} color="var(--text)" />
            <ServiceCard name="Postmark" role="Inbound email webhook processing" logo={PostmarkLogo} color="#FFDE00" />
          </div>

          <p>
            Two email providers, each doing what they do best. Resend handles outbound transactional email &mdash; trip invitations, concierge acknowledgments, and any notifications that go out over email. Postmark handles inbound email processing: when someone forwards a booking confirmation or itinerary to the concierge email address, Postmark parses the email (headers, body, attachments) and sends it as a structured webhook to a Next.js API route.
          </p>
          <p>
            Why two providers? Resend has the best developer experience for sending (React email templates, simple API) but doesn&apos;t offer inbound processing. Postmark has the most reliable inbound webhook system in the industry but their outbound API is more cumbersome. Using both means each service operates in its sweet spot.
          </p>

          <h4>Decision Table</h4>
          <TradeoffTable
            headers={['Option', 'Strengths', 'Why Not']}
            rows={[
              ['Resend (outbound)', 'React templates, clean API, great DX, fast delivery', 'Chosen'],
              ['Postmark (inbound)', 'Best-in-class inbound parsing, reliable webhooks, attachment handling', 'Chosen'],
              ['SendGrid (both)', 'Single provider for in + out', 'Inbound parsing less reliable, API more complex, deliverability reputation varies'],
              ['AWS SES', 'Cheapest at scale', 'Significant setup overhead, no inbound parsing, requires more infrastructure'],
            ]}
          />
        </Section>

        <NotchReveal compact />

        {/* VIII. The Concierge: End-to-End */}
        <Section id="concierge" number="VIII" title="The Concierge: End-to-End" open={openSections.concierge} onToggle={() => toggleSection('concierge')}>
          <p>
            The concierge is the most complex path in the system. Here is the full data flow when someone sends a message &mdash; from arrival to acknowledgment &mdash; showing every service touched along the way.
          </p>

          <div className="sd-flow">
            <div className="sd-flow-step">
              <div className="sd-flow-marker">1</div>
              <div className="sd-flow-body">
                <div className="sd-flow-title">Message Arrives</div>
                <div className="sd-flow-desc">
                  A traveler sends a text, WhatsApp message, forwards an email, or calls and leaves a voicemail. Each channel has a dedicated webhook endpoint.
                </div>
                <div className="sd-flow-services">
                  <span className="sd-flow-service-tag"><TwilioLogo /> Twilio</span>
                  <span className="sd-flow-service-tag"><PostmarkLogo /> Postmark</span>
                </div>
              </div>
            </div>

            <div className="sd-flow-step">
              <div className="sd-flow-marker">2</div>
              <div className="sd-flow-body">
                <div className="sd-flow-title">Webhook Processing</div>
                <div className="sd-flow-desc">
                  The Next.js API route validates the request, identifies the sender (phone number or email), resolves their trip membership, and downloads any media attachments.
                </div>
                <div className="sd-flow-services">
                  <span className="sd-flow-service-tag"><NextjsLogo /> Next.js</span>
                  <span className="sd-flow-service-tag"><SupabaseLogo /> Supabase</span>
                </div>
              </div>
            </div>

            <div className="sd-flow-step">
              <div className="sd-flow-marker">3</div>
              <div className="sd-flow-body">
                <div className="sd-flow-title">AI Parsing</div>
                <div className="sd-flow-desc">
                  The message content (text, images, PDFs) is sent to Claude with a structured extraction prompt. Claude returns JSON with detected items: flights, events, expenses, stay dates, new travelers, and notes.
                </div>
                <div className="sd-flow-services">
                  <span className="sd-flow-service-tag"><AnthropicLogo /> Claude</span>
                </div>
              </div>
            </div>

            <div className="sd-flow-step">
              <div className="sd-flow-marker">4</div>
              <div className="sd-flow-body">
                <div className="sd-flow-title">Auto-Accept or Inbox</div>
                <div className="sd-flow-desc">
                  Low-risk items (a single flight, a stay date update) are automatically applied to the trip. Higher-risk items (new expenses, multiple changes) go to the trip inbox for the owner to review and approve.
                </div>
                <div className="sd-flow-services">
                  <span className="sd-flow-service-tag"><SupabaseLogo /> Supabase</span>
                </div>
              </div>
            </div>

            <div className="sd-flow-step">
              <div className="sd-flow-marker">5</div>
              <div className="sd-flow-body">
                <div className="sd-flow-title">Acknowledgment</div>
                <div className="sd-flow-desc">
                  The concierge replies on the same channel confirming what was picked up. For SMS and WhatsApp, this can include a voice note generated by ElevenLabs in addition to the text reply.
                </div>
                <div className="sd-flow-services">
                  <span className="sd-flow-service-tag"><TwilioLogo /> Twilio</span>
                  <span className="sd-flow-service-tag"><ElevenLabsLogo /> ElevenLabs</span>
                  <span className="sd-flow-service-tag"><ResendLogo /> Resend</span>
                </div>
              </div>
            </div>
          </div>

          <p>
            A single concierge message can touch up to six external services in sequence. The design keeps each step independent &mdash; if ElevenLabs is down, the text acknowledgment still goes out. If FlightAware has no data yet for a flight number, the flight is still saved and polling begins on a schedule. Graceful degradation at every step.
          </p>
        </Section>

        <NotchReveal compact />

        {/* IX. Data Protection & Security */}
        <Section id="security" number="IX" title="Data Protection & Security" open={openSections.security} onToggle={() => toggleSection('security')}>
          <p>
            Vialoure handles personal travel data &mdash; flight itineraries, phone numbers, email addresses, photos, expenses, and payment handles (Venmo, CashApp, Zelle). The security model is designed around one principle: <strong>minimize what we store, enforce access at the lowest level, and delegate auth and encryption to services purpose-built for it.</strong>
          </p>

          <h4>Data in Transit</h4>
          <p>
            All traffic is encrypted with TLS. Vercel enforces HTTPS on every request with automatic certificate provisioning &mdash; there is no path to reach the application over plain HTTP. API calls to every external service (Supabase, Anthropic, Twilio, ElevenLabs, FlightAware, Google Maps, Resend, Postmark) use HTTPS with TLS 1.2 or higher.
          </p>

          <h4>Data at Rest</h4>
          <p>
            Supabase Postgres uses AES-256 encryption at rest for all database storage, managed transparently by the platform. Storage buckets (trip photos, concierge attachments) are encrypted at rest using the same standard. We do not store raw API keys, tokens, or credentials in the database.
          </p>

          <h4>Access Control &mdash; Row-Level Security</h4>
          <p>
            Every table in the database is protected by Postgres RLS policies. Trip data (events, expenses, logistics, journal entries, messages) is scoped to trip membership at the database level. A query from an authenticated user physically cannot return rows for a trip they don&apos;t belong to &mdash; this isn&apos;t application logic, it&apos;s enforced by the database engine. Storage bucket policies mirror this: files are linked to trips, and only trip members can access them. API routes that modify trip data (such as updating settlement records) verify trip membership before processing &mdash; authentication alone is not sufficient; the user must belong to the specific trip.
          </p>

          <h4>Authentication</h4>
          <p>
            Users authenticate via Google OAuth through Supabase Auth. Supabase issues short-lived JWTs that the client presents with every request. There are no passwords stored in the system. Pre-added trip members (invited by email before they have an account) are matched to their membership on first sign-in via email verification. Every internal API route (flight tracking, place resolution, settlements) requires an authenticated session &mdash; there are no unauthenticated paths to trip data.
          </p>

          <h4>Webhook Verification</h4>
          <p>
            Inbound webhooks are the primary attack surface for the concierge. Twilio webhooks are validated using Twilio&apos;s request signature &mdash; each incoming request includes a cryptographic signature computed from the request body and our auth token, which the API route verifies using constant-time comparison to prevent timing attacks. Postmark inbound emails are verified via their webhook authentication token. Unsigned or malformed webhook requests are rejected before any AI parsing occurs.
          </p>

          <h4>Rate Limiting</h4>
          <p>
            Every API route is rate-limited using a sliding window algorithm keyed on client IP. The concierge webhooks (SMS, WhatsApp, voice, email) are capped at 20&ndash;30 requests per minute &mdash; critical because each triggers an Anthropic API call. Public-facing endpoints have tighter limits: access requests are capped at 5 per minute, invite checks at 10 per minute. Exceeding the limit returns a <code>429 Too Many Requests</code> response with a <code>Retry-After</code> header.
          </p>

          <h4>HTTP Security Headers</h4>
          <p>
            Every response includes a strict Content Security Policy that locks down script, style, font, image, and connection sources to only what the application requires. Additional headers prevent MIME type sniffing (<code>X-Content-Type-Options: nosniff</code>), block iframe embedding (<code>X-Frame-Options: DENY</code>), restrict referrer information on cross-origin requests, and disable unused browser APIs (camera, microphone, geolocation) via <code>Permissions-Policy</code>.
          </p>

          <h4>Input Validation &amp; Payload Limits</h4>
          <p>
            All public-facing inputs are validated before processing. Email fields are checked against format rules and capped at 254 characters. Names are trimmed and length-limited. User-submitted values interpolated into HTML (such as access request notification emails) are escaped to prevent injection. Concierge webhook payloads are size-capped at 100KB for Twilio routes and 10MB for inbound email &mdash; oversized payloads are rejected before reaching any parsing logic. Flight numbers are validated as alphanumeric with a 10-character maximum.
          </p>

          <h4>Secret Management</h4>
          <p>
            All API keys and service credentials are stored as environment variables in Vercel &mdash; never in source code, never in the database, never in client bundles. Vercel environment variables are encrypted at rest and scoped to specific deployment environments (production, preview, development). The client-side JavaScript bundle has zero access to any server-side secret.
          </p>

          <h4>Media &amp; Attachment Handling</h4>
          <p>
            When the concierge receives MMS or WhatsApp media (photos, PDFs), attachments are downloaded server-side from Twilio&apos;s temporary media URLs using authenticated requests, processed by Claude for extraction, then stored in access-controlled Supabase storage buckets. Twilio&apos;s media URLs expire automatically. We do not retain the original media beyond what is stored in the trip&apos;s storage bucket, and that bucket is RLS-protected.
          </p>

          <h4>What We Don&apos;t Store</h4>
          <p>
            No passwords. No credit card numbers. No government IDs. Payment handles (Venmo usernames, CashApp tags) are stored as plain text because they are public-facing identifiers by design &mdash; they carry no access risk. AI prompts and extracted content are logged for concierge message history (visible to trip members) but raw API responses from Claude are not persisted.
          </p>

          <h4>Security Summary</h4>
          <TradeoffTable
            headers={['Layer', 'Mechanism', 'Enforced By']}
            rows={[
              ['Transit encryption', 'TLS 1.2+ on all connections', 'Vercel, Supabase, all service providers'],
              ['Storage encryption', 'AES-256 at rest', 'Supabase (Postgres + Storage)'],
              ['Access control', 'Row-level security + trip membership checks', 'Postgres RLS, API route guards'],
              ['Authentication', 'Google OAuth, short-lived JWTs, session-gated API routes', 'Supabase Auth'],
              ['Webhook integrity', 'HMAC signature validation (constant-time)', 'Twilio, Postmark'],
              ['Rate limiting', 'Sliding window per IP (5\u201330 req/min by route)', 'In-memory rate limiter'],
              ['HTTP headers', 'CSP, X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy', 'Next.js response headers'],
              ['Input validation', 'Email format, length caps, HTML escaping, payload size limits', 'API route guards'],
              ['Secrets', 'Encrypted environment variables, no client exposure', 'Vercel'],
              ['Media lifecycle', 'Temp URLs, server-side fetch, RLS-protected storage', 'Twilio, Supabase Storage'],
            ]}
          />
        </Section>

        {/* Footer */}
        <footer className="stand-footer">
          <svg viewBox="0 0 120 48" width="16" height="7" className="stand-footer-mark" aria-hidden="true">
            <path d="M0 48 L60 0 L120 48 Z" fill="currentColor" />
          </svg>
        </footer>
      </div>
    </div>
  );
}
