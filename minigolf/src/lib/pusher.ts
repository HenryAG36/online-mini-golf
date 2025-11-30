import Pusher from 'pusher-js';

// Client-side Pusher instance
let pusherClient: Pusher | null = null;

export function getPusherClient(): Pusher {
  if (!pusherClient) {
    // Use demo/sandbox Pusher credentials for development
    // In production, users should set their own NEXT_PUBLIC_PUSHER_* env vars
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY || 'app-key';
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1';
    
    pusherClient = new Pusher(key, {
      cluster,
      forceTLS: true,
    });
  }
  return pusherClient;
}

export function getChannelName(roomId: string): string {
  return `minigolf-${roomId}`;
}

// Event types for multiplayer
export const EVENTS = {
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left',
  PLAYER_READY: 'player-ready',
  GAME_STARTED: 'game-started',
  SHOT_TAKEN: 'shot-taken',
  BALL_STOPPED: 'ball-stopped',
  HOLE_COMPLETE: 'hole-complete',
  NEXT_HOLE: 'next-hole',
  GAME_STATE_SYNC: 'game-state-sync',
  CHAT_MESSAGE: 'chat-message',
} as const;

export type EventType = typeof EVENTS[keyof typeof EVENTS];
