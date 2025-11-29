// Game types

export interface Point {
  x: number;
  y: number;
}

export interface Vector {
  x: number;
  y: number;
}

export interface Ball {
  position: Point;
  velocity: Vector;
  isMoving: boolean;
  inHole: boolean;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  ball: Ball;
  strokes: number[];
  totalStrokes: number;
  currentStrokes: number;
  isReady: boolean;
  connected: boolean;
}

export interface Obstacle {
  type: 'wall' | 'water' | 'sand' | 'bouncer' | 'windmill' | 'ramp' | 'teleporter';
  points?: Point[];
  position?: Point;
  width?: number;
  height?: number;
  radius?: number;
  rotation?: number;
  speed?: number;
  targetId?: string;
  color?: string;
}

export interface Level {
  id: number;
  name: string;
  par: number;
  tee: Point;
  hole: Point;
  holeRadius: number;
  bounds: { width: number; height: number };
  walls: Obstacle[];
  obstacles: Obstacle[];
  theme: {
    grass: string;
    accent: string;
    background: string;
  };
}

export interface GameRoom {
  id: string;
  hostId: string;
  players: Player[];
  currentLevel: number;
  currentPlayerIndex: number;
  status: 'waiting' | 'playing' | 'finished';
  maxPlayers: number;
  createdAt: number;
}

export interface GameState {
  room: GameRoom | null;
  playerId: string | null;
  isConnected: boolean;
  aimAngle: number;
  aimPower: number;
  isAiming: boolean;
}

export const PLAYER_COLORS = [
  '#FF6B6B', // Coral red
  '#4ECDC4', // Teal
  '#FFE66D', // Yellow
  '#95E1D3', // Mint
];

export const MAX_POWER = 15;
export const FRICTION = 0.985;
export const WALL_BOUNCE = 0.7;
export const SAND_FRICTION = 0.95;
export const HOLE_ATTRACTION = 0.3;
