import { NextRequest, NextResponse } from 'next/server';
import Pusher from 'pusher';

// Server-side Pusher instance
const getPusher = () => {
  // Use environment variables, with fallbacks for development
  const appId = process.env.PUSHER_APP_ID || '1';
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY || 'app-key';
  const secret = process.env.PUSHER_SECRET || 'app-secret';
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1';

  return new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });
};

// In-memory game state storage (in production, use Redis or a database)
const gameStates = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const { action, roomId, data } = await request.json();
    const pusher = getPusher();
    const channelName = `minigolf-${roomId}`;

    switch (action) {
      case 'create-room': {
        const initialState = {
          roomId,
          players: [],
          currentLevel: 1,
          currentPlayerIndex: 0,
          phase: 'lobby',
          ballInMotion: false,
        };
        gameStates.set(roomId, initialState);
        return NextResponse.json({ success: true, state: initialState });
      }

      case 'join-room': {
        let state = gameStates.get(roomId);
        if (!state) {
          // Create room if it doesn't exist
          state = {
            roomId,
            players: [],
            currentLevel: 1,
            currentPlayerIndex: 0,
            phase: 'lobby',
            ballInMotion: false,
          };
        }
        
        if (state.phase !== 'lobby') {
          return NextResponse.json({ success: false, error: 'Game already in progress' }, { status: 400 });
        }
        
        if (state.players.length >= 4) {
          return NextResponse.json({ success: false, error: 'Room is full' }, { status: 400 });
        }

        const isHost = state.players.length === 0;
        const newPlayer = {
          ...data.player,
          isHost,
          isReady: isHost,
        };
        
        state.players.push(newPlayer);
        gameStates.set(roomId, state);

        await pusher.trigger(channelName, 'player-joined', { player: newPlayer, state });
        return NextResponse.json({ success: true, state, player: newPlayer });
      }

      case 'leave-room': {
        const state = gameStates.get(roomId);
        if (!state) {
          return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
        }

        state.players = state.players.filter((p: any) => p.id !== data.playerId);
        
        // Assign new host if needed
        if (state.players.length > 0 && !state.players.some((p: any) => p.isHost)) {
          state.players[0].isHost = true;
        }

        gameStates.set(roomId, state);
        await pusher.trigger(channelName, 'player-left', { playerId: data.playerId, state });
        return NextResponse.json({ success: true, state });
      }

      case 'player-ready': {
        const state = gameStates.get(roomId);
        if (!state) {
          return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
        }

        const player = state.players.find((p: any) => p.id === data.playerId);
        if (player) {
          player.isReady = true;
        }

        gameStates.set(roomId, state);
        await pusher.trigger(channelName, 'player-ready', { playerId: data.playerId, state });
        return NextResponse.json({ success: true, state });
      }

      case 'start-game': {
        const state = gameStates.get(roomId);
        if (!state) {
          return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
        }

        state.phase = 'playing';
        state.currentLevel = 1;
        state.currentPlayerIndex = 0;
        state.players = state.players.map((p: any) => ({
          ...p,
          scores: [],
          currentStrokes: 0,
          hasFinishedHole: false,
        }));

        gameStates.set(roomId, state);
        await pusher.trigger(channelName, 'game-started', { state });
        return NextResponse.json({ success: true, state });
      }

      case 'take-shot': {
        const state = gameStates.get(roomId);
        if (!state) {
          return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
        }

        const player = state.players.find((p: any) => p.id === data.playerId);
        if (player) {
          player.currentStrokes++;
        }
        state.ballInMotion = true;

        gameStates.set(roomId, state);
        await pusher.trigger(channelName, 'shot-taken', { 
          playerId: data.playerId, 
          shot: data.shot,
          state 
        });
        return NextResponse.json({ success: true, state });
      }

      case 'ball-stopped': {
        const state = gameStates.get(roomId);
        if (!state) {
          return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
        }

        const player = state.players.find((p: any) => p.id === data.playerId);
        if (player) {
          player.ballPosition = data.position;
        }
        state.ballInMotion = false;

        gameStates.set(roomId, state);
        await pusher.trigger(channelName, 'ball-stopped', { 
          playerId: data.playerId, 
          position: data.position,
          state 
        });
        return NextResponse.json({ success: true, state });
      }

      case 'hole-complete': {
        const state = gameStates.get(roomId);
        if (!state) {
          return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
        }

        const player = state.players.find((p: any) => p.id === data.playerId);
        if (player) {
          player.hasFinishedHole = true;
          player.scores.push(player.currentStrokes);
        }

        // Check if all players finished
        const allFinished = state.players.every((p: any) => p.hasFinishedHole);
        if (allFinished) {
          state.phase = 'between-holes';
        } else {
          // Find next player who hasn't finished
          for (let i = 0; i < state.players.length; i++) {
            const idx = (state.currentPlayerIndex + 1 + i) % state.players.length;
            if (!state.players[idx].hasFinishedHole) {
              state.currentPlayerIndex = idx;
              break;
            }
          }
        }
        state.ballInMotion = false;

        gameStates.set(roomId, state);
        await pusher.trigger(channelName, 'hole-complete', { 
          playerId: data.playerId, 
          strokes: player?.currentStrokes || 0,
          state 
        });
        return NextResponse.json({ success: true, state });
      }

      case 'next-hole': {
        const state = gameStates.get(roomId);
        if (!state) {
          return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
        }

        state.currentLevel++;
        state.currentPlayerIndex = 0;
        state.players = state.players.map((p: any) => ({
          ...p,
          currentStrokes: 0,
          hasFinishedHole: false,
          ballPosition: undefined,
        }));

        // Check if game is finished (10 holes)
        if (state.currentLevel > 10) {
          state.phase = 'finished';
          // Determine winner
          const totals = state.players.map((p: any) => ({
            id: p.id,
            total: p.scores.reduce((a: number, b: number) => a + b, 0),
          }));
          const winner = totals.reduce((min: any, p: any) => p.total < min.total ? p : min);
          state.winner = winner.id;
        } else {
          state.phase = 'playing';
        }

        gameStates.set(roomId, state);
        await pusher.trigger(channelName, 'next-hole', { state });
        return NextResponse.json({ success: true, state });
      }

      case 'play-again': {
        const state = gameStates.get(roomId);
        if (!state) {
          return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
        }

        state.phase = 'lobby';
        state.currentLevel = 1;
        state.currentPlayerIndex = 0;
        state.winner = undefined;
        state.players = state.players.map((p: any) => ({
          ...p,
          scores: [],
          currentStrokes: 0,
          hasFinishedHole: false,
          isReady: p.isHost,
          ballPosition: undefined,
        }));

        gameStates.set(roomId, state);
        await pusher.trigger(channelName, 'game-state-sync', { state });
        return NextResponse.json({ success: true, state });
      }

      case 'sync-state': {
        const state = gameStates.get(roomId);
        if (!state) {
          return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, state });
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Game API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
