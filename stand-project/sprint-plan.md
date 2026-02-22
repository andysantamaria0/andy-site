# Stand — Sprint Plan

---

## Pre-Start Checklist (Before Day 1)

### Lauren — Admin & Accounts
- [ ] Create shared email (admin@standkids.com) for account ownership
- [ ] Set up 1Password vault, share with Andy and David
- [ ] Create service accounts and share credentials (see service-accounts.md):
  - [ ] Vercel — add Andy and David as team members
  - [ ] Supabase — share project URL + service role key
  - [ ] PostHog — share project API key
  - [ ] Anthropic — share API key
  - [ ] Recraft — share API key
  - [ ] Printify — generate and share API token
- [ ] Confirm standkids.com domain ownership and share DNS access
- [ ] Share GitHub repo from Chris (for reference — we're building fresh in stand-app)
- [ ] Share final business categories doc from Alex/Petra

### Lauren — Product Decisions (P0)
- [ ] Sign off on business categories + subcategories
- [ ] Decide which ~10-15 Printify products to curate per category
- [ ] Define the Stand Coach voice/tone
- [ ] Decide parent gate flow: device handoff or email link?

### Andy & David — Technical Prep
- [ ] Review Chris's existing codebase (reference only)
- [ ] Review Printify API docs and test key endpoints
- [ ] Review Recraft API — test logo generation with sample prompts
- [ ] Spike on AI logo quality: which Recraft styles map to which "vibes"
- [ ] Draft Supabase schema (David)
- [ ] Set up Next.js project in stand-app repo

---

## Day 1 — Architecture + Design System Foundation

### Session 1: Kickoff with Lauren + David (1 hour)
**Label: PRODUCT ALIGNMENT**
- [ ] Intros — David meets Lauren
- [ ] Walk through the sprint plan and 13-day timeline
- [ ] Confirm accounts and credentials are all shared (flag any missing)
- [ ] Review Chris's existing codebase — anything we should preserve or reference?
- [ ] Confirm standkids.com domain setup plan

### Session 2: Product Decisions with Lauren (1 hour)
**Label: PRODUCT DECISIONS**
- [ ] Review branching doc — sign off on categories + subcategories for both age groups
- [ ] Review proposed Printify product list (8 products) — add or cut?
- [ ] Decide parent gate flow: kid hands device to mom, or mom gets an email link?
- [ ] Define the Stand Coach voice/tone — walk through examples, pick a direction
- [ ] Quick pass on vibe/style options — how many brand kits? What are they called?

### Session 3: Architecture Review with David (30 min)
**Label: TECHNICAL SYNC**
- [ ] Align on Supabase schema based on product decisions from Session 2
- [ ] Auth flow design — how COPPA-lite works given the parent gate decision
- [ ] Divide Day 1-2 work: David on infra, Andy on design system

### Solo Work: Andy (rest of day)
**Label: BUILD**
- Initialize Next.js app with project structure
- Design system foundations: typography, color tokens, spacing built on existing Stand brand
- Component library scaffolding: buttons, inputs, chips, cards
- Two-pane layout scaffold (left: input, right: live build)
- Mobile/iPad responsive foundation
- Verify deployment pipeline works (push → Vercel preview)

### Solo Work: David (rest of day)
**Label: BUILD**
- Set up Supabase project: schema, tables, RLS policies
- Auth flow design (COPPA-lite: kid alias, no real names, parent email gating)
- Deployment pipeline: Vercel project linked to stand-app repo, preview deploys on PR
- PostHog integration: project setup, basic event tracking wired in
- Printify API connection: test account, verify mockup generation flow works end-to-end

---

## Day 2 — Design System Completion + Onboarding Shell

### Andy
- Complete design system: animation patterns, transitions, loading states
- Build the two-pane onboarding shell (navigable, responsive)
- Wire up routing: onboarding → parent gate → storefront
- Implement the 6-moment flow structure (navigation between moments, progress tracking)
- Start moment 1 UI: "What do you want to be called?" — alias + avatar picker

### David
- Finalize Supabase schema: kids table, businesses table, onboarding progress, parent consent
- Auth flow implementation: kid starts session (no login), parent gate creates the auth relationship
- Storage buckets: logo assets, brand cards, storefront images
- Wrap up and hand off to Andy

---

## Day 3 — Stand Coach Moments 1-3

### Andy
- **Moment 1:** "What do you want to be called?" — CEO alias input, avatar selection, live preview on right pane
- **Moment 2:** "What do you love?" — open-ended interest input with interactive chips/buttons, AI parses into category match
- **Moment 3:** "Here's what you could build" — 2-3 curated business suggestions based on their input. Product businesses show product mockup previews, service businesses show service card previews.
- Wire up Claude API for interest → business suggestion matching
- Right pane updates live with each choice (brand colors start appearing, business type takes shape)
- PostHog events on each moment: time spent, choices made, drop-offs

### Blocking Decisions Needed by Day 3
- Coach voice/tone (P0) — needed for all onboarding copy
- Business categories + subcategories (P0) — needed for moment 3 suggestions

---

## Days 4-13 (High-Level)

| Day | Focus |
|-----|-------|
| 4 | Moments 4-6: vibe/style picker, business naming, goal setting |
| 5 | AI logo generation (Recraft) + Printify product mockup integration |
| 6 | Grand Reveal + live storefront (standkids.com/[name]) |
| 7 | Parent gate + survey |
| 8 | Storefront polish: catalog display, service cards, sharing, brand card |
| 9 | Pilot admin dashboard: funnel viz, categories, survey responses, export |
| 10 | Analytics instrumentation: PostHog events on every moment, funnels |
| 11 | Polish + animations: micro-interactions, transitions, responsive QA |
| 12 | Testing + bug fixes: end-to-end, edge cases, mobile/tablet QA |
| 13 | Deploy + handoff: production deployment, documentation |

We'll detail days 4+ as we get closer and product decisions land.
