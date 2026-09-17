import { ImageResponse } from 'next/og';

/**
 * andysantamaria.com's own marks: a cream Fraunces "A" on navy for the
 * favicon, and a navy card for link previews. Rendered by the root
 * icon / apple-icon / opengraph-image route files, which Next prerenders at
 * build time.
 */

export const NAVY = '#0A1628';
export const CHAMPAGNE = '#C4A77D';
export const PEARL = '#F0EDE6';

export const ICON_SIZE = { width: 32, height: 32 };
export const APPLE_ICON_SIZE = { width: 180, height: 180 };
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT = 'Andy Santamaria — Product Leader & AI Engineer';

const FETCH_TIMEOUT_MS = 8000;

function warnNull(family, why) {
  console.warn(`[brand/andy] ${family} not loaded, falling back to Satori's default font:`, why);
  return null;
}

/**
 * Satori (behind ImageResponse) ships only Noto Sans, and passing `fonts`
 * REPLACES that default rather than adding to it — so every face the card
 * uses has to be loaded here. Google Fonts hands back TrueType (which Satori
 * can read; woff2 it cannot) when the User-Agent is empty. Any failure returns
 * null so the build still succeeds; the mark just renders in Noto Sans.
 */
async function loadGoogleFont(family, weight) {
  const css2Family = family.replace(/ /g, '+');
  try {
    const cssRes = await fetch(
      `https://fonts.googleapis.com/css2?family=${css2Family}:wght@${weight}`,
      { headers: { 'User-Agent': '' }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
    );
    if (!cssRes.ok) return warnNull(family, `css ${cssRes.status}`);
    const url = (await cssRes.text()).match(
      /src: url\((https:\/\/fonts\.gstatic\.com\/[^)\s]+\.ttf)\)/
    )?.[1];
    if (!url) return warnNull(family, 'no ttf url in css');
    const ttfRes = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!ttfRes.ok) return warnNull(family, `ttf ${ttfRes.status}`);
    const data = await ttfRes.arrayBuffer();
    return { name: family, data, weight, style: 'normal' };
  } catch (err) {
    return warnNull(family, err);
  }
}

/** Load several faces; null (never an empty array — Satori throws on that) if none loaded. */
async function loadFonts(specs) {
  const loaded = (await Promise.all(specs.map(([f, w]) => loadGoogleFont(f, w)))).filter(Boolean);
  return loaded.length ? loaded : null;
}

function has(fonts, family) {
  return Boolean(fonts?.some((f) => f.name === family));
}

function withFonts(options, fonts) {
  return fonts ? { ...options, fonts } : options;
}

function Monogram({ box, radius, fontSize, fonts }) {
  return (
    <div
      style={{
        width: box,
        height: box,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: NAVY,
        borderRadius: radius,
        color: PEARL,
        fontFamily: has(fonts, 'Fraunces') ? 'Fraunces' : 'sans-serif',
        fontSize,
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      A
    </div>
  );
}

export async function andyIcon() {
  const fonts = await loadFonts([['Fraunces', 700]]);
  return new ImageResponse(
    <Monogram box={32} radius={4} fontSize={24} fonts={fonts} />,
    withFonts({ ...ICON_SIZE }, fonts)
  );
}

export async function andyAppleIcon() {
  const fonts = await loadFonts([['Fraunces', 700]]);
  return new ImageResponse(
    <Monogram box={180} radius={36} fontSize={128} fonts={fonts} />,
    withFonts({ ...APPLE_ICON_SIZE }, fonts)
  );
}

export async function andyOgImage() {
  // Same three faces the landing uses: typewriter eyebrow, serif name, sans role.
  const fonts = await loadFonts([
    ['Fraunces', 700],
    ['DM Sans', 400],
    ['Special Elite', 400],
  ]);
  const display = has(fonts, 'Fraunces') ? 'Fraunces' : 'sans-serif';
  const body = has(fonts, 'DM Sans') ? 'DM Sans' : 'sans-serif';
  const stamp = has(fonts, 'Special Elite') ? 'Special Elite' : body;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 96px',
          background: NAVY,
          color: PEARL,
        }}
      >
        <div
          style={{
            fontFamily: stamp,
            fontSize: 22,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: CHAMPAGNE,
            marginBottom: 28,
          }}
        >
          New York City
        </div>
        <div
          style={{
            fontFamily: display,
            fontSize: 108,
            fontWeight: 700,
            letterSpacing: '-0.025em',
            lineHeight: 1,
            marginBottom: 28,
          }}
        >
          Andy Santamaria
        </div>
        <div
          style={{
            fontFamily: body,
            fontSize: 34,
            color: 'rgba(240, 237, 230, 0.65)',
            letterSpacing: '0.01em',
          }}
        >
          Product Leader · AI Engineer
        </div>
      </div>
    ),
    withFonts({ ...OG_SIZE }, fonts)
  );
}
