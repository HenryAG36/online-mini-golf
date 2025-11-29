import { GameRoom, Player, PLAYER_COLORS } from './types';
import { getTotalLevels } from './levels';

// In-memory game state (for serverless, we'd use Redis or similar in production)
const rooms: Map<string, GameRoom> = new Map();
const playerRooms: Map<string, string> = new Map();

export function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function createRoom(hostId: string, hostName: string): GameRoom {
  const roomId = generateRoomId();
  
  const host: Player = {
    id: hostId,
    name: hostName,
    color: PLAYER_COLORS[0],
    scores: [],
    currentStrokes: 0,
    isReady: false,
    isHost: true,
    hasCompletedHole: false,
  };
  
  const room: GameRoom = {
    id: roomId,
    players: [host],
    currentLevel: 1,
    gameState: 'lobby',
    currentTurn: 0,
    maxPlayers: 4,
  };
  
  rooms.set(roomId, room);
  playerRooms.set(hostId, roomId);
  
  return room;
}

export function joinRoom(roomId: string, playerId: string, playerName: string): { success: boolean; room?: GameRoom; error?: string } {
  const room = rooms.get(roomId);
  
  if (!room) {
    return { success: false, error: 'Room not found' };
  }
  
  if (room.gameState !== 'lobby') {
    return { success: false, error: 'Game already in progress' };
  }
  
  if (room.players.length >= room.maxPlayers) {
    return { success: false, error: 'Room is full' };
  }
  
  const player: Player = {
    id: playerId,
    name: playerName,
    color: PLAYER_COLORS[room.players.length],
    scores: [],
    currentStrokes: 0,
    isReady: false,
    isHost: false,
    hasCompletedHole: false,
  };
  
  room.players.push(player);
  playerRooms.set(playerId, roomId);
  
  return { success: true, room };
}

export function leaveRoom(playerId: string): { room?: GameRoom; wasHost: boolean } {
  const roomId = playerRooms.get(playerId);
  if (!roomId) return { wasHost: false };
  
  const room = rooms.get(roomId);
  if (!room) return { wasHost: false };
  
  const playerIndex = room.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return { wasHost: false };
  
  const wasHost = room.players[playerIndex].isHost;
  room.players.splice(playerIndex, 1);
  playerRooms.delete(playerId);
  
  // If room is empty, delete it
  if (room.players.length === 0) {
    rooms.delete(roomId);
    return { wasHost };
  }
  
  // If host left, assign new host
  if (wasHost && room.players.length > 0) {
    room.players[0].isHost = true;
  }
  
  // Reassign colors
  room.players.forEach((p, i) => {
    p.color = PLAYER_COLORS[i];
  });
  
  return { room, wasHost };
}

export function getRoom(roomId: string): GameRoom | undefined {
  return rooms.get(roomId);
}

export function getRoomByPlayer(playerId: string): GameRoom | undefined {
  const roomId = playerRooms.get(playerId);
  return roomId ? rooms.get(roomId) : undefined;
}

export function setPlayerReady(playerId: string, ready: boolean): GameRoom | undefined {
  const room = getRoomByPlayer(playerId);
  if (!room) return undefined;
  
  const player = room.players.find(p => p.id === playerId);
  if (player) {
    player.isReady = ready;
  }
  
  return room;
}

export function startGame(roomId: string): GameRoom | undefined {
  const room = rooms.get(roomId);
  if (!room) return undefined;
  
  room.gameState = 'playing';
  room.currentLevel = 1;
  room.currentTurn = 0;
  
  // Reset all player scores
  room.players.forEach(p => {
    p.scores = [];
    p.currentStrokes = 0;
    p.hasCompletedHole = false;
  });
  
  return room;
}

export function recordShot(playerId: string): GameRoom | undefined {
  const room = getRoomByPlayer(playerId);
  if (!room) return undefined;
  
  const player = room.players.find(p => p.id === playerId);
  if (player) {
    player.currentStrokes++;
  }
  
  return room;
}

export function completeHole(playerId: string): { room?: GameRoom; allComplete: boolean } {
  const room = getRoomByPlayer(playerId);
  if (!room) return { allComplete: false };
  
  const player = room.players.find(p => p.id === playerId);
  if (player) {
    player.scores.push(player.currentStrokes);
    player.hasCompletedHole = true;
  }
  
  const allComplete = room.players.every(p => p.hasCompletedHole);
  
  return { room, allComplete };
}

export function nextLevel(roomId: string): { room?: GameRoom; gameOver: boolean } {
  const room = rooms.get(roomId);
  if (!room) return { gameOver: false };
  
  if (room.currentLevel >= getTotalLevels()) {
    room.gameState = 'finished';
    return { room, gameOver: true };
  }
  
  room.currentLevel++;
  room.currentTurn = 0;
  room.players.forEach(p => {
    p.currentStrokes = 0;
    p.hasCompletedHole = false;
    p.ballPosition = undefined;
  });
  room.gameState = 'playing';
  
  return { room, gameOver: false };
}

export function nextTurn(roomId: string): GameRoom | undefined {
  const room = rooms.get(roomId);
  if (!room) return undefined;
  
  // Find next player who hasn't completed the hole
  let nextTurn = (room.currentTurn + 1) % room.players.length;
  let attempts = 0;
  
  while (room.players[nextTurn].hasCompletedHole && attempts < room.players.length) {
    nextTurn = (nextTurn + 1) % room.players.length;
    attempts++;
  }
  
  room.currentTurn = nextTurn;
  return room;
}

export function getFinalScores(roomId: string): { playerId: string; name: string; totalScore: number }[] {
  const room = rooms.get(roomId);
  if (!room) return [];
  
  return room.players.map(p => ({
    playerId: p.id,
    name: p.name,
    totalScore: p.scores.reduce((a, b) => a + b, 0),
  })).sort((a, b) => a.totalScore - b.totalScore);
}
