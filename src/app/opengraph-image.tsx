import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = "School's Out! — Every Miami school closure + camp, one free app";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1a0b2e 0%, #2d1b4e 60%, #0b1d3a 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
          padding: 80,
        }}
      >
        <div style={{ fontSize: 32, opacity: 0.7, marginBottom: 20 }}>
          🎒 schoolsout.net
        </div>
        <div
          style={{
            fontSize: 128,
            fontWeight: 900,
            letterSpacing: -4,
            lineHeight: 1,
            backgroundImage: 'linear-gradient(90deg, #a78bfa, #f87171, #60a5fa)',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          School&apos;s Out!
        </div>
        <div
          style={{
            fontSize: 40,
            opacity: 0.9,
            marginTop: 24,
            textAlign: 'center',
            maxWidth: 900,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span>Every Miami school closure + camp.</span>
          <span>One free app.</span>
        </div>
        <div style={{ fontSize: 24, opacity: 0.6, marginTop: 40 }}>
          Built by Noah (age 8) &amp; Dad in Coral Gables 🌴
        </div>
      </div>
    ),
    { ...size },
  );
}
