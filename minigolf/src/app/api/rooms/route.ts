import { NextRequest, NextResponse } from 'next/server';
import { createRoom, getRoom } from '@/lib/roomStorage';

// Create a new room
export async function POST(request: NextRequest) {
  try {
    const { playerId, playerName } = await request.json();
    
    if (!playerId) {
      return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
    }

    const room = createRoom(playerId, playerName);
    
    return NextResponse.json({ room });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}

// Get room by ID (query param)
export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get('roomId');
  
  if (!roomId) {
    return NextResponse.json({ error: 'Room ID required' }, { status: 400 });
  }

  const room = getRoom(roomId);
  
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  return NextResponse.json({ room });
}
