'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import NotchReveal from '../../../components/NotchReveal';

const SECTIONS = [
  { id: 'basecamp', number: '', label: 'Basecamp' },
  { id: 'research', number: 'I', label: 'Research' },
  { id: 'building', number: 'II', label: 'Building' },
  { id: 'promise', number: 'III', label: 'Promise' },
  { id: 'approach', number: 'IV', label: 'Approach' },
  { id: 'sprint', number: 'V', label: 'Sprint Plan' },
  { id: 'deliverables', number: 'VI', label: 'Deliverables' },
  { id: 'infra', number: 'VII', label: 'Infra' },
  { id: 'investment', number: 'VIII', label: 'Investment' },
  { id: 'from-you', number: 'IX', label: 'From You' },
  { id: 'after', number: 'X', label: 'After' },
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
              {number && <span className="stand-nav-tab-num">{number}</span>}
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

        {/* Basecamp */}
        <Section id="basecamp" number="" title="Basecamp" open={openSections.basecamp} onToggle={() => toggleSection('basecamp')}>
          <p>
            You&apos;ve already done a lot. You&apos;ve raised capital, built a prototype, ran a physical beta, interviewed kids and parents, surveyed families, and know what you want Stand to feel like. What&apos;s missing is the bridge between the vision in your head and a product that 100+ families can actually use. Something with Soul.
          </p>
          <p>
            That&apos;s what this sprint is.
          </p>
          <p>
            To kick off this first sprint I want to aim high. Together, I want us to validate onboarding when we hear kids can&apos;t stop talking about Stand. Same goes for pricing, when parents see how polished it is there&apos;s no question they&apos;d pay for it.
          </p>
          <p>
            The product is the research that gets us the data and the conviction to get to the next stage of the business.
          </p>
        </Section>

        <NotchReveal compact />

        {/* I. What We Already Know */}
        <Section id="research" number="I" title="What We Already Know" open={openSections.research} onToggle={() => toggleSection('research')}>
          <p>
            Before we build, here&apos;s what your existing research tells us. These aren&apos;t open questions anymore:
          </p>

          <div className="stand-finding-block">
            <div className="stand-finding-block-name">Business categories (top 4 for pilot)</div>
            <p>
              Your interviews and survey converge on the same answer. Crafts/jewelry (Azzy, Ripley), food/treats (Arlo, Dash, survey at 17%), personal care/beauty (Azzy, Dash, survey at 12%), and services (Azzy babysits, Ripley wants to teach gymnastics). The survey skewed toward educational toys (29%) and craft/DIY (20%) &mdash; but the kid interviews tell a richer story.
            </p>
          </div>

          <div className="stand-finding-block">
            <div className="stand-finding-block-name">This is not all e-commerce</div>
            <p>
              Your original pitch includes pet-sitting, tutoring, and babysitting kits. Ripley wants to &ldquo;sell leotards and teach lessons.&rdquo; Azzy already babysits. The product needs to handle both: physical goods (bracelets, cookies, custom merch) AND services (dog walking, tutoring, teaching). For the pilot, this means the onboarding and storefront need two paths &mdash; a product preview for e-commerce businesses, and a service card/booking preview for service businesses.
            </p>
          </div>

          <div className="stand-finding-block">
            <div className="stand-finding-block-name">Pricing</div>
            <p>
              65% of surveyed parents will pay $25+. 35% will pay $36+. Celestine (Ripley&apos;s mom) said &ldquo;$25 or more I start to pay attention.&rdquo; Max and Arlo guessed $20&ndash;30/month. The sweet spot is $25&ndash;35/month.
            </p>
          </div>

          <div className="stand-finding-block">
            <div className="stand-finding-block-name">What motivates kids</div>
            <p>
              Money first, then accomplishment/goals, then friends. Consistent across every interview. Ripley: &ldquo;I don&apos;t really care about what I&apos;m selling, just that I am selling something to make money.&rdquo; Leveling up and unlocking tiers came up unprompted in every conversation.
            </p>
          </div>

          <div className="stand-finding-block">
            <div className="stand-finding-block-name">What parents want</div>
            <p>
              Financial literacy (71%), confidence/social skills (67%), earning potential (53%). Top features: structured curriculum (60%), tracking platform (52%), parent oversight (51%). Time commitment: 5 min/day max (Simone), 1&ndash;2 hours/week (45% of survey).
            </p>
          </div>

          <div className="stand-finding-block">
            <div className="stand-finding-block-name">Target cohorts</div>
            <p>
              8&ndash;11 and 11&ndash;14. The 11-year-old demo (Arlo, Ripley, Azzy) is the sweet spot &mdash; old enough to be self-directed, young enough to be genuinely excited.
            </p>
          </div>

          <div className="stand-finding-block">
            <div className="stand-finding-block-name">Platform</div>
            <p>
              Mobile-first, iPad is a must. 64% of survey respondents are on iOS.
            </p>
          </div>
        </Section>

        <NotchReveal compact />

        {/* II. What We're Building */}
        <Section id="building" number="II" title="What We&rsquo;re Building" open={openSections.building} onToggle={() => toggleSection('building')}>
          <p>
            A production-quality MVP of Stand that delivers on the core promise: <strong>a kid opens the app, and within minutes, they have a real business &mdash; branded and ready to share.</strong> A parent opens the app, and they see a tool that&apos;s safe, beautiful, and genuinely teaching their kid something. And because the whole thing is instrumented, you get every data point you asked for &mdash; funnel completion, drop-off points, category demand, parent sentiment &mdash; without needing a separate survey.
          </p>

          <h4>The Five Deliverables</h4>

          <div className="stand-feature-block">
            <div className="stand-feature-block-name">1. Onboarding &mdash; The Stand Coach Experience</div>
            <p>
              This is the hero. The thing that makes Stand feel like nothing else.
            </p>
            <p>
              Instead of the current 14-step form journey, we&apos;re building a <strong>conversational, two-pane interface</strong> where kids collaborate with a Stand Coach to build their business in real time:
            </p>
            <ul>
              <li><strong>Left pane:</strong> The conversation. The coach asks questions, reacts, encourages. Kids can type or talk (voice-first on iPad). It adapts to their energy. It feels like brainstorming with a creative partner, not answering a questionnaire.</li>
              <li><strong>Right pane:</strong> The live build. Every answer immediately renders into something visual. Kid says &ldquo;I want to sell bracelets&rdquo; &rarr; a bracelet mockup appears. They pick a vibe &rarr; the whole brand recolors. They name their business &rarr; the storefront header updates. By the end, the right pane IS their business. The reveal isn&apos;t a surprise at the end &mdash; it&apos;s been building the whole time.</li>
            </ul>
          </div>

          <div className="stand-feature-block">
            <div className="stand-feature-block-name">2. The Grand Reveal + Shareable Brand Card</div>
            <p>
              The reveal moment needs to hit. When the coach says &ldquo;CEO Q-Money, welcome to Quincy&apos;s Charm Co.&rdquo; &mdash; the kid is looking at THEIR storefront, THEIR products, THEIR brand. Every piece was their decision. It&apos;s theirs.
            </p>
            <p>
              The output is a <strong>shareable brand card</strong> &mdash; a beautiful, branded image/link the kid can text to friends, family, anyone. &ldquo;Check out my business!&rdquo; This is the viral loop. This is also what makes the pilot spread beyond the initial 100 families organically. For product businesses, it shows their products with their branding applied. For service businesses, it shows their service offering with their branding, rate, and how to get in touch.
            </p>
          </div>

          <div className="stand-feature-block">
            <div className="stand-feature-block-name">3. Parent Gate + Pilot Survey</div>
            <p>
              COPPA-lite consent flow that doubles as your research instrument:
            </p>
            <ul>
              <li>Parent email, kid age band, optional gender, consent checkbox</li>
              <li><strong>Embedded value prop moment</strong> &mdash; the parent sees what their kid built and gets a clear, compelling pitch for Stand</li>
              <li><strong>3&ndash;4 survey questions</strong> baked into the approval flow: value prop resonance (&ldquo;which of these resonates most?&rdquo;), pricing reaction (&ldquo;what would you expect to pay?&rdquo;), biggest concern, and how they heard about Stand</li>
              <li>This replaces the need for a separate A/B landing page test &mdash; the parent gate IS the value prop test, delivered at the moment of highest engagement (right after their kid&apos;s eyes lit up)</li>
            </ul>
          </div>

          <div className="stand-feature-block">
            <div className="stand-feature-block-name">4. CEO Dashboard (Light)</div>
            <p>
              The kid&apos;s home base after onboarding:
            </p>
            <ul>
              <li><strong>Goal progress tracker</strong> &mdash; visual, animated, makes the kid feel like they&apos;re running something real</li>
              <li><strong>Share your business</strong> &mdash; one-tap sharing of their brand card</li>
              <li><strong>Post-onboarding pulse</strong> &mdash; 2&ndash;3 quick fun questions after the reveal: &ldquo;How pumped are you?&rdquo; / &ldquo;Would you show this to a friend?&rdquo; / &ldquo;What was your favorite part?&rdquo; Captures the motivation and gamification data you want without a separate survey</li>
            </ul>
            <p>
              For the pilot, the dashboard is intentionally light &mdash; the focus is on the onboarding experience and getting the reveal right. The full dashboard (sales tracking, earnings, quick actions, leveling) is Sprint 2 once we know what kids care about most.
            </p>
          </div>

          <div className="stand-feature-block">
            <div className="stand-feature-block-name">5. Pilot Admin Dashboard (For Lauren)</div>
            <p>
              A simple, private view where you can see real-time pilot data:
            </p>
            <ul>
              <li>How many kids have started / completed onboarding</li>
              <li>Where they drop off (funnel visualization)</li>
              <li>What business categories they&apos;re picking</li>
              <li>What age bands are completing vs. abandoning</li>
              <li>Parent survey responses (value prop, pricing, concerns)</li>
              <li>Kid pulse responses (excitement, favorites)</li>
              <li>Export to CSV for your investor updates and internal analysis</li>
            </ul>
            <p>
              This is your &ldquo;analytics + export access&rdquo; deliverable &mdash; but instead of a spreadsheet, it&apos;s a live dashboard you can check anytime.
            </p>
          </div>

          <h4>The 6 Moments</h4>

          <div className="stand-moment">
            <span className="stand-moment-number">1</span>
            <span className="stand-moment-body"><strong>&ldquo;What do you want to be called?&rdquo;</strong> &mdash; CEO alias + avatar (fun AND COPPA-lite &mdash; no real names collected)</span>
          </div>
          <div className="stand-moment">
            <span className="stand-moment-number">2</span>
            <span className="stand-moment-body"><strong>&ldquo;What do you love?&rdquo;</strong> &mdash; Open-ended, not a category picker. &ldquo;I love making bracelets and my dog Biscuit&rdquo; is richer than checking a box</span>
          </div>
          <div className="stand-moment">
            <span className="stand-moment-number">3</span>
            <span className="stand-moment-body"><strong>&ldquo;Here&apos;s what you could build&rdquo;</strong> &mdash; 2&ndash;3 curated suggestions based on what they said. For product businesses: visual product mockups. For service businesses: a service card preview (what you offer, your rate, how to book). Each suggestion is matched against our curated catalog.</span>
          </div>
          <div className="stand-moment">
            <span className="stand-moment-number">4</span>
            <span className="stand-moment-body"><strong>&ldquo;What&apos;s your style?&rdquo;</strong> &mdash; Pick a vibe from visual mood boards, not color pickers. Each vibe is a pre-designed brand kit that transforms the entire preview</span>
          </div>
          <div className="stand-moment">
            <span className="stand-moment-number">5</span>
            <span className="stand-moment-body"><strong>&ldquo;Name your business&rdquo;</strong> &mdash; The storefront, cards, labels all update. The business becomes real.</span>
          </div>
          <div className="stand-moment">
            <span className="stand-moment-number">6</span>
            <span className="stand-moment-body"><strong>&ldquo;Set your goal&rdquo;</strong> &mdash; What do you want to do with the money? Save / Buy Something / Give Back / Split It. How much? A goal tracker animates into the dashboard.</span>
          </div>

          <p style={{ marginTop: 20 }}>
            Pricing is handled through positioning (&ldquo;For Everyone&rdquo; / &ldquo;Sweet Spot&rdquo; / &ldquo;Extra Special&rdquo;) &mdash; the app calculates the actual price backward from their goal, targeting ~10 sales as the sweet spot for engagement and learning.
          </p>

          <p>
            Every moment is instrumented with PostHog &mdash; time spent, choices made, drop-off points. You&apos;ll know exactly where kids light up and where they stall.
          </p>
        </Section>

        <NotchReveal compact />

        {/* III. The Promise Delivery */}
        <Section id="promise" number="III" title="The Promise Delivery" open={openSections.promise} onToggle={() => toggleSection('promise')}>
          <p>
            <strong>For the kid:</strong> The moment the right pane is fully built and the coach says something like &ldquo;CEO Q-Money, welcome to Quincy&apos;s Charm Co.&rdquo; &mdash; and they&apos;re looking at THEIR storefront, THEIR brand. They built it. Every piece was their decision. It&apos;s theirs. And they can share it immediately.
          </p>
          <p>
            <strong>For the parent:</strong> The moment they see their kid&apos;s eyes light up. And then, practically: the moment they see a well-designed, safe, educational tool that they trust. Not &ldquo;vibe coded.&rdquo; Not &ldquo;AI-y.&rdquo; Something that feels considered, intentional, and real.
          </p>
          <p>
            <strong>For you (Lauren):</strong> The moment you open the admin dashboard and see real families going through the experience, picking categories, completing onboarding &mdash; and the data is telling a story you can act on.
          </p>
        </Section>

        <NotchReveal compact />

        {/* IV. The Approach */}
        <Section id="approach" number="IV" title="The Approach" open={openSections.approach} onToggle={() => toggleSection('approach')}>
          <div className="stand-phase">
            <div className="stand-phase-number">Phase 1</div>
            <div className="stand-phase-name">Alignment <span className="stand-phase-complete">Complete</span></div>
            <p>
              Two calls done. Intake questionnaire received. Materials reviewed &mdash; pitch docs, kid interviews, survey results, brand assets, color palette, logos. This proposal formalizes the plan.
            </p>
          </div>

          <div className="stand-phase">
            <div className="stand-phase-number">Phase 2</div>
            <div className="stand-phase-name">Design Systems + Architecture (Days 1&ndash;2)</div>
            <p>
              David Shimel sets up the technical foundation: Supabase schema, auth flows (COPPA-lite), deployment pipeline, PostHog integration, and the architectural guardrails that let me move fast and safe for the rest of the sprint. In parallel, I build the design system &mdash; the typography, color system, component library, and animation patterns that make everything feel cohesive and elevated. Informed by your existing brand assets: Stand logos (Black, Blank Slate, Founder Red), color palette, and design references (Uncommon, Tin Can, A24, Lego &mdash; nostalgia modernized, elevated not toyish, gaming meets soul).
            </p>
          </div>

          <div className="stand-phase">
            <div className="stand-phase-number">Phase 3</div>
            <div className="stand-phase-name">Product Engineering (Days 3&ndash;10)</div>
            <p>
              The build. This is where the 6 moments come to life, the parent gate takes shape, and the dashboard gets built. Daily progress &mdash; you&apos;ll see things moving. I&apos;ll share builds frequently so we&apos;re never more than a day away from course-correcting.
            </p>
          </div>

          <div className="stand-phase">
            <div className="stand-phase-number">Phase 4</div>
            <div className="stand-phase-name">Front-End Interactive + Polish (Days 11&ndash;13)</div>
            <p>
              The difference between &ldquo;works&rdquo; and &ldquo;wow.&rdquo; Animations, transitions, micro-interactions, responsive refinement, the Grand Reveal moment. This is where the magic gets applied. This is where kids go from &ldquo;this is cool&rdquo; to &ldquo;this is MINE.&rdquo;
            </p>
          </div>

          <div className="stand-phase">
            <div className="stand-phase-number">Phase 5</div>
            <div className="stand-phase-name">Live + Testing (Day 14 onward)</div>
            <p>
              Ship to your first cohort. Testing parties &mdash; intense, in-person sessions if possible, remote if not. Real kids, real parents, real feedback. The admin dashboard is live, data is flowing. The pilot begins.
            </p>
          </div>
        </Section>

        <NotchReveal compact />

        {/* V. Sprint Plan */}
        <Section id="sprint" number="V" title="Sprint Plan &mdash; 2 Weeks" open={openSections.sprint} onToggle={() => toggleSection('sprint')}>
          <h4>Week 1: Foundation + The Hero Feature</h4>

          <div className="stand-table-wrapper">
            <table className="stand-table stand-sprint-table">
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
                  <td style={{ textAlign: 'left' }}>Supabase schema, auth, deployment pipeline, PostHog setup, brand tokens, component foundations</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>Design system + onboarding shell</td>
                  <td style={{ textAlign: 'left' }}>Typography, colors, layout system, two-pane interface scaffold, mobile/iPad responsive foundation</td>
                </tr>
                <tr>
                  <td>3</td>
                  <td>Stand Coach &mdash; Moments 1&ndash;3</td>
                  <td style={{ textAlign: 'left' }}>Alias/avatar selection, open-ended interest input, AI-powered business suggestions (products AND services)</td>
                </tr>
                <tr>
                  <td>4</td>
                  <td>Stand Coach &mdash; Moments 4&ndash;6</td>
                  <td style={{ textAlign: 'left' }}>Vibe/style selection, business naming, goal setting (save/buy/give/split)</td>
                </tr>
                <tr>
                  <td>5</td>
                  <td>The Live Build pane</td>
                  <td style={{ textAlign: 'left' }}>Real-time preview rendering &mdash; every input visually updates the brand. Product mockups for e-commerce, service cards for service businesses</td>
                </tr>
                <tr>
                  <td>6</td>
                  <td>Grand Reveal + shareable output</td>
                  <td style={{ textAlign: 'left' }}>The reveal moment (animations, transitions), shareable brand card generation</td>
                </tr>
                <tr>
                  <td>7</td>
                  <td>Parent gate + survey</td>
                  <td style={{ textAlign: 'left' }}>COPPA-lite consent flow, embedded value prop/pricing survey questions, parent approval</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="stand-milestone">
            <div className="stand-milestone-label">Milestone: End of Week 1</div>
            <p>A kid can go through the full onboarding journey and have a branded business with a name, a style, and a goal. The reveal moment works. They can share their brand card. A parent can approve it and answer survey questions in the process.</p>
          </div>

          <h4>Week 2: Dashboard + Admin + Ship</h4>

          <div className="stand-table-wrapper">
            <table className="stand-table stand-sprint-table">
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
                  <td>CEO Dashboard (light)</td>
                  <td style={{ textAlign: 'left' }}>Goal tracker, share button, post-onboarding pulse questions</td>
                </tr>
                <tr>
                  <td>9</td>
                  <td>Pilot admin dashboard</td>
                  <td style={{ textAlign: 'left' }}>Funnel visualization, category breakdown, parent survey responses, export</td>
                </tr>
                <tr>
                  <td>10</td>
                  <td>Landing page</td>
                  <td style={{ textAlign: 'left' }}>One incredible landing page &mdash; the entry point for pilot families. Clear, branded, compelling.</td>
                </tr>
                <tr>
                  <td>11</td>
                  <td>Analytics + instrumentation</td>
                  <td style={{ textAlign: 'left' }}>PostHog events on every moment, funnel tracking, session replays configured</td>
                </tr>
                <tr>
                  <td>12</td>
                  <td>Polish + animations</td>
                  <td style={{ textAlign: 'left' }}>Micro-interactions, loading states, transitions, responsive QA (mobile + iPad)</td>
                </tr>
                <tr>
                  <td>13</td>
                  <td>Testing + bug fixes</td>
                  <td style={{ textAlign: 'left' }}>End-to-end testing, edge cases, performance, mobile/tablet QA</td>
                </tr>
                <tr>
                  <td>14</td>
                  <td>Deploy + handoff</td>
                  <td style={{ textAlign: 'left' }}>Production deployment, pilot onboarding plan, documentation</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="stand-milestone">
            <div className="stand-milestone-label">Milestone: End of Week 2</div>
            <p>Stand is live. 100 families can find the landing page, go through onboarding, build their business, share their brand card, and complete the parent gate. You have a live admin dashboard with real-time pilot data. Production-grade. Design standards met. Ready for your first cohort.</p>
          </div>
        </Section>

        <NotchReveal compact />

        {/* VI. What You'll Have */}
        <Section id="deliverables" number="VI" title="What You&rsquo;ll Have" open={openSections.deliverables} onToggle={() => toggleSection('deliverables')}>
          <p>At the end of this sprint:</p>
          <ul className="stand-checklist">
            <li><strong>A production app</strong> deployed on Vercel, installable as a PWA (works like a native app on iPad/phone)</li>
            <li><strong>The Stand Coach onboarding</strong> &mdash; conversational, two-pane, with the Grand Reveal. Handles both product and service businesses.</li>
            <li><strong>A shareable brand card</strong> &mdash; the viral output kids send to friends and family</li>
            <li><strong>A parent gate</strong> with COPPA-lite consent and embedded research questions (value prop, pricing, concerns)</li>
            <li><strong>A CEO dashboard</strong> with goal tracking, sharing, and a post-onboarding pulse</li>
            <li><strong>A pilot admin dashboard</strong> for you &mdash; real-time funnel data, category breakdown, survey responses, CSV export</li>
            <li><strong>Full PostHog instrumentation</strong> &mdash; session replays, funnel analytics, drop-off tracking on every moment</li>
            <li><strong>A landing page</strong> &mdash; the entry point for pilot families</li>
            <li><strong>A design system</strong> &mdash; not just a pretty app, but a system that scales. Typography, color, components, animation patterns.</li>
            <li><strong>A Supabase backend</strong> with auth, database, storage &mdash; architected by David for security and scale</li>
            <li><strong>Documentation</strong> &mdash; what was built, how it works, how to iterate on it</li>
          </ul>

          <h4>Pilot Research Outputs (Built Into the Product)</h4>
          <p>You asked for specific deliverables from the pilot. Here&apos;s how each one gets answered:</p>

          <div className="stand-table-wrapper">
            <table className="stand-table stand-research-table">
              <thead>
                <tr>
                  <th>Your Question</th>
                  <th style={{ textAlign: 'left' }}>How We Answer It</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Must-have onboarding steps + personalization winners</td>
                  <td style={{ textAlign: 'left' }}>PostHog funnel data &mdash; time per moment, completion rates, drop-off points</td>
                </tr>
                <tr>
                  <td>Top 4 business areas for kids + &ldquo;why&rdquo;</td>
                  <td style={{ textAlign: 'left' }}>Category selection data from Moment 3, broken down by age band and gender</td>
                </tr>
                <tr>
                  <td>Value prop A/B directional winner</td>
                  <td style={{ textAlign: 'left' }}>Parent gate survey &mdash; which framing resonated, in the moment of highest engagement</td>
                </tr>
                <tr>
                  <td>Pricing sensitivity summary</td>
                  <td style={{ textAlign: 'left' }}>Parent gate survey &mdash; pricing expectation question, correlated with completion</td>
                </tr>
                <tr>
                  <td>Key objections + proposed fixes</td>
                  <td style={{ textAlign: 'left' }}>Parent gate survey &mdash; concerns question + drop-off analysis</td>
                </tr>
                <tr>
                  <td>Gamification preference findings</td>
                  <td style={{ textAlign: 'left' }}>Post-onboarding pulse &mdash; what excited them most, would they share, favorite part</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <NotchReveal compact />

        {/* VII. Infrastructure Costs */}
        <Section id="infra" number="VII" title="Infrastructure Costs" open={openSections.infra} onToggle={() => toggleSection('infra')}>
          <p>
            David Shimel is laying out the system architecture. Here&apos;s what it costs to run Stand for the pilot:
          </p>

          <div className="stand-table-wrapper">
            <table className="stand-table stand-infra-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>What</th>
                  <th>Cost/month</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Static Content Storage (S3)</td>
                  <td>Images, videos, backups</td>
                  <td>~$10</td>
                </tr>
                <tr>
                  <td>Compute (Vercel/EC2)</td>
                  <td>Application hosting</td>
                  <td>~$10</td>
                </tr>
                <tr>
                  <td>Text-to-Speech (ElevenLabs)</td>
                  <td>Stand Coach voice</td>
                  <td>$5&ndash;$22</td>
                </tr>
                <tr>
                  <td>LLM (Claude / Anthropic)</td>
                  <td>Stand Coach conversations</td>
                  <td>~$25</td>
                </tr>
                <tr>
                  <td>AI Image Generation</td>
                  <td>Brand/product rendering</td>
                  <td>$1&ndash;$13</td>
                </tr>
                <tr>
                  <td>Data Storage (Supabase)</td>
                  <td>Database, auth</td>
                  <td>Free</td>
                </tr>
                <tr>
                  <td>Code Storage (GitHub)</td>
                  <td>Repository</td>
                  <td>Free</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            <strong>Estimated total: ~$65&ndash;$85/month</strong> at 100 users. These are estimates and may shift as we finalize the stack &mdash; e.g. Recraft or other asset generation services could add ~$10&ndash;20/month. Scales linearly. The biggest variable costs (LLM at $0.25/session and image gen) have cheaper alternatives if needed. Your infrastructure costs for the pilot will be minimal either way.
          </p>
        </Section>

        <NotchReveal compact />

        {/* VIII. Investment */}
        <Section id="investment" number="VIII" title="Investment" open={openSections.investment} onToggle={() => toggleSection('investment')}>
          <div className="stand-price">
            <div className="stand-price-amount">$10,000</div>
            <div className="stand-price-label">2-week all-out sprint</div>
          </div>

          <div className="stand-investment-split">
            <div className="stand-investment-card">
              <div className="stand-investment-card-header">
                <div className="stand-investment-card-name">Andy Santamaria</div>
                <div className="stand-investment-card-role">Product Engineering</div>
              </div>
              <div className="stand-investment-card-amount">$8,000</div>
              <div className="stand-investment-card-hours">~80 hours &middot; 2 weeks full-time</div>
              <ul className="stand-investment-card-list">
                <li>Design system &amp; brand implementation</li>
                <li>Stand Coach onboarding experience</li>
                <li>Grand Reveal + shareable brand card</li>
                <li>Parent gate + embedded survey</li>
                <li>CEO Dashboard (light)</li>
                <li>Pilot admin dashboard</li>
                <li>Landing page</li>
                <li>Animations, polish &amp; responsive QA</li>
                <li>Testing &amp; production deployment</li>
              </ul>
            </div>
            <div className="stand-investment-card">
              <div className="stand-investment-card-header">
                <div className="stand-investment-card-name">David Shimel</div>
                <div className="stand-investment-card-role">System Architecture</div>
              </div>
              <div className="stand-investment-card-amount">$2,000</div>
              <div className="stand-investment-card-hours">5 hours &middot; capped</div>
              <ul className="stand-investment-card-list">
                <li>Supabase schema &amp; database design</li>
                <li>Auth flows (COPPA-lite)</li>
                <li>Deployment pipeline</li>
                <li>PostHog integration</li>
              </ul>
            </div>
          </div>

          <p>
            Alignment sessions are waived. I&apos;m clearing the calendar &mdash; 40 hours a week, fully dedicated to Stand. You&apos;ll see daily progress and have something shippable at the end.
          </p>

          <h4>What&apos;s Not Included (Yet)</h4>
          <ul className="stand-checklist">
            <li><strong>Product marketplace / fulfillment integration</strong> &mdash; the pilot focuses on the onboarding-to-reveal journey. Branded product mockups appear in the reveal, but actual Printify/partner integration for ordering and fulfillment is Sprint 2. For the pilot, we&apos;re validating which categories kids pick &mdash; not processing orders.</li>
            <li><strong>Payment processing</strong> &mdash; no real money for the pilot per your scope. The architecture is designed for Stripe/Step/Greenlight integration when you&apos;re ready.</li>
            <li><strong>AI image generation for logos</strong> &mdash; product mockups use templates with dynamic overlays (brand colors, names, vibes). Not AI-generated images &mdash; those aren&apos;t good enough yet per your feedback. The brand card uses styled templates, not generated art.</li>
            <li><strong>Social features</strong> (Stand Squad, leaderboards, friends) &mdash; designed into the architecture but not built in Sprint 1. The kid interviews confirm this matters (leveling, competing with friends), but it&apos;s the retention layer &mdash; you need acquisition first.</li>
            <li><strong>Voice input</strong> &mdash; stretch goal for the sprint. The coach works great with typing. Voice (Whisper API) would make it magical on iPad but adds meaningful scope. We&apos;ll get to it if time allows, or it&apos;s first up in Sprint 2.</li>
          </ul>
        </Section>

        <NotchReveal compact />

        {/* IX. What I Need From You */}
        <Section id="from-you" number="IX" title="What I Need From You" open={openSections['from-you']} onToggle={() => toggleSection('from-you')}>
          <h4>Before Day 1</h4>
          <ul className="stand-checklist">
            <li className="stand-checklist-done"><strong>Intake questionnaire</strong> &mdash; received</li>
            <li className="stand-checklist-done"><strong>Brand assets</strong> &mdash; logos (3 variants), color palette received</li>
            <li><strong>Figma files</strong> &mdash; whatever Devin has, even if you don&apos;t love it. Useful for understanding what&apos;s been explored.</li>
            <li><strong>GitHub repo access</strong> &mdash; transfer from Chris or grant read access so I can evaluate what&apos;s reusable</li>
            <li className="stand-checklist-done"><strong>Google Drive access</strong> &mdash; planning materials received</li>
          </ul>

          <h4>During the Sprint</h4>
          <ul className="stand-checklist">
            <li><strong>30 minutes daily</strong> &mdash; async check-in (Slack or text), plus a quick call 2&ndash;3x per week to review progress</li>
            <li><strong>Product decisions</strong> &mdash; I&apos;ll flag choices as they come up (copy tone, specific design calls, which product/service mockups to include). Quick responses keep the sprint moving.</li>
            <li><strong>2&ndash;3 test families</strong> by end of Week 1 &mdash; even just friends/family who can do a walkthrough and give raw feedback before the broader pilot</li>
          </ul>

          <h4>Decisions Already Made (From Your Intake)</h4>
          <p>These were open questions in the previous draft. Your intake answered them:</p>

          <ol className="stand-decisions">
            <li><strong>Starting categories:</strong> Products (crafts/jewelry, food/treats, personal care) + Services (tutoring, pet care, teaching). We&apos;ll curate 4&ndash;6 specific business types across both.</li>
            <li><strong>Input methods:</strong> Tap-first design &mdash; big buttons, chips, and preset options so 8-year-olds aren&apos;t stuck typing. Typing as a fallback for open-ended fields. Voice is a stretch goal &mdash; Chris attempted it, didn&apos;t land, but we&apos;ll revisit if time allows.</li>
            <li><strong>Payment for pilot:</strong> No real money. Theoretical pricing captured via parent survey.</li>
            <li><strong>Storefront sharing:</strong> The shareable brand card is the pilot&apos;s sharing mechanism &mdash; lightweight, viral, no storefront purchasing flow needed yet.</li>
            <li><strong>Mobile vs desktop:</strong> Mobile-first, iPad is a must.</li>
            <li><strong>Age cohorts:</strong> 8&ndash;11 and 11&ndash;14.</li>
          </ol>
        </Section>

        <NotchReveal compact />

        {/* X. After the Sprint */}
        <Section id="after" number="X" title="After the Sprint" open={openSections.after} onToggle={() => toggleSection('after')}>
          <p>The sprint gets Stand to &ldquo;shippable pilot.&rdquo; What comes next:</p>
          <ul className="stand-checklist">
            <li><strong>Pilot feedback loop</strong> (Weeks 3&ndash;4) &mdash; Testing parties, user sessions, async feedback. Real data from real families flowing through your admin dashboard. Live recorded sessions with kids and parents.</li>
            <li><strong>Learnings report</strong> &mdash; We pull the pilot data together: onboarding completion funnel, top categories, parent survey results, pricing sensitivity, drop-off analysis, and recommendations for MVP scope.</li>
            <li><strong>Iteration sprint</strong> &mdash; Based on pilot data, we prioritize what to build/fix/cut. Could be another 2-week sprint or an ongoing rhythm.</li>
            <li><strong>Product marketplace</strong> &mdash; Once categories are validated, build the actual product/service catalog with real fulfillment paths (Printify for physical goods, booking/scheduling for services).</li>
            <li><strong>Full dashboard + gamification</strong> &mdash; Goal tracking, leveling, badges, earnings. Informed by what kids actually responded to in the pilot.</li>
            <li><strong>Social features</strong> &mdash; Stand Squad, leaderboards, friend invites. The retention/viral layer.</li>
            <li><strong>Full payment rails</strong> &mdash; Stripe integration, parent-controlled wallets, real money movement.</li>
            <li><strong>Founding engineer hire</strong> &mdash; Once the product is validated and you&apos;re ready to scale, I help you hire your first full-time engineer and hand off a clean, well-documented codebase.</li>
          </ul>
        </Section>

        {/* Closing note */}
        <div className="stand-note">
          <div className="stand-note-label">Closing</div>
          <p>
            In two weeks, you&apos;ll have something with soul, something you can ship to a hundred families that you&apos;re proud of. A real product that real kids will use to start businesses, and a dashboard that tells you exactly what&apos;s working.
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
