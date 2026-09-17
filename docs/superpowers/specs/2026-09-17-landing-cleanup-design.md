# andysantamaria.com — landing cleanup

_Design spec, 2026-09-17. Approved by Andy in conversation before implementation._

## Goal

Make andysantamaria.com clean and simple when you land on it: Andy's bio, the
things he built, a consulting ask, and nothing else. Everything currently
reachable that is not on that list is deleted from the repo. The Vialoure app
(`/vialoure`, `/trips/**`, `/admin`, its API routes) is untouched.

## Decisions (from the brainstorm)

| Question | Decision |
|---|---|
| "The book club" vs Canon Society | Same thing. One row, canonsociety.com. |
| Old/unlinked pages (`/the-breakup`, `/system-design`, `/brown-glove-*`, old Vialoure HTML, `/invite`, gated `/stand/*`) | Delete from the repo. Git history keeps them. |
| Consulting | One line on the landing + "Get in touch" mailto. `/product` deleted, permanent redirect to `/`. |
| Stand | One sentence in the bio, link to standkids.com. Andy is **Head of Product** at Stand (day job), not a founder. |
| Visual direction | Keep the current look (navy/cream, Fraunces + DM Sans + Special Elite eyebrows, San Miguel photo); tighten it. |
| Writing | One footer link "Letters on Substack". No individual posts. |
| Other stuff (Fortuna, The Breakup, claude-pocket) | Not on the landing. |
| Built-for-others | Included in one "Built" list alongside Andy's own products. Client names appear ("For Faye Orlove", "For Naomi Brooks") — both are already credited on their own sites. |
| Contact email | `andyjsantamaria@gmail.com` (the `/product` page used a different one). |
| MailGaze spelling | One word, per the brand board. Link to themailgaze.co. |

## 1. Landing page (`/`)

Same shell: `.home-*` classes in `app/landing.css`, 640px column, dark by default
with the light-mode override in `globals.css`.

```
NEW YORK CITY                                   eyebrow (Special Elite)
Andy Santamaria                                 h1 (Fraunces 700)
Product Leader · AI Engineer                    role line

Twelve years at early-stage startups, from Square to the frontier of AI
engineering. Head of Product at Stand, where kids start real businesses.
                                                 intro (Fraunces italic); "Stand" links to https://standkids.com

[ San Miguel de Allende — 21:9 photo, pre-cropped WebP ]

BUILT                                            section title
  Canon Society ................................ canonsociety.com
    A book club. An unserious society, devoutly amateur, in the matter of the canon.
  MailGaze ..................................... themailgaze.co
    Real letters, on paper, once a month, from writers you choose and never meet.
  Vialoure ..................................... Invite only          (links to /vialoure)
    A private concierge for travelling with friends. Designed and built end to
    end — AI concierge, flight tracking, shared expenses.
  What Water Bottle Should I Get ............... whatwaterbottleshouldiget.com
    For Faye Orlove. 145 bottles, a quiz, and a pipeline so she can add the next one herself.
  Naomi's Lighthaus ............................ naomishaus.com
    For Naomi Brooks. The site for her creative and production studio.

Open to consulting. I partner with founders when it's early — which is to
say, messy — and we build the thing together.
Get in touch →                                   mailto:andyjsantamaria@gmail.com

Letters on Substack →                            https://letterfromandy.substack.com/
```

