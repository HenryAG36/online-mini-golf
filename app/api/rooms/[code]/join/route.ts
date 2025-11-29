import { NextResponse } from 'next/server';
import { getRoom, addPlayerToRoom } from '@/app/lib/rooms';

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

    return NextResponse.json({ players: updatedRoom.players });
  } catch (error) {
    console.error('Join room error:', error);
    return NextResponse.json(
      { error: 'Failed to join room' },
      { status: 500 }
    );
  }
}
