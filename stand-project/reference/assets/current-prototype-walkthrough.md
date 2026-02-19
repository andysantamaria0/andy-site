# Stand Prototype — Full Walkthrough

*Source: https://stand-app-omega.vercel.app/*
*Built by Chris on Claude Code, deployed on Vercel*
*Documented: Feb 17, 2026*

---

## Tech Stack
- **Framework:** Next.js (React)
- **Fonts:** Nunito (body), Fredoka (display), Fraunces (brand)
- **Theme:** Dark background with vibrant accents
- **Special colors:** "founder-red" (#cd171a), "lemonade" (#ffd93d), "lawn-money" (#4caf50)
- **Features:** QR code generation, email sending, PWA support

## Progress: 14 Steps Total

The flow is organized into 4 phases: **Dream → Design → Pitch → Launch**

---

## Phase 1: DREAM

### Step 1 — Splash Screen
- Heading: "stand"
- Subtitle: "Your first business starts here!"
- Description: "For kids ages 7-15"
- Three tags: "Dream" / "Design" / "Launch"
- Button: **"Jump In"**

### Step 2 — About You Intro
- Title: "Are you ready to build your company?"
- Subtitle: "First, tell us about yourself"
- Lists what they'll ask: Name, Location, Age
- Button: **"Next →"**

### Step 3 — Personal Info Form
- "What's your name?" (text input)
- "Where do you live?" (text input)
- "How old are you?" (age selector, options 7-15)
- Button: **"That's me"**
- Confirmation: "Nice to meet you, [name]!"

### Step 4 — Interest Selection
- Title: "What are you into?"
- Description: "Choose up to 2 areas to start your business around"
- **5 Categories:**
  - Sports
  - Fashion & Style
  - Cats & Dogs
  - Beauty & Design
  - Cooking
- Helper: "You can select up to 2 categories"
- Button: **"Continue with [X] interest(s)"**

### Step 5 — Subcategory Selection
- Title: "Pick up to 2 things you like most"
- Shows selected category with icon
- **Subcategories by category:**
  - **Sports:** Soccer, Football, Tennis & Golf, Baseball/Softball, Dance & Gym
  - **Fashion:** Clothing, Bags, Shoes, Jewelry & Accessories
  - **Pets:** Dogs, Cats
  - **Beauty:** Makeup, Skincare, Nails, Hair Care, Home Decor
  - **Cooking:** Homemade Treats, Delicious Drinks, Snacks
- Button: **"I like these" / "These are my interests"**

### Step 6 — Product Selection
- Title: "What would you want to sell?"
- Description: "Choose 1 thing to sell from each"
- **Products by subcategory:**
  - Soccer → soccer balls, jerseys, headbands
  - Football → footballs
  - Tennis & Golf → golf balls, polos
  - Baseball → baseballs
  - Dance & Gym → dance bags, leotards
  - Clothing → t-shirts, sweatshirts
  - Bags → bag charms
  - Shoes → shoe charms, sneakers
  - Jewelry → bracelets
  - Dogs → dog treats, custom dog bandanas
  - Cats → cat treats, knit cat toys
  - Makeup → makeup bags, compact mirrors, lip gloss
  - Skincare → spa headbands
  - Nails → nail polish
  - Hair Care → decorated hair brushes
  - Home Decor → candles, posters, blankets
  - Homemade Treats → brownies, cookies
  - Delicious Drinks → lemonade, hot cocoa
  - Snacks → popcorn mix, snow cones
- Button: **"Continue to my next interest" / "That's My Product!"**

### Step 7 — Product Reveal
- Milestone: "Locked in." (Dream phase complete)

---

## Phase 2: DESIGN

### Step 8 — Brand Intro
- "Great! Let's create your brand"

### Step 9 — Brand Name
- "What's your brand name?" (text input)

### Step 10 — Color Selection
- Primary color picker
- Secondary color picker
- Color labels: White, Light, Gray, Dark, Charcoal, Black
- "Your Brand Color" label

### Step 11 — Logo Style / Vibe
- Logo vibe selection (style preferences)
- Emoji/icon picker for logo

### Step 12 — Brand Reveal
- Milestone: "Your brand looks AMAZING!" (Design phase complete)
- Shows generated brand assets

### Business Toolkit (sub-step)
- Title: "Business Toolkit"
- Items: Business Cards, Certificate, Your Logo
- Preview button for each
- Button: **"Continue"**

---

## Phase 3: PITCH

### Step 13 — Business Plan Presentation
- Title: "Present your business plan"
- Subtitle: "Every great business needs someone who believes in it"
- Steps listed:
  1. "First, set your money goal"
  2. "Then, show off your business plan"
  3. "Get a grown-up to invest!"
- Button: **"Let's Go!"**

### Set Goal (sub-step)
- Title: "Set your goal!"
- "What do you want to do with the money?"
- **Goal types:**
  - "Save It" — Put it in the bank!
  - "Buy Something" — Get something special
  - "Give Back" — Help others
  - "Split It" — A little of each!
- Input: "How much do you want to earn?" ($ prefix)
- If "Buy Something": "What do you want to buy?"
- If "Give Back": "Who do you want to help?"
- If "Split It": Default allocation "Save: 50% | Spend: 30% | Give: 20%"
- Button: **"See My Business Plan!"**

### Step 14 — Investor (Parent Approval)
- Title: "Find Your Investor!"
- Subtitle: "Ask a parent or guardian to approve your business"
- **Two methods:**
  - "Scan QR" (generates QR code)
  - "Send Email" (input: parent@email.com → "Send Link")
- Status: "Waiting for investor..." → "Email sent!" → "Investor Found!"
- Milestone: "You got a deal. Well Done!" (Pitch phase complete)

---

## Phase 4: LAUNCH

### CEO Confirmation
- Title: "Congratulations, CEO!"
- Subtitle: "Your investor approved your business!"
- Stats: CEO Name, Age, Business, Goal
- Button: **"Go To Dashboard!"**
- Milestone: "You launched! Start selling."

### Dashboard
- Shows brand name and CEO info
- **Goal Progress** — earnings tracker
- Quick stats: Earned, Sales, Day
- **Quick Actions:**
  - Record a Sale
  - Add Photo
  - Update Goal
- "More Features Coming Soon!"

---

## Analytics Events Tracked
- session_started
- phase_dream_started
- phase_design_started
- phase_pitch_started
- phase_launch_completed
- brand_name_entered
- primary_color_selected
- logo_selected
- goal_set
- parent_consent_given
- shop_viewed
- shop_order_placed

---

## Observations & Gaps

### What's working (per Lauren):
- The basic flow logic makes sense: interests → narrow → product → brand → pitch → launch
- QR code for parent approval is a good idea (Chris's contribution)
- Voice input was attempted but didn't quite work

### What's NOT working (per Lauren):
- "Looks vibe coded" — no real branding applied
- Category selection feels overwhelming with too many options
- Design feels like "lovable prototype" — not shippable
- Logo generation via AI image generators isn't good enough
- The "reveal moment" doesn't deliver enough excitement
- Missing the magic/animation that kids expect
- Onboarding feels too long/overwhelming
- The dashboard is bare
- No social/community features (Stand Squad, friends)
- No product marketplace integration yet
- No payment rails
- No COPPA compliance built in
- No gamification (badges, streaks, leaderboards)

### Lauren's priorities for next version:
1. Branded, beautiful, NOT "vibe coded"
2. Onboarding that feels fun, magical, game-like
3. The "reveal moment" needs to blow kids away
4. Fewer, more curated business categories to start
5. Voice-to-text for kids on iPads
6. Social features (invite friends, Stand Squad)
7. COPPA-compliant from the architecture level
8. Payment rails designed (even if not live for pilot)
