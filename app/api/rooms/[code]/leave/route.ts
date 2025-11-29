import { NextResponse } from 'next/server';
import Pusher from 'pusher';
import { removePlayerFromRoom } from '@/app/lib/rooms';

// Initialize Pusher for server-side events
const pusher = process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET && process.env.PUSHER_CLUSTER
  ? new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    })
  : null;

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    const { playerId } = await request.json();

    const room = removePlayerFromRoom(code, playerId);

    // Notify remaining players
    if (pusher && room) {
      await pusher.trigger(`game-${code}`, 'player-left', {
        playerId,
        players: room.players,
      });
    }

    return NextResponse.json({ success: true, players: room?.players || [] });
  } catch (error) {
    console.error('Leave room error:', error);
    return NextResponse.json(
      { error: 'Failed to leave room' },
      { status: 500 }
    );
  }
}
