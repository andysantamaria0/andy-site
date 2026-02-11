import { ImageResponse } from 'next/og';

export const alt = 'Vialoure — Travel planning for friends';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
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
        {/* Subtle radial accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(ellipse at 30% 40%, rgba(74, 53, 215, 0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(194, 59, 34, 0.1) 0%, transparent 60%)',
            display: 'flex',
          }}
        />
        {/* V chevron mark */}
        <svg
          viewBox="0 0 120 48"
          width="80"
          height="32"
          style={{ marginBottom: 24 }}
        >
          <path d="M0 48 L60 0 L120 48 Z" fill="#C4A77D" />
        </svg>
        {/* Brand name */}
        <div
          style={{
            fontFamily: 'serif',
            fontSize: 72,
            fontWeight: 700,
            color: '#F0EDE6',
            letterSpacing: '-0.02em',
            marginBottom: 12,
          }}
        >
          Vialoure
        </div>
        {/* Champagne rule */}
        <div
          style={{
            width: 80,
            height: 2,
            background: '#C4A77D',
            marginBottom: 20,
          }}
        />
        {/* Tagline */}
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
    { ...size }
  );
}
