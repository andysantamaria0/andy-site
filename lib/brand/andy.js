import { ImageResponse } from 'next/og';

/**
 * andysantamaria.com's own marks: a cream Fraunces "A" on navy for the
 * favicon, and a navy card for link previews. Rendered by the root
 * icon / apple-icon / opengraph-image route files.
 */

export const NAVY = '#0A1628';
export const CHAMPAGNE = '#C4A77D';
export const PEARL = '#F0EDE6';

export const ICON_SIZE = { width: 32, height: 32 };
export const APPLE_ICON_SIZE = { width: 180, height: 180 };
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT = 'Andy Santamaria — Product Leader & AI Engineer';

/**
 * Satori (behind ImageResponse) only ships a default sans-serif. Pull the
 * Fraunces 700 TTF from Google Fonts at render time so the card matches the
 * site's headline. An empty User-Agent makes the CSS endpoint hand back
 * TrueType instead of woff2, which Satori can't read. Falls back to the
 * default font rather than failing the build if the fetch doesn't work.
 */
async function loadFraunces() {
  try {
    const css = await fetch(
      'https://fonts.googleapis.com/css2?family=Fraunces:wght@700',
      { headers: { 'User-Agent': '' } }
    ).then((r) => r.text());
    const url = css.match(/src: url\((https:\/\/[^)]+\.ttf)\)/)?.[1];
    if (!url) return null;
    const data = await fetch(url).then((r) => r.arrayBuffer());
    return [{ name: 'Fraunces', data, weight: 700, style: 'normal' }];
  } catch {
    return null;
  }
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
        fontFamily: fonts ? 'Fraunces' : 'serif',
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
  const fonts = await loadFraunces();
  return new ImageResponse(
    <Monogram box={32} radius={4} fontSize={24} fonts={fonts} />,
    withFonts({ ...ICON_SIZE }, fonts)
  );
}

export async function andyAppleIcon() {
  const fonts = await loadFraunces();
  return new ImageResponse(
    <Monogram box={180} radius={36} fontSize={128} fonts={fonts} />,
    withFonts({ ...APPLE_ICON_SIZE }, fonts)
  );
}

export async function andyOgImage() {
  const fonts = await loadFraunces();
  const display = fonts ? 'Fraunces' : 'serif';
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
            fontFamily: 'sans-serif',
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
            fontFamily: 'sans-serif',
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
