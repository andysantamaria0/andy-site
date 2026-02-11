import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A1628',
          borderRadius: 36,
        }}
      >
        <div
          style={{
            fontFamily: 'serif',
            fontWeight: 700,
            fontSize: 96,
            color: '#F0EDE6',
            lineHeight: 1,
          }}
        >
          V
        </div>
      </div>
    ),
    { ...size }
  );
}
