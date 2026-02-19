# Stand — Sprint Proposal

*From Andy Santamaria — Feb 2026*

---

## Basecamp

You've done the hard parts. You've raised capital, built a prototype, figured out who your customers are, and know what you want Stand to feel like. What's missing is the bridge between the vision in your head and a product that 100+ families can actually use — something that looks incredible, feels magical for kids, and makes parents say "holy shit, this is legit."

That's what this sprint is.

---

## What We're Building

A production-quality MVP of Stand that delivers on the core promise: **a kid opens the app, and within minutes, they have a real business — branded, stocked, and ready to sell.** A parent opens the app, and they see a tool that's safe, beautiful, and genuinely teaching their kid something.

### Three Core Features

**1. Onboarding — The Stand Coach Experience**

This is the hero. The thing that makes Stand feel like nothing else.

Instead of the current 14-step form journey, we're building a **conversational, two-pane interface** where kids collaborate with a Stand Coach to build their business in real time:

- **Left pane:** The conversation. The coach asks questions, reacts, encourages. Kids can type or talk (voice-first on iPad). It adapts to their energy. It feels like brainstorming with a creative partner, not answering a questionnaire.
- **Right pane:** The live build. Every answer immediately renders into something visual. Kid says "I want to sell bracelets" → a bracelet mockup appears. They pick a vibe → the whole brand recolors. They name their business → the storefront header updates. By the end, the right pane IS their business. The reveal isn't a surprise at the end — it's been building the whole time.

The journey is **6 moments**, not 14 steps:

1. **"What do you want to be called?"** — CEO alias + avatar (fun AND COPPA-friendly — no real names)
2. **"What do you love?"** — Open-ended, not a category picker. "I love making bracelets and my dog Biscuit" is richer than checking a box
3. **"Here's what you could sell"** — 2-3 curated product suggestions based on what they said, each with a visual mockup
4. **"What's your style?"** — Pick a vibe from visual mood boards, not color pickers. Each vibe is a pre-designed brand kit that transforms the entire preview
5. **"Name your business"** — The storefront, cards, labels all update. The business becomes real.
6. **"Set your goal"** — What do you want to do with the money? How much? A goal tracker animates into the dashboard.

Pricing is handled through positioning ("For Everyone" / "Sweet Spot" / "Extra Special") — the app calculates the actual price backward from their goal, targeting ~10 sales as the sweet spot for engagement and learning.

**2. Product Marketplace**

Curated products kids can actually sell. Not 50 options — a tight, beautiful catalog matched to what kids actually want to make and sell. Each product:

- Has a real fulfillment path (Printify/partner integration)
- Shows a mockup with the kid's brand applied (their colors, their name, their vibe)
- Has a real price and real margin the kid can understand

For the pilot, we start with the categories that matter most (from testing data) and ensure every product a kid picks can actually be ordered and delivered. Payment rails will be designed but may run semi-manually for the first 100 families — the UX will be production-grade even if the backend is human-assisted.

**3. Dashboard & Storefront**

The kid's home base after onboarding:

- **CEO Dashboard** — Goal progress tracker, sales count, earnings. Visual, animated, makes the kid feel like they're running something real.
- **Shareable Storefront** — A link the kid can send to family, friends, neighbors. "Check out my business!" This is the viral loop. The storefront is branded with their vibe, shows their products, and lets people buy.
- **Quick Actions** — Record a sale, share your store, update your goal. Keep it simple, keep them coming back.

The parent gets a parallel view: their kid's progress, order management, and the tools to actually fulfill orders and handle money responsibly.

---

## The Promise Delivery

From the pitch page: *the moment the customer gets what they came for.*

**For the kid:** The moment the right pane is fully built and the coach says something like "CEO Q-Money, welcome to Quincy's Charm Co." — and they're looking at THEIR storefront, THEIR products, THEIR brand. They built it. Every piece was their decision. It's theirs. That moment needs to hit.

**For the parent:** The moment they see their kid's eyes light up. And then, practically: the moment they see a well-designed, safe, educational tool that they trust. Not "vibe coded." Not "AI-y." Something that feels considered, intentional, and real.

