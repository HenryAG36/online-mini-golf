import { NextRequest, NextResponse } from 'next/server';
import { addPlayerToRoom, getRoom } from '@/lib/roomStorage';
import { getPusherServer, EVENTS, getRoomChannel } from '@/lib/pusher';

export async function POST(request: NextRequest) {
  try {
    const { roomId, playerId, playerName } = await request.json();
    
    if (!roomId || !playerId) {
      return NextResponse.json({ error: 'Room ID and Player ID required' }, { status: 400 });
    }

    const existingRoom = getRoom(roomId);
    if (!existingRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (existingRoom.status !== 'waiting') {
      return NextResponse.json({ error: 'Game already in progress' }, { status: 400 });
    }

    if (existingRoom.players.length >= 4) {
      return NextResponse.json({ error: 'Room is full' }, { status: 400 });
    }

    const room = addPlayerToRoom(roomId.toUpperCase(), playerId, playerName);
    
    if (!room) {
      return NextResponse.json({ error: 'Failed to join room' }, { status: 400 });
    }

    // Notify other players via Pusher (if configured)
    const pusher = getPusherServer();
    if (pusher) {
      await pusher.trigger(getRoomChannel(roomId), EVENTS.PLAYER_JOINED, { room });
    }

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
  }
}
