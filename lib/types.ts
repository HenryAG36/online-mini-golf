export interface Player {
  id: string;
  name: string;
  color: string;
  scores: number[];
  currentStrokes: number;
  isReady: boolean;
  isHost: boolean;
  ballPosition?: { x: number; y: number };
  hasCompletedHole: boolean;
}

export interface GameRoom {
  id: string;
  players: Player[];
  currentLevel: number;
  gameState: 'lobby' | 'playing' | 'between-holes' | 'finished';
  currentTurn: number; // Index of current player
  maxPlayers: number;
}

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isMoving: boolean;
}

export interface Shot {
  playerId: string;
  power: number;
  angle: number;
}

// Socket events
export type ServerToClientEvents = {
  roomUpdate: (room: GameRoom) => void;
  ballUpdate: (playerId: string, state: BallState) => void;
  playerShot: (playerId: string, shot: Shot) => void;
  holeComplete: (playerId: string, strokes: number) => void;
  levelComplete: () => void;
  gameOver: (finalScores: { playerId: string; name: string; totalScore: number }[]) => void;
  error: (message: string) => void;
  playerJoined: (player: Player) => void;
  playerLeft: (playerId: string) => void;
  chatMessage: (playerId: string, playerName: string, message: string) => void;
};

export type ClientToServerEvents = {
  createRoom: (playerName: string, callback: (roomId: string) => void) => void;
  joinRoom: (roomId: string, playerName: string, callback: (success: boolean, error?: string) => void) => void;
  leaveRoom: () => void;
  setReady: (ready: boolean) => void;
  startGame: () => void;
  shoot: (power: number, angle: number) => void;
  updateBallPosition: (state: BallState) => void;
  completeHole: (strokes: number) => void;
  nextLevel: () => void;
  sendChat: (message: string) => void;
};

export const PLAYER_COLORS = [
  '#ff6b6b', // Coral red
  '#4ecdc4', // Teal
  '#ffe66d', // Yellow
  '#a855f7', // Purple
];

export const PLAYER_COLOR_NAMES = [
  'Red',
  'Teal', 
  'Yellow',
  'Purple',
];
