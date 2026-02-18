'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import NotchReveal from '../../../components/NotchReveal';

const SECTIONS = [
  { id: 'building', number: 'I', label: 'Building' },
  { id: 'promise', number: 'II', label: 'Promise' },
  { id: 'approach', number: 'III', label: 'Approach' },
  { id: 'sprint', number: 'IV', label: 'Sprint' },
  { id: 'deliverables', number: 'V', label: 'Deliverables' },
  { id: 'investment', number: 'VI', label: 'Investment' },
  { id: 'from-you', number: 'VII', label: 'From You' },
  { id: 'after', number: 'VIII', label: 'After' },
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

export default function ProposalContent() {
  const [activeId, setActiveId] = useState('building');
  const [openSections, setOpenSections] = useState({ building: true });
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
          <Link href="/stand" className="stand-nav-link">
            <span className="stand-nav-link-arrow">&larr;</span> Pitch
          </Link>
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
          <h1 className="stand-name">Sprint Proposal</h1>
          <p className="stand-title">Stand &times; Andy Santamaria &mdash; Feb 2026</p>
          <div className="stand-rule" />
        </header>

        {/* I. What We're Building */}
        <Section id="building" number="I" title="What We&rsquo;re Building" open={openSections.building} onToggle={() => toggleSection('building')}>
          <p>
            A production-quality MVP of Stand that delivers on the core promise: <strong>a kid opens the app, and within minutes, they have a real business &mdash; branded, stocked, and ready to sell.</strong> And when they show it to their parents, it looks real, safe, and legit.
          </p>

          <h4>Three Core Features</h4>

          <div className="stand-feature-block">
            <div className="stand-feature-block-name">1. Onboarding &mdash; The Stand Coach Experience</div>
            <p>
              This is the hero. Instead of the current 14-step form journey, we&apos;re building a <strong>conversational, two-pane interface</strong> where kids collaborate with a Stand Coach to build their business in real time.
            </p>
            <ul>
              <li><strong>Left pane:</strong> The conversation. The coach asks questions, reacts, encourages. Kids can type or talk (voice-first on iPad). It adapts to their energy.</li>
              <li><strong>Right pane:</strong> The live build. Every answer immediately renders into something visual. Kid says &ldquo;I want to sell bracelets&rdquo; &rarr; a bracelet mockup appears. They pick a vibe &rarr; the whole brand recolors.</li>
            </ul>
          </div>

          <div className="stand-feature-block">
            <div className="stand-feature-block-name">2. Product Marketplace</div>
            <p>
              Curated products kids can actually sell. Not 50 options &mdash; a tight, beautiful catalog matched to what kids actually want to make and sell. Each product has a real fulfillment path, shows a mockup with the kid&apos;s brand applied, and has a real price and real margin the kid can understand.
            </p>
          </div>

          <div className="stand-feature-block">
            <div className="stand-feature-block-name">3. Dashboard &amp; Storefront</div>
            <p>
              The kid&apos;s home base after onboarding: a CEO Dashboard with goal tracking and sales, a shareable storefront (the viral loop), and quick actions to keep them coming back. This is also where kids show parents what they built &mdash; the dashboard IS the pitch to mom and dad. A dedicated parent backend (login, 2FA, order management) comes post-pilot.
            </p>
          </div>

          <h4>The 6 Moments</h4>

          <div className="stand-moment">
            <span className="stand-moment-number">1</span>
            <span className="stand-moment-body"><strong>&ldquo;What do you want to be called?&rdquo;</strong> &mdash; CEO alias + avatar</span>
          </div>
          <div className="stand-moment">
            <span className="stand-moment-number">2</span>
            <span className="stand-moment-body"><strong>&ldquo;What do you love?&rdquo;</strong> &mdash; Open-ended, not a category picker. &ldquo;I love making bracelets and my dog Biscuit&rdquo; is richer than checking a box</span>
          </div>
          <div className="stand-moment">
            <span className="stand-moment-number">3</span>
            <span className="stand-moment-body"><strong>&ldquo;Here&apos;s what you could sell&rdquo;</strong> &mdash; 2&ndash;3 curated product suggestions with visual mockups</span>
          </div>
          <div className="stand-moment">
            <span className="stand-moment-number">4</span>
            <span className="stand-moment-body"><strong>&ldquo;What&apos;s your style?&rdquo;</strong> &mdash; Pick a vibe from visual mood boards. Each vibe is a pre-designed brand kit</span>
          </div>
          <div className="stand-moment">
            <span className="stand-moment-number">5</span>
            <span className="stand-moment-body"><strong>&ldquo;Name your business&rdquo;</strong> &mdash; The storefront, cards, labels all update. The business becomes real.</span>
          </div>
          <div className="stand-moment">
            <span className="stand-moment-number">6</span>
            <span className="stand-moment-body"><strong>&ldquo;Set your goal&rdquo;</strong> &mdash; What do you want to do with the money? A goal tracker animates into the dashboard.</span>
          </div>
        </Section>

        <NotchReveal compact />

        {/* II. The Promise Delivery */}
        <Section id="promise" number="II" title="The Promise Delivery" open={openSections.promise} onToggle={() => toggleSection('promise')}>
          <p>
            From the pitch page: <em>the moment the customer gets what they came for.</em>
          </p>
          <p>
            <strong>For the kid:</strong> The moment the right pane is fully built and the coach says something like &ldquo;CEO Q-Money, welcome to Quincy&apos;s Charm Co.&rdquo; &mdash; and they&apos;re looking at THEIR storefront, THEIR products, THEIR brand. They built it. Every piece was their decision. That moment needs to hit.
          </p>
          <p>
            <strong>For the parent:</strong> The moment their kid turns the screen around and shows them. &ldquo;Look what I made.&rdquo; And the parent sees something polished, safe, and real &mdash; not &ldquo;vibe coded,&rdquo; not &ldquo;AI-y.&rdquo; The kid&apos;s dashboard IS the parent pitch for the pilot.
          </p>
        </Section>

        <NotchReveal compact />

        {/* III. The Approach */}
        <Section id="approach" number="III" title="The Approach" open={openSections.approach} onToggle={() => toggleSection('approach')}>
          <p>
            This is an incredibly fast project. Two weeks, no slack. To pull it off, we work in phases and hit milestones every couple of days. If something slips, we know immediately.
          </p>

          <div className="stand-phase">
            <div className="stand-phase-number">Phase 1</div>
            <div className="stand-phase-name">Alignment</div>
            <p>
              Already underway. Calls, this proposal, the intake questionnaire. Once you send over brand assets and visual inspiration, I&apos;ll put together a few high-fidelity mockups of the core features &mdash; so you can see what this could look like before a line of production code is written. These are directional, not final, but they&apos;ll give the vision real shape.
            </p>
          </div>

          <div className="stand-phase">
            <div className="stand-phase-number">Phase 2</div>
            <div className="stand-phase-name">Design Systems + Architecture</div>
            <p>
              David sets up the technical foundation: Supabase schema, auth, deployment pipeline, production infrastructure, data security. COPPA and payments are lightweight placeholders &mdash; the focus is getting every other service production-ready. In parallel, I build the design system &mdash; typography, color, components, animation patterns &mdash; informed by your brand assets.
            </p>
          </div>

          <div className="stand-phase">
            <div className="stand-phase-number">Phase 3</div>
            <div className="stand-phase-name">Product Engineering</div>
            <p>
              The build. The 6 onboarding moments come to life, the marketplace and storefront take shape as showcase experiences, and the CEO dashboard gets built. Daily progress &mdash; you&apos;ll see things moving. I&apos;ll share builds frequently so we&apos;re never more than a day away from course-correcting.
            </p>
          </div>

          <div className="stand-phase">
            <div className="stand-phase-number">Phase 4</div>
            <div className="stand-phase-name">Polish + Ship</div>
            <p>
              The difference between &ldquo;works&rdquo; and &ldquo;wow.&rdquo; Animations, transitions, micro-interactions, the Grand Reveal moment. Then: production deployment, testing with real families, and the pilot begins.
            </p>
          </div>
        </Section>

        <NotchReveal compact />

        {/* IV. Sprint Milestones */}
        <Section id="sprint" number="IV" title="Sprint Milestones" open={openSections.sprint} onToggle={() => toggleSection('sprint')}>
          <p>
            This sprint is milestone-driven. Every few days, something concrete is done and approved. If we&apos;re off track, we know by day 3, not day 14.
          </p>

          <div className="stand-sprint-milestone">
            <div className="stand-sprint-milestone-header">
              <div className="stand-sprint-milestone-day">Pre-Sprint</div>
              <div className="stand-sprint-milestone-name">Assets &amp; Materials Intake</div>
            </div>
            <p>95% of brand assets, Figma files, visual inspiration, and intake questionnaire delivered. High-fidelity concept mockups shared back for alignment. We don&apos;t start the clock until this is locked.</p>
          </div>

          <div className="stand-sprint-milestone">
            <div className="stand-sprint-milestone-header">
              <div className="stand-sprint-milestone-day">Days 1&ndash;2</div>
              <div className="stand-sprint-milestone-name">Design System v1 Approved</div>
            </div>
            <p>Typography, color system, component library, and animation patterns locked. This is what ships with the pilot &mdash; we&apos;ll have a separate polish pass at the end, but the foundation is set.</p>
          </div>

          <div className="stand-sprint-milestone">
            <div className="stand-sprint-milestone-header">
              <div className="stand-sprint-milestone-day">Days 1&ndash;2</div>
              <div className="stand-sprint-milestone-name">System Architecture Live</div>
            </div>
            <p>Supabase schema, auth, data security, deployment pipeline &mdash; all hooked up and configured. David&apos;s work is done. The infrastructure is production-ready and I&apos;m building on solid ground.</p>
          </div>

          <div className="stand-sprint-milestone">
            <div className="stand-sprint-milestone-header">
              <div className="stand-sprint-milestone-day">Day 7</div>
              <div className="stand-sprint-milestone-name">End of Week 1 &mdash; The Hero Feature</div>
            </div>
            <p>A kid can go through the full Stand Coach onboarding and have a branded business with products, a name, and a goal. The Grand Reveal moment works. A parent can approve it. The core experience is real.</p>
          </div>

          <div className="stand-sprint-milestone">
            <div className="stand-sprint-milestone-header">
              <div className="stand-sprint-milestone-day">Day 11</div>
              <div className="stand-sprint-milestone-name">Marketplace, Storefront &amp; Dashboard</div>
            </div>
            <p>CEO Dashboard with goal tracking and shareable storefront. Product marketplace as a curated showcase &mdash; branded mockups, pricing, product listings. These are high-quality landing pages for the pilot, not full e-commerce. Making them transactional is its own sprint.</p>
          </div>

          <div className="stand-sprint-milestone">
            <div className="stand-sprint-milestone-header">
              <div className="stand-sprint-milestone-day">Day 14</div>
              <div className="stand-sprint-milestone-name">Ship</div>
            </div>
            <p>Polish pass complete &mdash; animations, transitions, responsive QA. Production deployment on Vercel. Stand is live. 100&ndash;200 families can onboard, build their business, and share it with their parents. Ready for the pilot.</p>
          </div>
        </Section>

        <NotchReveal compact />

        {/* V. What You'll Have */}
        <Section id="deliverables" number="V" title="What You&rsquo;ll Have" open={openSections.deliverables} onToggle={() => toggleSection('deliverables')}>
          <p>At the end of this sprint:</p>
          <ul className="stand-checklist">
            <li><strong>A production app</strong> deployed on Vercel, installable as a PWA (works like a native app on iPad/phone)</li>
            <li><strong>The Stand Coach onboarding</strong> &mdash; conversational, voice-enabled, two-pane, with the Grand Reveal</li>
            <li><strong>Product marketplace &amp; storefront</strong> &mdash; high-quality showcase pages with curated catalog, branded mockups, and shareable links. Functional e-commerce (cart, checkout, fulfillment) is a separate sprint.</li>
            <li><strong>CEO Dashboard</strong> &mdash; the kid&apos;s home base with goal tracking, sales view, and quick actions</li>
            <li><strong>Barebones parent touchpoints</strong> &mdash; approval flow and a share-to-parent experience from the kid&apos;s dashboard. A full parent backend comes post-pilot.</li>
            <li><strong>A design system</strong> &mdash; not just a pretty app, but a system that scales. Typography, color, components, animation patterns.</li>
            <li><strong>A Supabase backend</strong> with auth, database, storage &mdash; architected by David for production-quality data security and scale. COPPA and payments are stubbed for the pilot; everything else is wired up for real.</li>
            <li><strong>Testing infrastructure</strong> ready for your first 100+ family pilot</li>
            <li><strong>Documentation</strong> &mdash; what was built, how it works, how to iterate on it</li>
          </ul>
        </Section>

        <NotchReveal compact />

        {/* VI. Investment */}
        <Section id="investment" number="VI" title="Investment" open={openSections.investment} onToggle={() => toggleSection('investment')}>
          <div className="stand-price">
            <div className="stand-price-amount">$9,000</div>
            <div className="stand-price-label">2-week all-out sprint</div>
          </div>

          <div className="stand-investment-split">
            <div className="stand-investment-card">
              <div className="stand-investment-card-header">
                <div className="stand-investment-card-name">Andy Santamaria</div>
                <div className="stand-investment-card-role">Product Engineering</div>
              </div>
              <div className="stand-investment-card-amount">$7,500</div>
              <div className="stand-investment-card-hours">~80 hours &middot; 2 weeks full-time</div>
              <ul className="stand-investment-card-list">
                <li>Design system &amp; brand implementation</li>
                <li>Stand Coach onboarding experience</li>
                <li>Product marketplace &amp; storefronts</li>
                <li>CEO Dashboard &amp; kid experience</li>
                <li>Animations, polish &amp; responsive QA</li>
                <li>Testing &amp; production deployment</li>
              </ul>
            </div>
            <div className="stand-investment-card">
              <div className="stand-investment-card-header">
                <div className="stand-investment-card-name">David Shimel</div>
                <div className="stand-investment-card-role">System Architecture</div>
              </div>
              <div className="stand-investment-card-amount">$1,500</div>
              <div className="stand-investment-card-hours">5 hours &middot; capped</div>
              <ul className="stand-investment-card-list">
                <li>Supabase schema &amp; database design</li>
                <li>Auth &amp; data security</li>
                <li>Production infrastructure</li>
                <li>Deployment pipeline</li>
              </ul>
              <div className="stand-investment-card-note">
                COPPA &amp; payments scoped to placeholders &mdash; David&apos;s time is focused purely on getting the core infrastructure production-ready.
              </div>
            </div>
          </div>

          <p>
            Alignment sessions are waived. I&apos;m clearing the calendar &mdash; 40 hours a week, fully dedicated to Stand. You&apos;ll see daily progress and have something shippable at the end.
          </p>

          <h4>What&apos;s Not Included (Yet)</h4>
          <ul className="stand-checklist">
            <li><strong>Full COPPA compliance</strong> &mdash; placeholder consent flows for the pilot. We&apos;ll harden these before public launch, but the pilot doesn&apos;t need the full regulatory stack</li>
            <li><strong>Payment processing</strong> &mdash; the UX will be designed and built. Payments are stubbed for the pilot (manual invoicing or simple checkout). Real money movement comes post-pilot.</li>
            <li><strong>Printify/fulfillment integration</strong> &mdash; the marketplace UX will be production-grade, but actual order fulfillment may be semi-manual for the pilot</li>
            <li><strong>AI image generation for logos</strong> &mdash; product mockups use templates with dynamic overlays (brand colors, names), not AI-generated images</li>
            <li><strong>Social features</strong> (Stand Squad, leaderboards, friends) &mdash; designed into the architecture but not built in Sprint 1</li>
          </ul>
        </Section>

        <NotchReveal compact />

        {/* VII. What I Need From You */}
        <Section id="from-you" number="VII" title="What I Need From You" open={openSections['from-you']} onToggle={() => toggleSection('from-you')}>
          <p>To hit the ground running:</p>

          <h4>Before Day 1</h4>
          <ul className="stand-checklist">
            <li className="stand-checklist-done"><strong>Signed NDA</strong> &mdash; done</li>
            <li><strong>Brand assets</strong> &mdash; Figma files, mood boards, color palettes, typography preferences</li>
            <li><strong>Google Drive access</strong> &mdash; pilot milestones doc, any other planning materials</li>
            <li><strong>GitHub repo access</strong> &mdash; transfer from Chris or grant read access so I can evaluate what&apos;s reusable</li>
            <li><strong>Intake questionnaire</strong> &mdash; the form at <a href="/stand/intake">andy.ws/stand/intake</a>, takes ~15 minutes</li>
            <li><strong>Test family profiles</strong> &mdash; names, ages, interests of the kids who&apos;ll be in the pilot. The sooner we have these, the more we can tailor the experience to real kids. Even 5&ndash;10 profiles will shape how we build.</li>
          </ul>

          <h4>You Own</h4>
          <ul className="stand-checklist">
            <li><strong>Customer acquisition</strong> &mdash; recruiting and managing the pilot families is on you. I&apos;ll build the product they fall in love with, but you need to get them in the door.</li>
          </ul>

          <h4>During the Sprint</h4>
          <ul className="stand-checklist">
            <li><strong>30 minutes daily</strong> &mdash; async check-in (Slack or text), plus a quick call 2&ndash;3x per week</li>
            <li><strong>Product decisions</strong> &mdash; I&apos;ll flag choices as they come up. Quick responses keep the sprint moving.</li>
            <li><strong>2&ndash;3 test families</strong> by end of Week 1 &mdash; even friends/family who can do a walkthrough</li>
          </ul>

          <h4>Decisions to Lock Before Day 1</h4>
          <p>These directly affect how we build. The faster they&apos;re locked, the less rework.</p>
          <ol className="stand-decisions">
            <li><strong>What types of businesses can kids start?</strong> &mdash; This is the big one. Are all businesses selling physical goods (t-shirts, bracelets, stickers)? What if a kid wants to run a services business &mdash; dog walking, tutoring, yard work? What about digital products &mdash; a calendar app, an interactive journal, a game? We probably scope the pilot to physical goods, but we need to decide explicitly so the onboarding, marketplace, and storefront are designed around the right model.</li>
            <li><strong>Starting product catalog</strong> &mdash; which 4&ndash;6 specific product categories do we launch with? The test family profiles will help inform this.</li>
            <li><strong>Primary age cohort</strong> &mdash; 8&ndash;11 or 12&ndash;15? We&apos;ll design the experience for one cohort and ship it to both for testing, then iterate based on feedback. But we need a primary focus so the tone, complexity, and product options are dialed in.</li>
            <li><strong>Voice input priority</strong> &mdash; must-have for pilot, or nice-to-have?</li>
            <li><strong>Storefront sharing</strong> &mdash; public links, or invite-only for the pilot?</li>
          </ol>

          <p className="stand-decisions-note">
            These are the pre-sprint blockers. Dozens more decisions will come up during the build &mdash; brand customization, sharing mechanics, notification preferences, goal types, product imagery. I&apos;ll flag them as they arise and we&apos;ll make fast calls together. Content moderation is something we&apos;re consciously skipping for the pilot since we&apos;ll know most of the families, but it&apos;s on the list for general availability.
          </p>
        </Section>

        <NotchReveal compact />

        {/* VIII. After the Sprint */}
        <Section id="after" number="VIII" title="After the Sprint" open={openSections.after} onToggle={() => toggleSection('after')}>
          <p>The sprint gets Stand to &ldquo;shippable pilot.&rdquo; What comes next:</p>
          <ul className="stand-checklist">
            <li><strong>Pilot feedback loop</strong> (Weeks 3&ndash;4) &mdash; Testing parties, user sessions, async feedback. Real data from real families.</li>
            <li><strong>Iteration sprint</strong> &mdash; Based on pilot data, we prioritize what to build/fix/cut. Could be another 2-week sprint or an ongoing rhythm.</li>
            <li><strong>Parent backend</strong> &mdash; Full parent dashboard with 2FA login, order management, progress views, and spending controls. The &ldquo;flip to parent view&rdquo; experience.</li>
            <li><strong>Social features</strong> &mdash; Stand Squad, leaderboards, friend invites. The retention/viral layer.</li>
            <li><strong>COPPA + payment rails</strong> &mdash; Full regulatory compliance and Stripe integration, parent-controlled wallets, real money movement.</li>
            <li><strong>Founding engineer hire</strong> &mdash; Once validated, I help you hire your first full-time engineer and hand off a clean, well-documented codebase.</li>
          </ul>
        </Section>

        {/* Closing note */}
        <div className="stand-note">
          <div className="stand-note-label">The Bottom Line</div>
          <p>
            You told me you want something kids feel like they&apos;re a part of, that feels cool and relevant, without being so heavy-handed that it takes away from their brand, their experience, their business. You want something that isn&apos;t &ldquo;vibe coded.&rdquo;
          </p>
          <p>
            In two weeks, you&apos;ll have something with soul &mdash; something you can ship to a hundred families that you&apos;re proud of. Not a prototype. Not a demo. A real product that will engage and inspire kids to become entrepreneurs.
          </p>
          <div className="stand-note-signature">
            &mdash;Andy<span className="stand-note-cursor" />
          </div>
        </div>

        <Link href="/stand/intake" className="stand-link" style={{ marginTop: 24 }}>
          Fill out the intake questionnaire <span className="stand-link-arrow">&rarr;</span>
        </Link>

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
