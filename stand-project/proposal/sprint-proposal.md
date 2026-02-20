# Stand — Sprint Proposal

*From Andy Santamaria — Feb 2026*

---

## Basecamp

You've already done a lot. You've raised capital, built a prototype, ran a physical beta, interviewed kids and parents, surveyed families, and know what you want Stand to feel like. What's missing is the bridge between the vision in your head and a product that 100+ families can actually use. Something with Soul.

That's what this sprint is.

To kick off this first sprint I want to aim high. Together, I want us to validate onboarding when we hear kids can't stop talking about Stand. Same goes for pricing, when parents see how polished it is there's no question they'd pay for it.

The product is the research that gets us the data and the conviction to get to the next stage of the business.

---

## What We Already Know

Before we build, here's what your existing research tells us. These aren't open questions anymore:

**Business categories (top 4 for pilot):**
Your interviews and survey converge on the same answer. Crafts/jewelry (Azzy, Ripley), food/treats (Arlo, Dash, survey at 17%), personal care/beauty (Azzy, Dash, survey at 12%), and services (Azzy babysits, Ripley wants to teach gymnastics). The survey skewed toward educational toys (29%) and craft/DIY (20%) — but the kid interviews tell a richer story.

**This is not all e-commerce.** Your original pitch includes pet-sitting, tutoring, and babysitting kits. Ripley wants to "sell leotards and teach lessons." Azzy already babysits. The Ripley survey has an entire services section. The product needs to handle both: physical goods (bracelets, cookies, custom merch) AND services (dog walking, tutoring, teaching). For the pilot, this means the onboarding and storefront need two paths — a product preview for e-commerce businesses, and a service card/booking preview for service businesses.

