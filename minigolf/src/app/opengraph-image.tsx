import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'MiniGolf - Play Online with Friends';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: 'linear-gradient(135deg, #065f46 0%, #0d3310 50%, #064e3b 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui',
        }}
      >
        <div style={{ fontSize: 100, marginBottom: 20 }}>⛳</div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 10,
          }}
        >
          MiniGolf
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#6ee7b7',
            marginBottom: 40,
          }}
        >
          Play Online with Friends
        </div>
        <div
          style={{
            display: 'flex',
            gap: 40,
            fontSize: 24,
            color: 'white',
          }}
        >
          <span>🎮 Up to 4 Players</span>
          <span>🏌️ 10 Unique Holes</span>
          <span>🌐 Real-time Multiplayer</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
