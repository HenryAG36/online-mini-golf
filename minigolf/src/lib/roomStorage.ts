import { GameRoom, Player, PLAYER_COLORS } from './types';
import { getLevel } from './levels';

// In-memory storage for rooms (for demo purposes)
// In production, use Vercel KV or a database
const rooms = new Map<string, GameRoom>();

export const createRoom = (hostId: string, hostName: string): GameRoom => {
  const roomId = generateRoomCode();
  const level = getLevel(1)!;
  
  const host: Player = {
    id: hostId,
    name: hostName || 'Player 1',
    color: PLAYER_COLORS[0],
    ball: {
      position: { x: level.tee.x, y: level.tee.y },
      velocity: { x: 0, y: 0 },
      isMoving: false,
      inHole: false,
    },
    strokes: [],
    totalStrokes: 0,
    currentStrokes: 0,
    isReady: false,
    connected: true,
  };

  const room: GameRoom = {
    id: roomId,
    hostId,
    players: [host],
    currentLevel: 1,
    currentPlayerIndex: 0,
    status: 'waiting',
    maxPlayers: 4,
    createdAt: Date.now(),
  };

  rooms.set(roomId, room);
  
  // Clean up old rooms after 2 hours
  setTimeout(() => {
    rooms.delete(roomId);
  }, 2 * 60 * 60 * 1000);

  return room;
};

export const getRoom = (roomId: string): GameRoom | undefined => {
  return rooms.get(roomId.toUpperCase());
};

export const updateRoom = (room: GameRoom): void => {
  rooms.set(room.id, room);
};

export const deleteRoom = (roomId: string): void => {
  rooms.delete(roomId);
};

export const addPlayerToRoom = (roomId: string, playerId: string, playerName: string): GameRoom | null => {
  const room = rooms.get(roomId);
  if (!room || room.players.length >= 4 || room.status !== 'waiting') {
    return null;
  }

  const level = getLevel(room.currentLevel)!;
  const playerIndex = room.players.length;

  const player: Player = {
    id: playerId,
    name: playerName || `Player ${playerIndex + 1}`,
    color: PLAYER_COLORS[playerIndex % PLAYER_COLORS.length],
    ball: {
      position: { x: level.tee.x, y: level.tee.y },
      velocity: { x: 0, y: 0 },
      isMoving: false,
      inHole: false,
    },
    strokes: [],
    totalStrokes: 0,
    currentStrokes: 0,
    isReady: false,
    connected: true,
  };

  room.players.push(player);
  rooms.set(roomId, room);
  
  return room;
};

export const removePlayerFromRoom = (roomId: string, playerId: string): GameRoom | null => {
  const room = rooms.get(roomId);
  if (!room) return null;

  room.players = room.players.filter(p => p.id !== playerId);
  
  if (room.players.length === 0) {
    rooms.delete(roomId);
    return null;
  }

  // If host left, assign new host
  if (room.hostId === playerId && room.players.length > 0) {
    room.hostId = room.players[0].id;
  }

  rooms.set(roomId, room);
  return room;
};

const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Make sure it's unique
  if (rooms.has(code)) {
    return generateRoomCode();
  }
  return code;
};
