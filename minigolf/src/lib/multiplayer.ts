import { GameState, GameMessage } from '@/types/game';
import Pusher from 'pusher-js';

type MessageHandler = (message: GameMessage) => void;

// For demo/local play, we use BroadcastChannel
// For online play, we use Pusher
export class MultiplayerManager {
  private roomId: string;
  private playerId: string;
  private channel: BroadcastChannel | null = null;
  private pusher: Pusher | null = null;
  private pusherChannel: any = null;
  private messageHandler: MessageHandler | null = null;
  private isOnline: boolean = false;

  constructor(roomId: string, playerId: string, online: boolean = false) {
    this.roomId = roomId;
    this.playerId = playerId;
    this.isOnline = online;
  }

  connect(onMessage: MessageHandler): void {
    this.messageHandler = onMessage;

    if (this.isOnline && process.env.NEXT_PUBLIC_PUSHER_KEY) {
      // Online mode with Pusher
      this.pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
      });
      
      this.pusherChannel = this.pusher.subscribe(`minigolf-${this.roomId}`);
      this.pusherChannel.bind('game-message', (data: GameMessage) => {
        if (data.playerId !== this.playerId && this.messageHandler) {
          this.messageHandler(data);
        }
      });
    } else {
      // Local mode with BroadcastChannel
      this.channel = new BroadcastChannel(`minigolf-${this.roomId}`);
      this.channel.onmessage = (event) => {
        const message = event.data as GameMessage;
        if (message.playerId !== this.playerId && this.messageHandler) {
          this.messageHandler(message);
        }
      };
    }
  }

  async send(message: Omit<GameMessage, 'playerId' | 'timestamp'>): Promise<void> {
    const fullMessage: GameMessage = {
      ...message,
      playerId: this.playerId,
      timestamp: Date.now(),
    };

    if (this.isOnline && process.env.NEXT_PUBLIC_PUSHER_KEY) {
      // Send via API to Pusher
      try {
        await fetch('/api/pusher/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: this.roomId,
            message: fullMessage,
          }),
        });
      } catch (error) {
        console.error('Failed to send message via Pusher:', error);
      }
    } else if (this.channel) {
      // Send via BroadcastChannel
      this.channel.postMessage(fullMessage);
    }
  }

  disconnect(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.pusherChannel) {
      this.pusherChannel.unbind_all();
      this.pusher?.unsubscribe(`minigolf-${this.roomId}`);
    }
    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
    }
    this.messageHandler = null;
  }

  getRoomId(): string {
    return this.roomId;
  }

  getPlayerId(): string {
    return this.playerId;
  }
}

// Room storage for API (in-memory for serverless, but works for demo)
const rooms = new Map<string, { state: GameState; lastActivity: number }>();

export function createRoom(roomId: string, state: GameState): void {
  rooms.set(roomId, { state, lastActivity: Date.now() });
}

export function getRoom(roomId: string): GameState | null {
  const room = rooms.get(roomId);
  if (room) {
    room.lastActivity = Date.now();
    return room.state;
  }
  return null;
}

export function updateRoom(roomId: string, state: GameState): void {
  rooms.set(roomId, { state, lastActivity: Date.now() });
}

export function deleteRoom(roomId: string): void {
  rooms.delete(roomId);
}

// Cleanup old rooms (call periodically)
export function cleanupRooms(): void {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes
  
  for (const [roomId, room] of rooms.entries()) {
    if (now - room.lastActivity > maxAge) {
      rooms.delete(roomId);
    }
  }
}
