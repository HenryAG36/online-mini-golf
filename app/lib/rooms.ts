import { Player } from '../types';

interface Room {
  players: Player[];
  hostId: string;
  createdAt: number;
}

// In-memory storage for rooms (use Redis or database in production)
// This will be reset on each deployment, but works for demo purposes
const rooms = new Map<string, Room>();

export function getRooms() {
  return rooms;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code);
}

export function createRoom(code: string, player: Player): Room {
  const room: Room = {
    players: [player],
    hostId: player.id,
    createdAt: Date.now(),
  };
  rooms.set(code, room);
  return room;
}

export function deleteRoom(code: string): void {
  rooms.delete(code);
}

export function addPlayerToRoom(code: string, player: Player): Room | null {
  const room = rooms.get(code);
  if (!room) return null;
  
  // Check if player already exists
  const existingIndex = room.players.findIndex(p => p.id === player.id);
  if (existingIndex === -1) {
    room.players.push(player);
  }
  
  return room;
}

export function removePlayerFromRoom(code: string, playerId: string): Room | null {
  const room = rooms.get(code);
  if (!room) return null;
  
  room.players = room.players.filter(p => p.id !== playerId);
  
  if (room.players.length === 0) {
    rooms.delete(code);
    return null;
  }
  
  return room;
}

// Clean up old rooms (older than 2 hours)
export function cleanupRooms(): void {
  const now = Date.now();
  const twoHours = 2 * 60 * 60 * 1000;
  
  rooms.forEach((room, code) => {
    if (now - room.createdAt > twoHours) {
      rooms.delete(code);
    }
  });
}

export function getRoomCount(): number {
  return rooms.size;
}
