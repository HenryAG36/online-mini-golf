import { NextResponse } from 'next/server';
import Pusher from 'pusher';

// Initialize Pusher only if credentials are available
const pusher = process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET && process.env.PUSHER_CLUSTER
  ? new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    })
  : null;

export async function POST(request: Request) {
  if (!pusher) {
    return NextResponse.json(
      { error: 'Pusher not configured' },
      { status: 503 }
    );
  }

  try {
    const { channel, event, data } = await request.json();

    await pusher.trigger(channel, event, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Pusher trigger error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger event' },
      { status: 500 }
    );
  }
}
