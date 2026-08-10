import './landing.css';

const DESCRIPTION =
  'Product leader and product engineer in New York. Twelve years at early-stage startups, from Square to the frontier of AI engineering.';

export const metadata = {
  title: 'Andy Santamaria — Product Leader & Product Engineer',
  description: DESCRIPTION,
  openGraph: {
    title: 'Andy Santamaria — Product Leader & Product Engineer',
    description: DESCRIPTION,
    url: 'https://andysantamaria.com',
    siteName: 'Andy Santamaria',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Andy Santamaria — Product Leader & Product Engineer',
    description: DESCRIPTION,
  },
};

const WORK = [
  {
    href: '/product',
    label: 'Working together',
    meta: 'Consulting',
    note: 'How I work, what I build, and what an engagement looks like.',
  },
  {
    href: '/vialoure',
    label: 'Vialoure',
    meta: 'Live',
    note: 'A private concierge for travelling with friends. Designed and built end to end — AI concierge, flight tracking, shared expenses.',
  },
];

const WRITING = [
  {
    href: 'https://letterfromandy.substack.com/p/a-long-story-about-something-i-built',
    label: 'A Long Story About Something I Built',
    meta: 'Jan 2026',
  },
  {
    href: 'https://letterfromandy.substack.com/p/thoughts-on-the-product-function',
    label: 'Thoughts On The Product Function',
    meta: 'Nov 2025',
  },
];

export default function Home() {
  return (
    <main className="home">
      <div className="home-inner">

        <header className="home-masthead">
          <div className="home-eyebrow">New York City</div>
          <h1 className="home-name">Andy Santamaria</h1>
          <p className="home-role">Product Leader &middot; Product Engineer</p>
        </header>

        <p className="home-intro">
          Twelve years at early-stage startups, from Square to the frontier of AI
          engineering. I partner with founders when it&rsquo;s early &mdash; which is to
          say, messy &mdash; and we build the thing together.
        </p>

        <figure className="home-horizon">
          <div className="home-horizon-frame">
            <img
              src="/san-miguel-sunset.png"
              alt="Sunset over the rooftops and church spires of San Miguel de Allende"
            />
          </div>
          <figcaption>San Miguel de Allende</figcaption>
        </figure>

        <section className="home-section">
          <h2 className="home-section-title">Work</h2>
          <div className="home-rows">
            {WORK.map(({ href, label, meta, note }) => (
              <a key={href} className="home-row" href={href}>
                <span className="home-row-label">{label}</span>
                <span className="home-row-meta">{meta}</span>
                <span className="home-row-note">{note}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="home-section">
          <h2 className="home-section-title">Writing</h2>
          <div className="home-rows">
            {WRITING.map(({ href, label, meta }) => (
              <a
                key={href}
                className="home-row"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="home-row-label">{label}</span>
                <span className="home-row-meta">{meta}</span>
              </a>
            ))}
          </div>
          <a
            className="home-more"
            href="https://letterfromandy.substack.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            All letters on Substack &rarr;
          </a>
        </section>

        <footer className="home-footer">
          <a className="home-contact" href="mailto:andyjsantamaria@gmail.com">
            Get in touch
          </a>
          <svg viewBox="0 0 120 48" width="22" height="9" className="home-mark" aria-hidden="true">
            <path d="M0 48 L60 0 L120 48 Z" fill="currentColor" />
          </svg>
        </footer>

      </div>
    </main>
  );
}
