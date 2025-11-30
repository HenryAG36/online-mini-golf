import { NextRequest, NextResponse } from 'next/server';
import { getRoom, updateRoom } from '@/lib/roomStorage';
import { getPusherServer, EVENTS, getRoomChannel } from '@/lib/pusher';
import { GameRoom } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { roomId, room: updatedRoom, event } = await request.json();
    
    if (!roomId || !updatedRoom) {
      return NextResponse.json({ error: 'Room ID and room data required' }, { status: 400 });
    }

    const existingRoom = getRoom(roomId);
    if (!existingRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Update the room
    updateRoom(updatedRoom as GameRoom);

    // Broadcast to other players via Pusher (if configured)
    const pusher = getPusherServer();
    if (pusher) {
      await pusher.trigger(
        getRoomChannel(roomId), 
        event || EVENTS.GAME_STATE, 
        { room: updatedRoom }
      );
    }

    return NextResponse.json({ success: true, room: updatedRoom });
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }
}