---

## The Approach

This builds on the phases outlined in the original pitch, compressed into a focused sprint:

### Phase 1 — Alignment (Already Underway)
Roles clear, expectations set, highest-level goals illuminated. We've done two calls. This proposal formalizes the rest. The intake questionnaire gives us the remaining detail to lock scope.

### Phase 2 — Design Systems + Architecture (Days 1-2)
David Shimel sets up the technical foundation: Supabase schema, auth flows (COPPA-compliant), deployment pipeline, and the architectural guardrails that let me move fast and safe for the rest of the sprint. In parallel, I build the design system — the typography, color system, component library, and animation patterns that make everything feel cohesive and elevated. This is informed by your brand assets and Figma files.

### Phase 3 — Product Engineering (Days 3-10)
The build. This is where the 6 moments come to life, the marketplace takes shape, and the dashboard gets built. Daily progress — you'll see things moving. I'll share builds frequently so we're never more than a day away from course-correcting.

### Phase 4 — Front-End Interactive + Polish (Days 11-13)
The difference between "works" and "wow." Animations, transitions, micro-interactions, responsive refinement, the Grand Reveal moment. This is where the magic gets applied. This is where kids go from "this is cool" to "this is MINE."

### Phase 5 — Live + Testing (Day 14 onward)
Ship to your first cohort. Testing parties — intense, in-person sessions if possible, remote if not. Real kids, real parents, real feedback. Async feedback channels. Recorded sessions. The pilot begins.

---

## Sprint Plan — 2 Weeks

### Week 1: Foundation + The Hero Feature

| Day | Focus | Deliverable |
|-----|-------|-------------|
| 1 | Architecture + design system | Supabase schema, auth, deployment pipeline, brand tokens, component foundations |
| 2 | Design system + onboarding shell | Typography, colors, layout system, two-pane interface scaffold |
| 3 | Stand Coach — Moments 1-3 | Alias/avatar selection, open-ended interest input, AI-powered product suggestions |
| 4 | Stand Coach — Moments 4-6 | Vibe/style selection, business naming, goal setting |
| 5 | The Live Build pane | Real-time preview rendering — every input visually updates the storefront/brand |
| 6 | Grand Reveal + parent flow | The reveal moment (animations, transitions), COPPA consent, parent approval |
| 7 | Voice input + integration | Whisper API integration, voice-to-text in the coach conversation |

**Milestone: End of Week 1** — A kid can go through the full onboarding journey and have a branded business with products, a name, and a goal. The reveal moment works. A parent can approve it.

### Week 2: Marketplace + Dashboard + Ship

| Day | Focus | Deliverable |
|-----|-------|-------------|
| 8 | Product marketplace | Curated catalog, product pages with branded mockups, pricing display |
| 9 | Storefront | Shareable storefront link, branded layout, product listings, buy flow |
| 10 | CEO Dashboard | Goal tracker, sales/earnings display, quick actions |
| 11 | Parent experience | Parent dashboard, order management, kid progress view |
| 12 | Polish + animations | Micro-interactions, loading states, transitions, responsive QA |
| 13 | Testing + bug fixes | End-to-end testing, edge cases, performance, mobile/tablet QA |
| 14 | Deploy + handoff | Production deployment, pilot onboarding plan, documentation |

**Milestone: End of Week 2** — Stand is live. 100-200 families can onboard, build their business, share their storefront, and start selling. Production-grade. Design standards met. Ready for the pilot.

---

## What You'll Have

At the end of this sprint:

- [ ] **A production app** deployed on Vercel, installable as a PWA (works like a native app on iPad/phone)
- [ ] **The Stand Coach onboarding** — conversational, voice-enabled, two-pane, with the Grand Reveal
- [ ] **A curated product marketplace** with branded mockups and real fulfillment paths
- [ ] **CEO dashboards for kids** with goal tracking and shareable storefronts
- [ ] **A parent experience** with COPPA-compliant consent, progress views, and order management
- [ ] **A design system** — not just a pretty app, but a system that scales. Typography, color, components, animation patterns.
- [ ] **A Supabase backend** with auth, database, storage — architected by David for security and scale
- [ ] **Testing infrastructure** ready for your first 100+ family pilot
- [ ] **Documentation** — what was built, how it works, how to iterate on it

