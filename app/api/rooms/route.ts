import { NextResponse } from 'next/server';
import { createRoom, cleanupRooms, getRoomCount, getRoom } from '@/app/lib/rooms';

export async function POST(request: Request) {
  try {
    cleanupRooms();
    
    const { code, player } = await request.json();

    if (getRoom(code)) {
      return NextResponse.json(
        { error: 'Room code already exists' },
        { status: 400 }
      );
    }

    createRoom(code, player);

    return NextResponse.json({ success: true, code });
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}

export async function GET() {
  cleanupRooms();
  return NextResponse.json({ roomCount: getRoomCount() });
}
