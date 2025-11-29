export interface Vector2 {
  x: number;
  y: number;
}

export type { Vector2 as Position };

export interface Ball {
  position: Vector2;
  velocity: Vector2;
  radius: number;
}

export interface Hole {
  position: Vector2;
  radius: number;
}

export interface Wall {
  start: Vector2;
  end: Vector2;
  thickness: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
  angle?: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export interface Obstacle {
  type: 'wall' | 'bumper' | 'water' | 'sand' | 'windmill' | 'moving-wall' | 'teleporter' | 'ramp';
  shape: Rectangle | Circle | Wall;
  properties?: {
    speed?: number;
    direction?: number;
    pairedId?: string;
    bounceFactor?: number;
    friction?: number;
  };
  id?: string;
}

export interface Level {
  id: number;
  name: string;
  par: number;
  tee: Vector2;
  hole: Hole;
  bounds: Rectangle;
  walls: Wall[];
  obstacles: Obstacle[];
  theme?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface Player {
  id: string;
  name: string;
  color: string;
  scores: number[];
  isReady: boolean;
}

export interface GameState {
  roomCode: string;
  players: Player[];
  currentPlayerIndex: number;
  currentLevel: number;
  ball: Ball;
  strokes: number;
  phase: 'waiting' | 'aiming' | 'shooting' | 'rolling' | 'scored' | 'finished';
  isHost: boolean;
}

export interface GameRoom {
  code: string;
  players: Player[];
  gameState: GameState | null;
  hostId: string;
  createdAt: number;
}
