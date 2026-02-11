import Link from 'next/link';
import { createClient } from '../../lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatDateRange, tripDuration } from '../../lib/utils/dates';

export const metadata = {
  title: 'Vialoure — Holiday With Friends',
  description: 'A private concierge center to manage travel for intimate groups.',
  openGraph: {
    title: 'Vialoure — Holiday With Friends',
    description: 'A private concierge center to manage travel for intimate groups.',
    url: 'https://andysantamaria.com/vialoure',
    siteName: 'Vialoure',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vialoure — Holiday With Friends',
    description: 'A private concierge center to manage travel for intimate groups.',
  },
};

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
    // Featured trip query failed (e.g. schema cache stale) — skip gracefully
  }

  const duration = featuredTrip?.start_date && featuredTrip?.end_date
    ? tripDuration(featuredTrip.start_date, featuredTrip.end_date)
    : null;

  return (
    <div className="v-landing">
      <nav className="v-landing-nav">
        <div className="v-landing-nav-brand">
          <span>Vialoure</span>
          <span className="v-landing-nav-tagline">For Friends</span>
        </div>
        <Link href={user ? '/trips' : '/trips/login'} className="v-btn v-btn-primary v-landing-nav-cta">
          {user ? 'Go to Trips' : 'Sign In'}
        </Link>
      </nav>

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

      <section className="v-landing-hero">
        <div className="v-landing-hero-content">
          <h1 className="v-landing-title">
            Holiday<br />With Friends.
          </h1>
          <p className="v-landing-subtitle">
            A private concierge center to manage travel for intimate groups.
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
          <div className="v-landing-card-stack">
            <div className="v-landing-card v-landing-card-1">
              <div className="v-landing-card-icon">&#128172;</div>
              <div className="v-landing-card-label">Trip Concierge</div>
              <div className="v-landing-card-detail">Text, call, or email your assistant</div>
            </div>
            <div className="v-landing-card v-landing-card-2">
              <div className="v-landing-card-icon">&#9992;&#65039;</div>
              <div className="v-landing-card-label">Happening Now</div>
              <div className="v-landing-card-detail">Live flights and arrivals at a glance</div>
            </div>
            <div className="v-landing-card v-landing-card-3">
              <div className="v-landing-card-icon">&#10024;</div>
              <div className="v-landing-card-label">Smart Paste</div>
              <div className="v-landing-card-detail">AI reads your confirmations for you</div>
            </div>
          </div>
        </div>
      </section>

      <section className="v-landing-features">
        <div className="v-landing-feature">
          <div className="v-landing-feature-number">01</div>
          <h3>Your trip concierge</h3>
          <p>Text, call, or email your trip assistant. Ask about flights, plans, or who&apos;s arriving — it knows everything about your trip.</p>
        </div>
        <div className="v-landing-feature">
          <div className="v-landing-feature-number">02</div>
          <h3>See what&apos;s happening now</h3>
          <p>Live dashboard showing flights in the air, who&apos;s arriving today, and what&apos;s coming up — real-time group awareness at a glance.</p>
        </div>
        <div className="v-landing-feature">
          <div className="v-landing-feature-number">03</div>
          <h3>Paste anything</h3>
          <p>Drop in a flight confirmation, Airbnb link, or booking email. AI extracts the details and adds them to your trip automatically.</p>
        </div>
      </section>

      <footer className="v-landing-footer">
        <span className="v-landing-footer-brand">Vialoure</span>
        <span className="v-landing-footer-tagline">For Friends</span>
      </footer>
    </div>
  );
}
