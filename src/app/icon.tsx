import { ImageResponse } from 'next/og';

// DECISION: Dynamic 192x192 PNG for Android / generic PWA install. Matches the
// dark gradient of Kid Mode so the app's visual identity carries onto the
// home screen without having to hand-author a static PNG.
export const runtime = 'edge';
export const size = { width: 192, height: 192 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a0b2e, #0b1d3a)',
          fontSize: 140,
        }}
      >
        🎒
      </div>
    ),
    { ...size },
  );
}