External rows open in a new tab (`target="_blank" rel="noopener noreferrer"`).
The Vialoure row is an internal link. The footer chevron mark (Vialoure's) is
removed from the landing.

## 2. Deletions

Pages and everything only they used:

| Remove | Also remove |
|---|---|
| `app/stand/**` (7 pages + unlock) | `public/stand/**`, `lib/standAuth.js`, `standGate()` + `/stand` matcher entries in `middleware.js`, the `/stand/design/:path*.html` headers block and `frame-src` comment in `next.config.js`, `stand.css` + its import in `app/layout.js`, `STAND_PASSWORD` from `.env.local` (Vercel env var: Andy removes after merge) |
| `app/product/**` | `product.css` import in `app/layout.js`; add `redirects()` entry `/product` → `/` (permanent) |
| `app/system-design/**` | `system-design.css` import in `app/layout.js` |
| `app/invite/**` | `components/InviteLetter.js` (`/api/check-invite` stays — `AuthButton.js` uses it) |
| `public/the-breakup.html`, `public/the-breakup/` | `app/api/breakup/**`, empty `app/the-breakup/`, its rewrite, vestigial `api.anthropic.com` / `api.elevenlabs.io` `connect-src` CSP entries |
| `public/brown-glove-{overview,deck,waitlist}.html` | `app/api/bg-waitlist/route.js`, their three rewrites. `supabase/migrations/032_brown_glove_waitlist.sql` stays (record of DB state). |
| `public/vialoure-design-options.html`, `public/vialoure-grand-tour-v2.html` | their two rewrites |
| Legacy selectors in `app/globals.css` (`.container`, `.name`, `.tagline`, `.divider`, `.links*`, `.projects*`, `.image-section`) | — |
| Supabase connection string in `CLAUDE.md` | replaced with "pull from Vercel env / Supabase dashboard" |
| Stale "Landing Page" section in `PLAN.md` | rewritten to describe the current root |

`rewrites()` in `next.config.js` becomes empty and is removed.

## 3. Root identity becomes Andy's; Vialoure's moves under its routes

- `app/layout.js` metadata: `metadataBase` `https://andysantamaria.com`, title
  `Andy Santamaria — Product Leader & AI Engineer`, description
  `Product leader and AI engineer in New York. Twelve years at early-stage
  startups, from Square to the frontier of AI engineering.` Remove
  `appleWebApp` and `manifest`. Keep `themeColor #0A1628` (it is the landing
  background too). `app/page.js` metadata matches.
- New root `app/icon.js` and `app/apple-icon.js`: navy square, cream Fraunces
  "A". New root `app/opengraph-image.js`: navy card, "Andy Santamaria",
  "Product Leader · AI Engineer", "New York City".
- Vialoure's existing icon/apple-icon/OG generators move to
  `app/trips/{icon,apple-icon,opengraph-image}.js` and `app/vialoure/{icon,apple-icon,opengraph-image}.js`
  (shared drawing code in `lib/vialoureBrand.js`). `app/manifest.js` becomes
  static `public/vialoure.webmanifest`; `app/trips/layout.js` metadata sets
  `manifest: '/vialoure.webmanifest'` and the `appleWebApp` block.
- `app/robots.js` (allow `/`, disallow `/trips/`, `/admin/`, `/api/`; sitemap URL) and
  `app/sitemap.js` (`/`, `/vialoure`).
- `middleware.js` exempts `/trips/{icon,apple-icon,opengraph-image}` from the
  session redirect, otherwise link unfurlers fetching the OG image without
  cookies would be bounced to the login page. The `/trips` layout also gets its
  own `openGraph`/`twitter` blocks so shared `/trips` links unfurl as Vialoure.

## 4. Hygiene

- `app/layout.js` imports only `globals.css`. `trips.css` is imported by
  `app/trips/layout.js` (already) and `app/vialoure/page.js` (needs it for
  `.v-phone*` and `.v-notch*`).
- Hero: `public/san-miguel-sunset.webp`, pre-cropped to 16:9 (1498x843,
  118 KB) so the mobile frame fits exactly and the desktop 21:9 frame crops it
  with the same `object-position` as before; explicit `width`/`height` and
  `fetchpriority="high"`. The original PNG stays
  in `public/` because the Vialoure featured trip's `cover_image_url` points
  at it.
- Google Fonts link left as-is: `trips.css` uses all four families (DM Sans,
  Fraunces, Crimson Pro, Special Elite), and browsers only download the faces a
  page actually renders, so the shared `<link>` costs the landing one CSS request.

## 5. Verification

- `npm run build` green.
- Local `next dev`: `/`, `/vialoure`, `/trips/login` → 200; `/product` → 308/301 to `/`;
  every deleted path → 404.
- Rendered `<head>` of `/`: new title/description, `og:image` → root OG, no
  `manifest` link, no `apple-mobile-web-app-title`. `/trips/login` and
  `/vialoure` still carry the Vialoure OG.
- `grep -r` for `stand`, `breakup`, `brown-glove`, `product.css`,
  `system-design`, `InviteLetter`, `standAuth` finds no live references.
- Light + dark screenshots of the landing if a headless Chrome is available.
- Adversarial review workflow over the diff (Vialoure breakage, dangling
  references, copy, metadata, security lenses) before the PR is opened.

## 6. Delivery

Branch `worktree-landing-cleanup` in a git worktree; one PR to `main`. Andy
merges; Vercel deploys from `main`. Not merged or deployed by Claude.

After merge (Andy): remove `STAND_PASSWORD` from Vercel env; rotate the
Supabase DB password that was committed in `CLAUDE.md` (public repo, since
Feb 2026); optionally rotate the keys hardcoded in the local
`~/dev/andy-projects/the-breakup/config.js`.

Out of scope, flagged: `/api/onboarding/step-audio` has no auth or rate
limit; Twilio webhooks fail open if `TWILIO_AUTH_TOKEN` is unset in prod;
`/vialoure` renders a real past trip as its featured example.