**Pricing:** 65% of surveyed parents will pay $25+. 35% will pay $36+. Celestine (Ripley's mom) said "$25 or more I start to pay attention." Max and Arlo guessed $20-30/month. The sweet spot is $25-35/month.

**What motivates kids:** Money first, then accomplishment/goals, then friends. Consistent across every interview. Ripley: "I don't really care about what I'm selling, just that I am selling something to make money." Leveling up and unlocking tiers came up unprompted in every conversation.

**What parents want:** Financial literacy (71%), confidence/social skills (67%), earning potential (53%). Top features: structured curriculum (60%), tracking platform (52%), parent oversight (51%). Time commitment: 5 min/day max (Simone), 1-2 hours/week (45% of survey).

**Target cohorts:** 8-11 and 11-14. The 11-year-old demo (Arlo, Ripley, Azzy) is the sweet spot — old enough to be self-directed, young enough to be genuinely excited.

**Platform:** Mobile-first, iPad is a must. 64% of survey respondents are on iOS.

---

## What We're Building

A production-quality MVP of Stand that delivers on the core promise: **a kid opens the app, and within minutes, they have a real business — branded and ready to share.** A parent opens the app, and they see a tool that's safe, beautiful, and genuinely teaching their kid something. And because the whole thing is instrumented, you get every data point you asked for — funnel completion, drop-off points, category demand, parent sentiment — without needing a separate survey.

### The Five Deliverables

**1. Onboarding — The Stand Coach Experience**

This is the hero. The thing that makes Stand feel like nothing else.

Instead of the current 14-step form journey, we're building a **conversational, two-pane interface** where kids collaborate with a Stand Coach to build their business in real time:

- **Left pane:** The conversation. The coach asks questions, reacts, encourages. Kids can type or talk (voice-first on iPad). It adapts to their energy. It feels like brainstorming with a creative partner, not answering a questionnaire.
- **Right pane:** The live build. Every answer immediately renders into something visual. Kid says "I want to sell bracelets" → a bracelet mockup appears. They pick a vibe → the whole brand recolors. They name their business → the storefront header updates. By the end, the right pane IS their business. The reveal isn't a surprise at the end — it's been building the whole time.

The journey is **6 moments**, not 14 steps:

1. **"What do you want to be called?"** — CEO alias + avatar (fun AND COPPA-lite — no real names collected)
2. **"What do you love?"** — Open-ended, not a category picker. "I love making bracelets and my dog Biscuit" is richer than checking a box
3. **"Here's what you could build"** — 2-3 curated suggestions based on what they said. For product businesses: visual product mockups. For service businesses: a service card preview (what you offer, your rate, how to book). Each suggestion is matched against our curated catalog.
4. **"What's your style?"** — Pick a vibe from visual mood boards, not color pickers. Each vibe is a pre-designed brand kit that transforms the entire preview
5. **"Name your business"** — The storefront, cards, labels all update. The business becomes real.
6. **"Set your goal"** — What do you want to do with the money? Save / Buy Something / Give Back / Split It. How much? A goal tracker animates into the dashboard.

Pricing is handled through positioning ("For Everyone" / "Sweet Spot" / "Extra Special") — the app calculates the actual price backward from their goal, targeting ~10 sales as the sweet spot for engagement and learning.

Every moment is instrumented with PostHog — time spent, choices made, drop-off points. You'll know exactly where kids light up and where they stall.

**2. The Grand Reveal + Shareable Brand Card**

The reveal moment needs to hit. When the coach says "CEO Q-Money, welcome to Quincy's Charm Co." — the kid is looking at THEIR storefront, THEIR products, THEIR brand. Every piece was their decision. It's theirs.

The output is a **shareable brand card** — a beautiful, branded image/link the kid can text to friends, family, anyone. "Check out my business!" This is the viral loop. This is also what makes the pilot spread beyond the initial 100 families organically. For product businesses, it shows their products with their branding applied. For service businesses, it shows their service offering with their branding, rate, and how to get in touch.

**3. Parent Gate + Pilot Survey**

COPPA-lite consent flow that doubles as your research instrument:

- Parent email, kid age band, optional gender, consent checkbox
- **Embedded value prop moment** — the parent sees what their kid built and gets a clear, compelling pitch for Stand
- **3-4 survey questions** baked into the approval flow: value prop resonance ("which of these resonates most?"), pricing reaction ("what would you expect to pay?"), biggest concern, and how they heard about Stand
- This replaces the need for a separate A/B landing page test — the parent gate IS the value prop test, delivered at the moment of highest engagement (right after their kid's eyes lit up)

**4. CEO Dashboard (Light)**

The kid's home base after onboarding:

- **Goal progress tracker** — visual, animated, makes the kid feel like they're running something real
- **Share your business** — one-tap sharing of their brand card
- **Post-onboarding pulse** — 2-3 quick fun questions after the reveal: "How pumped are you?" / "Would you show this to a friend?" / "What was your favorite part?" Captures the motivation and gamification data you want without a separate survey

For the pilot, the dashboard is intentionally light — the focus is on the onboarding experience and getting the reveal right. The full dashboard (sales tracking, earnings, quick actions, leveling) is Sprint 2 once we know what kids care about most.

**5. Pilot Admin Dashboard (For Lauren)**

A simple, private view where you can see real-time pilot data:

- How many kids have started / completed onboarding
- Where they drop off (funnel visualization)
- What business categories they're picking
- What age bands are completing vs. abandoning
- Parent survey responses (value prop, pricing, concerns)
- Kid pulse responses (excitement, favorites)
- Export to CSV for your investor updates and internal analysis

This is your "analytics + export access" deliverable — but instead of a spreadsheet, it's a live dashboard you can check anytime.

---

## The Promise Delivery

**For the kid:** The moment the right pane is fully built and the coach says something like "CEO Q-Money, welcome to Quincy's Charm Co." — and they're looking at THEIR storefront, THEIR brand. They built it. Every piece was their decision. It's theirs. And they can share it immediately.

**For the parent:** The moment they see their kid's eyes light up. And then, practically: the moment they see a well-designed, safe, educational tool that they trust. Not "vibe coded." Not "AI-y." Something that feels considered, intentional, and real.

**For you (Lauren):** The moment you open the admin dashboard and see real families going through the experience, picking categories, completing onboarding — and the data is telling a story you can act on.

---

## The Approach

### Phase 1 — Alignment (Complete)
Two calls done. Intake questionnaire received. Materials reviewed — pitch docs, kid interviews, survey results, brand assets, color palette, logos. This proposal formalizes the plan.

### Phase 2 — Design Systems + Architecture (Days 1-2)
David Shimel sets up the technical foundation: Supabase schema, auth flows (COPPA-lite), deployment pipeline, PostHog integration, and the architectural guardrails that let me move fast and safe for the rest of the sprint. In parallel, I build the design system — the typography, color system, component library, and animation patterns that make everything feel cohesive and elevated. Informed by your existing brand assets: Stand logos (Black, Blank Slate, Founder Red), color palette, and design references (Uncommon, Tin Can, A24, Lego — nostalgia modernized, elevated not toyish, gaming meets soul).

### Phase 3 — Product Engineering (Days 3-10)
The build. This is where the 6 moments come to life, the parent gate takes shape, and the dashboard gets built. Daily progress — you'll see things moving. I'll share builds frequently so we're never more than a day away from course-correcting.

### Phase 4 — Front-End Interactive + Polish (Days 11-13)
The difference between "works" and "wow." Animations, transitions, micro-interactions, responsive refinement, the Grand Reveal moment. This is where the magic gets applied. This is where kids go from "this is cool" to "this is MINE."

### Phase 5 — Live + Testing (Day 14 onward)
Ship to your first cohort. Testing parties — intense, in-person sessions if possible, remote if not. Real kids, real parents, real feedback. The admin dashboard is live, data is flowing. The pilot begins.

---

## Sprint Plan — 2 Weeks

### Week 1: Foundation + The Hero Feature

| Day | Focus | Deliverable |
|-----|-------|-------------|
| 1 | Architecture + design system | Supabase schema, auth, deployment pipeline, PostHog setup, brand tokens, component foundations |
| 2 | Design system + onboarding shell | Typography, colors, layout system, two-pane interface scaffold, mobile/iPad responsive foundation |
| 3 | Stand Coach — Moments 1-3 | Alias/avatar selection, open-ended interest input, AI-powered business suggestions (products AND services) |
| 4 | Stand Coach — Moments 4-6 | Vibe/style selection, business naming, goal setting (save/buy/give/split) |
| 5 | The Live Build pane | Real-time preview rendering — every input visually updates the brand. Product mockups for e-commerce, service cards for service businesses |
| 6 | Grand Reveal + shareable output | The reveal moment (animations, transitions), shareable brand card generation |
| 7 | Parent gate + survey | COPPA-lite consent flow, embedded value prop/pricing survey questions, parent approval |

**Milestone: End of Week 1** — A kid can go through the full onboarding journey and have a branded business with a name, a style, and a goal. The reveal moment works. They can share their brand card. A parent can approve it and answer survey questions in the process.

### Week 2: Dashboard + Admin + Ship

| Day | Focus | Deliverable |
|-----|-------|-------------|
| 8 | CEO Dashboard (light) | Goal tracker, share button, post-onboarding pulse questions |
| 9 | Pilot admin dashboard | Funnel visualization, category breakdown, parent survey responses, export |
| 10 | Landing page | One incredible landing page — the entry point for pilot families. Clear, branded, compelling. |
| 11 | Analytics + instrumentation | PostHog events on every moment, funnel tracking, session replays configured |
| 12 | Polish + animations | Micro-interactions, loading states, transitions, responsive QA (mobile + iPad) |
| 13 | Testing + bug fixes | End-to-end testing, edge cases, performance, mobile/tablet QA |
| 14 | Deploy + handoff | Production deployment, pilot onboarding plan, documentation |

**Milestone: End of Week 2** — Stand is live. 100 families can find the landing page, go through onboarding, build their business, share their brand card, and complete the parent gate. You have a live admin dashboard with real-time pilot data. Production-grade. Design standards met. Ready for your first cohort.

---

## What You'll Have

At the end of this sprint:

- [ ] **A production app** deployed on Vercel, installable as a PWA (works like a native app on iPad/phone)
- [ ] **The Stand Coach onboarding** — conversational, two-pane, with the Grand Reveal. Handles both product and service businesses.
- [ ] **A shareable brand card** — the viral output kids send to friends and family
- [ ] **A parent gate** with COPPA-lite consent and embedded research questions (value prop, pricing, concerns)
- [ ] **A CEO dashboard** with goal tracking, sharing, and a post-onboarding pulse
- [ ] **A pilot admin dashboard** for you — real-time funnel data, category breakdown, survey responses, CSV export
- [ ] **Full PostHog instrumentation** — session replays, funnel analytics, drop-off tracking on every moment
- [ ] **A landing page** — the entry point for pilot families
- [ ] **A design system** — not just a pretty app, but a system that scales. Typography, color, components, animation patterns.
- [ ] **A Supabase backend** with auth, database, storage — architected by David for security and scale
- [ ] **Documentation** — what was built, how it works, how to iterate on it

### Pilot Research Outputs (Built Into the Product)

You asked for specific deliverables from the pilot. Here's how each one gets answered:

| Your Question | How We Answer It |
|---------------|-----------------|
| Must-have onboarding steps + personalization winners | PostHog funnel data — time per moment, completion rates, drop-off points |
| Top 4 business areas for kids + "why" | Category selection data from Moment 3, broken down by age band and gender |
| Value prop A/B directional winner | Parent gate survey — which framing resonated, in the moment of highest engagement |
| Pricing sensitivity summary | Parent gate survey — pricing expectation question, correlated with completion |
| Key objections + proposed fixes | Parent gate survey — concerns question + drop-off analysis |
| Gamification preference findings | Post-onboarding pulse — what excited them most, would they share, favorite part |

---

## Infrastructure Costs

David Shimel is laying out the system architecture. Here's what it costs to run Stand for the pilot:

| Service | What | Cost/month |
|---------|------|------------|
| Static Content Storage (S3) | Images, videos, backups | ~$10 |
| Compute (Vercel/EC2) | Application hosting | ~$10 |
| Text-to-Speech (ElevenLabs) | Stand Coach voice | $5–$22 |
| LLM (Claude / Anthropic) | Stand Coach conversations | ~$25 |
| AI Image Generation | Brand/product rendering | $1–$13 |
| Data Storage (Supabase) | Database, auth | Free |
| Code Storage (GitHub) | Repository | Free |

**Estimated total: ~$65–$85/month** at 100 users. These are estimates and may shift as we finalize the stack — e.g. Recraft or other asset generation services could add ~$10–20/month. Scales linearly. The biggest variable costs (LLM at $0.25/session and image gen) have cheaper alternatives if needed. Your infrastructure costs for the pilot will be minimal either way.

---

## Investment

### The Deal

**$10,000 flat** for a 2-week all-out sprint.

That covers $8,000 for product engineering from me — design, code, architecture, testing, deployment — plus $2,000 for David Shimel's system architecture work upfront (auth, database schema, security guardrails, deployment pipeline). Alignment sessions are waived.

I'm clearing the calendar. 40 hours a week, fully dedicated to Stand. You'll see daily progress and have something shippable at the end.

### What's Not Included (Yet)

- **Product marketplace / fulfillment integration** — the pilot focuses on the onboarding-to-reveal journey. Branded product mockups appear in the reveal, but actual Printify/partner integration for ordering and fulfillment is Sprint 2. For the pilot, we're validating which categories kids pick — not processing orders.
- **Payment processing** — no real money for the pilot per your scope. The architecture is designed for Stripe/Step/Greenlight integration when you're ready.
- **AI image generation for logos** — product mockups use templates with dynamic overlays (brand colors, names, vibes). Not AI-generated images — those aren't good enough yet per your feedback. The brand card uses styled templates, not generated art.
- **Social features** (Stand Squad, leaderboards, friends) — designed into the architecture but not built in Sprint 1. The kid interviews confirm this matters (leveling, competing with friends), but it's the retention layer — you need acquisition first.
- **Voice input** — stretch goal for the sprint. The coach works great with typing. Voice (Whisper API) would make it magical on iPad but adds meaningful scope. We'll get to it if time allows, or it's first up in Sprint 2.

---

## What I Need From You

### Before Day 1
- [x] ~~Intake questionnaire~~ — received
- [x] ~~Brand assets~~ — logos (3 variants), color palette received
- [ ] **Figma files** — whatever Devin has, even if you don't love it. Useful for understanding what's been explored.
- [ ] **GitHub repo access** — transfer from Chris or grant read access so I can evaluate what's reusable
- [x] **Google Drive access** — planning materials received

### During the Sprint
- [ ] **30 minutes daily** — async check-in (Slack or text), plus a quick call 2-3x per week to review progress
- [ ] **Product decisions** — I'll flag choices as they come up (copy tone, specific design calls, which product/service mockups to include). Quick responses keep the sprint moving.
- [ ] **2-3 test families** by end of Week 1 — even just friends/family who can do a walkthrough and give raw feedback before the broader pilot

### Decisions Already Made (From Your Intake)
These were open questions in the previous draft. Your intake answered them:

1. **Starting categories:** Products (crafts/jewelry, food/treats, personal care) + Services (tutoring, pet care, teaching). We'll curate 4-6 specific business types across both.
2. **Input methods:** Tap-first design — big buttons, chips, and preset options so 8-year-olds aren't stuck typing. Typing as a fallback for open-ended fields. Voice is a stretch goal — Chris attempted it, didn't land, but we'll revisit if time allows.
3. **Payment for pilot:** No real money. Theoretical pricing captured via parent survey.
4. **Storefront sharing:** The shareable brand card is the pilot's sharing mechanism — lightweight, viral, no storefront purchasing flow needed yet.
5. **Mobile vs desktop:** Mobile-first, iPad is a must.
6. **Age cohorts:** 8-11 and 11-14.

---

## After the Sprint

The sprint gets Stand to "shippable pilot." What comes next:

- **Pilot feedback loop** (Weeks 3-4) — Testing parties, user sessions, async feedback. Real data from real families flowing through your admin dashboard. Live recorded sessions with kids and parents.
- **Learnings report** — We pull the pilot data together: onboarding completion funnel, top categories, parent survey results, pricing sensitivity, drop-off analysis, and recommendations for MVP scope.
- **Iteration sprint** — Based on pilot data, we prioritize what to build/fix/cut. Could be another 2-week sprint or an ongoing rhythm.
- **Product marketplace** — Once categories are validated, build the actual product/service catalog with real fulfillment paths (Printify for physical goods, booking/scheduling for services).
- **Full dashboard + gamification** — Goal tracking, leveling, badges, earnings. Informed by what kids actually responded to in the pilot.
- **Social features** — Stand Squad, leaderboards, friend invites. The retention/viral layer.
- **Full payment rails** — Stripe integration, parent-controlled wallets, real money movement.
- **Founding engineer hire** — Once the product is validated and you're ready to scale, I help you hire your first full-time engineer and hand off a clean, well-documented codebase.

---

## Closing

In two weeks, you'll have something with soul, something you can ship to a hundred families that you're proud of. A real product that real kids will use to start businesses, and a dashboard that tells you exactly what's working.
