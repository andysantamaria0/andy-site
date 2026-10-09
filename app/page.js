import { Fragment } from 'react';
import './landing.css';

const EMAIL = 'andyjsantamaria@gmail.com';

const BUILT = [
  {
    href: 'https://themailgaze.co',
    label: 'MailGaze',
    mark: '/marks/mailgaze.svg',
    meta: 'themailgaze.co',
    note: 'Gaze into the minds of interesting people around the globe through a modern mail service.',
  },
  {
    href: 'https://flowerspls.nyc',
    label: 'Flowers, Pls?',
    mark: '/marks/flowers-pls.png',
    meta: 'flowerspls.nyc',
    note: 'Last-minute delivery and pickup service flowers in NYC.',
  },
  {
    href: '/vialoure',
    label: 'Vialoure',
    mark: '/marks/vialoure.svg',
    meta: 'Invite only',
    note: 'A private concierge for travelling with friends. Designed and built end to end — AI concierge, flight tracking, shared expenses.',
    internal: true,
    walkthrough: '/vialoure/watch',
  },
  {
    href: 'https://whatwaterbottleshouldiget.com',
    label: 'What Water Bottle Should I Get',
    mark: '/marks/water-bottle.png',
    meta: 'whatwaterbottleshouldiget.com',
    note: 'For a client. A water bottle discovery site with a recommendation quiz, searchable product inventory, and a data scraping pipeline to bring new bottles into the catalog.',
  },
  {
    href: 'https://naomishaus.com',
    label: 'Naomi’s Lighthaus',
    mark: '/marks/naomis-lighthaus.png',
    meta: 'naomishaus.com',
    note: 'A portfolio site for a production and creative services with a TV/analog theme.',
  },
  {
    href: 'https://canonsociety.com',
    label: 'Canon Society',
    mark: '/marks/canon-society.svg',
    meta: 'canonsociety.com',
    note: 'A book club. An unserious society, devoutly amateur, in the matter of the canon.',
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
          12+ years shipping 0 to 1 at early-stage startups, from Square to today.
          Continual learning and problem-solving are my vices. I thrive when the
          start is ambiguous but the outcome must be clear. Most recently I’ve been
          building AI agents in production across voice, chat, and email.
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
        </figure>

        <section className="home-section">
          <h2 className="home-section-title">Built</h2>
          <div className="home-rows">
            {BUILT.map(({ href, label, mark, meta, note, internal, walkthrough }) => (
              <Fragment key={href}>
                <a
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
                {walkthrough && (
                  <a className="home-walkthrough" href={walkthrough}>
                    Watch the 60-second walkthrough <span aria-hidden="true">&rarr;</span>
                  </a>
                )}
              </Fragment>
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

      </div>
    </main>
  );
}
