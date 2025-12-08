export interface Point {
  x: number;
  y: number;
}

export interface Obstacle {
  type: 'wall' | 'water' | 'sand' | 'bumper' | 'windmill' | 'ramp' | 'teleporter';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  angle?: number;
  vertices?: Point[];
  targetX?: number;
  targetY?: number;
  speed?: number;
}

export interface Level {
  id: number;
  name: string;
  par: number;
  tee: Point;
  hole: Point;
  obstacles: Obstacle[];
  bounds: { width: number; height: number };
  theme: 'classic' | 'beach' | 'castle' | 'space' | 'jungle' | 'candy';
}

export interface Player {
  id: string;
  name: string;
  color: string;
  avatar: string;
  scores: number[];
  currentStrokes: number;
  isHost: boolean;
  isReady: boolean;
  ballPosition?: Point;
  hasFinishedHole: boolean;
}

export interface GameState {
  roomId: string;
  players: Player[];
  currentLevel: number;
  currentPlayerIndex: number;
  phase: 'lobby' | 'playing' | 'between-holes' | 'finished';
  ballInMotion: boolean;
  winner?: string;
}

export interface Shot {
  playerId: string;
  angle: number;
  power: number;
}

export type GameAction =
  | { type: 'PLAYER_JOIN'; player: Player }
  | { type: 'PLAYER_LEAVE'; playerId: string }
  | { type: 'PLAYER_READY'; playerId: string }
  | { type: 'START_GAME' }
  | { type: 'TAKE_SHOT'; shot: Shot }
  | { type: 'BALL_STOPPED'; playerId: string; position: Point }
  | { type: 'HOLE_COMPLETE'; playerId: string; strokes: number }
  | { type: 'NEXT_HOLE' }
  | { type: 'GAME_OVER' };

export const PLAYER_COLORS = [
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Teal
  '#FFE66D', // Sunny Yellow  
  '#A855F7', // Purple
];

export const PLAYER_AVATARS = ['🦊', '🐸', '🦁', '🐼'];
