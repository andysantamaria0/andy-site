# Stand — Technical Overview for David

Hey David — this is everything we've decided so far on the technical side. Nothing is locked in stone on the architecture; you're the system architect, so push back on anything that doesn't make sense. This is meant to get you up to speed fast so we can hit the ground running on Day 1.

---

## What We're Building

Stand is a kid entrepreneurship app. Kids (ages 8-14) go through a guided onboarding experience where they pick a business type, customize their brand, and get a live storefront at `standkids.com/[business-name]`. Parents go through a consent gate before anything goes live.

This is a 2-week pilot sprint. The goal is a working product that Lauren can put in front of 2-3 test families by end of Week 1.

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | **Next.js** (App Router) | Server components + client components |
| Hosting | **Vercel** | Push-to-deploy, preview builds on PR |
| Database | **Supabase** | Postgres, Auth, Storage, RLS |
| AI (Coach) | **Claude API** (Anthropic) | Powers the Stand Coach — interest parsing, business suggestions |
| AI (Logos) | **Recraft API** | Vector logo/icon generation (outputs native SVG) |
| Products | **Printify API** | Product mockup rendering (visual only, no orders) |
| Analytics | **PostHog** | Event tracking, funnels, session replays |
| Domain | **standkids.com** | Storefront URLs: `standkids.com/[business-name]` |

---

## Core Product Flow

```
Kid opens app
  → Onboarding (6 guided moments, two-pane UI)
    → Moment 1: "What do you want to be called?" (alias + avatar)
    → Moment 2: "What do you love?" (interest → category matching via Claude)
    → Moment 3: "Here's what you could build" (2-3 business suggestions)
    → Moment 4: Pick your vibe/style (brand kit selection)
    → Moment 5: Name your business
    → Moment 6: Set your goal
  → AI logo generated (Recraft)
  → Product mockups generated (Printify)
  → Grand Reveal (animated brand reveal)
  → Parent Gate (COPPA-lite consent + survey)
  → Live Storefront (standkids.com/[name])
```

The onboarding is a **two-pane layout**: left side is conversational input (the Stand Coach guiding the kid), right side is a live preview that updates as they make choices — brand colors appear, business name shows up, products start rendering.

---

## Your Focus Areas (Days 1-2)

Based on the sprint plan, here's what we're thinking for your scope:

### Day 1
- **Supabase project setup**: schema, tables, RLS policies
- **Auth flow design**: COPPA-lite approach (see below)
- **Deployment pipeline**: Vercel project linked to `stand-app` repo, preview deploys on PR
- **PostHog integration**: project setup, basic event tracking wired in
- **Printify API connection**: test the account, verify mockup generation works end-to-end

### Day 2
- **Finalize Supabase schema**: kids table, businesses table, onboarding progress, parent consent
- **Auth flow implementation**: kid starts session (no login), parent gate creates the auth relationship
- **Storage buckets**: logo assets, brand cards, storefront images
- **Wrap up and hand off to Andy**

You're capped at 6 hours total for the engagement. We should front-load your work on Days 1-2 so the infra is solid and I can build on top of it for the rest of the sprint.

---

## Auth / COPPA-Lite Flow

This is one of the trickier design decisions and depends on a product call with Lauren on Day 1. Two options:

**Option A: Device Handoff**
Kid goes through onboarding on a device → at the parent gate, kid hands the device to their parent → parent enters email, answers survey, gives consent → device goes back to kid → storefront is live.

**Option B: Email Link**
Kid goes through onboarding → at the parent gate, kid enters parent's email → parent gets an email with a link → parent clicks link, answers survey, gives consent on their own device → kid's storefront goes live.

