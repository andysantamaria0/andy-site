# Sprint Notes

## Scope Change: Printify Swap (Feb 20, 2026)

**Likely change:** Swap out CEO Dashboard (Light) for Printify product mockup integration.

### Rationale

- The CEO Dashboard in the pilot is a dead end — no real transactions means kids are manually checking off goals. Weakest deliverable.
- Printify integration makes the onboarding *real*: kid picks "stickers" and sees their brand on an actual product mockup with real pricing.
- Unlocks real economics teaching (margins, pricing) which is Lauren's core thesis.
- The reveal moment gets stronger — instead of a brand card, they see their brand on a product they could actually sell.
- Answers the investor retention question: "they come back because they have real orders" instead of "they come back to check off a goal."

### What this changes in the sprint plan

| Out | In |
|-----|-----|
| CEO Dashboard (Light) — Day 8 | Printify API integration + product mockup rendering |
| Manual goal tracking | Real product selection with margin calculator |
| Post-onboarding pulse survey | Product visualization in onboarding right pane |

### What stays the same

- Onboarding (6 moments) — the hero feature
- Grand Reveal + Shareable Brand Card (now even better with real product mockups)
- Parent Gate + Pilot Survey
- Pilot Admin Dashboard (Lauren's)
- Landing page, design system, analytics, everything else

### Open questions

- Does Lauren want Printify for the full product catalog or just mockup rendering?
- Which Printify products to include in pilot? Likely: stickers, t-shirts, mugs, tote bags (low cost, high margin, kid-friendly)
- Service businesses still get a service card (no Printify needed) — that path is unchanged

### Status

Pending Lauren confirmation. Andy expects this will happen. Discuss on next call (Feb 20).

---

## Day 0 — Pre-Sprint Setup (Before Monday Feb 24)

### Goal
Get every account, credential, and access issue out of the way so Monday morning is pure building. One call with all three (Andy, David, Lauren). Budget 60-90 minutes.

### Checklist

**Accounts & Access**

- [ ] **GitHub repo** — Get access from Chris (transfer or collaborator invite). Or: decide to start fresh repo. Either way, Lauren owns the org.
- [ ] **Vercel** — Create project. Decide: under Lauren's account or Andy's? Lauren should own it long-term. Add Andy and David as team members.
- [ ] **Supabase** — New project. Lauren as owner, Andy and David as admins. David configures schema + auth on Days 1-2.
- [ ] **PostHog** — Create account. David configures during Days 1-2. Lauren added as viewer so she can see session replays later.
- [ ] **Anthropic API** — Lauren creates account, generates API key for Stand Coach. Andy sets up model routing (cheap models for simple tasks, Claude for the coach conversation).
- [ ] **Domain / DNS** — What's the URL? Options: stand.app, trystand.com, something on Lauren's existing domain? Needs to be decided and DNS pointed at Vercel.
- [ ] **1Password** — Lauren creates a shared vault ("Stand Engineering"). Adds Andy and David. Every API key, login, and credential goes here. Nothing in Slack DMs or texts.
- [ ] **Recraft** — Lauren signs up ($10/mo). For custom illustrations — no emojis, hand-drawn style icons per the design system.
- [ ] **ElevenLabs** — Only if voice is in scope. Can wait.

**Communication & Tooling**

- [ ] **Slack channel or group** — Where quick decisions happen during the sprint. Needs to be something Lauren checks. If she's not a Slack person, iMessage group works.
- [ ] **Linear** — Andy sets up workspace + project. Andy and David use this for sprint tracking. Lauren does NOT need access — she gets daily Looms instead.
- [ ] **Loom** — Andy records 3-5 min end-of-day video showing progress. Screen-share the running app, narrate what changed, flag what's next. Paired with a short written summary (bullets) in the Slack/text channel.

**Design Decisions (Lauren)**

- [ ] **Pick a design direction** — Lauren reviews the 4 explorations (Varsity, Patina, Carbon, Arcade) and picks one or gives a top 2 to refine on Day 1. Link: the `design-explorations/index.html` file Andy already built.
- [ ] **Lock the 4-6 pilot business types** — Recommendation based on research: Food & Treats, Crafts & Accessories, Personal Care (products) + Pet Care, Tutoring & Teaching (services). Maybe Custom Merch as 6th if Printify comes in. Lauren confirms or swaps.
- [ ] **Printify decision** — In or out for Sprint 1? If in, CEO Dashboard drops out. (See scope change notes above.)

**Assets Lauren Sends**

- [ ] **Figma files** — Whatever Devin created, even if she doesn't love it. Useful reference.
- [ ] **Printify SDK/docs** — If Printify is in scope, Lauren already received something from them.
- [ ] **Sabina's marketing copy** — Landing page language, personas, any brand voice work.
- [ ] **The Cut article + Gen Alpha investing article** — Lauren mentioned sending these on the Feb 19 call.

### Operating Rhythm for the Sprint

**Daily (Andy)**
- Build all day
- End of day: Record Loom (3-5 min, show the running app)
- End of day: Post written summary in Slack/text (bullets — what shipped, what's next, any decisions needed)

**2-3x/week (Andy + Lauren)**
- Quick call (15-30 min) to review progress, make product decisions, course-correct
- Scheduled in advance so Lauren can plan around them

**As needed (Andy + David)**
- Async in Linear + Slack
- David reviews PRs that touch infra/auth/schema
- Short sync call only if something is blocked

**David's hours (~5-6 total)**
- Day 0: On the setup call, owns Supabase + PostHog configuration
- Days 1-2: Schema, auth (COPPA-lite parent gate flow), deployment pipeline (~3-4 hrs)
- Days 3-14: PR reviews + architecture questions as needed, async (<30 min/day, most days nothing)
