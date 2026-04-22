import { ImageResponse } from 'next/og';

// DECISION: Apple touch icon is 180x180 on a cream background — iOS masks the
// icon into its rounded-square and its render looks best with a light bg +
// dark emoji (the opposite of the Android icon). Same emoji keeps the app
// recognizable either way.
export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FBF8F1',
          fontSize: 130,
        }}
      >
        🎒
      </div>
    ),
    { ...size },
  );
}
