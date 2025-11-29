export interface Obstacle {
  type: 'wall' | 'water' | 'sand' | 'windmill' | 'bumper' | 'ramp' | 'teleporter' | 'moving-wall';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  angle?: number;
  speed?: number;
  linkedTo?: number; // For teleporter pairs
  color?: string;
}

export interface Level {
  id: number;
  name: string;
  par: number;
  ball: { x: number; y: number };
  hole: { x: number; y: number };
  obstacles: Obstacle[];
  backgroundColor?: string;
  theme?: 'grass' | 'desert' | 'ice' | 'space';
}

export const levels: Level[] = [
  // Level 1: The Basics
  {
    id: 1,
    name: "First Swing",
    par: 2,
    ball: { x: 100, y: 300 },
    hole: { x: 700, y: 300 },
    obstacles: [
      // Border walls
      { type: 'wall', x: 400, y: 50, width: 760, height: 20 },
      { type: 'wall', x: 400, y: 550, width: 760, height: 20 },
      { type: 'wall', x: 30, y: 300, width: 20, height: 480 },
      { type: 'wall', x: 770, y: 300, width: 20, height: 480 },
    ],
    theme: 'grass'
  },
  
  // Level 2: The Dogleg
  {
    id: 2,
    name: "Dogleg Right",
    par: 3,
    ball: { x: 100, y: 150 },
    hole: { x: 700, y: 450 },
    obstacles: [
      // Border
      { type: 'wall', x: 400, y: 50, width: 760, height: 20 },
      { type: 'wall', x: 400, y: 550, width: 760, height: 20 },
      { type: 'wall', x: 30, y: 300, width: 20, height: 480 },
      { type: 'wall', x: 770, y: 300, width: 20, height: 480 },
      // L-shape blocker
      { type: 'wall', x: 400, y: 200, width: 300, height: 25 },
      { type: 'wall', x: 250, y: 350, width: 25, height: 280 },
    ],
    theme: 'grass'
  },
  
  // Level 3: Water Hazard
  {
    id: 3,
    name: "Splash Zone",
    par: 3,
    ball: { x: 100, y: 300 },
    hole: { x: 700, y: 300 },
    obstacles: [
      // Border
      { type: 'wall', x: 400, y: 50, width: 760, height: 20 },
      { type: 'wall', x: 400, y: 550, width: 760, height: 20 },
      { type: 'wall', x: 30, y: 300, width: 20, height: 480 },
      { type: 'wall', x: 770, y: 300, width: 20, height: 480 },
      // Water in the middle
      { type: 'water', x: 400, y: 300, width: 200, height: 400 },
      // Bridge walls
      { type: 'wall', x: 400, y: 130, width: 180, height: 20 },
      { type: 'wall', x: 400, y: 470, width: 180, height: 20 },
    ],
    theme: 'grass'
  },
  
  // Level 4: Sandy Path
  {
    id: 4,
    name: "Desert Storm",
    par: 3,
    ball: { x: 100, y: 100 },
    hole: { x: 700, y: 500 },
    obstacles: [
      // Border
      { type: 'wall', x: 400, y: 50, width: 760, height: 20 },
      { type: 'wall', x: 400, y: 550, width: 760, height: 20 },
      { type: 'wall', x: 30, y: 300, width: 20, height: 480 },
      { type: 'wall', x: 770, y: 300, width: 20, height: 480 },
      // Sand traps
      { type: 'sand', x: 250, y: 250, width: 150, height: 150 },
      { type: 'sand', x: 550, y: 400, width: 150, height: 150 },
      // Walls
      { type: 'wall', x: 400, y: 200, width: 20, height: 200 },
      { type: 'wall', x: 500, y: 450, width: 20, height: 150 },
    ],
    theme: 'desert'
  },
  
  // Level 5: Bumper Madness
  {
    id: 5,
    name: "Pinball Wizard",
    par: 4,
    ball: { x: 100, y: 300 },
    hole: { x: 700, y: 300 },
    obstacles: [
      // Border
      { type: 'wall', x: 400, y: 50, width: 760, height: 20 },
      { type: 'wall', x: 400, y: 550, width: 760, height: 20 },
      { type: 'wall', x: 30, y: 300, width: 20, height: 480 },
      { type: 'wall', x: 770, y: 300, width: 20, height: 480 },
      // Bumpers
      { type: 'bumper', x: 250, y: 200, radius: 30 },
      { type: 'bumper', x: 400, y: 300, radius: 35 },
      { type: 'bumper', x: 250, y: 400, radius: 30 },
      { type: 'bumper', x: 550, y: 180, radius: 25 },
      { type: 'bumper', x: 550, y: 420, radius: 25 },
    ],
    theme: 'grass'
  },
  
  // Level 6: The Windmill
  {
    id: 6,
    name: "Dutch Treat",
    par: 3,
    ball: { x: 100, y: 300 },
    hole: { x: 700, y: 300 },
    obstacles: [
      // Border
      { type: 'wall', x: 400, y: 50, width: 760, height: 20 },
      { type: 'wall', x: 400, y: 550, width: 760, height: 20 },
      { type: 'wall', x: 30, y: 300, width: 20, height: 480 },
      { type: 'wall', x: 770, y: 300, width: 20, height: 480 },
      // Windmill
      { type: 'windmill', x: 400, y: 300, width: 200, height: 25, speed: 0.02 },
      // Guide walls
      { type: 'wall', x: 280, y: 150, width: 20, height: 120 },
      { type: 'wall', x: 280, y: 450, width: 20, height: 120 },
      { type: 'wall', x: 520, y: 150, width: 20, height: 120 },
      { type: 'wall', x: 520, y: 450, width: 20, height: 120 },
    ],
    theme: 'grass'
  },
  
  // Level 7: Teleporter Fun
  {
    id: 7,
    name: "Portal Golf",
    par: 2,
    ball: { x: 100, y: 500 },
    hole: { x: 700, y: 100 },
    obstacles: [
      // Border
      { type: 'wall', x: 400, y: 50, width: 760, height: 20 },
      { type: 'wall', x: 400, y: 550, width: 760, height: 20 },
      { type: 'wall', x: 30, y: 300, width: 20, height: 480 },
      { type: 'wall', x: 770, y: 300, width: 20, height: 480 },
      // Big wall in the middle
      { type: 'wall', x: 400, y: 300, width: 20, height: 400 },
      // Teleporters
      { type: 'teleporter', x: 250, y: 300, radius: 35, linkedTo: 1, color: '#9b59b6' },
      { type: 'teleporter', x: 550, y: 300, radius: 35, linkedTo: 0, color: '#9b59b6' },
    ],
    theme: 'space'
  },
  
  // Level 8: Moving Obstacles
  {
    id: 8,
    name: "Rhythm & Putt",
    par: 4,
    ball: { x: 100, y: 300 },
    hole: { x: 700, y: 300 },
    obstacles: [
      // Border
      { type: 'wall', x: 400, y: 50, width: 760, height: 20 },
      { type: 'wall', x: 400, y: 550, width: 760, height: 20 },
      { type: 'wall', x: 30, y: 300, width: 20, height: 480 },
      { type: 'wall', x: 770, y: 300, width: 20, height: 480 },
      // Moving walls
      { type: 'moving-wall', x: 300, y: 300, width: 20, height: 200, speed: 2 },
      { type: 'moving-wall', x: 500, y: 300, width: 20, height: 200, speed: -2 },
    ],
    theme: 'grass'
  },
  
  // Level 9: The Maze
  {
    id: 9,
    name: "Labyrinth",
    par: 5,
    ball: { x: 80, y: 100 },
    hole: { x: 720, y: 500 },
    obstacles: [
      // Border
      { type: 'wall', x: 400, y: 50, width: 760, height: 20 },
      { type: 'wall', x: 400, y: 550, width: 760, height: 20 },
      { type: 'wall', x: 30, y: 300, width: 20, height: 480 },
      { type: 'wall', x: 770, y: 300, width: 20, height: 480 },
      // Maze walls
      { type: 'wall', x: 200, y: 180, width: 20, height: 220 },
      { type: 'wall', x: 300, y: 350, width: 200, height: 20 },
      { type: 'wall', x: 350, y: 150, width: 200, height: 20 },
      { type: 'wall', x: 500, y: 250, width: 20, height: 180 },
      { type: 'wall', x: 400, y: 450, width: 20, height: 160 },
      { type: 'wall', x: 600, y: 400, width: 20, height: 200 },
      { type: 'wall', x: 650, y: 200, width: 180, height: 20 },
    ],
    theme: 'grass'
  },
  
  // Level 10: Grand Finale
  {
    id: 10,
    name: "The Gauntlet",
    par: 5,
    ball: { x: 80, y: 300 },
    hole: { x: 720, y: 300 },
    obstacles: [
      // Border
      { type: 'wall', x: 400, y: 50, width: 760, height: 20 },
      { type: 'wall', x: 400, y: 550, width: 760, height: 20 },
      { type: 'wall', x: 30, y: 300, width: 20, height: 480 },
      { type: 'wall', x: 770, y: 300, width: 20, height: 480 },
      // Water
      { type: 'water', x: 200, y: 200, width: 100, height: 100 },
      { type: 'water', x: 200, y: 400, width: 100, height: 100 },
      // Sand
      { type: 'sand', x: 350, y: 300, width: 80, height: 200 },
      // Bumpers
      { type: 'bumper', x: 500, y: 200, radius: 30 },
      { type: 'bumper', x: 500, y: 400, radius: 30 },
      // Windmill
      { type: 'windmill', x: 620, y: 300, width: 150, height: 20, speed: 0.025 },
    ],
    theme: 'grass'
  },
  
  // Level 11: Ice Rink
  {
    id: 11,
    name: "Frozen Fairway",
    par: 3,
    ball: { x: 100, y: 300 },
    hole: { x: 700, y: 300 },
    obstacles: [
      // Border
      { type: 'wall', x: 400, y: 50, width: 760, height: 20 },
      { type: 'wall', x: 400, y: 550, width: 760, height: 20 },
      { type: 'wall', x: 30, y: 300, width: 20, height: 480 },
      { type: 'wall', x: 770, y: 300, width: 20, height: 480 },
      // Ice (reduced friction) - represented as blue sand
      { type: 'sand', x: 400, y: 300, width: 700, height: 440, color: '#a8d8ea' },
      // Bumpers as obstacles
      { type: 'bumper', x: 300, y: 200, radius: 40 },
      { type: 'bumper', x: 500, y: 400, radius: 40 },
      { type: 'bumper', x: 400, y: 300, radius: 25 },
    ],
    theme: 'ice'
  },
  
  // Level 12: Space Golf
  {
    id: 12,
    name: "Zero Gravity",
    par: 4,
    ball: { x: 100, y: 500 },
    hole: { x: 700, y: 100 },
    obstacles: [
      // Border
      { type: 'wall', x: 400, y: 50, width: 760, height: 20 },
      { type: 'wall', x: 400, y: 550, width: 760, height: 20 },
      { type: 'wall', x: 30, y: 300, width: 20, height: 480 },
      { type: 'wall', x: 770, y: 300, width: 20, height: 480 },
      // Asteroid bumpers
      { type: 'bumper', x: 200, y: 200, radius: 35 },
      { type: 'bumper', x: 400, y: 150, radius: 45 },
      { type: 'bumper', x: 600, y: 250, radius: 30 },
      { type: 'bumper', x: 300, y: 400, radius: 40 },
      { type: 'bumper', x: 550, y: 450, radius: 35 },
      // Teleporters
      { type: 'teleporter', x: 150, y: 150, radius: 30, linkedTo: 1, color: '#00ff88' },
      { type: 'teleporter', x: 650, y: 450, radius: 30, linkedTo: 0, color: '#00ff88' },
    ],
    theme: 'space'
  },
];

export function getLevel(id: number): Level | undefined {
  return levels.find(l => l.id === id);
}

export function getTotalLevels(): number {
  return levels.length;
}
