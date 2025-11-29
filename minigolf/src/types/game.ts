export interface Vector2D {
  x: number;
  y: number;
}

export interface Ball {
  position: Vector2D;
  velocity: Vector2D;
  radius: number;
  color: string;
  isMoving: boolean;
}

export interface Hole {
  position: Vector2D;
  radius: number;
}

export interface Wall {
  start: Vector2D;
  end: Vector2D;
  type: 'normal' | 'bouncy' | 'sticky';
}

export interface Obstacle {
  type: 'windmill' | 'bumper' | 'ramp' | 'portal' | 'spinner' | 'water' | 'sand';
  position: Vector2D;
  size: Vector2D;
  rotation?: number;
  properties?: Record<string, any>;
}

export interface Level {
  id: number;
  name: string;
  par: number;
  startPosition: Vector2D;
  hole: Hole;
  walls: Wall[];
  obstacles: Obstacle[];
  theme: 'grass' | 'desert' | 'ice' | 'space' | 'candy' | 'volcano';
  bounds: { width: number; height: number };
}

export interface Player {
  id: string;
  name: string;
  color: string;
  score: number[];
  totalScore: number;
  isHost: boolean;
  isReady: boolean;
  currentStrokes: number;
  hasFinishedHole: boolean;
}

export interface GameState {
  roomId: string;
  players: Player[];
  currentLevel: number;
  currentPlayerIndex: number;
  balls: Record<string, Ball>;
  gamePhase: 'lobby' | 'playing' | 'between-holes' | 'finished';
  levelScores: Record<string, number[]>;
}

export interface GameMessage {
  type: 'join' | 'leave' | 'start' | 'shoot' | 'ball-update' | 'hole-complete' | 'next-level' | 'game-over' | 'sync' | 'ready';
  playerId: string;
  data?: any;
  timestamp: number;
}

export const PLAYER_COLORS = [
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Teal
  '#FFE66D', // Yellow
  '#95E1D3', // Mint
];

export const PLAYER_NAMES = [
  'Player 1',
  'Player 2', 
  'Player 3',
  'Player 4',
];
