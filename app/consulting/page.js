import './consulting.css';

const EMAIL = 'andyjsantamaria@gmail.com';

const TITLE = 'Working together — Andy Santamaria';
const DESCRIPTION =
  'How I work with founders: align, build a foundation, ship constantly, test with real people. Product leader and AI engineer in New York.';

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://andysantamaria.com/consulting',
    siteName: 'Andy Santamaria',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const STEPS = [
  {
    label: 'Align',
    body: 'Roles, expectations, goals. Everyone present, before anyone writes code.',
  },
  {
    label: 'Build a foundation',
    body: 'System design that enables speed without cutting corners. Professional-grade, and safe for real users from the first release.',
  },
  {
    label: 'Ship constantly',
    body: 'Working builds, not status updates. We react, adjust, and the product takes shape through daily collaboration.',
  },
  {
    label: 'Test with real people',
    body: 'Real users, real feedback, real data. Testing sessions and iteration until you are proud of it.',
  },
];

const TRACK = [
  { role: 'Head of Product', where: 'Stand, where kids start real businesses', current: true },
  { role: 'Founder in Residence', where: 'Fractal Tech NYC, an AI engineering accelerator' },
  { role: 'Product', where: 'Square, payments at scale' },
];

export default function Consulting() {
  return (
    <main className="cons">
      <div className="cons-inner">

        <header className="cons-masthead">
          <a className="cons-back" href="/">
            Andy Santamaria
          </a>
          <h1 className="cons-title">Working together</h1>
          <p className="cons-role">Product Leader &middot; AI Engineer</p>
        </header>

        <p className="cons-lede">
          I am obsessed with the early stage, where you are still hunting for the
          moment a user finally gets what they came for. Twelve years of it, from
          Square to the frontier of AI engineering. I partner with founders when
          it&rsquo;s early &mdash; which is to say, messy &mdash; and we build the
          thing together.
        </p>

        <section className="cons-section">
          <h2 className="cons-section-title">How I work</h2>
          <ol className="cons-steps">
            {STEPS.map(({ label, body }, i) => (
              <li key={label} className="cons-step">
                <span className="cons-step-num">{String(i + 1).padStart(2, '0')}</span>
                <div className="cons-step-text">
                  <h3 className="cons-step-label">{label}</h3>
                  <p className="cons-step-body">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="cons-section">
          <h2 className="cons-section-title">Who I bring in</h2>
          <p className="cons-body">
            I have a network of people who will pick up the phone when I call, from
            software engineers, designers, social media, and video.
          </p>
        </section>

        <section className="cons-section">
          <h2 className="cons-section-title">Track record</h2>
          <ul className="cons-track">
            {TRACK.map(({ role, where, current }) => (
              <li key={where} className="cons-track-row">
                <span className="cons-track-role">{role}</span>
                <span className="cons-track-where">{where}</span>
                {current ? <span className="cons-track-when">now</span> : null}
              </li>
            ))}
          </ul>
          <p className="cons-body">
            The things I have built are on the{' '}
            <a href="/">front page</a> &mdash; a book club, a letter service, a
            travel concierge, and two sites built for other people.
          </p>
        </section>

        <footer className="cons-footer">
          <p className="cons-body">
            If you are early and it feels messy, that is the right time to talk.
          </p>
          <a className="cons-contact" href={`mailto:${EMAIL}`}>
            Get in touch &rarr;
          </a>
        </footer>

      </div>
    </main>
  );
}
