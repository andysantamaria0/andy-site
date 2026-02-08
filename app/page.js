import Link from 'next/link';
import { createClient } from '../lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Vialoure — Travel Together',
  description: 'Plan trips with your crew. Shared calendars, expenses, logistics, and a living travel log.',
};

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect('/trips');
  }

  return (
    <div className="v-landing">
      <nav className="v-landing-nav">
        <div className="v-landing-nav-brand">
          <span>Vialoure</span>
          <span className="v-landing-nav-tagline">For Friends</span>
        </div>
        <Link href="/trips/login" className="v-btn v-btn-primary v-landing-nav-cta">
          Sign In
        </Link>
      </nav>

      <section className="v-landing-hero">
        <div className="v-landing-hero-content">
          <h1 className="v-landing-title">
            The Ultimate<br />Travel App<br />For Guapos.
          </h1>
          <p className="v-landing-subtitle">
            Andy&apos;s made it easy for friends to travel together, keeping everyone&apos;s logistics, events, and expenses all in one place.
          </p>
          <Link href="/trips/login" className="v-btn v-btn-google v-landing-cta">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ marginRight: 8 }}>
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.166 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            Get Started with Google
          </Link>
        </div>
        <div className="v-landing-hero-visual">
          <div className="v-landing-card-stack">
            <div className="v-landing-card v-landing-card-1">
              <div className="v-landing-card-icon">&#128197;</div>
              <div className="v-landing-card-label">Shared Calendar</div>
              <div className="v-landing-card-detail">See who&apos;s arriving when</div>
            </div>
            <div className="v-landing-card v-landing-card-2">
              <div className="v-landing-card-icon">&#9992;&#65039;</div>
              <div className="v-landing-card-label">Flight Logistics</div>
              <div className="v-landing-card-detail">Track everyone&apos;s travel plans</div>
            </div>
            <div className="v-landing-card v-landing-card-3">
              <div className="v-landing-card-icon">&#128176;</div>
              <div className="v-landing-card-label">Split Costs</div>
              <div className="v-landing-card-detail">Fair expense tracking built in</div>
            </div>
          </div>
        </div>
      </section>

      <section className="v-landing-features">
        <div className="v-landing-feature">
          <div className="v-landing-feature-number">01</div>
          <h3>Paste anything</h3>
          <p>Drop in a flight confirmation, Airbnb link, or group chat screenshot. AI extracts the details automatically.</p>
        </div>
        <div className="v-landing-feature">
          <div className="v-landing-feature-number">02</div>
          <h3>See the whole picture</h3>
          <p>Month calendar with arrival/departure markers, daily events, and who&apos;s there each day.</p>
        </div>
        <div className="v-landing-feature">
          <div className="v-landing-feature-number">03</div>
          <h3>Invite anyone</h3>
          <p>Add members by name before they even have an account. They claim their spot when they sign in.</p>
        </div>
      </section>

      <footer className="v-landing-footer">
        <span className="v-landing-footer-brand">Vialoure</span>
        <span className="v-landing-footer-tagline">For Friends</span>
      </footer>
    </div>
  );
}
