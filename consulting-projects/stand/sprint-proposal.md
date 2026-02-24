# Stand — Sprint Proposal

*From Andy Santamaria — Feb 2026*

---

## Basecamp

You've already done a lot. You've raised capital, built a prototype, ran a physical beta, interviewed kids and parents, surveyed families, and know what you want Stand to feel like. What's missing is the bridge between the vision in your head and a product that families can actually use. Something with Soul.

That's what this sprint is.

But we're early — and that's the right time to be flexible. The product is going to evolve as we build it together. Rather than locking in a rigid list of deliverables, this engagement is about getting my full attention and David's architectural expertise pointed at Stand for two weeks. We'll set up the infrastructure, start building, ship versions to you constantly, and iterate until we land on something you're proud of.

The reason this works: David and I will build a strong but flexible architecture from Day 1 — the kind of foundation that lets us iterate quickly on the product without cutting corners. That means we can try things, adjust direction, and commit to the right services, UX, and UI as the product takes shape, while still shipping and maintaining something that's professional-grade and safe for real users. You get speed and flexibility without sacrificing quality.

In practice, it'll feel like I'm on your team — not a contractor handing off a spec. We'll talk every day, I'll ship you working builds, you'll react, we'll adjust, and we'll keep going.

---

## What We Already Know

Before we build, here's what your existing research tells us:

**Business categories (6 for pilot + Other):**
Lauren and Alex (Petra) have built a detailed product catalog with fulfillment paths already mapped. The current 6 categories are: **Sports**, **Toys & Games**, **Fashion & Style**, **Cats & Dogs**, **Beauty & Design**, and **Cooking** — plus an **Other** option. Each category has subcategories and products mapped by age cohort (8-12 and 12-15).

**Pricing:** 65% of surveyed parents will pay $25+. 35% will pay $36+. The sweet spot is $25-35/month.

**What motivates kids:** Money first, then accomplishment/goals, then friends. Leveling up and unlocking tiers came up unprompted in every conversation.

**What parents want:** Financial literacy (71%), confidence/social skills (67%), earning potential (53%). Time commitment: 5 min/day max to 1-2 hours/week.

**Platform:** Mobile-first, iPad is a must. 64% iOS.

**Target cohorts:** 8-11 and 11-14.

---

## The Engagement

### What You're Getting

You're buying dedicated product engineering and senior engineering time, focused entirely on Stand for two weeks.

- **Andy Santamaria — Product Engineer:** 40 hours/week. Design, code, product thinking, testing, deployment. I'll be building the app with you day by day.
- **David Shimel — Engineering Leader:** 6 hours total. System architecture, auth, database design, deployment pipeline, security guardrails. The technical foundation that lets me move fast and safe.

### How It Works

This is a collaborative build, not a spec-and-deliver contract. Here's what that looks like in practice:

- **Day 1-2:** David and I set up the infrastructure — Supabase, auth, deployment, analytics, the design system foundation. You and I align on what we're building first.
- **Day 3 onward:** I'm shipping you working builds constantly. You react, we adjust, I keep building. We're iterating toward the version of Stand that feels right.
- **Daily 30-min check-in** — quick sync on progress and priorities
- **MWF 1-hour product session** — deeper review, product decisions, course corrections
- **Async throughout** — I'll flag decisions as they come up, you respond when you can

The goal is to move fast, stay flexible, and get to a product you can put in front of real families. If we nail it before two weeks, great. If we need to adjust direction mid-sprint, that's the whole point.

### The Direction

Based on everything we've discussed, here's the general direction we'll be heading — but all of this is subject to change as we build and learn together:

- **An onboarding experience** where kids build their business with a Stand Coach
- **AI-generated branding** — logos, visuals, something that makes it feel real and theirs
- **Product integration** — showing kids real products with real pricing so the economics feel tangible
- **A live output** the kid can share — storefront, brand card, something they're proud of
- **A parent gate** that handles consent and doubles as a research instrument for you
- **Analytics** so you can see what's working and what's not
- **The infrastructure** to support all of it — auth, database, hosting, the works

