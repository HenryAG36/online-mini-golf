import { Level } from '@/types/game';

export const LEVELS: Level[] = [
  // Level 1: Easy Start - Straight Shot
  {
    id: 1,
    name: "First Putt",
    par: 2,
    theme: 'grass',
    bounds: { width: 600, height: 400 },
    startPosition: { x: 100, y: 200 },
    hole: { position: { x: 500, y: 200 }, radius: 18 },
    walls: [
      { start: { x: 50, y: 100 }, end: { x: 550, y: 100 }, type: 'normal' },
      { start: { x: 50, y: 300 }, end: { x: 550, y: 300 }, type: 'normal' },
      { start: { x: 50, y: 100 }, end: { x: 50, y: 300 }, type: 'normal' },
      { start: { x: 550, y: 100 }, end: { x: 550, y: 300 }, type: 'normal' },
    ],
    obstacles: [],
  },

  // Level 2: The Dogleg
  {
    id: 2,
    name: "Dogleg Right",
    par: 3,
    theme: 'grass',
    bounds: { width: 600, height: 450 },
    startPosition: { x: 100, y: 100 },
    hole: { position: { x: 500, y: 350 }, radius: 18 },
    walls: [
      { start: { x: 50, y: 50 }, end: { x: 350, y: 50 }, type: 'normal' },
      { start: { x: 350, y: 50 }, end: { x: 350, y: 200 }, type: 'normal' },
      { start: { x: 350, y: 200 }, end: { x: 550, y: 200 }, type: 'normal' },
      { start: { x: 550, y: 200 }, end: { x: 550, y: 400 }, type: 'normal' },
      { start: { x: 550, y: 400 }, end: { x: 250, y: 400 }, type: 'normal' },
      { start: { x: 250, y: 400 }, end: { x: 250, y: 150 }, type: 'normal' },
      { start: { x: 250, y: 150 }, end: { x: 50, y: 150 }, type: 'normal' },
      { start: { x: 50, y: 150 }, end: { x: 50, y: 50 }, type: 'normal' },
    ],
    obstacles: [],
  },

  // Level 3: Bumper Madness
  {
    id: 3,
    name: "Bumper Bonanza",
    par: 3,
    theme: 'candy',
    bounds: { width: 600, height: 400 },
    startPosition: { x: 80, y: 200 },
    hole: { position: { x: 520, y: 200 }, radius: 18 },
    walls: [
      { start: { x: 40, y: 80 }, end: { x: 560, y: 80 }, type: 'bouncy' },
      { start: { x: 40, y: 320 }, end: { x: 560, y: 320 }, type: 'bouncy' },
      { start: { x: 40, y: 80 }, end: { x: 40, y: 320 }, type: 'bouncy' },
      { start: { x: 560, y: 80 }, end: { x: 560, y: 320 }, type: 'bouncy' },
    ],
    obstacles: [
      { type: 'bumper', position: { x: 200, y: 150 }, size: { x: 40, y: 40 } },
      { type: 'bumper', position: { x: 300, y: 250 }, size: { x: 40, y: 40 } },
      { type: 'bumper', position: { x: 400, y: 150 }, size: { x: 40, y: 40 } },
      { type: 'bumper', position: { x: 250, y: 200 }, size: { x: 30, y: 30 } },
      { type: 'bumper', position: { x: 350, y: 200 }, size: { x: 30, y: 30 } },
    ],
  },

  // Level 4: Sandy Shores
  {
    id: 4,
    name: "Sandy Shores",
    par: 4,
    theme: 'desert',
    bounds: { width: 650, height: 400 },
    startPosition: { x: 80, y: 320 },
    hole: { position: { x: 570, y: 80 }, radius: 18 },
    walls: [
      { start: { x: 40, y: 40 }, end: { x: 610, y: 40 }, type: 'normal' },
      { start: { x: 40, y: 360 }, end: { x: 610, y: 360 }, type: 'normal' },
      { start: { x: 40, y: 40 }, end: { x: 40, y: 360 }, type: 'normal' },
      { start: { x: 610, y: 40 }, end: { x: 610, y: 360 }, type: 'normal' },
      { start: { x: 200, y: 40 }, end: { x: 200, y: 220 }, type: 'normal' },
      { start: { x: 400, y: 140 }, end: { x: 400, y: 360 }, type: 'normal' },
    ],
    obstacles: [
      { type: 'sand', position: { x: 300, y: 280 }, size: { x: 150, y: 100 } },
      { type: 'sand', position: { x: 500, y: 180 }, size: { x: 80, y: 80 } },
    ],
  },

  // Level 5: Water Hazard
  {
    id: 5,
    name: "Lake View",
    par: 3,
    theme: 'grass',
    bounds: { width: 600, height: 400 },
    startPosition: { x: 80, y: 200 },
    hole: { position: { x: 520, y: 200 }, radius: 18 },
    walls: [
      { start: { x: 40, y: 60 }, end: { x: 560, y: 60 }, type: 'normal' },
      { start: { x: 40, y: 340 }, end: { x: 560, y: 340 }, type: 'normal' },
      { start: { x: 40, y: 60 }, end: { x: 40, y: 340 }, type: 'normal' },
      { start: { x: 560, y: 60 }, end: { x: 560, y: 340 }, type: 'normal' },
    ],
    obstacles: [
      { type: 'water', position: { x: 300, y: 200 }, size: { x: 120, y: 200 } },
    ],
  },

  // Level 6: Spinner Challenge
  {
    id: 6,
    name: "Spin City",
    par: 4,
    theme: 'space',
    bounds: { width: 600, height: 450 },
    startPosition: { x: 80, y: 225 },
    hole: { position: { x: 520, y: 225 }, radius: 18 },
    walls: [
      { start: { x: 40, y: 50 }, end: { x: 560, y: 50 }, type: 'normal' },
      { start: { x: 40, y: 400 }, end: { x: 560, y: 400 }, type: 'normal' },
      { start: { x: 40, y: 50 }, end: { x: 40, y: 400 }, type: 'normal' },
      { start: { x: 560, y: 50 }, end: { x: 560, y: 400 }, type: 'normal' },
    ],
    obstacles: [
      { type: 'spinner', position: { x: 200, y: 150 }, size: { x: 60, y: 60 } },
      { type: 'spinner', position: { x: 300, y: 300 }, size: { x: 60, y: 60 } },
      { type: 'spinner', position: { x: 400, y: 150 }, size: { x: 60, y: 60 } },
    ],
  },

  // Level 7: The Maze
  {
    id: 7,
    name: "Labyrinth",
    par: 5,
    theme: 'grass',
    bounds: { width: 650, height: 450 },
    startPosition: { x: 80, y: 380 },
    hole: { position: { x: 570, y: 70 }, radius: 18 },
    walls: [
      // Outer walls
      { start: { x: 40, y: 40 }, end: { x: 610, y: 40 }, type: 'normal' },
      { start: { x: 40, y: 410 }, end: { x: 610, y: 410 }, type: 'normal' },
      { start: { x: 40, y: 40 }, end: { x: 40, y: 410 }, type: 'normal' },
      { start: { x: 610, y: 40 }, end: { x: 610, y: 410 }, type: 'normal' },
      // Inner maze walls
      { start: { x: 40, y: 140 }, end: { x: 200, y: 140 }, type: 'normal' },
      { start: { x: 140, y: 140 }, end: { x: 140, y: 280 }, type: 'normal' },
      { start: { x: 140, y: 280 }, end: { x: 300, y: 280 }, type: 'normal' },
      { start: { x: 300, y: 140 }, end: { x: 300, y: 350 }, type: 'normal' },
      { start: { x: 200, y: 40 }, end: { x: 200, y: 200 }, type: 'normal' },
      { start: { x: 400, y: 100 }, end: { x: 400, y: 280 }, type: 'normal' },
      { start: { x: 400, y: 280 }, end: { x: 500, y: 280 }, type: 'normal' },
      { start: { x: 500, y: 140 }, end: { x: 500, y: 410 }, type: 'normal' },
      { start: { x: 300, y: 100 }, end: { x: 500, y: 100 }, type: 'normal' },
    ],
    obstacles: [],
  },

  // Level 8: Portal Pandemonium
  {
    id: 8,
    name: "Portal Panic",
    par: 3,
    theme: 'space',
    bounds: { width: 600, height: 400 },
    startPosition: { x: 80, y: 320 },
    hole: { position: { x: 520, y: 80 }, radius: 18 },
    walls: [
      { start: { x: 40, y: 40 }, end: { x: 560, y: 40 }, type: 'normal' },
      { start: { x: 40, y: 360 }, end: { x: 560, y: 360 }, type: 'normal' },
      { start: { x: 40, y: 40 }, end: { x: 40, y: 360 }, type: 'normal' },
      { start: { x: 560, y: 40 }, end: { x: 560, y: 360 }, type: 'normal' },
      { start: { x: 200, y: 40 }, end: { x: 200, y: 250 }, type: 'normal' },
      { start: { x: 400, y: 150 }, end: { x: 400, y: 360 }, type: 'normal' },
    ],
    obstacles: [
      { 
        type: 'portal', 
        position: { x: 120, y: 120 }, 
        size: { x: 40, y: 40 },
        properties: { targetPosition: { x: 480, y: 280 } }
      },
      { 
        type: 'portal', 
        position: { x: 300, y: 300 }, 
        size: { x: 40, y: 40 },
        properties: { targetPosition: { x: 450, y: 120 } }
      },
    ],
  },

  // Level 9: The Grand Finale
  {
    id: 9,
    name: "Grand Finale",
    par: 5,
    theme: 'volcano',
    bounds: { width: 700, height: 500 },
    startPosition: { x: 80, y: 420 },
    hole: { position: { x: 620, y: 80 }, radius: 18 },
    walls: [
      // Outer walls
      { start: { x: 40, y: 40 }, end: { x: 660, y: 40 }, type: 'normal' },
      { start: { x: 40, y: 460 }, end: { x: 660, y: 460 }, type: 'normal' },
      { start: { x: 40, y: 40 }, end: { x: 40, y: 460 }, type: 'normal' },
      { start: { x: 660, y: 40 }, end: { x: 660, y: 460 }, type: 'normal' },
      // Inner obstacles
      { start: { x: 150, y: 40 }, end: { x: 150, y: 200 }, type: 'bouncy' },
      { start: { x: 150, y: 300 }, end: { x: 150, y: 460 }, type: 'bouncy' },
      { start: { x: 300, y: 100 }, end: { x: 300, y: 360 }, type: 'normal' },
      { start: { x: 450, y: 140 }, end: { x: 450, y: 460 }, type: 'normal' },
      { start: { x: 550, y: 40 }, end: { x: 550, y: 320 }, type: 'bouncy' },
    ],
    obstacles: [
      { type: 'bumper', position: { x: 220, y: 250 }, size: { x: 50, y: 50 } },
      { type: 'bumper', position: { x: 380, y: 200 }, size: { x: 40, y: 40 } },
      { type: 'bumper', position: { x: 500, y: 380 }, size: { x: 45, y: 45 } },
      { type: 'sand', position: { x: 380, y: 380 }, size: { x: 100, y: 80 } },
      { type: 'water', position: { x: 220, y: 380 }, size: { x: 80, y: 100 } },
      { type: 'spinner', position: { x: 600, y: 200 }, size: { x: 50, y: 50 } },
      { 
        type: 'ramp', 
        position: { x: 220, y: 120 }, 
        size: { x: 60, y: 40 },
        rotation: -Math.PI / 4
      },
    ],
  },
];

export function getLevel(id: number): Level | undefined {
  return LEVELS.find(level => level.id === id);
}

export function getTotalLevels(): number {
  return LEVELS.length;
}
