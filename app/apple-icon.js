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
            width: 0,
            height: 0,
            borderLeft: '40px solid transparent',
            borderRight: '40px solid transparent',
            borderBottom: '32px solid #C4A77D',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