These aren't fixed deliverables — they're the vision we're building toward. What actually ships will be shaped by our daily collaboration.

---

## The Approach

### Phase 1 — Alignment (Complete)
Calls done. Intake questionnaire received. Materials reviewed — pitch docs, kid interviews, survey results, brand assets, color palette, logos. This proposal formalizes the plan.

### Phase 2 — Infrastructure + Design Foundation (Days 1-2)
David sets up the technical foundation. I build the design system on the existing Stand brand — elevated, not replaced. By end of Day 2, we have a working scaffold and can start building features.

### Phase 3 — Build + Iterate (Days 3-12)
This is the bulk of the engagement. I'm building, you're reviewing, we're iterating. Daily builds, constant feedback. The product takes shape through collaboration, not a handoff.

### Phase 4 — Polish + Ship (Days 13-14)
Lock in what we've built, polish the rough edges, deploy to production. Get it ready for real families.

---

## Infrastructure Costs

David Shimel is laying out the system architecture. Estimated costs to run Stand:

| Service | What | Cost/month |
|---------|------|------------|
| Compute (Vercel) | Application hosting | ~$10 |
| LLM (Claude / Anthropic) | AI features | ~$25 |
| AI Image Generation | Logo/visual generation | $5–$20 |
| Data Storage (Supabase) | Database, auth | Free tier |
| Code Storage (GitHub) | Repository | Free |

**Estimated total: ~$40–$55/month** at pilot scale. The exact stack and costs will depend on what we build.

---

## Investment

### The Deal

**$10,000 flat** for a 2-week embedded product engineering sprint.

That covers:
- **Andy Santamaria** — 40 hours/week of product engineering (design, code, product, testing, deployment)
- **David Shimel** — 6 hours of senior engineering (system architecture, auth, database, security, deployment pipeline)
- **Daily collaboration** — check-ins, product sessions, async communication throughout

This is a time-based engagement with a price cap. You're getting our full attention for two weeks at a fixed cost — no hourly surprises, no scope creep charges. Alignment sessions are waived.

### Payment Schedule

| Milestone | Amount | Due |
|-----------|--------|-----|
| Upon signing | $5,000 | Before work begins |
| End of sprint | $5,000 | Net 5 business days from final day |

### What's Not Included

- **Payment processing / order fulfillment** — no real transactions in the pilot
- **Ongoing maintenance or support after delivery** — available as a separate retainer
- **Third-party service costs** — infrastructure costs listed above are Client's responsibility

---

## What I Need From You

### Before Day 1
- [ ] **GitHub repo access** — Lauren has the repo from Chris. Needs to add Andy as a collaborator.
- [ ] **Printify API access** — if we go the Printify route, we'll need an account + API token
- [ ] **Business categories doc** — the latest version of Lauren and Alex's working doc

### During the Sprint
- [ ] **Daily 30-min check-in** — text/call, every day
- [ ] **MWF 1-hour product review** — deeper dive on progress, decisions, direction
- [ ] **Product decisions** — I'll flag choices as they come up. Quick responses keep us moving.
- [ ] **2-3 test families** by end of Week 1 — even just friends/family for raw feedback

---

## After the Sprint

At the end of two weeks, you'll have a production-deployed application and the foundation to keep building. What comes next depends on where we land:

- **Continued sprints** — if we want to keep going, we scope the next engagement based on what we learned
- **Maintenance retainer** — optional ongoing support to keep things running and handle small updates
- **Handoff** — clean codebase, documentation, and knowledge transfer if you're bringing on your own team

---

## Closing

In two weeks, you'll have something real — built by someone who's fully in it with you, not handing off a spec from a distance. The product will be shaped by our daily collaboration, and the goal is simple: get to something you're proud to put in front of families.

Let's build.
