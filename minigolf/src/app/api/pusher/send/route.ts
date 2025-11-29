import { NextRequest, NextResponse } from 'next/server';
import Pusher from 'pusher';

// Initialize Pusher server instance
const pusher = process.env.PUSHER_APP_ID ? new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
  useTLS: true,
}) : null;

export async function POST(request: NextRequest) {
  try {
    const { roomId, message } = await request.json();

    if (!roomId || !message) {
      return NextResponse.json({ error: 'Missing roomId or message' }, { status: 400 });
    }

    if (pusher) {
      await pusher.trigger(`minigolf-${roomId}`, 'game-message', message);
      return NextResponse.json({ success: true });
    } else {
      // Pusher not configured, return success anyway for local play
      return NextResponse.json({ success: true, local: true });
    }
  } catch (error) {
    console.error('Pusher error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
