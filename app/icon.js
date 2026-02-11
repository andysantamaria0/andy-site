import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A1628',
          borderRadius: 4,
        }}
      >
        <div
          style={{
            fontFamily: 'serif',
            fontWeight: 700,
            fontSize: 20,
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
