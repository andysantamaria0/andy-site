'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import NotchReveal from '../../components/NotchReveal';

const SECTIONS = [
  { id: 'background', number: 'I', label: 'Background' },
  { id: 'david', number: 'II', label: 'David Shimel' },
  { id: 'references', number: 'III', label: 'References' },
  { id: 'built', number: 'IV', label: 'Portfolio' },
  { id: 'approach', number: 'V', label: 'Approach' },
  { id: 'phases', number: 'VI', label: 'Phases' },
  { id: 'estimates', number: 'VII', label: 'Estimates' },
];

function ChevronIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6 L8 10 L12 6" />
    </svg>
  );
}

function Section({ id, number, title, defaultOpen = false, open: controlledOpen, onToggle, children }) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const toggle = onToggle || (() => setInternalOpen(v => !v));

  return (
    <div id={id} className={`stand-section${isOpen ? ' stand-section-open' : ''}`}>
      <button className="stand-section-toggle" onClick={toggle}>
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

function Placeholder({ type }) {
  const labels = {
    screenshot: 'Screenshot coming soon',
    link: 'Link coming soon',
    design: 'Design system preview coming soon',
  };
  return (
    <div className="stand-placeholder">
      {labels[type] || 'Coming soon'}
    </div>
  );
}

export default function StandContent() {
  const [moreOpen, setMoreOpen] = useState(false);
  const [activeId, setActiveId] = useState('background');
  const [openSections, setOpenSections] = useState({ background: true });
  const navRef = useRef(null);
  const isScrollingRef = useRef(false);

  const toggleSection = useCallback((id) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const jumpTo = useCallback((id) => {
    // Open the section if it's closed
    setOpenSections(prev => ({ ...prev, [id]: true }));
    setActiveId(id);
    isScrollingRef.current = true;

    // Wait a frame for the section to open, then scroll
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

  // Track active section on scroll
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

  // Keep active tab scrolled into view in the nav
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
          <h1 className="stand-name">Andy Santamaria</h1>
          <p className="stand-title">Product Engineer</p>
          <div className="stand-rule" />
        </header>

        {/* Section 1: Background */}
        <Section id="background" number="I" title="My Background" open={openSections.background} onToggle={() => toggleSection('background')}>
          <p>
            <a href="https://www.linkedin.com/in/andrew-santamaria-95a40869/" target="_blank" rel="noopener noreferrer">A product leader</a> for the last 12 years working with early-stage startups. I was an early employee at Square where I ran beta products as an associate product manager. These products went on to become huge business lines like Cash App, Retail, and Square Capital (small business loans). I led a pilot with the New York City Taxi and Limousine Commission to install Square hardware in taxis (before Uber was allowed). Recently I was the head of product at a Web3 infra startup with a custodial trust license serving institutional and retail investors with low risk tolerance. During the fallout from FTX, I, along with the head of engineering, were tasked with a drastic turnaround with only 10 months of runway left. We ended up rebuilding an entirely new product and got the company acquired (the software was the key asset).
          </p>
          <p>
            After that I started a small venture studio where my partner from the previous company worked with many founders at the earliest stages, right before they were starting to build software. I helped them with feature planning, wireframing, PRDs, and roadmapping (the old-school way!).
          </p>
          <p>
            I&apos;m currently consulting with Fractal Tech NYC. It&apos;s an AI engineering accelerator. For building software, it&apos;s truly on the frontier. I quickly saw an opportunity — a short window — where I could stay on the frontier or fall behind. I had to forget everything I knew about making software.
          </p>
          <p>
            At Fractal I act as Founder in Residence, working to bridge the frontier of AI engineering application to startups looking to grow by building faster and smarter. The engineers and founders are my customers. I have built partnerships with <a href="https://www.antler.co/" target="_blank" rel="noopener noreferrer">Antler</a>, <a href="https://collabfund.com/" target="_blank" rel="noopener noreferrer">Collab Fund</a>, two pre-seed firms, and am in initial talks with <a href="https://www.forumvc.com/" target="_blank" rel="noopener noreferrer">Forum Ventures</a>. These partnerships offer a direct line to early-stage startup founders where I advise on product and engineering. Many of these founders are in a similar stage as you. For the engineers at Fractal, I work with them on the product side to help them &ldquo;fill in the gaps&rdquo; on PRDs and tickets. Teaching them to think like product owners makes an engineer at an early stage a lot more productive. There are internal meetings and more time spent talking to customers.
          </p>
        </Section>

        <NotchReveal compact />

        {/* Section 2: David Shimel */}
        <Section id="david" number="II" title="David Shimel, Engineering Leader" open={openSections.david} onToggle={() => toggleSection('david')}>
          <p><em>Bio coming soon.</em></p>
        </Section>

        <NotchReveal compact />

        {/* Section 3: References */}
        <Section id="references" number="III" title="References" open={openSections.references} onToggle={() => toggleSection('references')}>
          <div className="stand-ref">
            <div className="stand-ref-name">Noelle, Founder of <a href="https://hellolegado.com/" target="_blank" rel="noopener noreferrer">Legado</a></div>
            <p className="stand-ref-context">
              I have worked with Noelle at two different periods. Initially I worked with her at the very beginning when she was duct-taping a prototype together and trying to figure out how to go to market and with whom. I worked with her and her team to plan a roadmap that was flexible yet still true to the north star. I later worked with her more closely as a product manager with engineers who we hired through our studio.
            </p>
          </div>
          <div className="stand-ref">
            <div className="stand-ref-name">Woody</div>
            <p className="stand-ref-context">
              Mostly character reference. I worked with Woody at Square. The direct overlap was when I was preparing his team to handle the support operations for the taxi pilot as we were preparing to scale the project.
            </p>
          </div>
          <div className="stand-ref">
            <div className="stand-ref-name">Chuck</div>
            <p className="stand-ref-context">
              I worked with him as the head of product at Ponto. Chuck led partnerships, building relationships with large telecom companies to incorporate our infrastructure. I supported him on the customer front, taking complex, boring technology and turning it into products with applications they could tell a story about to their board members as well as consumers.
            </p>
          </div>
        </Section>

        <NotchReveal compact />

        {/* Section 4: Things I've Built */}
        <Section id="built" number="IV" title="Things I've Built — End to End" open={openSections.built} onToggle={() => toggleSection('built')}>
          <div className="stand-project">
            <h3 className="stand-project-name">Job Detective Jr.</h3>
            <div className="stand-project-body">
              <p>
                An automated custom data pipeline that crawls 8+ ATS services and 5 websites, and two-way syncs with Fractal&apos;s HubSpot with custom regex filtering to produce a curated list of open roles that meet the criteria of the engineering community. Displayed in Google Sheets with a Discord bot for updates.
              </p>
              <p>
                Like anything today, we&apos;re flooded with feeds. Especially in New York, everyone knows it&apos;s got a vibrant tech scene but not everyone (especially engineers) knows where to look. This was the first step to solving their problem, which is a custom feed. Now they have a place to look every week.
              </p>
            </div>
            <img className="stand-screenshot" src="/stand/job-detective-jr.png" alt="Job Detective Jr. Discord bot showing scan results — 1,192 companies scanned, 144 matching Fractal Fit jobs" />
            <a className="stand-link" href="https://letterfromandy.substack.com/p/job-detective-jr" target="_blank" rel="noopener noreferrer">
              Read about Job Detective Jr. <span className="stand-link-arrow">→</span>
            </a>
            <a className="stand-link" href="/stand/job-detective-jr" target="_blank" rel="noopener noreferrer">
              Deep Dive <span className="stand-link-arrow">→</span>
            </a>
          </div>

          <div className="stand-project">
            <h3 className="stand-project-name">The Hiring Spa</h3>
            <div className="stand-project-body">
              <p>
                The main feedback I got from Job Detective Jr. was that it was great to know there were many more roles available than just the big companies, but now they were overwhelmed with choice!
              </p>
              <p>
                Same users: engineers looking to work at early-stage startups. It&apos;s deeply personal somehow. Working at these early-stage startups, you know you&apos;re signing up for something harder than a big company. So you need to be personally invested in the mission, the customers, and the team, as well as the technical challenges. So engineers make these decisions extremely carefully.
              </p>
              <p>
                The problem: this experience is just quite stressful.
              </p>
              <p>
                How could I make this experience calmer?
              </p>
              <p>
                It required a much more technically complex and also subtle solution.
              </p>
              <p>
                To the engineers I said: what if I could hand-deliver up to 10 roles each week that you were excited to pursue, before you even saw the job description? These roles would match your career goals and personal priorities across 5 dimensions.
              </p>
              <p>
                The Hiring Spa lets engineers sign up, add their GitHub profile, résumé, and portfolio site. It then takes them through a guided questionnaire to understand the nuances of their desires. What kind of work environment enables them to perform their best? What is their preferred management style? How comfortable are they with ambiguity? Do they like to work in large teams or prefer solo tasks? After this, the app produces a table specifically for that engineer called EngineerDNA. It then crawls all the job descriptions from Job Detective Jr., the company&apos;s LinkedIn, and website in order to find matches.
              </p>
              <p>
                The matching engine gets better with each engagement and specifically saves any preferences for that engineer. It&apos;s about as personalized as you can get. It&apos;s been one of the most fun products to build because I have less than 100 users. I can build a feature specifically for one user and watch it move the needle for them. It&apos;s given me a lot to think about when designing and building products for those early stages.
              </p>
            </div>
            <img className="stand-screenshot" src="/stand/hiring-spa-matches.jpg" alt="The Hiring Spa — personalized job match card showing 80% match score across Mission, Technical, Culture, Environment, and DNA dimensions" />
            <img className="stand-screenshot" src="/stand/hiring-spa-feedback.jpg" alt="Discord user feedback — engineer recommending The Hiring Spa for its well-aligned job recommendations" />
            <a className="stand-link" href="https://eng.fractaltech.nyc/" target="_blank" rel="noopener noreferrer">
              The Hiring Spa <span className="stand-link-arrow">→</span>
            </a>
            <a className="stand-link" href="/stand/hiring-spa" target="_blank" rel="noopener noreferrer">
              Deep Dive <span className="stand-link-arrow">→</span>
            </a>
          </div>

          <div className="stand-project">
            <h3 className="stand-project-name">Vialoure, for Andy&apos;s Friends</h3>
            <div className="stand-project-body">
              <p>
                Years ago I wanted to build an app that let me show up to any city and meet someone — a local — who knew just one tiny corner of the city better than anyone else and was willing to let a stranger come along for the ride and see the city through their eyes. I had friends at Airbnb and I pitched them. I was about 3 months too late and they wanted to go in a different direction: Airbnb Experiences. That idea still stuck with me and recently morphed into a new version.
              </p>
              <p>
                I&apos;m lucky enough to be part of a friend group that travels a lot together. We&apos;ve got long-spanning friendships where people live all over the world and we still aim to make it happen. Sometimes 30 people descend onto a villa in Sicily. The organization is intense, almost like a destination wedding. And there are personalities...
              </p>
              <p>
                I wanted to focus on two things.
              </p>
              <p>
                What if I could build a private concierge center for my friends when we travel? So everything is in one place and updated constantly. Who is coming and how long are they staying (often the trip is more than a week because we can&apos;t all overlap for the same duration)? How could I make it easy to manage and split expenses? There is a lot more that went into this but you can get the idea.
              </p>
              <p>
                The second thing: I want this app to look amazing. I want it to be stylish, evocative, romantic. I want it to look beautiful. So the experience of using the app makes you feel like the trip was just a bit more elegant.
              </p>
              <p>
                I spent quite a lot of time working on the design of the app. Every single detail. From the font choice, to the scaling on screens, to the animations and UI components. I wanted all of these elements to tell a consistent story so when you&apos;re using the app you &ldquo;stay in character.&rdquo; There is nothing like traveling somewhere and something doesn&apos;t fit (like in a hotel or restaurant) where you&apos;re jolted out of the dream.
              </p>
            </div>
            <img className="stand-screenshot" src="/stand/vialoure-landing.png" alt="Vialoure landing page — Holiday With Friends" />
            <a className="stand-link" href="https://andysantamaria.com/vialoure-grand-tour-v2" target="_blank" rel="noopener noreferrer">
              Design System <span className="stand-link-arrow">→</span>
            </a>
            <img className="stand-screenshot stand-screenshot-small" src="/stand/vialoure-app.png" alt="Vialoure logged-in view — trip overview for Chuck's Birthday in Verona" />
            <a className="stand-link" href="/vialoure" target="_blank" rel="noopener noreferrer">
              Vialoure App <span className="stand-link-arrow">→</span>
            </a>
            <a className="stand-link" href="/stand/vialoure-for-friends" target="_blank" rel="noopener noreferrer">
              Deep Dive <span className="stand-link-arrow">→</span>
            </a>
          </div>

          {/* Nested: More Things */}
          <div className={`stand-nested${moreOpen ? ' stand-nested-open' : ''}`}>
            <button className="stand-nested-toggle" onClick={() => setMoreOpen(!moreOpen)}>
              <ChevronIcon className="stand-nested-chevron" />
              More Things I&apos;ve Built
            </button>
            <div className="stand-nested-body">
              <div className="stand-nested-inner">
                <div className="stand-nested-content">
                  <div className="stand-mini-project">
                    <div className="stand-mini-project-name">Fractal Tech Website</div>
                    <p>
                      I designed and built the new Fractal Tech website, which includes a much-updated look and feel. It also includes a custom HubSpot integration for the company to track and manage leads for companies and engineers.
                    </p>
                    <a className="stand-link" href="https://fractaltech.nyc/" target="_blank" rel="noopener noreferrer">
                      New Site <span className="stand-link-arrow">→</span>
                    </a>
                    <a className="stand-link" href="https://fractalbootcamp.com/" target="_blank" rel="noopener noreferrer">
                      Original Site (for comparison) <span className="stand-link-arrow">→</span>
                    </a>
                  </div>

                  <div className="stand-mini-project">
                    <div className="stand-mini-project-name">Partner Portal — Fractal Tech</div>
                    <p>
                      I built a partner portal for qualified companies to create an account, view the accelerator&apos;s work, and participate in the Fractal Cycles program. Cycles offers an intense internship where companies submit features they want built; they&apos;re matched with engineers who are looking to build for them (and their résumé).
                    </p>
                  </div>

                  <div className="stand-mini-project">
                    <div className="stand-mini-project-name">Fractal Tech Backend Portal</div>
                    <p>
                      I built a fully functional portal to manage all the engineers, companies, the Cycles program (automated), and dashboards to track all company metrics.
                    </p>
                    <img className="stand-screenshot" src="/stand/fractal-admin.png" alt="Fractal Admin portal — Engineer Pipeline dashboard showing 38 engineers across the funnel" />
                    <a className="stand-link" href="/stand/admin-portal" target="_blank" rel="noopener noreferrer">
                      Deep Dive <span className="stand-link-arrow">→</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <NotchReveal compact />

        {/* Section 5: The Approach */}
        <Section id="approach" number="V" title="The Approach" open={openSections.approach} onToggle={() => toggleSection('approach')}>
          <p>
            Here is the <span className="stand-term">operating rhythm</span> (I stole that) I&apos;m envisioning.
          </p>
          <p>
            You&apos;re funded. So this hopefully means, even for a short period, you can forget about investors as &ldquo;users&rdquo; you&apos;re working to solve for and focus on the real customers.
          </p>
          <p>
            You&apos;ve got a prototype, some branding, and you can see a spot over on the mountain that looks nice — you&apos;d like to get there. You&apos;re at what I call <span className="stand-term">basecamp</span>. You&apos;re packed and ready, you know the direction generally but it&apos;s not entirely clear how to get to that spot on the mountain. Besides, once you enter the thick of the forest you won&apos;t be able to see that spot anymore.
          </p>
          <p>
            You&apos;re at the stage where you&apos;re seeking the <span className="stand-term">Promise Delivery</span>.
          </p>
          <p>
            It&apos;s the moment when the customer gets what they came for (whether they realize it consciously or subconsciously).
          </p>
          <p>
            Especially at this stage, everything is changing, but all through the pre-seed phase (sometimes longer) you will notice the Promise Delivery may not be identical for a customer group or even that specific customer.
          </p>
          <p>
            You have two main customer groups: parents and their kids. (I&apos;m adding the law as a subgroup but it&apos;s going to be its own group soon so it&apos;s worth sketching that out now.)
          </p>
          <p>
            The Promise Delivery for a specific parent can be different and you&apos;ll uncover that — if you haven&apos;t already — during user feedback sessions.
          </p>
          <p>
            The process is meant to happen as fast as possible. Decide on a Promise Delivery you want to hit, build the product with the best chance for that outcome, talk to customers, iterate UNTIL THE END OF TIME.
          </p>
          <p>
            The thing I find extremely fun about this stage (and also frustrating) is that the Promise Delivery can be elusive. It always exists but it&apos;s not always obvious, and customers sometimes have a hard time articulating it. In fact, most do. That&apos;s why we have the most famous product quote, erroneously attributed: &ldquo;If I asked people, they would have said a faster horse.&rdquo;
          </p>
          <p>
            So what a successful <span className="stand-term">user journey</span> is for one parent may look different for another.
          </p>
          <p>
            But over time, you&apos;ll collect patterns and the patterns will make it clear which path to pursue.
          </p>
          <p>
            How do we start? At the early stages like this it really feels like a creative endeavor. Almost like painting. It&apos;s hard to look at the blank canvas but the best way to start painting is to... start painting.
          </p>
        </Section>

        <NotchReveal compact />

        {/* Section 6: The Phases */}
        <Section id="phases" number="VI" title="The Phases" open={openSections.phases} onToggle={() => toggleSection('phases')}>
          <p>
            I&apos;ll describe the phases. They can take as much time as they take, but it&apos;s hopefully clear when one phase is done and you can move to the next one (or back to repeat one).
          </p>

          <div className="stand-phase">
            <div className="stand-phase-number">Phase 1</div>
            <div className="stand-phase-name">Alignment</div>
            <p>
              This is where whoever is a part of this story is present, roles are made clear, expectations set, and the highest-level goals are illuminated.
            </p>
            <p>
              From my side, I would bring engineering and product expertise.
            </p>
          </div>

          <div className="stand-phase">
            <div className="stand-phase-number">Phase 2</div>
            <div className="stand-phase-name">Design — Systems, Services, Functionality</div>
            <p>
              This is where an engineering leader — one who understands the business goals as well as the product goals of the company — designs a system architecture that enables the company to move fast, be flexible, and maintain production-grade security protocols specific to the industry. For Stand, this means designing around two critical constraints from the start: COPPA compliance (parental consent flows, what data we can and can&apos;t collect before a parent signs off, how we handle under-13 accounts) and payment rails (how money moves between parents, kids, and product partners like Printify — and what that looks like for MVP versus long-term integrations like Step or Greenlight). David and I both bring direct experience here — me at Square and Ponto, David at Stripe — so this isn&apos;t new territory for either of us.
            </p>
            <p>
              Because the company is so early, this phase will also include them working with product engineering (me) and leadership (you) to hook these up and configure them. You&apos;ll get a document explaining why these services were chosen, how they were configured, and what the tradeoffs were for each decision. The end of this phase will make it ready for product engineering to work in this system.
            </p>
          </div>

          <div className="stand-phase">
            <div className="stand-phase-number">Phase 3</div>
            <div className="stand-phase-name">Product Engineering (a.k.a. Building)</div>
            <p>
              The fun part. It&apos;s time to build.
            </p>
            <p>
              This part is where each product engineer and founder have their own spin on the process. Here is what I recommend this phase looks like.
            </p>
            <p>
              We start with whatever we have. We make a short document (words only for now).
            </p>
            <p>
              It&apos;s an internal document, it&apos;s not a marketing document. The audience is: product, engineering, and leadership.
            </p>
            <p>
              In the simplest words it says what we&apos;re building (within a certain period so it can&apos;t be too large in scope or vague), who the customers are, and the promise we aim to deliver to them.
            </p>
            <p>
              The next section is user journeys. This is a specific term I use in a specific way. It simply means writing down things a user can do when they interact with your app. We almost always chop this list down after we&apos;re done; we&apos;ll put the rest away in a drawer and come back to revisit it often.
            </p>
          </div>

          <div className="stand-phase">
            <div className="stand-phase-number">Phase 4</div>
            <div className="stand-phase-name">Front-End Interactive (Optional)</div>
            <p>
              This is what it looks like you&apos;ve got so far. It&apos;s got part of a flow but not necessarily the whole complete user journey. (I want to take a moment to call out &ldquo;onboarding&rdquo; as a specific user journey which sounds simple but is notoriously nuanced and hard.) One helpful tip for how I think about user journeys is: how many of these do they need to perform until they can say &ldquo;Ah, yes, I&apos;m done now&rdquo; and that moment is wrapped up in a bow? In this phase I&apos;ll create and show visualized and interactive app functionality, on a local server usually. We can make changes almost instantly until we get to a point where we want to push this into production.
            </p>
          </div>

          <div className="stand-phase">
            <div className="stand-phase-number">Phase 5</div>
            <div className="stand-phase-name">Live + Testing</div>
            <p>
              The app with a collection of user journeys is in production. It works but not exactly as we imagined. We&apos;re testing it until we feel confident that it can be put in the hands of a customer. Testing happens with the internal team and close friends mostly. For a proper big release, we&apos;ll do a <span className="stand-term">testing party</span> — an in-person, intense session to break and fix every single edge case within a time-boxed period.
            </p>
          </div>

          <div className="stand-phase">
            <div className="stand-phase-number">Phase 6</div>
            <div className="stand-phase-name">User Feedback</div>
            <p>
              Time to go back to the beginning with new learnings! Share the product, ask for feedback async as well as do <span className="stand-term">live in-person sessions</span> where we can get consent to record the session. Doing these on video calls is fine too and we should do all of them. Getting the in-person sessions is really gold though.
            </p>
          </div>
        </Section>

        <NotchReveal compact />

        {/* Section 7: Estimates */}
        <Section id="estimates" number="VII" title="Estimates" open={openSections.estimates} onToggle={() => toggleSection('estimates')}>
          <h4>Rates</h4>
          <div className="stand-table-wrapper">
            <table className="stand-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Engineering Leader (David Shimel)</td>
                  <td>$300/hr</td>
                </tr>
                <tr>
                  <td>Product Engineer (Andy Santamaria)</td>
                  <td>$85/hr</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4>Phase Estimates</h4>
          <div className="stand-table-wrapper">
            <table className="stand-table">
              <thead>
                <tr>
                  <th>Phase</th>
                  <th>Who</th>
                  <th>Hours</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Alignment Session(s)</td>
                  <td>Both</td>
                  <td>~2 hr</td>
                  <td><span className="stand-waived">$770</span> Waived</td>
                </tr>
                <tr>
                  <td>System Design, Hook-Up, Configuration</td>
                  <td>Engineering Leader</td>
                  <td>~5–10 hr</td>
                  <td>$1,500–$3,000</td>
                </tr>
                <tr>
                  <td>Initial Product Document</td>
                  <td>Product Engineer</td>
                  <td>~1–2 hr</td>
                  <td>$85–$170</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4>Ongoing: Building, Live Testing, User Feedback</h4>
          <p>
            This is where it gets fuzzy. It&apos;s an extremely dynamic scenario because software is never done. So for this, we can go as slow or fast as you want. The way I recommend doing this is: once we get that product document in a good place, I&apos;ll go all out for 10 hours and come up for air with something. It should meet or exceed your expectations in value of time spent. If not, we can recalibrate until we get our operating rhythm just right.
          </p>

          <h4>Example Weekly Breakdown</h4>
          <div className="stand-table-wrapper">
            <table className="stand-table">
              <thead>
                <tr>
                  <th>Week</th>
                  <th>Role</th>
                  <th>Hours</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Week 1</td>
                  <td>Engineering Leader</td>
                  <td>5–10 hr</td>
                  <td>$1,500–$3,000</td>
                </tr>
                <tr>
                  <td>Week 1</td>
                  <td>Product Engineer</td>
                  <td>11–13 hr</td>
                  <td>$935–$1,105</td>
                </tr>
                <tr className="stand-total">
                  <td>Week 1 Total</td>
                  <td></td>
                  <td></td>
                  <td>$2,435–$4,105</td>
                </tr>
                <tr>
                  <td>Week 2</td>
                  <td>Product Engineer</td>
                  <td>10 hr</td>
                  <td>$850</td>
                </tr>
                <tr className="stand-total">
                  <td>Week 2 Total</td>
                  <td></td>
                  <td></td>
                  <td>$850</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4>Why This Works</h4>
          <p>
            You will have already gotten the <span className="stand-term">foundation designed and built</span>. So if things change months down the road (and they will), you&apos;ll be in a place to <span className="stand-term">swap out services and/or talent</span>. It&apos;s an ideal setup for an early-stage startup. You can use a product engineer to move fast and efficiently, and if there are complex pull requests you have the option to bring in the engineering leader to bring it the last mile.
          </p>
        </Section>

        {/* Personal Note */}
        <div className="stand-note">
          <div className="stand-note-label">A final note for Lauren</div>
          <p>
            If you made it this far, I commend you. I hope I have managed to convey my obsession with my customers and my craft.
          </p>
          <p>
            For me, one of my favorite experiences is that early bit when you&apos;re building and talking with customers. You may appreciate this: a founder (and parent) once told me it was similar to the beginning of parenthood. Almost every day there is an exciting new development; enjoy it because that period is over before you know it.
          </p>
          <p>
            Ahead of Tuesday, if you have any questions or topics you&apos;d like to cover please let me know.
          </p>
          <div className="stand-note-signature">
            &mdash;Andy<span className="stand-note-cursor" />
          </div>
        </div>

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
