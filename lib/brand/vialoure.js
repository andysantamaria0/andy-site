import { ImageResponse } from 'next/og';

/**
 * Vialoure's marks — the champagne chevron on navy. Rendered by the
 * icon / apple-icon / opengraph-image route files under /trips and /vialoure
 * so the app keeps its own identity without it leaking onto the root domain.
 */

export const NAVY = '#0A1628';
export const CHAMPAGNE = '#C4A77D';
export const PEARL = '#F0EDE6';

export const ICON_SIZE = { width: 32, height: 32 };
export const APPLE_ICON_SIZE = { width: 180, height: 180 };
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT = 'Vialoure — Travel planning for friends';

function Chevron({ half, height }) {
  return (
    <div
      style={{
        width: 0,
        height: 0,
        borderLeft: `${half}px solid transparent`,
        borderRight: `${half}px solid transparent`,
        borderBottom: `${height}px solid ${CHAMPAGNE}`,
      }}
    />
  );
}

export function vialoureIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: NAVY,
          borderRadius: 4,
        }}
      >
        <Chevron half={10} height={8} />
      </div>
    ),
    { ...ICON_SIZE }
  );
}

export function vialoureAppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: NAVY,
          borderRadius: 36,
        }}
      >
        <Chevron half={40} height={32} />
      </div>
    ),
    { ...APPLE_ICON_SIZE }
  );
}

export function vialoureOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0A1628 0%, #0F1D30 50%, #1E3248 100%)',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'radial-gradient(ellipse at 30% 40%, rgba(74, 53, 215, 0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(194, 59, 34, 0.1) 0%, transparent 60%)',
            display: 'flex',
          }}
        />
        <svg viewBox="0 0 120 48" width="80" height="32" style={{ marginBottom: 24 }}>
          <path d="M0 48 L60 0 L120 48 Z" fill={CHAMPAGNE} />
        </svg>
        <div
          style={{
            fontFamily: 'serif',
            fontSize: 72,
            fontWeight: 700,
            color: PEARL,
            letterSpacing: '-0.02em',
            marginBottom: 12,
          }}
        >
          Vialoure
        </div>
        <div style={{ width: 80, height: 2, background: CHAMPAGNE, marginBottom: 20 }} />
        <div
          style={{
            fontFamily: 'sans-serif',
            fontSize: 24,
            color: 'rgba(240, 237, 230, 0.7)',
            letterSpacing: '0.04em',
          }}
        >
          Travel planning for friends
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
