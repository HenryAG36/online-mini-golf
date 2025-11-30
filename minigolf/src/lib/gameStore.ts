import { create } from 'zustand';
import { GameRoom, Player, Ball, PLAYER_COLORS } from './types';
import { getLevel, getTotalLevels } from './levels';
import { v4 as uuidv4 } from 'uuid';

interface GameStore {
  // State
  room: GameRoom | null;
  playerId: string | null;
  playerName: string;
  isConnected: boolean;
  aimAngle: number;
  aimPower: number;
  isAiming: boolean;
  showScoreboard: boolean;
  
  // Actions
  setPlayerName: (name: string) => void;
  createRoom: () => string;
  joinRoom: (roomId: string, existingRoom?: GameRoom) => boolean;
  setRoom: (room: GameRoom) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  updateBall: (playerId: string, ball: Ball) => void;
  setAim: (angle: number, power: number) => void;
  setIsAiming: (isAiming: boolean) => void;
  startGame: () => void;
  nextTurn: () => void;
  nextLevel: () => void;
  addStroke: (playerId: string) => void;
  toggleScoreboard: () => void;
  resetGame: () => void;
  getMyPlayer: () => Player | undefined;
  isMyTurn: () => boolean;
  getCurrentPlayer: () => Player | undefined;
}

const createInitialBall = (teeX: number, teeY: number): Ball => ({
  position: { x: teeX, y: teeY },
  velocity: { x: 0, y: 0 },
  isMoving: false,
  inHole: false,
});

export const useGameStore = create<GameStore>((set, get) => ({
  room: null,
  playerId: null,
  playerName: '',
  isConnected: false,
  aimAngle: 0,
  aimPower: 5,
  isAiming: false,
  showScoreboard: false,

  setPlayerName: (name) => set({ playerName: name }),

  createRoom: () => {
    const roomId = uuidv4().substring(0, 6).toUpperCase();
    const playerId = uuidv4();
    const level = getLevel(1)!;
    
    const player: Player = {
      id: playerId,
      name: get().playerName || 'Player 1',
      color: PLAYER_COLORS[0],
      ball: createInitialBall(level.tee.x, level.tee.y),
      strokes: [],
      totalStrokes: 0,
      currentStrokes: 0,
      isReady: false,
      connected: true,
    };

    const room: GameRoom = {
      id: roomId,
      hostId: playerId,
      players: [player],
      currentLevel: 1,
      currentPlayerIndex: 0,
      status: 'waiting',
      maxPlayers: 4,
      createdAt: Date.now(),
    };

    set({ room, playerId, isConnected: true });
    return roomId;
  },

  joinRoom: (roomId, existingRoom) => {
    const playerId = uuidv4();
    const currentRoom = existingRoom || get().room;
    
    if (!currentRoom || currentRoom.players.length >= 4) {
      return false;
    }

    const level = getLevel(currentRoom.currentLevel)!;
    const playerIndex = currentRoom.players.length;
    
    const player: Player = {
      id: playerId,
      name: get().playerName || `Player ${playerIndex + 1}`,
      color: PLAYER_COLORS[playerIndex % PLAYER_COLORS.length],
      ball: createInitialBall(level.tee.x, level.tee.y),
      strokes: [],
      totalStrokes: 0,
      currentStrokes: 0,
      isReady: false,
      connected: true,
    };

    const updatedRoom = {
      ...currentRoom,
      players: [...currentRoom.players, player],
    };

    set({ room: updatedRoom, playerId, isConnected: true });
    return true;
  },

  setRoom: (room) => set({ room }),

  updatePlayer: (playerId, updates) => {
    const { room } = get();
    if (!room) return;

    const updatedPlayers = room.players.map(p =>
      p.id === playerId ? { ...p, ...updates } : p
    );

    set({ room: { ...room, players: updatedPlayers } });
  },

  updateBall: (playerId, ball) => {
    const { room } = get();
    if (!room) return;

    const updatedPlayers = room.players.map(p =>
      p.id === playerId ? { ...p, ball } : p
    );

    set({ room: { ...room, players: updatedPlayers } });
  },

  setAim: (angle, power) => set({ aimAngle: angle, aimPower: power }),

  setIsAiming: (isAiming) => set({ isAiming }),

  startGame: () => {
    const { room } = get();
    if (!room) return;

    const level = getLevel(1)!;
    const updatedPlayers = room.players.map(p => ({
      ...p,
      ball: createInitialBall(level.tee.x, level.tee.y),
      strokes: [],
      totalStrokes: 0,
      currentStrokes: 0,
      isReady: true,
    }));

    set({
      room: {
        ...room,
        players: updatedPlayers,
        status: 'playing',
        currentLevel: 1,
        currentPlayerIndex: 0,
      },
    });
  },

  nextTurn: () => {
    const { room } = get();
    if (!room) return;

    // Find next player who hasn't holed out
    let nextIndex = room.currentPlayerIndex;
    const playersCount = room.players.length;
    
    // Check if all players have holed out
    const allHoled = room.players.every(p => p.ball.inHole);
    if (allHoled) {
      get().nextLevel();
      return;
    }

    // Find next player who hasn't holed
    for (let i = 0; i < playersCount; i++) {
      nextIndex = (nextIndex + 1) % playersCount;
      if (!room.players[nextIndex].ball.inHole) {
        break;
      }
    }

    set({ room: { ...room, currentPlayerIndex: nextIndex } });
  },

  nextLevel: () => {
    const { room } = get();
    if (!room) return;

    const nextLevelNum = room.currentLevel + 1;
    
    if (nextLevelNum > getTotalLevels()) {
      // Game finished
      const updatedPlayers = room.players.map(p => ({
        ...p,
        strokes: [...p.strokes, p.currentStrokes],
        totalStrokes: p.totalStrokes + p.currentStrokes,
      }));

      set({
        room: {
          ...room,
          players: updatedPlayers,
          status: 'finished',
        },
        showScoreboard: true,
      });
      return;
    }

    const nextLevel = getLevel(nextLevelNum)!;
    
    // Save current level strokes and reset for next level
    const updatedPlayers = room.players.map(p => ({
      ...p,
      strokes: [...p.strokes, p.currentStrokes],
      totalStrokes: p.totalStrokes + p.currentStrokes,
      currentStrokes: 0,
      ball: createInitialBall(nextLevel.tee.x, nextLevel.tee.y),
    }));

    set({
      room: {
        ...room,
        players: updatedPlayers,
        currentLevel: nextLevelNum,
        currentPlayerIndex: 0,
      },
    });
  },

  addStroke: (playerId) => {
    const { room } = get();
    if (!room) return;

    const updatedPlayers = room.players.map(p =>
      p.id === playerId 
        ? { ...p, currentStrokes: p.currentStrokes + 1 }
        : p
    );

    set({ room: { ...room, players: updatedPlayers } });
  },

  toggleScoreboard: () => set(state => ({ showScoreboard: !state.showScoreboard })),

  resetGame: () => set({
    room: null,
    playerId: null,
    isConnected: false,
    aimAngle: 0,
    aimPower: 5,
    isAiming: false,
    showScoreboard: false,
  }),

  getMyPlayer: () => {
    const { room, playerId } = get();
    return room?.players.find(p => p.id === playerId);
  },

  isMyTurn: () => {
    const { room, playerId } = get();
    if (!room || room.status !== 'playing') return false;
    return room.players[room.currentPlayerIndex]?.id === playerId;
  },

  getCurrentPlayer: () => {
    const { room } = get();
    if (!room) return undefined;
    return room.players[room.currentPlayerIndex];
  },
}));
