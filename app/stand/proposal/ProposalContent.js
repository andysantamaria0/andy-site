'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import NotchReveal from '../../../components/NotchReveal';

const SECTIONS = [
  { id: 'basecamp', number: 'I', label: 'Basecamp' },
  { id: 'building', number: 'II', label: 'Building' },
  { id: 'promise', number: 'III', label: 'Promise' },
  { id: 'approach', number: 'IV', label: 'Approach' },
  { id: 'sprint', number: 'V', label: 'Sprint' },
  { id: 'deliverables', number: 'VI', label: 'Deliverables' },
  { id: 'investment', number: 'VII', label: 'Investment' },
  { id: 'from-you', number: 'VIII', label: 'From You' },
  { id: 'after', number: 'IX', label: 'After' },
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
  const [activeId, setActiveId] = useState('basecamp');
  const [openSections, setOpenSections] = useState({ basecamp: true });
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

        {/* I. Basecamp */}
        <Section id="basecamp" number="I" title="Basecamp" open={openSections.basecamp} onToggle={() => toggleSection('basecamp')}>
          <p>
            You&apos;ve done the hard parts. You&apos;ve raised capital, built a prototype, figured out who your customers are, and know what you want Stand to feel like. What&apos;s missing is the bridge between the vision in your head and a product that 100+ families can actually use &mdash; something that looks incredible, feels magical for kids, and makes parents say &ldquo;holy shit, this is legit.&rdquo;
          </p>
          <p>
            That&apos;s what this sprint is.
          </p>
        </Section>

        <NotchReveal compact />

        {/* II. What We're Building */}
        <Section id="building" number="II" title="What We&rsquo;re Building" open={openSections.building} onToggle={() => toggleSection('building')}>
          <p>
            A production-quality MVP of Stand that delivers on the core promise: <strong>a kid opens the app, and within minutes, they have a real business &mdash; branded, stocked, and ready to sell.</strong> A parent opens the app, and they see a tool that&apos;s safe, beautiful, and genuinely teaching their kid something.
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
              The kid&apos;s home base after onboarding: a CEO Dashboard with goal tracking and sales, a shareable storefront (the viral loop), and quick actions to keep them coming back. The parent gets a parallel view: progress, order management, and tools to handle money responsibly.
            </p>
          </div>

          <h4>The 6 Moments</h4>

          <div className="stand-moment">
            <span className="stand-moment-number">1</span>
            <span className="stand-moment-body"><strong>&ldquo;What do you want to be called?&rdquo;</strong> &mdash; CEO alias + avatar (fun AND COPPA-friendly)</span>
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

        {/* III. The Promise Delivery */}
        <Section id="promise" number="III" title="The Promise Delivery" open={openSections.promise} onToggle={() => toggleSection('promise')}>
          <p>
            From the pitch page: <em>the moment the customer gets what they came for.</em>
          </p>
          <p>
            <strong>For the kid:</strong> The moment the right pane is fully built and the coach says something like &ldquo;CEO Q-Money, welcome to Quincy&apos;s Charm Co.&rdquo; &mdash; and they&apos;re looking at THEIR storefront, THEIR products, THEIR brand. They built it. Every piece was their decision. That moment needs to hit.
          </p>
          <p>
            <strong>For the parent:</strong> The moment they see their kid&apos;s eyes light up. And then, practically: the moment they see a well-designed, safe, educational tool that they trust. Not &ldquo;vibe coded.&rdquo; Not &ldquo;AI-y.&rdquo; Something that feels considered, intentional, and real.
          </p>
        </Section>

        <NotchReveal compact />

        {/* IV. The Approach */}
        <Section id="approach" number="IV" title="The Approach" open={openSections.approach} onToggle={() => toggleSection('approach')}>
          <p>
            This builds on the phases outlined in the original pitch, compressed into a focused sprint:
          </p>

          <div className="stand-phase">
            <div className="stand-phase-number">Phase 1</div>
            <div className="stand-phase-name">Alignment (Already Underway)</div>
            <p>
              Roles clear, expectations set, highest-level goals illuminated. We&apos;ve done two calls. This proposal formalizes the rest. The intake questionnaire gives us the remaining detail to lock scope.
            </p>
          </div>

          <div className="stand-phase">
            <div className="stand-phase-number">Phase 2</div>
            <div className="stand-phase-name">Design Systems + Architecture (Days 1&ndash;2)</div>
            <p>
              David Shimel sets up the technical foundation: Supabase schema, auth flows (COPPA-compliant), deployment pipeline. In parallel, I build the design system &mdash; typography, color system, component library, animation patterns. Informed by your brand assets and Figma files.
            </p>
          </div>

          <div className="stand-phase">
            <div className="stand-phase-number">Phase 3</div>
            <div className="stand-phase-name">Product Engineering (Days 3&ndash;10)</div>
            <p>
              The build. This is where the 6 moments come to life, the marketplace takes shape, and the dashboard gets built. Daily progress &mdash; you&apos;ll see things moving. I&apos;ll share builds frequently so we&apos;re never more than a day away from course-correcting.
            </p>
          </div>

          <div className="stand-phase">
            <div className="stand-phase-number">Phase 4</div>
            <div className="stand-phase-name">Front-End Interactive + Polish (Days 11&ndash;13)</div>
            <p>
              The difference between &ldquo;works&rdquo; and &ldquo;wow.&rdquo; Animations, transitions, micro-interactions, responsive refinement, the Grand Reveal moment. This is where kids go from &ldquo;this is cool&rdquo; to &ldquo;this is MINE.&rdquo;
            </p>
          </div>

          <div className="stand-phase">
            <div className="stand-phase-number">Phase 5</div>
            <div className="stand-phase-name">Live + Testing (Day 14 onward)</div>
            <p>
              Ship to your first cohort. Testing parties &mdash; intense, in-person sessions if possible, remote if not. Real kids, real parents, real feedback. The pilot begins.
            </p>
          </div>
        </Section>

        <NotchReveal compact />

        {/* V. Sprint Plan */}
        <Section id="sprint" number="V" title="Sprint Plan &mdash; 2 Weeks" open={openSections.sprint} onToggle={() => toggleSection('sprint')}>
          <h4>Week 1: Foundation + The Hero Feature</h4>
          <div className="stand-table-wrapper">
            <table className="stand-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Focus</th>
                  <th style={{ textAlign: 'left' }}>Deliverable</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>Architecture + design system</td>
                  <td style={{ textAlign: 'left' }}>Supabase schema, auth, deployment pipeline, brand tokens</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>Design system + onboarding shell</td>
                  <td style={{ textAlign: 'left' }}>Typography, colors, layout system, two-pane scaffold</td>
                </tr>
                <tr>
                  <td>3</td>
                  <td>Stand Coach &mdash; Moments 1&ndash;3</td>
                  <td style={{ textAlign: 'left' }}>Alias/avatar, interest input, AI product suggestions</td>
                </tr>
                <tr>
                  <td>4</td>
                  <td>Stand Coach &mdash; Moments 4&ndash;6</td>
                  <td style={{ textAlign: 'left' }}>Vibe selection, business naming, goal setting</td>
                </tr>
                <tr>
                  <td>5</td>
                  <td>The Live Build pane</td>
                  <td style={{ textAlign: 'left' }}>Real-time preview &mdash; every input updates the storefront</td>
                </tr>
                <tr>
                  <td>6</td>
                  <td>Grand Reveal + parent flow</td>
                  <td style={{ textAlign: 'left' }}>Reveal animations, COPPA consent, parent approval</td>
                </tr>
                <tr>
                  <td>7</td>
                  <td>Voice input + integration</td>
                  <td style={{ textAlign: 'left' }}>Whisper API, voice-to-text in the coach conversation</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="stand-milestone">
            <div className="stand-milestone-label">Milestone &mdash; End of Week 1</div>
            <p>A kid can go through the full onboarding journey and have a branded business with products, a name, and a goal. The reveal moment works. A parent can approve it.</p>
          </div>

          <h4>Week 2: Marketplace + Dashboard + Ship</h4>
          <div className="stand-table-wrapper">
            <table className="stand-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Focus</th>
                  <th style={{ textAlign: 'left' }}>Deliverable</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>8</td>
                  <td>Product marketplace</td>
                  <td style={{ textAlign: 'left' }}>Curated catalog, branded mockups, pricing display</td>
                </tr>
                <tr>
                  <td>9</td>
                  <td>Storefront</td>
                  <td style={{ textAlign: 'left' }}>Shareable link, branded layout, product listings, buy flow</td>
                </tr>
                <tr>
                  <td>10</td>
                  <td>CEO Dashboard</td>
                  <td style={{ textAlign: 'left' }}>Goal tracker, sales/earnings, quick actions</td>
                </tr>
                <tr>
                  <td>11</td>
                  <td>Parent experience</td>
                  <td style={{ textAlign: 'left' }}>Parent dashboard, order management, kid progress view</td>
                </tr>
                <tr>
                  <td>12</td>
                  <td>Polish + animations</td>
                  <td style={{ textAlign: 'left' }}>Micro-interactions, loading states, transitions, responsive QA</td>
                </tr>
                <tr>
                  <td>13</td>
                  <td>Testing + bug fixes</td>
                  <td style={{ textAlign: 'left' }}>End-to-end testing, edge cases, performance, mobile/tablet QA</td>
                </tr>
                <tr>
                  <td>14</td>
                  <td>Deploy + handoff</td>
                  <td style={{ textAlign: 'left' }}>Production deployment, pilot plan, documentation</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="stand-milestone">
            <div className="stand-milestone-label">Milestone &mdash; End of Week 2</div>
            <p>Stand is live. 100&ndash;200 families can onboard, build their business, share their storefront, and start selling. Production-grade. Ready for the pilot.</p>
          </div>
        </Section>

        <NotchReveal compact />

        {/* VI. What You'll Have */}
        <Section id="deliverables" number="VI" title="What You&rsquo;ll Have" open={openSections.deliverables} onToggle={() => toggleSection('deliverables')}>
          <p>At the end of this sprint:</p>
          <ul className="stand-checklist">
            <li><strong>A production app</strong> deployed on Vercel, installable as a PWA (works like a native app on iPad/phone)</li>
            <li><strong>The Stand Coach onboarding</strong> &mdash; conversational, voice-enabled, two-pane, with the Grand Reveal</li>
            <li><strong>A curated product marketplace</strong> with branded mockups and real fulfillment paths</li>
            <li><strong>CEO dashboards for kids</strong> with goal tracking and shareable storefronts</li>
            <li><strong>A parent experience</strong> with COPPA-compliant consent, progress views, and order management</li>
            <li><strong>A design system</strong> &mdash; not just a pretty app, but a system that scales. Typography, color, components, animation patterns.</li>
            <li><strong>A Supabase backend</strong> with auth, database, storage &mdash; architected by David for security and scale</li>
            <li><strong>Testing infrastructure</strong> ready for your first 100+ family pilot</li>
            <li><strong>Documentation</strong> &mdash; what was built, how it works, how to iterate on it</li>
          </ul>
        </Section>

        <NotchReveal compact />

        {/* VII. Investment */}
        <Section id="investment" number="VII" title="Investment" open={openSections.investment} onToggle={() => toggleSection('investment')}>
          <div className="stand-price">
            <div className="stand-price-amount">$7,500 flat</div>
            <div className="stand-price-label">2-week all-out sprint</div>
          </div>

          <p>
            That covers ~80 hours of product engineering from me &mdash; design, code, architecture, testing, deployment &mdash; plus David Shimel&apos;s system architecture work upfront (auth, database schema, security guardrails, deployment pipeline). Alignment sessions are waived.
          </p>
          <p>
            I&apos;m clearing the calendar. 40 hours a week, fully dedicated to Stand. You&apos;ll see daily progress and have something shippable at the end.
          </p>

          <h4>What&apos;s Not Included (Yet)</h4>
          <ul className="stand-checklist">
            <li><strong>Printify/fulfillment integration</strong> &mdash; the marketplace UX will be production-grade, but actual order fulfillment may be semi-manual for the pilot</li>
            <li><strong>Payment processing</strong> &mdash; the UX will be designed and built. For the pilot, actual money movement can go through simple Stripe checkout or manual invoicing</li>
            <li><strong>AI image generation for logos</strong> &mdash; product mockups use templates with dynamic overlays (brand colors, names), not AI-generated images</li>
            <li><strong>Social features</strong> (Stand Squad, leaderboards, friends) &mdash; designed into the architecture but not built in Sprint 1</li>
          </ul>
        </Section>

        <NotchReveal compact />

        {/* VIII. What I Need From You */}
        <Section id="from-you" number="VIII" title="What I Need From You" open={openSections['from-you']} onToggle={() => toggleSection('from-you')}>
          <p>To hit the ground running:</p>

          <h4>Before Day 1</h4>
          <ul className="stand-checklist">
            <li><strong>Signed NDA</strong> &mdash; so you can share everything freely</li>
            <li><strong>Brand assets</strong> &mdash; Figma files, mood boards, color palettes, typography preferences</li>
            <li><strong>Google Drive access</strong> &mdash; pilot milestones doc, any other planning materials</li>
            <li><strong>GitHub repo access</strong> &mdash; transfer from Chris or grant read access so I can evaluate what&apos;s reusable</li>
            <li><strong>Intake questionnaire</strong> &mdash; the form at <a href="/stand/intake">andy.ws/stand/intake</a>, takes ~15 minutes</li>
          </ul>

          <h4>During the Sprint</h4>
          <ul className="stand-checklist">
            <li><strong>30 minutes daily</strong> &mdash; async check-in (Slack or text), plus a quick call 2&ndash;3x per week</li>
            <li><strong>Product decisions</strong> &mdash; I&apos;ll flag choices as they come up. Quick responses keep the sprint moving.</li>
            <li><strong>2&ndash;3 test families</strong> by end of Week 1 &mdash; even friends/family who can do a walkthrough</li>
          </ul>

          <h4>Your Decisions to Make</h4>
          <ol className="stand-decisions">
            <li><strong>Starting product catalog</strong> &mdash; which 4&ndash;6 business types do we launch with?</li>
            <li><strong>Voice input priority</strong> &mdash; must-have for pilot, or nice-to-have?</li>
            <li><strong>Payment for pilot</strong> &mdash; are families paying real money, or is the pilot free with simulated transactions?</li>
            <li><strong>Storefront sharing</strong> &mdash; public links, or invite-only for the pilot?</li>
          </ol>
        </Section>

        <NotchReveal compact />

        {/* IX. After the Sprint */}
        <Section id="after" number="IX" title="After the Sprint" open={openSections.after} onToggle={() => toggleSection('after')}>
          <p>The sprint gets Stand to &ldquo;shippable pilot.&rdquo; What comes next:</p>
          <ul className="stand-checklist">
            <li><strong>Pilot feedback loop</strong> (Weeks 3&ndash;4) &mdash; Testing parties, user sessions, async feedback. Real data from real families.</li>
            <li><strong>Iteration sprint</strong> &mdash; Based on pilot data, we prioritize what to build/fix/cut. Could be another 2-week sprint or an ongoing rhythm.</li>
            <li><strong>Social features</strong> &mdash; Stand Squad, leaderboards, friend invites. The retention/viral layer.</li>
            <li><strong>Full payment rails</strong> &mdash; Stripe integration, parent-controlled wallets, real money movement.</li>
            <li><strong>Founding engineer hire</strong> &mdash; Once validated, I help you hire your first full-time engineer and hand off a clean, well-documented codebase.</li>
          </ul>
        </Section>

        {/* Closing note */}
        <div className="stand-note">
          <div className="stand-note-label">The Bottom Line</div>
          <p>
            You told me you want something kids feel like they&apos;re a part of, that feels cool and relevant, without being so heavy-handed that it takes away from their brand, their experience, their business. You want something that isn&apos;t &ldquo;vibe coded&rdquo; &mdash; something with real soul.
          </p>
          <p>
            I can promise you that in two weeks, you&apos;ll have something you can ship to a hundred families that you&apos;re proud of. Not a prototype. Not a demo. A real product that real kids will use to start real businesses.
          </p>
          <p>
            Let&apos;s build it.
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
