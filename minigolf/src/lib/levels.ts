import { Level, Point } from './types';

// Helper to create rectangular walls
const rect = (x: number, y: number, w: number, h: number): Point[] => [
  { x, y },
  { x: x + w, y },
  { x: x + w, y: y + h },
  { x, y: y + h },
];

export const LEVELS: Level[] = [
  // Level 1: Beginner's Luck
  {
    id: 1,
    name: "Beginner's Luck",
    par: 2,
    tee: { x: 100, y: 300 },
    hole: { x: 600, y: 300 },
    holeRadius: 18,
    bounds: { width: 700, height: 500 },
    walls: [
      { type: 'wall', points: rect(50, 150, 600, 20) },
      { type: 'wall', points: rect(50, 430, 600, 20) },
      { type: 'wall', points: rect(50, 150, 20, 300) },
      { type: 'wall', points: rect(630, 150, 20, 300) },
    ],
    obstacles: [],
    theme: {
      grass: '#2D5A27',
      accent: '#45B649',
      background: '#1a3a1a',
    },
  },

  // Level 2: The Dogleg
  {
    id: 2,
    name: 'The Dogleg',
    par: 3,
    tee: { x: 100, y: 400 },
    hole: { x: 600, y: 100 },
    holeRadius: 18,
    bounds: { width: 700, height: 500 },
    walls: [
      { type: 'wall', points: rect(50, 50, 600, 20) },
      { type: 'wall', points: rect(50, 430, 600, 20) },
      { type: 'wall', points: rect(50, 50, 20, 400) },
      { type: 'wall', points: rect(630, 50, 20, 400) },
      // L-shaped obstacle
      { type: 'wall', points: rect(200, 150, 250, 25) },
      { type: 'wall', points: rect(200, 150, 25, 200) },
    ],
    obstacles: [],
    theme: {
      grass: '#1B4D3E',
      accent: '#3CB371',
      background: '#0d2d24',
    },
  },

  // Level 3: Sandy Shores
  {
    id: 3,
    name: 'Sandy Shores',
    par: 3,
    tee: { x: 100, y: 250 },
    hole: { x: 600, y: 250 },
    holeRadius: 18,
    bounds: { width: 700, height: 500 },
    walls: [
      { type: 'wall', points: rect(50, 100, 600, 20) },
      { type: 'wall', points: rect(50, 380, 600, 20) },
      { type: 'wall', points: rect(50, 100, 20, 300) },
      { type: 'wall', points: rect(630, 100, 20, 300) },
    ],
    obstacles: [
      { type: 'sand', position: { x: 300, y: 200 }, width: 150, height: 100 },
      { type: 'sand', position: { x: 450, y: 280 }, width: 80, height: 80 },
    ],
    theme: {
      grass: '#2D5A27',
      accent: '#F4D03F',
      background: '#1a3a1a',
    },
  },

  // Level 4: Water Hazard
  {
    id: 4,
    name: 'Water Hazard',
    par: 3,
    tee: { x: 100, y: 250 },
    hole: { x: 600, y: 250 },
    holeRadius: 18,
    bounds: { width: 700, height: 500 },
    walls: [
      { type: 'wall', points: rect(50, 100, 600, 20) },
      { type: 'wall', points: rect(50, 380, 600, 20) },
      { type: 'wall', points: rect(50, 100, 20, 300) },
      { type: 'wall', points: rect(630, 100, 20, 300) },
      // Bridge walls
      { type: 'wall', points: rect(300, 100, 20, 80) },
      { type: 'wall', points: rect(380, 100, 20, 80) },
      { type: 'wall', points: rect(300, 320, 20, 80) },
      { type: 'wall', points: rect(380, 320, 20, 80) },
    ],
    obstacles: [
      { type: 'water', position: { x: 270, y: 170 }, width: 160, height: 160 },
    ],
    theme: {
      grass: '#1E5128',
      accent: '#4FC3F7',
      background: '#0f2d14',
    },
  },

  // Level 5: Bouncy Castle
  {
    id: 5,
    name: 'Bouncy Castle',
    par: 4,
    tee: { x: 100, y: 400 },
    hole: { x: 600, y: 100 },
    holeRadius: 18,
    bounds: { width: 700, height: 500 },
    walls: [
      { type: 'wall', points: rect(50, 50, 600, 20) },
      { type: 'wall', points: rect(50, 430, 600, 20) },
      { type: 'wall', points: rect(50, 50, 20, 400) },
      { type: 'wall', points: rect(630, 50, 20, 400) },
      // Inner walls creating a maze
      { type: 'wall', points: rect(150, 150, 20, 200) },
      { type: 'wall', points: rect(300, 100, 20, 200) },
      { type: 'wall', points: rect(450, 200, 20, 200) },
    ],
    obstacles: [
      { type: 'bouncer', position: { x: 250, y: 300 }, radius: 25 },
      { type: 'bouncer', position: { x: 400, y: 150 }, radius: 25 },
      { type: 'bouncer', position: { x: 550, y: 300 }, radius: 25 },
    ],
    theme: {
      grass: '#2E4057',
      accent: '#FF6B6B',
      background: '#1a2635',
    },
  },

  // Level 6: The Windmill
  {
    id: 6,
    name: 'The Windmill',
    par: 4,
    tee: { x: 100, y: 250 },
    hole: { x: 600, y: 250 },
    holeRadius: 18,
    bounds: { width: 700, height: 500 },
    walls: [
      { type: 'wall', points: rect(50, 100, 600, 20) },
      { type: 'wall', points: rect(50, 380, 600, 20) },
      { type: 'wall', points: rect(50, 100, 20, 300) },
      { type: 'wall', points: rect(630, 100, 20, 300) },
    ],
    obstacles: [
      { type: 'windmill', position: { x: 350, y: 250 }, width: 120, height: 20, speed: 2 },
    ],
    theme: {
      grass: '#2D5A27',
      accent: '#8B4513',
      background: '#1a3a1a',
    },
  },

  // Level 7: Serpentine
  {
    id: 7,
    name: 'Serpentine',
    par: 5,
    tee: { x: 100, y: 400 },
    hole: { x: 600, y: 100 },
    holeRadius: 18,
    bounds: { width: 700, height: 500 },
    walls: [
      { type: 'wall', points: rect(50, 50, 600, 20) },
      { type: 'wall', points: rect(50, 430, 600, 20) },
      { type: 'wall', points: rect(50, 50, 20, 400) },
      { type: 'wall', points: rect(630, 50, 20, 400) },
      // Serpentine walls
      { type: 'wall', points: rect(150, 50, 20, 280) },
      { type: 'wall', points: rect(280, 170, 20, 280) },
      { type: 'wall', points: rect(410, 50, 20, 280) },
      { type: 'wall', points: rect(540, 170, 20, 280) },
    ],
    obstacles: [],
    theme: {
      grass: '#1B5E20',
      accent: '#81C784',
      background: '#0d3310',
    },
  },

  // Level 8: Island Hopping
  {
    id: 8,
    name: 'Island Hopping',
    par: 4,
    tee: { x: 100, y: 250 },
    hole: { x: 600, y: 250 },
    holeRadius: 18,
    bounds: { width: 700, height: 500 },
    walls: [
      { type: 'wall', points: rect(50, 100, 600, 20) },
      { type: 'wall', points: rect(50, 380, 600, 20) },
      { type: 'wall', points: rect(50, 100, 20, 300) },
      { type: 'wall', points: rect(630, 100, 20, 300) },
    ],
    obstacles: [
      { type: 'water', position: { x: 180, y: 120 }, width: 100, height: 260 },
      { type: 'water', position: { x: 420, y: 120 }, width: 100, height: 260 },
      { type: 'bouncer', position: { x: 350, y: 250 }, radius: 30 },
    ],
    theme: {
      grass: '#006064',
      accent: '#00BCD4',
      background: '#003d40',
    },
  },

  // Level 9: The Gauntlet
  {
    id: 9,
    name: 'The Gauntlet',
    par: 5,
    tee: { x: 100, y: 250 },
    hole: { x: 600, y: 250 },
    holeRadius: 18,
    bounds: { width: 700, height: 500 },
    walls: [
      { type: 'wall', points: rect(50, 100, 600, 20) },
      { type: 'wall', points: rect(50, 380, 600, 20) },
      { type: 'wall', points: rect(50, 100, 20, 300) },
      { type: 'wall', points: rect(630, 100, 20, 300) },
      // Narrow passages
      { type: 'wall', points: rect(200, 100, 20, 100) },
      { type: 'wall', points: rect(200, 300, 20, 100) },
      { type: 'wall', points: rect(350, 100, 20, 130) },
      { type: 'wall', points: rect(350, 270, 20, 130) },
      { type: 'wall', points: rect(500, 100, 20, 100) },
      { type: 'wall', points: rect(500, 300, 20, 100) },
    ],
    obstacles: [
      { type: 'windmill', position: { x: 275, y: 250 }, width: 80, height: 15, speed: 3 },
      { type: 'windmill', position: { x: 425, y: 250 }, width: 80, height: 15, speed: -2 },
    ],
    theme: {
      grass: '#37474F',
      accent: '#FF7043',
      background: '#1c2529',
    },
  },

  // Level 10: Grand Finale
  {
    id: 10,
    name: 'Grand Finale',
    par: 6,
    tee: { x: 100, y: 450 },
    hole: { x: 600, y: 50 },
    holeRadius: 20,
    bounds: { width: 700, height: 550 },
    walls: [
      { type: 'wall', points: rect(50, 20, 600, 20) },
      { type: 'wall', points: rect(50, 510, 600, 20) },
      { type: 'wall', points: rect(50, 20, 20, 510) },
      { type: 'wall', points: rect(630, 20, 20, 510) },
      // Complex maze
      { type: 'wall', points: rect(150, 100, 20, 150) },
      { type: 'wall', points: rect(150, 350, 20, 150) },
      { type: 'wall', points: rect(280, 180, 150, 20) },
      { type: 'wall', points: rect(280, 350, 150, 20) },
      { type: 'wall', points: rect(500, 100, 20, 200) },
      { type: 'wall', points: rect(500, 400, 20, 100) },
    ],
    obstacles: [
      { type: 'water', position: { x: 200, y: 250 }, width: 80, height: 80 },
      { type: 'sand', position: { x: 450, y: 320 }, width: 100, height: 70 },
      { type: 'bouncer', position: { x: 350, y: 270 }, radius: 30 },
      { type: 'windmill', position: { x: 350, y: 120 }, width: 100, height: 18, speed: 2.5 },
    ],
    theme: {
      grass: '#4A148C',
      accent: '#E040FB',
      background: '#2a0a50',
    },
  },
];

export const getLevel = (id: number): Level | undefined => {
  return LEVELS.find(l => l.id === id);
};

export const getTotalLevels = (): number => LEVELS.length;
