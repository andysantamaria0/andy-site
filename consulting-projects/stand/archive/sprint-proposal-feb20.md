> **ARCHIVED — February 20, 2026.** This is the original deliverable-based proposal. Superseded by the updated time-based engagement proposal dated February 24, 2026.

# Stand — Sprint Proposal

*From Andy Santamaria — Feb 2026*

---

### What's Changed (Updated Feb 20 after our call)

Based on our conversation today, here's what's new in this version:

- **AI image generation is now in scope.** Kids will get a generated logo/icon for their business during onboarding. First version for the pilot — we'll refine it post-sprint. *(Previously excluded)*
- **Printify product integration is now in scope.** Real product mockups with your branding, real wholesale pricing, real margin math baked into the experience. *(Previously excluded)*
- **Each kid gets a live storefront** at standkids.com/[business-name] — not just a brand card. Products, branding, logo, pricing. Looks almost operational. Payments are Sprint 2. *(Previously just a shareable brand card)*
- **CEO Dashboard swapped out** to make room for Printify + storefronts. Kids land on their storefront as their home base. Dashboard comes back in Sprint 2 with real sales data to show. *(Previously Deliverable #4)*
- **Design system built on your existing brand** — current Stand logo, palette, and fonts as the foundation. Elevated and made more playful, not replaced. No Figma from Devin needed. *(Previously open-ended design exploration)*
- **Business categories updated** to the 6 you and Alex have been refining: Sports, Toys & Games, Fashion & Style, Cats & Dogs, Beauty & Design, Cooking + Other. Categories are a working draft — you finalize during the sprint. *(Previously based on survey data)*
- **Operating rhythm updated** — daily 30-min standing check-in + MWF 1-hour product review sessions. *(Previously 30-min async + 2-3x/week calls)*
- **Voice input** stays as a stretch goal, feature-flagged so we can enable it per-user for testing.

Everything else — pricing, timeline, the 6-moment onboarding structure, parent gate, admin dashboard, analytics — is unchanged.

---

## Basecamp

You've already done a lot. You've raised capital, built a prototype, ran a physical beta, interviewed kids and parents, surveyed families, and know what you want Stand to feel like. What's missing is the bridge between the vision in your head and a product that 100+ families can actually use. Something with Soul.

That's what this sprint is.

To kick off this first sprint I want to aim high. Together, I want us to validate onboarding when we hear kids can't stop talking about Stand. Same goes for pricing, when parents see how polished it is there's no question they'd pay for it.

The product is the research that gets us the data and the conviction to get to the next stage of the business.

---

## What We Already Know

Before we build, here's what your existing research tells us. These aren't open questions anymore:

**Business categories (6 for pilot + Other):**
Lauren and Alex (Petra) have built a detailed product catalog with fulfillment paths already mapped. The current 6 categories are: **Sports**, **Toys & Games**, **Fashion & Style**, **Cats & Dogs**, **Beauty & Design**, and **Cooking** — plus an **Other** option with open-ended input. Each category has subcategories (e.g., Sports → Basketball, Soccer, Dance & Gym) and specific products mapped to fulfillment partners (Printify, Merchize, GoTeamSports, etc.) or DIY kits. The full catalog is split by age cohort: 8-12 year olds get simpler options, 12-15 year olds get more sophisticated products and services like private training. *Note: these categories are a working draft. Lauren will finalize the category list during the sprint — the architecture is built to accommodate changes without rework.*

**This is not all e-commerce.** Services are woven into the categories — dog walking and pet sitting under Cats & Dogs, private training under Sports. The onboarding and storefront need two paths: a product preview for physical goods businesses, and a service card/booking preview for service businesses. Every category includes an "Other" option so we capture what's missing.

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

- **Left pane:** The input. Interactive buttons, chips, and visual selectors that make every choice feel engaging — not a form, not a questionnaire. Typing as a fallback for open-ended fields. Voice input is a stretch goal, feature-flagged for testing. The primary experience is tap-first: big, clear options that an 8-year-old can navigate confidently.
- **Right pane:** The live build. Every answer immediately renders into something visual. Kid picks "cookies" → a cookie product mockup appears with their branding. They pick a vibe → the whole brand recolors. They name their business → the storefront header updates. By the end, the right pane IS their business. The reveal isn't a surprise at the end — it's been building the whole time.

The journey is **6 moments**, not 14 steps:

1. **"What do you want to be called?"** — CEO alias + avatar (fun AND COPPA-lite — no real names collected)
2. **"What do you love?"** — Open-ended, not a category picker. "I love making bracelets and my dog Biscuit" is richer than checking a box
3. **"Here's what you could build"** — 2-3 curated suggestions based on what they said. For product businesses: visual product mockups. For service businesses: a service card preview (what you offer, your rate, how to book). Each suggestion is matched against our curated catalog.
4. **"What's your style?"** — Pick a vibe from visual mood boards, not color pickers. Each vibe is a pre-designed brand kit that transforms the entire preview
5. **"Name your business"** — The storefront, cards, labels all update. The business becomes real.
6. **"Set your goal"** — What do you want to do with the money? Save / Buy Something / Give Back / Split It. How much? A goal tracker animates into the dashboard.

Pricing is handled through positioning ("For Everyone" / "Sweet Spot" / "Extra Special") — the app calculates the actual price backward from their goal, targeting ~10 sales as the sweet spot for engagement and learning.

Every moment is instrumented with PostHog — time spent, choices made, drop-off points. You'll know exactly where kids light up and where they stall.

**2. The Grand Reveal + Live Storefront** *(Updated — now includes hosted storefront, not just a brand card)*

The reveal moment needs to hit. When the coach says "CEO Q-Money, welcome to Quincy's Charm Co." — the kid is looking at THEIR storefront, THEIR products, THEIR brand. Every piece was their decision. It's theirs.

The output is a **real, hosted storefront** — a live page at standkids.com/[business-name] that the kid can share with friends, family, anyone. It shows their products with their branding, their AI-generated logo, and real Printify product mockups with actual pricing. For service businesses, it shows their service offering with their branding, rate, and how to get in touch. It looks almost operational — the only thing missing is payments (Sprint 2). On top of the storefront, kids also get a **shareable brand card** — a beautiful, branded image they can text or post. "Check out my business!" This is the viral loop.

**3. Parent Gate + Pilot Survey**

COPPA-lite consent flow that doubles as your research instrument:

- Parent email, kid age band, optional gender, consent checkbox
- **Embedded value prop moment** — the parent sees what their kid built and gets a clear, compelling pitch for Stand
- **3-4 survey questions** baked into the approval flow: value prop resonance ("which of these resonates most?"), pricing reaction ("what would you expect to pay?"), biggest concern, and how they heard about Stand
- This replaces the need for a separate A/B landing page test — the parent gate IS the value prop test, delivered at the moment of highest engagement (right after their kid's eyes lit up)

**4. Printify Product Integration** *(New — replaces CEO Dashboard)*

This is what makes Stand feel real, not pretend. During onboarding, when a kid picks a product business, they see their brand applied to actual Printify products — stickers, t-shirts, mugs, tote bags. Real wholesale pricing, real margins.

- **Product mockup rendering** — Printify's API generates mockups with the kid's branding applied. Their logo on a sticker. Their colors on a t-shirt. Visual, tangible, shareable.
- **Real economics** — the app shows real numbers. "This sticker costs $1.42 to make. You sell it for $8. You keep $6.58." That's actual business education baked into the product, not a separate lesson.
- **Storefront catalog** — the kid's storefront (standkids.com/[name]) displays their selected products with pricing. No payment processing yet — but it looks and feels like a real store that's one step away from going live.

For the pilot, Printify is visual + educational — we're rendering mockups and teaching margins, not processing orders. Payment rails and actual fulfillment are Sprint 2.

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

**For the kid:** The moment the right pane is fully built and the coach says something like "CEO Q-Money, welcome to Quincy's Charm Co." — and they're looking at THEIR storefront with THEIR logo, THEIR products with real prices, THEIR brand. They built it. Every piece was their decision. It's theirs. And they've got a real URL they can share immediately.

**For the parent:** The moment they see their kid's eyes light up. And then, practically: the moment they see a well-designed, safe, educational tool that they trust. Not "vibe coded." Not "AI-y." Something that feels considered, intentional, and real.

**For you (Lauren):** The moment you open the admin dashboard and see real families going through the experience, picking categories, completing onboarding — and the data is telling a story you can act on.

---

## The Approach

### Phase 1 — Alignment (Complete)
Two calls done. Intake questionnaire received. Materials reviewed — pitch docs, kid interviews, survey results, brand assets, color palette, logos. This proposal formalizes the plan.

### Phase 2 — Design Systems + Architecture (Days 1-2) *(Updated)*
David Shimel sets up the technical foundation: Supabase schema, auth flows (COPPA-lite), deployment pipeline, PostHog integration, Printify API connection, and the architectural guardrails that let me move fast and safe for the rest of the sprint. In parallel, I build the design system — the typography, color system, component library, and animation patterns that make everything feel cohesive and elevated. Built on the existing Stand brand: the current logo, color palette, and fonts — elevated and made more playful, not replaced. If a graphic designer delivers custom icons, illustrations, or badges during the sprint, they feed directly into the design system.

### Phase 3 — Product Engineering (Days 3-10)
The build. This is where the 6 moments come to life, the AI image generation takes shape, Printify products get integrated, the parent gate comes together, and the admin dashboard gets built. Daily progress — you'll see things moving. I'll share builds frequently so we're never more than a day away from course-correcting.

### Phase 4 — Front-End Interactive + Polish (Days 11-13)
The difference between "works" and "wow." Animations, transitions, micro-interactions, responsive refinement, the Grand Reveal moment. This is where the magic gets applied. This is where kids go from "this is cool" to "this is MINE."

### Phase 5 — Live + Testing (Day 14 onward)
Ship to your first cohort. Testing parties — intense, in-person sessions if possible, remote if not. Real kids, real parents, real feedback. The admin dashboard is live, data is flowing. The pilot begins.

---

## Sprint Plan — 2 Weeks *(Updated)*

### Week 1: Foundation + The Hero Feature

| Day | Focus | Deliverable |
|-----|-------|-------------|
| 1 | Architecture + design system | Supabase schema, auth, deployment pipeline, PostHog setup, Printify API connection, brand tokens, component foundations |
| 2 | Design system + onboarding shell | Typography, colors, layout system (built on existing Stand brand), two-pane interface scaffold, mobile/iPad responsive foundation |
| 3 | Stand Coach — Moments 1-3 | Alias/avatar selection, open-ended interest input, AI-powered business suggestions across 6 categories (products AND services) |
| 4 | Stand Coach — Moments 4-6 | Vibe/style selection, business naming, goal setting (save/buy/give/split) |
| 5 | AI image generation + Printify | Logo/icon generation for kid businesses, Printify product mockup rendering with kid's branding applied, margin calculator |
| 6 | Grand Reveal + storefront | The reveal moment (animations, transitions), live storefront at standkids.com/[name], shareable brand card generation |
| 7 | Parent gate + survey | COPPA-lite consent flow, embedded value prop/pricing survey questions, parent approval |

**Milestone: End of Week 1** — A kid can go through the full onboarding journey, get an AI-generated logo, see their brand on real Printify products with real pricing, and land on a live storefront they can share. A parent can approve it and answer survey questions in the process.

### Week 2: Storefront + Admin + Ship

| Day | Focus | Deliverable |
|-----|-------|-------------|
| 8 | Storefront polish | Product catalog display, service cards, storefront sharing, brand card download |
| 9 | Pilot admin dashboard | Funnel visualization, category breakdown, parent survey responses, export |
| 10 | Analytics + instrumentation | PostHog events on every moment, funnel tracking, session replays configured |
| 11 | Polish + animations | Micro-interactions, loading states, transitions, responsive QA (mobile + iPad) |
| 12 | Testing + bug fixes | End-to-end testing, edge cases, performance, mobile/tablet QA |
| 13 | Deploy + handoff | Production deployment, pilot onboarding plan, documentation |

**Milestone: End of Week 2** — Stand is live. 100 families can go through onboarding, get an AI-generated logo, build their storefront with real Printify products, share it with anyone, and complete the parent gate. You have a live admin dashboard with real-time pilot data. Production-grade. Design standards met. Ready for your first cohort.

---

## What You'll Have

At the end of this sprint:

- [ ] **A production app** deployed on Vercel, installable as a PWA (works like a native app on iPad/phone)
- [ ] **The Stand Coach onboarding** — interactive, two-pane, with the Grand Reveal. Handles both product and service businesses across 6 categories.
- [ ] **AI-generated logos** — kids get a custom logo/icon for their business, generated during onboarding
- [ ] **Printify product integration** — real product mockups with the kid's branding, real wholesale pricing, real margin math
- [ ] **Live storefronts** — each kid gets a hosted storefront at standkids.com/[name] with their products, branding, and logo
- [ ] **A shareable brand card** — the viral output kids send to friends and family
- [ ] **A parent gate** with COPPA-lite consent and embedded research questions (value prop, pricing, concerns)
- [ ] **A pilot admin dashboard** for you — real-time funnel data, category breakdown, survey responses, CSV export
- [ ] **Full PostHog instrumentation** — session replays, funnel analytics, drop-off tracking on every moment
- [ ] **A design system** — built on the existing Stand brand (logo, palette, fonts), elevated and made playful. Typography, color, components, animation patterns.
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
| LLM (Claude / Anthropic) | Stand Coach conversations | ~$25 |
| AI Image Generation | Logo/icon generation per session | $5–$20 |
| Printify API | Product mockup rendering | Free (API access) |
| Data Storage (Supabase) | Database, auth | Free |
| Code Storage (GitHub) | Repository | Free |
| Recraft | Custom illustration assets | ~$10 |

**Estimated total: ~$60–$75/month** at 100 users. These are estimates and may shift as we finalize the stack. Scales linearly. The biggest variable costs (LLM at $0.25/session and image gen) have cheaper alternatives if needed — we'll use different models for different tasks to keep costs down. Your infrastructure costs for the pilot will be minimal either way.

---

## Investment

### The Deal

**$10,000 flat** for a 2-week all-out sprint.

That covers $8,000 for product engineering from me — design, code, architecture, testing, deployment — plus $2,000 for David Shimel's system architecture work upfront (auth, database schema, security guardrails, deployment pipeline). Alignment sessions are waived.

I'm clearing the calendar. 40 hours a week, fully dedicated to Stand. You'll see daily progress and have something shippable at the end.

### What's Not Included (Yet) *(Updated)*

- **Payment processing / order fulfillment** — Printify products are displayed with real pricing and margins, but no actual ordering or payment in the pilot. The architecture is designed for Stripe/Step/Greenlight integration when you're ready. Storefronts look operational — payments are the one missing piece for Sprint 2.
- **Custom domain per kid** — storefronts live at standkids.com/[name] for now. Custom domains (quincyscharms.com) are a future upsell opportunity.
- **CEO Dashboard** — the kid's post-onboarding home base (goal tracking, earnings, leveling) is deferred to Sprint 2. For the pilot, kids land on their storefront as their home base.
- **Social features** (Stand Squad, leaderboards, friends) — designed into the architecture but not built in Sprint 1. The kid interviews confirm this matters (leveling, competing with friends), but it's the retention layer — you need acquisition first.
- **Curriculum / learning modules** — the business education in Sprint 1 is baked into the experience (real margins, real pricing, real products). Structured curriculum modules (marketing, customer feedback, pivoting, new SKUs) are Sprint 2+.
- **Voice input** — stretch goal for the sprint, feature-flagged. The onboarding is tap-first with typing as fallback. If time allows, voice gets built and feature-flagged so it can be enabled per-user for testing.

---

## What I Need From You *(Updated)*

### Before Day 1
- [x] ~~Intake questionnaire~~ — received
- [x] ~~Brand assets~~ — logos (3 variants), color palette received
- [x] ~~Google Drive access~~ — planning materials received
- [ ] **GitHub repo access** — Lauren has the repo from Chris. Needs to add Andy as a collaborator.
- [ ] **Printify API access** — Account + API token for integration planning.
- [ ] **Business categories doc** — Lauren and Alex (Petra) have a working doc on the 5 pilot categories. Share final version.

### During the Sprint
- [ ] **Daily 30-min standing check-in** — text/call, every day
- [ ] **MWF 1-hour product review** — deeper dive on progress, product decisions, course corrections
- [ ] **Product decisions** — I'll flag choices as they come up (copy tone, specific design calls, which product/service mockups to include). Quick responses keep the sprint moving.
- [ ] **2-3 test families** by end of Week 1 — even just friends/family who can do a walkthrough and give raw feedback before the broader pilot

### Decisions Already Made *(Updated)*
These were open questions in earlier drafts. Now resolved:

1. **Starting categories:** Sports, Toys & Games, Fashion & Style, Cats & Dogs, Beauty & Design, Cooking — plus Other. 6 categories with subcategories, age-differentiated product lists, and fulfillment already mapped (Printify, Merchize, DIY kits). Services (dog walking, pet sitting, private training) woven into relevant categories. Categories are a working draft — Lauren finalizes during the sprint.
2. **Input methods:** Tap-first design — big buttons, chips, and preset options so 8-year-olds aren't stuck typing. Typing as a fallback for open-ended fields. Voice is a stretch goal, feature-flagged.
3. **Payment for pilot:** No real money. Printify products displayed with real pricing/margins for education. Payments are Sprint 2.
4. **Storefront:** Each kid gets a live hosted storefront at standkids.com/[name] with their products, branding, and logo. Plus a shareable brand card for viral distribution.
5. **Design system:** Built on the existing Stand brand (current logo, palette, fonts) — elevated and made more playful, not replaced. No Figma from Devin needed.
6. **Mobile vs desktop:** Mobile-first, iPad is a must.
7. **Age cohorts:** 8-11 and 11-14.
8. **AI image generation:** In scope — first version of logo/icon generation during onboarding. Will be refined post-sprint.

---

## After the Sprint

The sprint gets Stand to "shippable pilot." What comes next:

- **Pilot feedback loop** (Weeks 3-4) — Testing parties, user sessions, async feedback. Real data from real families flowing through your admin dashboard. Live recorded sessions with kids and parents.
- **Learnings report** — We pull the pilot data together: onboarding completion funnel, top categories, parent survey results, pricing sensitivity, drop-off analysis, and recommendations for MVP scope.
- **Iteration sprint** — Based on pilot data, we prioritize what to build/fix/cut. Could be another 2-week sprint or an ongoing rhythm.
- **Payment rails + live commerce** — Turn the storefronts on. Stripe integration, Printify order fulfillment, parent-controlled wallets, real money movement. The storefronts already look real — payments make them real.
- **CEO Dashboard + gamification** — Goal tracking, leveling, badges, earnings, sales tracking. The kid's home base. Informed by what kids actually responded to in the pilot.
- **Curriculum modules** — Structured business education: marketing, pricing, customer feedback, pivoting, launching new SKUs. The foundation Lauren keeps coming back to.
- **Social features** — Stand Squad, leaderboards, friend invites. The retention/viral layer.
- **AI image generation v2** — Refined logo generation, more sophisticated brand assets, cost-optimized model routing.
- **Founding engineer hire** — Once the product is validated and you're ready to scale, I help you hire your first full-time engineer and hand off a clean, well-documented codebase.

---

## Closing

In two weeks, you'll have something with soul, something you can ship to a hundred families that you're proud of. A real product where kids build a business with an AI-generated logo, see their brand on real products with real pricing, and walk away with a live storefront they can share with anyone. And you'll have a dashboard that tells you exactly what's working.
