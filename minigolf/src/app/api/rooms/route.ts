import { NextRequest, NextResponse } from 'next/server';

// In-memory room storage (for serverless demo)
// In production, use a database like Vercel KV, Supabase, or Redis
const rooms = new Map<string, { state: any; lastActivity: number }>();

// Clean up old rooms periodically
function cleanupRooms() {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 hour
  
  for (const [roomId, room] of rooms.entries()) {
    if (now - room.lastActivity > maxAge) {
      rooms.delete(roomId);
    }
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const roomId = searchParams.get('roomId');
  
  if (!roomId) {
    return NextResponse.json({ error: 'Room ID required' }, { status: 400 });
  }

  cleanupRooms();
  const room = rooms.get(roomId);
  
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  room.lastActivity = Date.now();
  return NextResponse.json({ state: room.state });
}

export async function POST(request: NextRequest) {
  try {
    const { roomId, state, action } = await request.json();

    cleanupRooms();

    if (action === 'create') {
      if (rooms.has(roomId)) {
        return NextResponse.json({ error: 'Room already exists' }, { status: 409 });
      }
      rooms.set(roomId, { state, lastActivity: Date.now() });
      return NextResponse.json({ success: true, roomId });
    }

    if (action === 'update') {
      if (!rooms.has(roomId)) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }
      rooms.set(roomId, { state, lastActivity: Date.now() });
      return NextResponse.json({ success: true });
    }

    if (action === 'join') {
      const room = rooms.get(roomId);
      if (!room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }
      room.lastActivity = Date.now();
      return NextResponse.json({ success: true, state: room.state });
    }

    if (action === 'delete') {
      rooms.delete(roomId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
