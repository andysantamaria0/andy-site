import Link from 'next/link';
import { createClient } from '../../lib/supabase/server';
import { formatDateRange, tripDuration } from '../../lib/utils/dates';

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

function PhoneMockup() {
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
            <div className="v-phone-trip-dest">CÔTE D&apos;AZUR</div>
            <div className="v-phone-trip-name">Summer in Nice</div>
            <span className="v-phone-live-badge">Live</span>
          </div>
          <div className="v-phone-trip-dates">Jun 15 – Jun 22 · 7 nights</div>
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
          <span className="v-landing-nav-tagline">For Friends</span>
        </div>
        <Link href={user ? '/trips' : '/trips/login'} className="v-btn v-btn-primary v-landing-nav-cta">
          {user ? 'Go to Trips' : 'Sign In'}
        </Link>
      </nav>

      {/* Hero */}
      <section className="v-landing-hero">
        <div className="v-landing-hero-content">
          <h1 className="v-landing-title">
            Holiday<br />With Friends.
          </h1>
          <p className="v-landing-subtitle">
            Your group&apos;s private concierge — flights tracked, plans shared, every detail handled.
          </p>
          <Link href={user ? '/trips' : '/trips/login'} className={`v-btn ${user ? 'v-btn-primary' : 'v-btn-google'} v-landing-cta`}>
            {user ? 'Go to Trips' : (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ marginRight: 8 }}>
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#2D8659"/>
                  <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.166 6.656 3.58 9 3.58Z" fill="#EA4335"/>
                </svg>
                Get Started with Google
              </>
            )}
          </Link>
        </div>
        <div className="v-landing-hero-visual">
          <PhoneMockup />
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

      {/* Features — Editorial Layout */}
      <section className="v-landing-features-editorial">
        <div className="v-landing-feature-block">
          <div className="v-landing-feature-text">
            <h3 className="v-landing-feature-heading">Your concierge, always listening</h3>
            <p className="v-landing-feature-body">
              Text, call, or email. The concierge knows your flights, your plans, who&apos;s arriving when. Ask anything.
            </p>
          </div>
        </div>

        <div className="v-landing-feature-block v-landing-feature-block-alt">
          <div className="v-landing-feature-text">
            <h3 className="v-landing-feature-heading">The whole trip, happening now</h3>
            <p className="v-landing-feature-body">
              Live flights in the air, dinner reservations tonight, who just landed. One glance, everything you need.
            </p>
          </div>
        </div>

        <div className="v-landing-feature-block">
          <div className="v-landing-feature-text">
            <h3 className="v-landing-feature-heading">Paste anything, we&apos;ll read it</h3>
            <p className="v-landing-feature-body">
              Forward a flight confirmation, drop in an Airbnb link. AI extracts every detail and adds it to your trip.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="v-landing-footer">
        <svg viewBox="0 0 120 48" width="24" height="10" className="v-landing-footer-mark" aria-hidden="true">
          <path d="M0 48 L60 0 L120 48 Z" fill="currentColor" />
        </svg>
        <span className="v-landing-footer-wordmark">Vialoure</span>
        <span className="v-landing-footer-tagline-italic">for friends</span>
      </footer>
    </div>
  );
}
