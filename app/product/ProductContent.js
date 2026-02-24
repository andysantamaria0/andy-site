'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import NotchReveal from '../../components/NotchReveal';

const SECTIONS = [
  { id: 'about', number: 'I', label: 'About' },
  { id: 'built', number: 'II', label: 'Built' },
  { id: 'approach', number: 'III', label: 'Approach' },
  { id: 'team', number: 'IV', label: 'Team' },
  { id: 'writing', number: 'V', label: 'Writing' },
  { id: 'engage', number: 'VI', label: 'Engage' },
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
    <div id={id} className={`prod-section${isOpen ? ' prod-section-open' : ''}`}>
      <button className="prod-section-toggle" onClick={toggle}>
        <span className="prod-section-label">{number}</span>
        <span className="prod-section-heading">{title}</span>
        <ChevronIcon className="prod-section-chevron" />
      </button>
      <div className="prod-section-body">
        <div className="prod-section-inner">
          <div className="prod-section-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductContent() {
  const [activeId, setActiveId] = useState('about');
  const [openSections, setOpenSections] = useState({ about: true });
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
    const activeBtn = navRef.current.querySelector('.prod-nav-tab-active');
    if (activeBtn) {
      activeBtn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }
  }, [activeId]);

  return (
    <div className="prod">
      {/* Tab nav */}
      <nav className="prod-nav" ref={navRef}>
        <div className="prod-nav-inner">
          {SECTIONS.map(({ id, number, label }) => (
            <button
              key={id}
              className={`prod-nav-tab${activeId === id ? ' prod-nav-tab-active' : ''}`}
              onClick={() => jumpTo(id)}
            >
              <span className="prod-nav-tab-num">{number}</span>
              {label}
            </button>
          ))}
        </div>
      </nav>

      <div className="prod-container">

        {/* Header */}
        <header className="prod-header">
          <div className="prod-dateline">New York City</div>
          <h1 className="prod-name">Andy Santamaria</h1>
          <p className="prod-title">Product Leader &middot; Product Engineer</p>
          <div className="prod-rule" />
          <p className="prod-intro">
            I&apos;m obsessed with those early stages where you&apos;re constantly in search of the <em>Promise Delivery</em>, the moment when the user gets what they came for. With 12 years of doing this, from Square to the frontier of AI engineering, the chaos <em>almost</em> feels natural now. I partner with founders when it&apos;s early (AKA messy). Together, we work to will their vision into existence. Like the user, the founder has flashes of moments where what they imagined is now in their hands. I&apos;ll help with that part too.
          </p>
        </header>

        {/* Section 1: Background */}
        <Section id="about" number="I" title="Background" open={openSections.about} onToggle={() => toggleSection('about')}>
          <p>
            I was an early employee at <strong>Square</strong> where I ran beta products as an associate product manager. The products I worked on went on to become Cash App, Retail, and Square Capital. I led a pilot with the NYC Taxi &amp; Limousine Commission to install Square hardware in taxis &mdash; before Uber was even allowed to operate.
          </p>
          <p>
            I was later head of product at a <strong>Web3 infrastructure startup</strong> with a custodial trust license. During the FTX fallout, I led a turnaround with 10 months of runway: we rebuilt the product entirely and got the company acquired.
          </p>
          <p>
            After that I started a small <strong>venture studio</strong> helping founders at the earliest stages with feature planning, wireframing, PRDs, and roadmapping.
          </p>
          <p>
            Now I&apos;m consulting with <a href="https://fractaltech.nyc" target="_blank" rel="noopener noreferrer">Fractal Tech NYC</a>, an AI engineering accelerator where I act as Founder in Residence. I&apos;ve built partnerships with <a href="https://www.antler.co/" target="_blank" rel="noopener noreferrer">Antler</a>, <a href="https://collabfund.com/" target="_blank" rel="noopener noreferrer">Collab Fund</a>, and <a href="https://www.forumvc.com/" target="_blank" rel="noopener noreferrer">Forum Ventures</a> &mdash; all direct lines to early-stage founders where I advise on product and engineering.
          </p>
        </Section>

        <NotchReveal compact />

        {/* Section 2: Things I've Built */}
        <Section id="built" number="II" title="Things I've Built" open={openSections.built} onToggle={() => toggleSection('built')}>
          <div className="prod-project">
            <h3 className="prod-project-name">Vialoure</h3>
            <div className="prod-project-tag">Private Travel Concierge</div>
            <div className="prod-project-body">
              <p>
                A private concierge app for group travel with friends. Tracks attendees, flights, expenses, itineraries &mdash; everything in one place. I obsessed over every design detail: typography, animations, UI components, all telling a consistent story so when you&apos;re using the app you stay in character.
              </p>
              <p>
                Built with its own design system, <a href="/vialoure-grand-tour-v2" target="_blank" rel="noopener noreferrer">Grand Tour</a>, inspired by Riviera cinema and vintage travel ephemera. Features an AI concierge, real-time flight tracking, and WhatsApp integration.
              </p>
            </div>
            <div className="prod-project-stack">
              <span className="prod-stack-item">Next.js</span>
              <span className="prod-stack-item">Supabase</span>
              <span className="prod-stack-item">Claude API</span>
              <span className="prod-stack-item">PostHog</span>
            </div>
            <a className="prod-link" href="/vialoure" target="_blank" rel="noopener noreferrer">
              Live App <span className="prod-link-arrow">&rarr;</span>
            </a>
          </div>

          <div className="prod-project">
            <h3 className="prod-project-name">The Hiring Spa</h3>
            <div className="prod-project-tag">AI-Powered Job Matching</div>
            <div className="prod-project-body">
              <p>
                Engineers add their GitHub, r&eacute;sum&eacute;, and portfolio. A guided questionnaire captures career goals across five dimensions. The app produces an &ldquo;EngineerDNA&rdquo; profile and matches against curated job descriptions, company LinkedIn, and websites. The matching engine improves with each engagement.
              </p>
            </div>
            <div className="prod-project-stack">
              <span className="prod-stack-item">Next.js</span>
              <span className="prod-stack-item">Supabase</span>
              <span className="prod-stack-item">Claude API</span>
              <span className="prod-stack-item">HubSpot</span>
            </div>
            <a className="prod-link" href="https://eng.fractaltech.nyc/" target="_blank" rel="noopener noreferrer">
              Live App <span className="prod-link-arrow">&rarr;</span>
            </a>
            <a className="prod-link" href="/stand/hiring-spa" target="_blank" rel="noopener noreferrer">
              Deep Dive <span className="prod-link-arrow">&rarr;</span>
            </a>
          </div>

          <div className="prod-project">
            <h3 className="prod-project-name">Job Detective Jr.</h3>
            <div className="prod-project-tag">Automated Job Pipeline</div>
            <div className="prod-project-body">
              <p>
                An automated data pipeline crawling 8+ ATS services and 5 websites, two-way syncing with HubSpot. Surfaces curated roles that match engineering community criteria via Google Sheets and Discord bot. Built to solve the problem of engineers drowning in feeds but not knowing where to look.
              </p>
            </div>
            <div className="prod-project-stack">
              <span className="prod-stack-item">Node.js</span>
              <span className="prod-stack-item">HubSpot API</span>
              <span className="prod-stack-item">Discord</span>
              <span className="prod-stack-item">Puppeteer</span>
            </div>
            <a className="prod-link" href="https://letterfromandy.substack.com/p/job-detective-jr" target="_blank" rel="noopener noreferrer">
              Read About It <span className="prod-link-arrow">&rarr;</span>
            </a>
          </div>

          <div className="prod-project">
            <h3 className="prod-project-name">Fractal Tech</h3>
            <div className="prod-project-tag">Website, Portals, Admin</div>
            <div className="prod-project-body">
              <p>
                Designed and built the <a href="https://fractaltech.nyc/" target="_blank" rel="noopener noreferrer">Fractal Tech website</a> with HubSpot integration, a partner portal for companies to participate in the Cycles internship program, and a full admin portal for managing engineers, companies, and program automation.
              </p>
            </div>
            <div className="prod-project-stack">
              <span className="prod-stack-item">Next.js</span>
              <span className="prod-stack-item">Supabase</span>
              <span className="prod-stack-item">HubSpot</span>
              <span className="prod-stack-item">Vercel</span>
            </div>
          </div>
        </Section>

        <NotchReveal compact />

        {/* Section 3: The Approach */}
        <Section id="approach" number="III" title="The Approach" open={openSections.approach} onToggle={() => toggleSection('approach')}>
          <p>
            You&apos;re funded. You&apos;ve got a prototype, some branding, and you can see a spot on the mountain that looks nice. You&apos;re at what I call <span className="prod-term">basecamp</span>. You&apos;re packed and ready but it&apos;s not entirely clear how to get there.
          </p>
          <p>
            You&apos;re seeking the <span className="prod-term">Promise Delivery</span> &mdash; the moment the customer gets what they came for. It&apos;s not always obvious, and customers sometimes have a hard time articulating it.
          </p>
          <p>
            The process: decide on a Promise Delivery you want to hit, build the product with the best chance for that outcome, talk to customers, iterate. The product is the research.
          </p>
          <p>
            I work in <span className="prod-term">phases</span>, but they&apos;re flexible &mdash; not a rigid timeline:
          </p>

          <div className="prod-phases">
            <div className="prod-phase">
              <div className="prod-phase-num">1</div>
              <div className="prod-phase-content">
                <div className="prod-phase-name">Alignment</div>
                <p>Roles, expectations, goals. Everyone present.</p>
              </div>
            </div>
            <div className="prod-phase">
              <div className="prod-phase-num">2</div>
              <div className="prod-phase-content">
                <div className="prod-phase-name">Architecture</div>
                <p>System design that enables speed and flexibility without cutting corners. Strong foundation, professional-grade, safe for real users.</p>
              </div>
            </div>
            <div className="prod-phase">
              <div className="prod-phase-num">3</div>
              <div className="prod-phase-content">
                <div className="prod-phase-name">Build</div>
                <p>Ship working builds constantly. React, adjust, iterate. The product takes shape through daily collaboration.</p>
              </div>
            </div>
            <div className="prod-phase">
              <div className="prod-phase-num">4</div>
              <div className="prod-phase-content">
                <div className="prod-phase-name">Test + Ship</div>
                <p>Real users, real feedback, real data. Testing parties, live sessions, iteration until you&apos;re proud of it.</p>
              </div>
            </div>
          </div>
        </Section>

        <NotchReveal compact />

        {/* Section 4: The Team */}
        <Section id="team" number="IV" title="The Team" open={openSections.team} onToggle={() => toggleSection('team')}>
          <div className="prod-team-member">
            <div className="prod-team-name">Andy Santamaria</div>
            <div className="prod-team-role">Product Engineer</div>
            <p>
              Design, code, product thinking, testing, deployment. 12 years at early-stage startups. Square, Web3, venture studio, Fractal Tech. I build end to end and I ship. I&apos;m the constant &mdash; your primary builder and product partner on every engagement.
            </p>
          </div>

          <div className="prod-collective">
            <div className="prod-collective-label">Accessible Collective Talent</div>
            <p className="prod-collective-intro">
              Every project is different, so I assemble the right collective for each one. Through Fractal Tech and my network, I have access to senior engineers, designers, and specialists across the stack. I bring in exactly who the project needs &mdash; no more, no less. You get a tight, focused team without the overhead of an agency.
            </p>
            <div className="prod-collective-member">
              <div className="prod-collective-member-header">
                <div className="prod-collective-member-name"><a href="https://www.linkedin.com/in/david-shimel/" target="_blank" rel="noopener noreferrer">David Shimel</a></div>
                <div className="prod-collective-member-role">Engineering Leader</div>
              </div>
              <p>
                15+ years across Google (Docs, Sheets, YouTube, Lens), Atmosfy ($13M Redpoint raise), and Stripe (Capital, Lending Network). System architecture, auth, databases, security, deployment pipelines &mdash; the foundation that lets me move fast without breaking things.
              </p>
            </div>
          </div>
        </Section>

        <NotchReveal compact />

        {/* Section 5: Writing */}
        <Section id="writing" number="V" title="Writing" open={openSections.writing} onToggle={() => toggleSection('writing')}>
          <p>
            I write about learnings in tech, the product function in early-stage startups, and things I&apos;ve built.
          </p>
          <div className="prod-writing-list">
            <a className="prod-writing-item" href="https://letterfromandy.substack.com/p/a-long-story-about-something-i-built" target="_blank" rel="noopener noreferrer">
              <span className="prod-writing-title">A Long Story About Something I Built</span>
              <span className="prod-writing-date">Jan 2026</span>
            </a>
            <a className="prod-writing-item" href="https://letterfromandy.substack.com/p/thoughts-on-the-product-function" target="_blank" rel="noopener noreferrer">
              <span className="prod-writing-title">Thoughts On The Product Function In Early Stage Startups</span>
              <span className="prod-writing-date">Nov 2025</span>
            </a>
          </div>
          <a className="prod-link" href="https://letterfromandy.substack.com/" target="_blank" rel="noopener noreferrer">
            All Writing on Substack <span className="prod-link-arrow">&rarr;</span>
          </a>
        </Section>

        <NotchReveal compact />

        {/* Section 6: Working Together */}
        <Section id="engage" number="VI" title="Working Together" open={openSections.engage} onToggle={() => toggleSection('engage')}>
          <p>
            I work best with founders who are funded, have a direction, and need someone to build with them &mdash; not hand off a spec to. In practice it feels like I&apos;m on your team.
          </p>
          <p>
            Typical engagements are 2-week sprints with a price cap. You get dedicated product engineering time, daily collaboration, and working builds shipped constantly. The specific product is shaped together.
          </p>
          <p>
            If you&apos;re building something and it&apos;s time to move, let&apos;s talk.
          </p>

          <div className="prod-cta">
            <a className="prod-cta-btn" href="mailto:andysantamaria0@gmail.com">
              Get in Touch
            </a>
          </div>

          <div className="prod-refs">
            <div className="prod-refs-label">References available</div>
            <p>
              Founders I&apos;ve worked with at prototype stage through scaling, a Square colleague, and a partnerships lead from a previous company. Happy to connect you.
            </p>
          </div>
        </Section>

        {/* Footer */}
        <footer className="prod-footer">
          <svg viewBox="0 0 120 48" width="16" height="7" className="prod-footer-mark" aria-hidden="true">
            <path d="M0 48 L60 0 L120 48 Z" fill="currentColor" />
          </svg>
        </footer>
      </div>
    </div>
  );
}
