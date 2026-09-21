import './landing.css';

const EMAIL = 'andyjsantamaria@gmail.com';
const SUBSTACK = 'https://letterfromandy.substack.com/';

const BUILT = [
  {
    href: 'https://canonsociety.com',
    label: 'Canon Society',
    mark: '/marks/canon-society.svg',
    meta: 'canonsociety.com',
    note: 'A book club. An unserious society, devoutly amateur, in the matter of the canon.',
  },
  {
    href: 'https://themailgaze.co',
    label: 'MailGaze',
    mark: '/marks/mailgaze.svg',
    meta: 'themailgaze.co',
    note: 'Gaze into the minds of interesting people around the globe through a modern mail service.',
  },
  {
    href: '/vialoure',
    label: 'Vialoure',
    mark: '/marks/vialoure.svg',
    meta: 'Invite only',
    note: 'A private concierge for travelling with friends. Designed and built end to end — AI concierge, flight tracking, shared expenses.',
    internal: true,
  },
  {
    href: 'https://whatwaterbottleshouldiget.com',
    label: 'What Water Bottle Should I Get',
    mark: '/marks/water-bottle.png',
    meta: 'whatwaterbottleshouldiget.com',
    note: 'For Faye Orlove. 145 bottles, a quiz, and a pipeline so she can add the next one herself.',
  },
  {
    href: 'https://naomishaus.com',
    label: 'Naomi’s Lighthaus',
    mark: '/marks/naomis-lighthaus.png',
    meta: 'naomishaus.com',
    note: 'For Naomi Brooks. The site for her creative and production studio.',
  },
];

export default function Home() {
  return (
    <main className="home">
      <div className="home-inner">

        <header className="home-masthead">
          <div className="home-eyebrow">New York City</div>
          <h1 className="home-name">Andy Santamaria</h1>
          <p className="home-role">Product Leader &middot; AI Engineer</p>
        </header>

        <p className="home-intro">
          Twelve years at early-stage startups, from Square to the frontier of AI
          engineering. Head of Product at{' '}
          <a href="https://standkids.com" target="_blank" rel="noopener noreferrer">
            Stand
          </a>
          , where kids start real businesses.
        </p>

        <figure className="home-horizon">
          <div className="home-horizon-frame">
            <img
              src="/san-miguel-sunset.webp"
              width="1498"
              height="843"
              fetchPriority="high"
              alt="Sunset over the rooftops and church spires of San Miguel de Allende"
            />
          </div>
          <figcaption>San Miguel de Allende</figcaption>
        </figure>

        <section className="home-section">
          <h2 className="home-section-title">Built</h2>
          <div className="home-rows">
            {BUILT.map(({ href, label, mark, meta, note, internal }) => (
              <a
                key={href}
                className="home-row"
                href={href}
                {...(internal ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
              >
                <span
                  className="home-row-mark"
                  style={{ '--mark': `url(${mark})` }}
                  aria-hidden="true"
                />
                <span className="home-row-label">{label}</span>
                <span className="home-row-meta">{meta}</span>
                <span className="home-row-note">{note}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="home-section home-consulting">
          <p className="home-consulting-text">
            Open to consulting. I partner with founders when it&rsquo;s early &mdash; which
            is to say, messy &mdash; and we build the thing together.
          </p>
          <div className="home-consulting-links">
            <a className="home-contact" href="/consulting">
              How I work &rarr;
            </a>
            <a className="home-contact" href={`mailto:${EMAIL}`}>
              Get in touch &rarr;
            </a>
          </div>
        </section>

        <footer className="home-footer">
          <a
            className="home-more"
            href={SUBSTACK}
            target="_blank"
            rel="noopener noreferrer"
          >
            Letters on Substack &rarr;
          </a>
        </footer>

      </div>
    </main>
  );
}