Key constraint: **no kid accounts with real names or emails**. Kids get an alias ("CEO name") and an anonymous session. The parent gate is what creates the real auth relationship (parent email → kid's business). This is COPPA-lite — we're not collecting data from kids under 13.

The schema needs to support:
- Anonymous kid sessions (onboarding progress saved without auth)
- Parent consent records (email, timestamp, survey responses)
- Linking a parent to a kid's business after consent

---

## Supabase Schema (Rough Sketch)

This is a starting point — redesign as you see fit.

**`kids`**
- `id` (uuid, PK)
- `alias` (text) — their CEO name
- `avatar` (text) — avatar selection
- `session_id` (text) — anonymous session identifier
- `created_at` (timestamptz)

**`businesses`**
- `id` (uuid, PK)
- `kid_id` (uuid, FK → kids)
- `name` (text) — business name
- `slug` (text, unique) — URL slug for storefront
- `category` (text) — Sports, Fashion, etc.
- `subcategory` (text)
- `business_type` (text) — product or service
- `vibe` (text) — brand kit / style selection
- `logo_url` (text) — Recraft-generated logo (stored in Supabase Storage)
- `brand_colors` (jsonb) — palette derived from vibe selection
- `goal` (text)
- `status` (text) — draft, pending_consent, live
- `created_at` (timestamptz)

**`onboarding_progress`**
- `id` (uuid, PK)
- `kid_id` (uuid, FK → kids)
- `current_moment` (int) — 1-6
- `moment_data` (jsonb) — choices made at each moment
- `updated_at` (timestamptz)

**`parent_consents`**
- `id` (uuid, PK)
- `business_id` (uuid, FK → businesses)
- `parent_email` (text)
- `consent_given` (boolean)
- `survey_responses` (jsonb)
- `consented_at` (timestamptz)

**`products`** (per-business product catalog)
- `id` (uuid, PK)
- `business_id` (uuid, FK → businesses)
- `printify_product_id` (text)
- `title` (text)
- `mockup_url` (text) — generated mockup image
- `wholesale_price` (numeric)
- `retail_price` (numeric)
- `sort_order` (int)

**Storage Buckets:**
- `logos` — Recraft SVGs + rasterized PNGs
- `mockups` — Printify-generated product images
- `brand-cards` — Shareable brand card images

**RLS:**
- Storefronts are public (anyone can view `standkids.com/[name]`)
- Onboarding data is session-scoped (kid can only see their own)
- Parent consent is private
- Admin dashboard reads need a service role or admin policy

---

## Printify Integration (Visual Only)

This is **mockup generation only** — no orders, no payments, no fulfillment. We render the kid's logo/branding on real products so they can see what their merch would look like.

### How It Works

1. **Printify REST API** (not an SDK, just HTTP calls)
2. Kid picks a product type (e.g., T-shirt)
3. We call Printify's mockup generation endpoint with their logo + product ID
4. **Mockup generation is async**: you POST the request, get a task ID, then poll until done
5. Typical wait: **5-15 seconds** per mockup
6. We download the mockup image and store it in Supabase Storage

### Key Endpoints
- `GET /shops/{shop_id}/products.json` — list products
- `POST /shops/{shop_id}/products.json` — create a product (triggers mockup generation)
- `GET /shops/{shop_id}/products/{product_id}.json` — check status, get mockup URLs
- `GET /uploads/mockup-tasks/{task_id}.json` — poll for mockup completion

### Printify Account
Lauren creates a free Printify account and generates an API token. API access is free — Printify only charges when actual orders are placed (which we're not doing).

### Timing Strategy
The 5-15 second mockup generation wait is a UX problem. The current plan is to kick off mockup generation right after the kid picks their business type (Moment 3), then use the remaining onboarding moments (4-6: vibe picker, naming, goal) as a natural buffer. By the time they reach the Grand Reveal, mockups should be ready. If not, we show a loading state.

### Proposed Product Set (8 items for pilot)
1. T-Shirts
2. Sweatshirts
3. Posters & Artwork
4. Backpacks
5. Decorated Makeup Bags
6. Dog Bandanas
7. Hair Bows & Scrunchies
8. Dance Bags

This list needs Lauren's sign-off. There are more products in the branching doc but these are the ones that map cleanly to Printify.

---

## Recraft (AI Logo Generation)

We chose Recraft over DALL-E 3, Ideogram, Midjourney, and Stable Diffusion. Reasons:

- **Native SVG output** — this is the big one. Logos need to be vector so they can go on products at any resolution. Other services output rasterized PNGs that look terrible scaled up on a T-shirt.
- **Dedicated logo/icon styles** — Recraft has specific style presets for logos, not just general image generation.
- **Best-in-class text rendering** — logos often include the business name, and most AI image generators butcher text.
- **$0.08/image** — cheap enough for a pilot.

### Flow
1. Kid completes onboarding (business name, vibe/style, category)
2. We construct a prompt: business name + style preset + category context + safety guardrails
3. Call Recraft API → get SVG back
4. Store SVG in Supabase Storage
5. For Printify mockups, we rasterize the SVG to high-res PNG using **Sharp** (built into Next.js, no extra dependency)

### Safety
We need a system-level prompt to keep generated logos appropriate for kids. No violence, no inappropriate imagery, age-appropriate everything. The prompt will include the business name, category, and vibe — all constrained by our UI (kids pick from predefined options, they don't type freeform prompts).

### Open Question
How many vibe/style presets do we offer? ("Fun & Colorful", "Cool & Minimal", etc.) Each maps to a Recraft style parameter. This is a product decision for Lauren.

---

## Claude API (Stand Coach)

The Stand Coach is the conversational guide through onboarding. It uses the Claude API for:

1. **Interest → Category Matching** (Moment 2): Kid types what they're into → Claude parses it and maps to one of the 6 categories + subcategories
2. **Business Suggestions** (Moment 3): Based on the matched category, Claude generates 2-3 business ideas with product/service options
3. **Onboarding Copy**: The coach personality/tone throughout (pending Lauren's voice/tone decision)

This isn't a chatbot — it's structured AI calls at specific moments. The kid interacts through our UI (buttons, chips, text inputs), and Claude processes behind the scenes.

---

## PostHog Analytics

Free tier gives us 1M events/month and 5K session replays/month — plenty for a pilot.

What we're tracking:
- Funnel events on each onboarding moment (start, complete, drop-off)
- Time spent per moment
- Category/subcategory selections
- Parent gate conversion rate
- Survey responses
- Storefront views

Session replays are configurable directly in PostHog by Lauren — we just need the JS snippet wired in.

---

## Pilot Admin Dashboard

Lauren gets an admin view at a protected route with:
- Real-time funnel visualization (how many kids at each moment)
- Category breakdown (which businesses are most popular)
- Survey responses from parent gate
- CSV export of all data

This is a Day 9 build item — straightforward once the data model is in place.

---

## Deployment

- **Repo**: `github.com/andysantamaria0/stand-app` (private, you have admin access)
- **Hosting**: Vercel, push-to-deploy from `main`
- **Preview Deploys**: Every PR gets a preview URL
- **Domain**: `standkids.com` pointed at Vercel (Lauren needs to confirm DNS ownership)
- **Home Screen**: The app will be saveable as a home screen bookmark on iOS (not a full PWA — just proper meta tags and icons)

---

## Business Categories (from Alex/Petra Branching Doc)

The product catalog is already mapped across 6 categories for two age groups (8-12 and 12-15):

1. **Sports** — Soccer, Football, Tennis & Golf, Baseball/Softball, Dance & Gym
2. **Toys & Games** — Magic, Slime, Cars/Hot Wheels, Video Games
3. **Fashion & Style** — Clothing, Bags/Purses, Shoes, Accessories
4. **Cats & Dogs** — Dogs, Cats (includes service businesses: walking, sitting)
5. **Beauty & Interior Design** — Makeup, Skincare, Nails, Hair Care, Home Decor
6. **Cooking** — Homemade Treats, Delicious Drinks, Snacks
7. **Other** — open-ended

Each subcategory maps to specific products and fulfillment types. Some are Printify (T-shirts, posters), some are DIY/handmade (slime, fudge), some are services (dog walking, private training). The full mapping is in `stand-project/reference/stand-platform-branching.xlsx`.

---

## Key Files in This Repo

All sprint planning docs are in `stand-project/`:

- `proposal/contract.md` — the signed contract (scope, exclusions, payment)
- `proposal/sprint-proposal.md` — the client-facing proposal
- `product-decisions.md` — prioritized list of decisions needing Lauren's sign-off
- `service-accounts.md` — accounts Lauren needs to create
- `sprint-plan.md` — day-by-day sprint plan with your Day 1-2 tasks
- `reference/stand-platform-branching.xlsx` — Alex/Petra's category → product mapping
- `reference/designer-asset-brief.md` — brand assets brief

---

## What's NOT in Scope

Explicitly excluded from this sprint (in the contract):

- Printify order fulfillment / payments
- Custom domains (just `standkids.com/[name]`)
- CEO Dashboard (kid's post-onboarding home base)
- Curriculum / learning modules
- Social features (leaderboards, friends)
- Voice input
- Ongoing maintenance after delivery

---

## Open Questions for Day 1

These will be decided in the Day 1 sessions with Lauren:

1. Parent gate flow: device handoff or email link? (changes auth significantly)
2. Coach voice/tone (affects all onboarding copy)
3. Final sign-off on business categories + Printify product list
4. How many brand kit / vibe options?

After those decisions land, we can finalize the schema and start building.

---

Let me know what questions you have. Looking forward to working together on this.