---

## Investment

### The Deal

**$7,500 flat** for a 2-week all-out sprint.

That covers ~80 hours of product engineering from me — design, code, architecture, testing, deployment — plus David Shimel's system architecture work upfront (auth, database schema, security guardrails, deployment pipeline). Alignment sessions are waived.

I'm clearing the calendar. 40 hours a week, fully dedicated to Stand. You'll see daily progress and have something shippable at the end.

### What's Not Included (Yet)

- **Printify/fulfillment integration** — the marketplace UX will be production-grade, but actual order fulfillment may be semi-manual for the pilot. We design the full flow, wire what we can, and handle the rest with human ops until volume justifies full automation.
- **Payment processing** — the UX for buying/selling will be designed and built. For the pilot, actual money movement can go through a simple Stripe checkout or even manual invoicing. We architect for Stripe/Step/Greenlight integration.
- **AI image generation for logos** — product mockups use templates with dynamic overlays (brand colors, names). Not AI-generated images — those aren't good enough yet per your feedback.
- **Social features** (Stand Squad, leaderboards, friends) — designed into the architecture but not built in Sprint 1. This is Sprint 2 territory.

---

## What I Need From You

To hit the ground running:

### Before Day 1
- [ ] **Signed NDA** — so you can share everything freely
- [ ] **Brand assets** — whatever you have. Figma files, mood boards, color palettes, typography preferences. Even rough direction helps.
- [ ] **Google Drive access** — pilot milestones doc, any other planning materials
- [ ] **GitHub repo access** — transfer from Chris or grant read access so I can evaluate what's reusable
- [ ] **Intake questionnaire** — the form at andy.ws/stand/intake, takes ~15 minutes

### During the Sprint
- [ ] **30 minutes daily** — async check-in (Slack or text), plus a quick call 2-3x per week to review progress
- [ ] **Product decisions** — I'll flag choices as they come up (which products to include, copy tone, specific design calls). Quick responses keep the sprint moving.
- [ ] **2-3 test families** by end of Week 1 — even just friends/family who can do a walkthrough and give raw feedback before the broader pilot

### Your Decisions to Make
These are the open questions I'll need answers on to build:

1. **Starting product catalog** — which 4-6 business types do we launch with? (I'll recommend based on our analysis, but you decide)
2. **Voice input priority** — must-have for pilot, or nice-to-have? (Affects scope significantly)
3. **Payment for pilot** — are families paying real money, or is the pilot free with simulated transactions?
4. **Storefront sharing** — public links, or invite-only for the pilot?

---

## After the Sprint

The sprint gets Stand to "shippable pilot." What comes next:

- **Pilot feedback loop** (Weeks 3-4) — Testing parties, user sessions, async feedback. Real data from real families. This is Phase 6 from the original approach: sharing the product, collecting feedback, live recorded sessions.
- **Iteration sprint** — Based on pilot data, we prioritize what to build/fix/cut. Could be another 2-week sprint or an ongoing rhythm.
- **Social features** — Stand Squad, leaderboards, friend invites. This is the retention/viral layer.
- **Full payment rails** — Stripe integration, parent-controlled wallets, real money movement.
- **Founding engineer hire** — Once the product is validated and you're ready to scale, I help you hire your first full-time engineer and hand off a clean, well-documented codebase.

---

## The Bottom Line

You told me you want something kids feel like they're a part of, that feels cool and relevant, without being so heavy-handed that it takes away from *their* brand, *their* experience, *their* business. You want something that isn't "vibe coded" — something with real soul.

I can promise you that in two weeks, you'll have something you can ship to a hundred families that you're proud of. Not a prototype. Not a demo. A real product that real kids will use to start real businesses.

Let's build it.

---

*Ready to start? Fill out the intake at [andy.ws/stand/intake](https://andy.ws/stand/intake) and let's align on Day 1.*
