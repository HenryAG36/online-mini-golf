import { NextResponse } from 'next/server';
import { removePlayerFromRoom } from '@/app/lib/rooms';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    const { playerId } = await request.json();

    const room = removePlayerFromRoom(code, playerId);

    return NextResponse.json({ success: true, players: room?.players || [] });
  } catch (error) {
    console.error('Leave room error:', error);
    return NextResponse.json(
      { error: 'Failed to leave room' },
      { status: 500 }
    );
  }
}
