import Pusher from 'pusher-js';
import PusherServer from 'pusher';

// Client-side Pusher instance
let pusherClient: Pusher | null = null;

export const getPusherClient = (): Pusher | null => {
  if (typeof window === 'undefined') return null;
  
  if (!pusherClient && process.env.NEXT_PUBLIC_PUSHER_KEY) {
    pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
    });
  }
  
  return pusherClient;
};

// Server-side Pusher instance
let pusherServer: PusherServer | null = null;

export const getPusherServer = (): PusherServer | null => {
  if (typeof window !== 'undefined') return null;
  
  if (!pusherServer && process.env.PUSHER_APP_ID) {
    pusherServer = new PusherServer({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
      useTLS: true,
    });
  }
  
  return pusherServer;
};

// Event types
export const EVENTS = {
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left',
  GAME_STARTED: 'game-started',
  BALL_UPDATE: 'ball-update',
  SHOT_MADE: 'shot-made',
  TURN_CHANGED: 'turn-changed',
  LEVEL_COMPLETE: 'level-complete',
  GAME_STATE: 'game-state',
  PLAYER_READY: 'player-ready',
};

// Channel name helper
export const getRoomChannel = (roomId: string): string => `game-room-${roomId}`;
