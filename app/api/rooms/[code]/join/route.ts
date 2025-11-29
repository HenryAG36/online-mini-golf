import { NextResponse } from 'next/server';
import Pusher from 'pusher';
import { getRoom, addPlayerToRoom } from '@/app/lib/rooms';

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
    const { player } = await request.json();

    const room = getRoom(code);

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found', message: 'Room not found. Check the code and try again.' },
        { status: 404 }
      );
    }

    if (room.players.length >= 4) {
      return NextResponse.json(
        { error: 'Room full', message: 'This room is full (max 4 players).' },
        { status: 400 }
      );
    }

    const updatedRoom = addPlayerToRoom(code, player);

    if (!updatedRoom) {
      return NextResponse.json(
        { error: 'Failed to join room' },
        { status: 500 }
      );
    }

    // Notify all players in the room about the new player
    if (pusher) {
      await pusher.trigger(`game-${code}`, 'player-joined', {
        player,
        players: updatedRoom.players,
      });
    }

    return NextResponse.json({ players: updatedRoom.players });
  } catch (error) {
    console.error('Join room error:', error);
    return NextResponse.json(
      { error: 'Failed to join room' },
      { status: 500 }
    );
  }
}
