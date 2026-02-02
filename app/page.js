export default function Home() {
  return (
    <main className="container">
      <h1 className="name">Andy Santamaria</h1>
      <p className="tagline">My site. Some links, some writing, reading, some backgammon.</p>
      <div className="divider" />

        <p>
          I've been working in product for over 10 years at early stage startups where the
          product function is closely tied to customer sales.
        </p>

        <p>
          In my free time I like to read and write, mostly for myself. I've completed 2
          screenplays (shorts). I recently got into backgammon and I'm in a club here in
          the city. I also do consulting. I help founders and early stage startups by
          matching them with founding engineers and under-the-radar tech talent.
        </p>
      </div>

      <div className="links-section">
        <p className="links-intro">I'm here and there.</p>
        <div className="links">
          <a href="https://www.linkedin.com/in/andrew-santamaria-95a40869/" target="_blank" rel="noopener noreferrer">
            <span className="link-label">LinkedIn</span>
            <span className="link-arrow">&rarr;</span>
          </a>
          <a href="https://canonsociety.substack.com/" target="_blank" rel="noopener noreferrer">
            <span className="link-label">Substack</span>
            <span className="link-arrow">&rarr;</span>
          </a>
          <a href="https://commandk.xyz" target="_blank" rel="noopener noreferrer">
            <span className="link-label">commandk.xyz</span>
            <span className="link-arrow">&rarr;</span>
          </a>
        </div>
      </div>

      <div className="projects-section">
        <p className="projects-intro">(unfortunately) making some things vibe coding</p>
        <ul className="projects">
          <li>
            A{' '}
            <a
              href="https://claude.ai/public/artifacts/6ebae92f-49bd-4fc2-a7cb-8bf1171b4688"
              target="_blank"
              rel="noopener noreferrer"
            >
              script formatting tool
            </a>{' '}
            for people who write screenplays on single-purpose writing tools like freewrite,
            BYOK, remarkable, etc.
          </li>
          <li>
            a time tracking app based on 3 principles (spent, invest, and sold)
          </li>
        </ul>
      </div>

      <div className="image-section">
        <img
          src="https://framerusercontent.com/images/WzB4epeg30Xpq1wjeXK9NYwAgrA.jpeg?scale-down-to=2048"
          alt="Andy Santamaria"
        />
      </div>
    </main>
  );
}
