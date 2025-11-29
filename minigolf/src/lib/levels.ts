import { Level } from '@/types/game';

export const LEVELS: Level[] = [
  // Level 1: The Classic - Simple straight shot
  {
    id: 1,
    name: "The Warm-Up",
    par: 2,
    tee: { x: 100, y: 300 },
    hole: { x: 700, y: 300 },
    bounds: { width: 800, height: 600 },
    theme: 'classic',
    obstacles: [
      // Outer walls
      { type: 'wall', x: 50, y: 200, width: 10, height: 200 },
      { type: 'wall', x: 750, y: 200, width: 10, height: 200 },
      { type: 'wall', x: 50, y: 200, width: 710, height: 10 },
      { type: 'wall', x: 50, y: 400, width: 710, height: 10 },
    ],
  },

  // Level 2: The Dog Leg - L-shaped course
  {
    id: 2,
    name: "Dog Leg",
    par: 3,
    tee: { x: 100, y: 500 },
    hole: { x: 700, y: 150 },
    bounds: { width: 800, height: 600 },
    theme: 'classic',
    obstacles: [
      // Outer walls forming L shape
      { type: 'wall', x: 50, y: 400, width: 10, height: 150 },
      { type: 'wall', x: 50, y: 550, width: 450, height: 10 },
      { type: 'wall', x: 500, y: 300, width: 10, height: 260 },
      { type: 'wall', x: 500, y: 300, width: 260, height: 10 },
      { type: 'wall', x: 750, y: 100, width: 10, height: 210 },
      { type: 'wall', x: 500, y: 100, width: 260, height: 10 },
      // Inner corner
      { type: 'wall', x: 50, y: 400, width: 350, height: 10 },
      { type: 'wall', x: 400, y: 100, width: 10, height: 310 },
      { type: 'wall', x: 400, y: 100, width: 110, height: 10 },
    ],
  },

  // Level 3: Sand Trap Challenge
  {
    id: 3,
    name: "Beach Day",
    par: 3,
    tee: { x: 100, y: 300 },
    hole: { x: 700, y: 300 },
    bounds: { width: 800, height: 600 },
    theme: 'beach',
    obstacles: [
      // Walls
      { type: 'wall', x: 50, y: 150, width: 10, height: 300 },
      { type: 'wall', x: 750, y: 150, width: 10, height: 300 },
      { type: 'wall', x: 50, y: 150, width: 710, height: 10 },
      { type: 'wall', x: 50, y: 450, width: 710, height: 10 },
      // Sand traps
      { type: 'sand', x: 300, y: 200, width: 100, height: 200 },
      { type: 'sand', x: 500, y: 250, width: 80, height: 150 },
      // Water hazard
      { type: 'water', x: 400, y: 350, width: 60, height: 100 },
    ],
  },

  // Level 4: Bumper Madness
  {
    id: 4,
    name: "Pinball Wizard",
    par: 4,
    tee: { x: 100, y: 300 },
    hole: { x: 700, y: 300 },
    bounds: { width: 800, height: 600 },
    theme: 'candy',
    obstacles: [
      // Walls
      { type: 'wall', x: 50, y: 100, width: 10, height: 400 },
      { type: 'wall', x: 750, y: 100, width: 10, height: 400 },
      { type: 'wall', x: 50, y: 100, width: 710, height: 10 },
      { type: 'wall', x: 50, y: 500, width: 710, height: 10 },
      // Bumpers
      { type: 'bumper', x: 250, y: 200, radius: 30 },
      { type: 'bumper', x: 400, y: 350, radius: 35 },
      { type: 'bumper', x: 550, y: 200, radius: 30 },
      { type: 'bumper', x: 350, y: 450, radius: 25 },
      { type: 'bumper', x: 500, y: 450, radius: 25 },
    ],
  },

  // Level 5: The Windmill
  {
    id: 5,
    name: "Windmill Classic",
    par: 3,
    tee: { x: 100, y: 300 },
    hole: { x: 700, y: 300 },
    bounds: { width: 800, height: 600 },
    theme: 'classic',
    obstacles: [
      // Walls
      { type: 'wall', x: 50, y: 150, width: 10, height: 300 },
      { type: 'wall', x: 750, y: 150, width: 10, height: 300 },
      { type: 'wall', x: 50, y: 150, width: 710, height: 10 },
      { type: 'wall', x: 50, y: 450, width: 710, height: 10 },
      // Windmill obstacle
      { type: 'windmill', x: 400, y: 300, width: 120, height: 15, speed: 2 },
      // Guide walls
      { type: 'wall', x: 350, y: 200, width: 10, height: 80 },
      { type: 'wall', x: 450, y: 320, width: 10, height: 80 },
    ],
  },

  // Level 6: The Maze
  {
    id: 6,
    name: "Lost in the Garden",
    par: 5,
    tee: { x: 100, y: 500 },
    hole: { x: 700, y: 100 },
    bounds: { width: 800, height: 600 },
    theme: 'jungle',
    obstacles: [
      // Outer walls
      { type: 'wall', x: 50, y: 50, width: 10, height: 500 },
      { type: 'wall', x: 750, y: 50, width: 10, height: 500 },
      { type: 'wall', x: 50, y: 50, width: 710, height: 10 },
      { type: 'wall', x: 50, y: 550, width: 710, height: 10 },
      // Maze walls
      { type: 'wall', x: 150, y: 50, width: 10, height: 350 },
      { type: 'wall', x: 250, y: 200, width: 10, height: 350 },
      { type: 'wall', x: 350, y: 50, width: 10, height: 350 },
      { type: 'wall', x: 450, y: 200, width: 10, height: 350 },
      { type: 'wall', x: 550, y: 50, width: 10, height: 350 },
      { type: 'wall', x: 650, y: 200, width: 10, height: 350 },
    ],
  },

  // Level 7: Teleporter Fun
  {
    id: 7,
    name: "Portal Paradise",
    par: 3,
    tee: { x: 100, y: 300 },
    hole: { x: 700, y: 300 },
    bounds: { width: 800, height: 600 },
    theme: 'space',
    obstacles: [
      // Walls
      { type: 'wall', x: 50, y: 100, width: 10, height: 400 },
      { type: 'wall', x: 750, y: 100, width: 10, height: 400 },
      { type: 'wall', x: 50, y: 100, width: 710, height: 10 },
      { type: 'wall', x: 50, y: 500, width: 710, height: 10 },
      // Blocking wall
      { type: 'wall', x: 350, y: 100, width: 10, height: 400 },
      // Teleporters
      { type: 'teleporter', x: 250, y: 300, radius: 25, targetX: 450, targetY: 300 },
    ],
  },

  // Level 8: Castle Challenge
  {
    id: 8,
    name: "Castle Siege",
    par: 4,
    tee: { x: 100, y: 500 },
    hole: { x: 400, y: 150 },
    bounds: { width: 800, height: 600 },
    theme: 'castle',
    obstacles: [
      // Outer walls
      { type: 'wall', x: 50, y: 50, width: 10, height: 500 },
      { type: 'wall', x: 750, y: 50, width: 10, height: 500 },
      { type: 'wall', x: 50, y: 50, width: 710, height: 10 },
      { type: 'wall', x: 50, y: 550, width: 710, height: 10 },
      // Castle structure
      { type: 'wall', x: 300, y: 100, width: 200, height: 10 },
      { type: 'wall', x: 300, y: 100, width: 10, height: 150 },
      { type: 'wall', x: 500, y: 100, width: 10, height: 150 },
      { type: 'wall', x: 300, y: 250, width: 80, height: 10 },
      { type: 'wall', x: 420, y: 250, width: 90, height: 10 },
      // Ramps
      { type: 'ramp', x: 200, y: 350, width: 100, height: 20, angle: -15 },
      { type: 'ramp', x: 500, y: 350, width: 100, height: 20, angle: 15 },
      // Moat (water)
      { type: 'water', x: 250, y: 400, width: 300, height: 50 },
    ],
  },

  // Level 9: The Gauntlet
  {
    id: 9,
    name: "The Gauntlet",
    par: 5,
    tee: { x: 70, y: 300 },
    hole: { x: 730, y: 300 },
    bounds: { width: 800, height: 600 },
    theme: 'candy',
    obstacles: [
      // Walls
      { type: 'wall', x: 50, y: 200, width: 10, height: 200 },
      { type: 'wall', x: 750, y: 200, width: 10, height: 200 },
      { type: 'wall', x: 50, y: 200, width: 710, height: 10 },
      { type: 'wall', x: 50, y: 400, width: 710, height: 10 },
      // Obstacles gauntlet
      { type: 'bumper', x: 200, y: 300, radius: 25 },
      { type: 'sand', x: 280, y: 250, width: 60, height: 100 },
      { type: 'windmill', x: 400, y: 300, width: 80, height: 12, speed: 3 },
      { type: 'water', x: 500, y: 270, width: 40, height: 60 },
      { type: 'bumper', x: 600, y: 260, radius: 20 },
      { type: 'bumper', x: 600, y: 340, radius: 20 },
    ],
  },

  // Level 10: Championship Hole
  {
    id: 10,
    name: "Championship",
    par: 6,
    tee: { x: 100, y: 550 },
    hole: { x: 700, y: 100 },
    bounds: { width: 800, height: 650 },
    theme: 'space',
    obstacles: [
      // Outer walls
      { type: 'wall', x: 50, y: 50, width: 10, height: 550 },
      { type: 'wall', x: 750, y: 50, width: 10, height: 550 },
      { type: 'wall', x: 50, y: 50, width: 710, height: 10 },
      { type: 'wall', x: 50, y: 600, width: 710, height: 10 },
      // Complex layout
      { type: 'wall', x: 150, y: 400, width: 200, height: 10 },
      { type: 'wall', x: 350, y: 400, width: 10, height: 150 },
      { type: 'wall', x: 450, y: 250, width: 10, height: 200 },
      { type: 'wall', x: 450, y: 250, width: 150, height: 10 },
      { type: 'wall', x: 250, y: 150, width: 10, height: 150 },
      { type: 'wall', x: 250, y: 150, width: 200, height: 10 },
      // Hazards
      { type: 'water', x: 200, y: 450, width: 100, height: 100 },
      { type: 'sand', x: 500, y: 400, width: 150, height: 100 },
      // Bumpers
      { type: 'bumper', x: 400, y: 500, radius: 30 },
      { type: 'bumper', x: 550, y: 150, radius: 25 },
      // Windmill
      { type: 'windmill', x: 350, y: 300, width: 60, height: 10, speed: 2.5 },
      // Teleporter
      { type: 'teleporter', x: 150, y: 250, radius: 20, targetX: 600, targetY: 350 },
    ],
  },
];

export const getLevel = (id: number): Level | undefined => {
  return LEVELS.find(level => level.id === id);
};

export const TOTAL_LEVELS = LEVELS.length;
