# Product Concept: The Six Moments

*Captured Feb 17, 2026 — Redesign of the 14-step form flow into 6 conversational moments*

---

## The Problem with the Current Flow

The existing prototype has **14 steps** organized into 4 phases (Dream → Design → Pitch → Launch). It's a traditional form journey: pick a category, pick a subcategory, pick a product, type a name, pick colors. Too many steps, too many choices, too much fatigue. Kids lose interest long before the payoff.

## The Redesign: 6 Moments

Instead of designing intake by listing what we need to ask, we designed **backward from output** — what data do we actually need to deliver the three main features (onboarding/brand reveal, product marketplace, dashboard/storefront)?

### Moment 1 — "What do you want to be called?"
- **Input:** CEO alias + avatar selection + age
- **Why alias, not real name:** Fun ("Q-Money" > "Quincy"), COPPA-friendly (no PII from kids), feels like a CEO identity
- **Avatar:** Pick from a set of cool characters/icons — becomes their brand mark
- **Age:** Light touch, helps the coach calibrate language and suggestions
- **Right pane update:** Avatar appears, "CEO [alias]" renders on a badge/nameplate

### Moment 2 — "What do you love?"
- **Input:** Open-ended — kid types or talks about what they're into
- **NOT a category picker.** "I love making bracelets and my dog Biscuit" is infinitely richer than checking "Fashion" and "Pets"
- **The Coach parses this** using Claude to extract interests, passions, energy
- **Right pane update:** Interest keywords animate in as tags/bubbles, mood imagery shifts

### Moment 3 — "Here's what you could sell"
- **Input:** Kid picks from 2-3 curated product suggestions
- **The app generates suggestions** based on Moment 2, matched against the product catalog (Printify/partner inventory)
- **Each suggestion is visual** — product mockup, not just text
- **Right pane update:** Selected product appears as a hero mockup, starts taking shape with their brand

### Moment 4 — "What's your style?"
- **Input:** Pick a vibe from visual mood boards (not color pickers)
- **Options like:** "Sweet & Sparkle" / "Street & Bold" / "Chill & Nature" / "Retro & Fun"
- **Each vibe is a pre-designed brand kit:** color palette, typography feel, pattern/texture, product mockup styling
- **Right pane update:** The entire preview recolors/restyles — product, storefront, brand — all at once. This is the big "wow" moment.

### Moment 5 — "Name your business"
- **Input:** Type a business name (Coach can suggest options based on everything so far)
- **Right pane update:** Name appears on storefront header, business cards, product labels — everywhere. The business becomes real.

### Moment 6 — "Set your goal"
- **Input:** What do you want to do with the money? + How much?
- **Goal types:** Save It / Buy Something / Give Back / Split It
- **Right pane update:** Goal tracker animates into the dashboard preview, target amount displayed

## Pricing: The Hidden 7th Moment

Instead of asking kids "how much should this cost?" (which is an impossible question for a 9-year-old), pricing is handled through **positioning**:

### Three Tiers
| Tier | Label | Meaning |
|------|-------|---------|
| 1 | **For Everyone** | Affordable, accessible, high volume |
| 2 | **Sweet Spot** | Mid-range, recommended default |
| 3 | **Extra Special** | Premium, exclusive, lower volume |

### How It Works
1. Kid selects a positioning tier (visual, not numerical — "Do you want EVERYONE to have one, or should it be something really special?")
2. App already knows the product type (from Moment 3) and wholesale/production cost
3. App already knows the goal amount (from Moment 6)
4. **App calculates backward:** If the goal is $100 and the tier is "Sweet Spot," the app suggests a price of ~$15-20, which means ~6-8 sales to hit the goal
5. The target of **~10 sales** is the sweet spot for engagement — enough to feel achievable, enough to keep checking the dashboard, enough to learn from the selling process

### Why This Is Powerful
- **Kids don't need to understand pricing** — they understand "for everyone" vs "extra special"
- **The goal creates a natural retention loop** — the dashboard tracks progress toward the goal, giving kids a reason to come back
- **~10 sales as a target** means the kid has ~10 meaningful interactions with customers (like Dev and his Donut Hats), which IS the learning experience
- **The selling journey becomes the product**, not just the storefront

## Data Model

After the 6 moments, we have everything we need:

```json
{
  "ceo_alias": "Q-Money",
  "avatar": "🦊",
  "age": 8,
  "interests_raw": "I love making bracelets and my dog Biscuit",
  "business_type": "custom-bracelets",
  "pricing_tier": "sweet-spot",
  "suggested_price": 15.00,
  "style": "sweet-sparkle",
  "color_palette": ["#FFB6C1", "#FFD700", "#FFF5EE"],
  "business_name": "Quincy's Charm Co.",
  "goal_amount": 50,
  "goal_purpose": "Save for a skateboard",
  "goal_type": "buy-something",
  "parent_contact": "mom@email.com"
}
```

## Feature Coverage

| Feature | Data Needed | Source Moment |
|---------|-------------|---------------|
| **Brand/Reveal** | alias, avatar, style, business name, colors | Moments 1, 4, 5 |
| **Product Marketplace** | interests, product type, pricing tier, suggested price | Moments 2, 3, Pricing |
| **Dashboard/Storefront** | all of the above + goal | Moment 6 + all |
| **COPPA Compliance** | alias (not real name), age, parent contact | Moments 1, 6 |

## vs. Current Prototype

| Current (14 steps) | Redesign (6 moments) |
|---------------------|----------------------|
| Pick a category | Tell me what you love |
| Pick a subcategory | (parsed by AI) |
| Pick a product | Here are 2-3 suggestions |
| Type your name | What do you want to be called? |
| Pick colors | Pick a vibe |
| Pick a logo style | (included in vibe) |
| Set a price | For everyone or extra special? |
| Multiple "reveal" screens | One continuous build |
| ~8-10 minutes | ~3-4 minutes |
| Feels like a form | Feels like brainstorming with a coach |
