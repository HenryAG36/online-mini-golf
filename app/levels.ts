import { Level } from './types';

export const levels: Level[] = [
  // Level 1: Straight Shot
  {
    id: 1,
    name: "First Swing",
    par: 2,
    tee: { x: 100, y: 300 },
    hole: { position: { x: 500, y: 300 }, radius: 18 },
    bounds: { x: 40, y: 100, width: 520, height: 400 },
    walls: [
      { start: { x: 40, y: 100 }, end: { x: 560, y: 100 }, thickness: 8 },
      { start: { x: 560, y: 100 }, end: { x: 560, y: 500 }, thickness: 8 },
      { start: { x: 560, y: 500 }, end: { x: 40, y: 500 }, thickness: 8 },
      { start: { x: 40, y: 500 }, end: { x: 40, y: 100 }, thickness: 8 },
    ],
    obstacles: [],
    theme: { primary: '#2d4a3e', secondary: '#1a2e26', accent: '#4ade80' }
  },
  
  // Level 2: L-Shape
  {
    id: 2,
    name: "The Corner",
    par: 3,
    tee: { x: 100, y: 150 },
    hole: { position: { x: 500, y: 450 }, radius: 18 },
    bounds: { x: 40, y: 80, width: 520, height: 440 },
    walls: [
      { start: { x: 40, y: 80 }, end: { x: 300, y: 80 }, thickness: 8 },
      { start: { x: 300, y: 80 }, end: { x: 300, y: 280 }, thickness: 8 },
      { start: { x: 300, y: 280 }, end: { x: 560, y: 280 }, thickness: 8 },
      { start: { x: 560, y: 280 }, end: { x: 560, y: 520 }, thickness: 8 },
      { start: { x: 560, y: 520 }, end: { x: 200, y: 520 }, thickness: 8 },
      { start: { x: 200, y: 520 }, end: { x: 200, y: 280 }, thickness: 8 },
      { start: { x: 200, y: 280 }, end: { x: 40, y: 280 }, thickness: 8 },
      { start: { x: 40, y: 280 }, end: { x: 40, y: 80 }, thickness: 8 },
    ],
    obstacles: [],
    theme: { primary: '#3d3a4a', secondary: '#252331', accent: '#a78bfa' }
  },

  // Level 3: Bumper Fun
  {
    id: 3,
    name: "Bumper Zone",
    par: 3,
    tee: { x: 100, y: 300 },
    hole: { position: { x: 500, y: 300 }, radius: 18 },
    bounds: { x: 40, y: 100, width: 520, height: 400 },
    walls: [
      { start: { x: 40, y: 100 }, end: { x: 560, y: 100 }, thickness: 8 },
      { start: { x: 560, y: 100 }, end: { x: 560, y: 500 }, thickness: 8 },
      { start: { x: 560, y: 500 }, end: { x: 40, y: 500 }, thickness: 8 },
      { start: { x: 40, y: 500 }, end: { x: 40, y: 100 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'bumper', shape: { x: 250, y: 250, radius: 25 }, properties: { bounceFactor: 1.5 } },
      { type: 'bumper', shape: { x: 350, y: 350, radius: 25 }, properties: { bounceFactor: 1.5 } },
      { type: 'bumper', shape: { x: 300, y: 200, radius: 20 }, properties: { bounceFactor: 1.5 } },
      { type: 'bumper', shape: { x: 300, y: 400, radius: 20 }, properties: { bounceFactor: 1.5 } },
    ],
    theme: { primary: '#4a3d3d', secondary: '#312525', accent: '#f472b6' }
  },

  // Level 4: Sand Trap
  {
    id: 4,
    name: "Beach Day",
    par: 3,
    tee: { x: 100, y: 300 },
    hole: { position: { x: 500, y: 300 }, radius: 18 },
    bounds: { x: 40, y: 100, width: 520, height: 400 },
    walls: [
      { start: { x: 40, y: 100 }, end: { x: 560, y: 100 }, thickness: 8 },
      { start: { x: 560, y: 100 }, end: { x: 560, y: 500 }, thickness: 8 },
      { start: { x: 560, y: 500 }, end: { x: 40, y: 500 }, thickness: 8 },
      { start: { x: 40, y: 500 }, end: { x: 40, y: 100 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'sand', shape: { x: 220, y: 200, width: 100, height: 80 }, properties: { friction: 0.95 } },
      { type: 'sand', shape: { x: 320, y: 350, width: 120, height: 90 }, properties: { friction: 0.95 } },
    ],
    theme: { primary: '#4a4a3d', secondary: '#31312a', accent: '#fbbf24' }
  },

  // Level 5: Water Hazard
  {
    id: 5,
    name: "Water World",
    par: 3,
    tee: { x: 100, y: 300 },
    hole: { position: { x: 500, y: 300 }, radius: 18 },
    bounds: { x: 40, y: 100, width: 520, height: 400 },
    walls: [
      { start: { x: 40, y: 100 }, end: { x: 560, y: 100 }, thickness: 8 },
      { start: { x: 560, y: 100 }, end: { x: 560, y: 500 }, thickness: 8 },
      { start: { x: 560, y: 500 }, end: { x: 40, y: 500 }, thickness: 8 },
      { start: { x: 40, y: 500 }, end: { x: 40, y: 100 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'water', shape: { x: 250, y: 150, width: 100, height: 300 } },
    ],
    theme: { primary: '#3d4a4a', secondary: '#253131', accent: '#60a5fa' }
  },

  // Level 6: The Windmill
  {
    id: 6,
    name: "Windmill Classic",
    par: 4,
    tee: { x: 100, y: 300 },
    hole: { position: { x: 500, y: 300 }, radius: 18 },
    bounds: { x: 40, y: 100, width: 520, height: 400 },
    walls: [
      { start: { x: 40, y: 100 }, end: { x: 560, y: 100 }, thickness: 8 },
      { start: { x: 560, y: 100 }, end: { x: 560, y: 500 }, thickness: 8 },
      { start: { x: 560, y: 500 }, end: { x: 40, y: 500 }, thickness: 8 },
      { start: { x: 40, y: 500 }, end: { x: 40, y: 100 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'windmill', shape: { x: 300, y: 300, radius: 60 }, properties: { speed: 2 } },
    ],
    theme: { primary: '#3d4a42', secondary: '#25312a', accent: '#4ade80' }
  },

  // Level 7: Maze
  {
    id: 7,
    name: "The Maze",
    par: 5,
    tee: { x: 80, y: 150 },
    hole: { position: { x: 520, y: 450 }, radius: 18 },
    bounds: { x: 40, y: 80, width: 520, height: 440 },
    walls: [
      { start: { x: 40, y: 80 }, end: { x: 560, y: 80 }, thickness: 8 },
      { start: { x: 560, y: 80 }, end: { x: 560, y: 520 }, thickness: 8 },
      { start: { x: 560, y: 520 }, end: { x: 40, y: 520 }, thickness: 8 },
      { start: { x: 40, y: 520 }, end: { x: 40, y: 80 }, thickness: 8 },
      // Inner walls
      { start: { x: 150, y: 80 }, end: { x: 150, y: 300 }, thickness: 8 },
      { start: { x: 250, y: 220 }, end: { x: 250, y: 520 }, thickness: 8 },
      { start: { x: 350, y: 80 }, end: { x: 350, y: 350 }, thickness: 8 },
      { start: { x: 450, y: 200 }, end: { x: 450, y: 520 }, thickness: 8 },
    ],
    obstacles: [],
    theme: { primary: '#4a3d4a', secondary: '#312531', accent: '#a78bfa' }
  },

  // Level 8: Teleporter
  {
    id: 8,
    name: "Portal Jump",
    par: 3,
    tee: { x: 100, y: 300 },
    hole: { position: { x: 500, y: 300 }, radius: 18 },
    bounds: { x: 40, y: 100, width: 520, height: 400 },
    walls: [
      { start: { x: 40, y: 100 }, end: { x: 560, y: 100 }, thickness: 8 },
      { start: { x: 560, y: 100 }, end: { x: 560, y: 500 }, thickness: 8 },
      { start: { x: 560, y: 500 }, end: { x: 40, y: 500 }, thickness: 8 },
      { start: { x: 40, y: 500 }, end: { x: 40, y: 100 }, thickness: 8 },
      // Blocking wall
      { start: { x: 280, y: 100 }, end: { x: 280, y: 400 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'teleporter', shape: { x: 200, y: 300, radius: 20 }, id: 'tp1', properties: { pairedId: 'tp2' } },
      { type: 'teleporter', shape: { x: 400, y: 300, radius: 20 }, id: 'tp2', properties: { pairedId: 'tp1' } },
    ],
    theme: { primary: '#3d3d4a', secondary: '#252531', accent: '#c084fc' }
  },

  // Level 9: Moving Walls
  {
    id: 9,
    name: "Keep Moving",
    par: 4,
    tee: { x: 100, y: 300 },
    hole: { position: { x: 500, y: 300 }, radius: 18 },
    bounds: { x: 40, y: 100, width: 520, height: 400 },
    walls: [
      { start: { x: 40, y: 100 }, end: { x: 560, y: 100 }, thickness: 8 },
      { start: { x: 560, y: 100 }, end: { x: 560, y: 500 }, thickness: 8 },
      { start: { x: 560, y: 500 }, end: { x: 40, y: 500 }, thickness: 8 },
      { start: { x: 40, y: 500 }, end: { x: 40, y: 100 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'moving-wall', shape: { x: 250, y: 200, width: 10, height: 100 }, properties: { speed: 1.5, direction: 1 } },
      { type: 'moving-wall', shape: { x: 350, y: 300, width: 10, height: 100 }, properties: { speed: 1.5, direction: -1 } },
    ],
    theme: { primary: '#4a423d', secondary: '#312a25', accent: '#fb923c' }
  },

  // Level 10: Bumper Gauntlet
  {
    id: 10,
    name: "Pinball Zone",
    par: 4,
    tee: { x: 100, y: 300 },
    hole: { position: { x: 500, y: 300 }, radius: 18 },
    bounds: { x: 40, y: 100, width: 520, height: 400 },
    walls: [
      { start: { x: 40, y: 100 }, end: { x: 560, y: 100 }, thickness: 8 },
      { start: { x: 560, y: 100 }, end: { x: 560, y: 500 }, thickness: 8 },
      { start: { x: 560, y: 500 }, end: { x: 40, y: 500 }, thickness: 8 },
      { start: { x: 40, y: 500 }, end: { x: 40, y: 100 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'bumper', shape: { x: 200, y: 200, radius: 22 }, properties: { bounceFactor: 1.6 } },
      { type: 'bumper', shape: { x: 200, y: 400, radius: 22 }, properties: { bounceFactor: 1.6 } },
      { type: 'bumper', shape: { x: 300, y: 300, radius: 28 }, properties: { bounceFactor: 1.6 } },
      { type: 'bumper', shape: { x: 400, y: 200, radius: 22 }, properties: { bounceFactor: 1.6 } },
      { type: 'bumper', shape: { x: 400, y: 400, radius: 22 }, properties: { bounceFactor: 1.6 } },
      { type: 'bumper', shape: { x: 300, y: 180, radius: 18 }, properties: { bounceFactor: 1.6 } },
      { type: 'bumper', shape: { x: 300, y: 420, radius: 18 }, properties: { bounceFactor: 1.6 } },
    ],
    theme: { primary: '#4a3d42', secondary: '#312529', accent: '#f472b6' }
  },

  // Level 11: S-Curve
  {
    id: 11,
    name: "Snake Path",
    par: 4,
    tee: { x: 80, y: 130 },
    hole: { position: { x: 520, y: 470 }, radius: 18 },
    bounds: { x: 40, y: 80, width: 520, height: 440 },
    walls: [
      { start: { x: 40, y: 80 }, end: { x: 560, y: 80 }, thickness: 8 },
      { start: { x: 560, y: 80 }, end: { x: 560, y: 520 }, thickness: 8 },
      { start: { x: 560, y: 520 }, end: { x: 40, y: 520 }, thickness: 8 },
      { start: { x: 40, y: 520 }, end: { x: 40, y: 80 }, thickness: 8 },
      // S-curve walls
      { start: { x: 40, y: 200 }, end: { x: 400, y: 200 }, thickness: 8 },
      { start: { x: 160, y: 340 }, end: { x: 560, y: 340 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'sand', shape: { x: 280, y: 250, width: 80, height: 60 }, properties: { friction: 0.95 } },
    ],
    theme: { primary: '#3d4642', secondary: '#252e2a', accent: '#34d399' }
  },

  // Level 12: Double Windmill
  {
    id: 12,
    name: "Twin Mills",
    par: 5,
    tee: { x: 100, y: 300 },
    hole: { position: { x: 500, y: 300 }, radius: 18 },
    bounds: { x: 40, y: 100, width: 520, height: 400 },
    walls: [
      { start: { x: 40, y: 100 }, end: { x: 560, y: 100 }, thickness: 8 },
      { start: { x: 560, y: 100 }, end: { x: 560, y: 500 }, thickness: 8 },
      { start: { x: 560, y: 500 }, end: { x: 40, y: 500 }, thickness: 8 },
      { start: { x: 40, y: 500 }, end: { x: 40, y: 100 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'windmill', shape: { x: 230, y: 300, radius: 50 }, properties: { speed: 2.5 } },
      { type: 'windmill', shape: { x: 380, y: 300, radius: 50 }, properties: { speed: -2 } },
    ],
    theme: { primary: '#424a3d', secondary: '#2a3125', accent: '#a3e635' }
  },

  // Level 13: Island Hop
  {
    id: 13,
    name: "Island Hop",
    par: 4,
    tee: { x: 100, y: 300 },
    hole: { position: { x: 500, y: 300 }, radius: 18 },
    bounds: { x: 40, y: 100, width: 520, height: 400 },
    walls: [
      { start: { x: 40, y: 100 }, end: { x: 560, y: 100 }, thickness: 8 },
      { start: { x: 560, y: 100 }, end: { x: 560, y: 500 }, thickness: 8 },
      { start: { x: 560, y: 500 }, end: { x: 40, y: 500 }, thickness: 8 },
      { start: { x: 40, y: 500 }, end: { x: 40, y: 100 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'water', shape: { x: 160, y: 100, width: 80, height: 400 } },
      { type: 'water', shape: { x: 360, y: 100, width: 80, height: 400 } },
      // Bridges
      { type: 'ramp', shape: { x: 160, y: 270, width: 80, height: 60 } },
      { type: 'ramp', shape: { x: 360, y: 270, width: 80, height: 60 } },
    ],
    theme: { primary: '#3d464a', secondary: '#252e31', accent: '#38bdf8' }
  },

  // Level 14: Chaos Theory
  {
    id: 14,
    name: "Chaos Theory",
    par: 5,
    tee: { x: 100, y: 450 },
    hole: { position: { x: 500, y: 150 }, radius: 18 },
    bounds: { x: 40, y: 80, width: 520, height: 440 },
    walls: [
      { start: { x: 40, y: 80 }, end: { x: 560, y: 80 }, thickness: 8 },
      { start: { x: 560, y: 80 }, end: { x: 560, y: 520 }, thickness: 8 },
      { start: { x: 560, y: 520 }, end: { x: 40, y: 520 }, thickness: 8 },
      { start: { x: 40, y: 520 }, end: { x: 40, y: 80 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'bumper', shape: { x: 200, y: 200, radius: 25 }, properties: { bounceFactor: 1.5 } },
      { type: 'bumper', shape: { x: 350, y: 350, radius: 25 }, properties: { bounceFactor: 1.5 } },
      { type: 'windmill', shape: { x: 300, y: 280, radius: 45 }, properties: { speed: 2 } },
      { type: 'sand', shape: { x: 400, y: 180, width: 80, height: 80 }, properties: { friction: 0.95 } },
      { type: 'moving-wall', shape: { x: 180, y: 320, width: 10, height: 80 }, properties: { speed: 1.2, direction: 1 } },
    ],
    theme: { primary: '#4a3d46', secondary: '#31252e', accent: '#e879f9' }
  },

  // Level 15: Teleport Maze
  {
    id: 15,
    name: "Portal Madness",
    par: 4,
    tee: { x: 80, y: 450 },
    hole: { position: { x: 520, y: 150 }, radius: 18 },
    bounds: { x: 40, y: 80, width: 520, height: 440 },
    walls: [
      { start: { x: 40, y: 80 }, end: { x: 560, y: 80 }, thickness: 8 },
      { start: { x: 560, y: 80 }, end: { x: 560, y: 520 }, thickness: 8 },
      { start: { x: 560, y: 520 }, end: { x: 40, y: 520 }, thickness: 8 },
      { start: { x: 40, y: 520 }, end: { x: 40, y: 80 }, thickness: 8 },
      // Dividing walls
      { start: { x: 200, y: 80 }, end: { x: 200, y: 350 }, thickness: 8 },
      { start: { x: 400, y: 170 }, end: { x: 400, y: 520 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'teleporter', shape: { x: 120, y: 200, radius: 18 }, id: 'tp1', properties: { pairedId: 'tp2' } },
      { type: 'teleporter', shape: { x: 300, y: 400, radius: 18 }, id: 'tp2', properties: { pairedId: 'tp1' } },
      { type: 'teleporter', shape: { x: 300, y: 150, radius: 18 }, id: 'tp3', properties: { pairedId: 'tp4' } },
      { type: 'teleporter', shape: { x: 480, y: 400, radius: 18 }, id: 'tp4', properties: { pairedId: 'tp3' } },
    ],
    theme: { primary: '#463d4a', secondary: '#2e2531', accent: '#c084fc' }
  },

  // Level 16: Speed Run
  {
    id: 16,
    name: "Speed Demon",
    par: 3,
    tee: { x: 80, y: 300 },
    hole: { position: { x: 520, y: 300 }, radius: 18 },
    bounds: { x: 40, y: 150, width: 520, height: 300 },
    walls: [
      { start: { x: 40, y: 150 }, end: { x: 560, y: 150 }, thickness: 8 },
      { start: { x: 560, y: 150 }, end: { x: 560, y: 450 }, thickness: 8 },
      { start: { x: 560, y: 450 }, end: { x: 40, y: 450 }, thickness: 8 },
      { start: { x: 40, y: 450 }, end: { x: 40, y: 150 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'ramp', shape: { x: 150, y: 250, width: 60, height: 100 } },
      { type: 'ramp', shape: { x: 280, y: 250, width: 60, height: 100 } },
      { type: 'ramp', shape: { x: 410, y: 250, width: 60, height: 100 } },
    ],
    theme: { primary: '#4a4642', secondary: '#312e2a', accent: '#fbbf24' }
  },

  // Level 17: The Fortress
  {
    id: 17,
    name: "The Fortress",
    par: 5,
    tee: { x: 80, y: 300 },
    hole: { position: { x: 300, y: 300 }, radius: 18 },
    bounds: { x: 40, y: 100, width: 520, height: 400 },
    walls: [
      { start: { x: 40, y: 100 }, end: { x: 560, y: 100 }, thickness: 8 },
      { start: { x: 560, y: 100 }, end: { x: 560, y: 500 }, thickness: 8 },
      { start: { x: 560, y: 500 }, end: { x: 40, y: 500 }, thickness: 8 },
      { start: { x: 40, y: 500 }, end: { x: 40, y: 100 }, thickness: 8 },
      // Fortress walls (square around hole)
      { start: { x: 220, y: 220 }, end: { x: 380, y: 220 }, thickness: 8 },
      { start: { x: 380, y: 220 }, end: { x: 380, y: 380 }, thickness: 8 },
      { start: { x: 380, y: 380 }, end: { x: 220, y: 380 }, thickness: 8 },
      { start: { x: 220, y: 380 }, end: { x: 220, y: 310 }, thickness: 8 },
      { start: { x: 220, y: 290 }, end: { x: 220, y: 220 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'bumper', shape: { x: 450, y: 200, radius: 20 }, properties: { bounceFactor: 1.4 } },
      { type: 'bumper', shape: { x: 450, y: 400, radius: 20 }, properties: { bounceFactor: 1.4 } },
    ],
    theme: { primary: '#464a3d', secondary: '#2e3125', accent: '#84cc16' }
  },

  // Level 18: Grand Finale
  {
    id: 18,
    name: "Grand Finale",
    par: 6,
    tee: { x: 80, y: 480 },
    hole: { position: { x: 520, y: 120 }, radius: 18 },
    bounds: { x: 40, y: 60, width: 520, height: 460 },
    walls: [
      { start: { x: 40, y: 60 }, end: { x: 560, y: 60 }, thickness: 8 },
      { start: { x: 560, y: 60 }, end: { x: 560, y: 520 }, thickness: 8 },
      { start: { x: 560, y: 520 }, end: { x: 40, y: 520 }, thickness: 8 },
      { start: { x: 40, y: 520 }, end: { x: 40, y: 60 }, thickness: 8 },
      // Maze sections
      { start: { x: 40, y: 400 }, end: { x: 350, y: 400 }, thickness: 8 },
      { start: { x: 200, y: 280 }, end: { x: 560, y: 280 }, thickness: 8 },
      { start: { x: 40, y: 160 }, end: { x: 400, y: 160 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'windmill', shape: { x: 450, y: 400, radius: 45 }, properties: { speed: 2 } },
      { type: 'windmill', shape: { x: 120, y: 220, radius: 40 }, properties: { speed: -2.5 } },
      { type: 'bumper', shape: { x: 300, y: 340, radius: 22 }, properties: { bounceFactor: 1.5 } },
      { type: 'bumper', shape: { x: 480, y: 120, radius: 18 }, properties: { bounceFactor: 1.4 } },
      { type: 'water', shape: { x: 320, y: 60, width: 80, height: 100 } },
      { type: 'sand', shape: { x: 100, y: 320, width: 70, height: 60 }, properties: { friction: 0.95 } },
      { type: 'teleporter', shape: { x: 150, y: 120, radius: 16 }, id: 'tp1', properties: { pairedId: 'tp2' } },
      { type: 'teleporter', shape: { x: 450, y: 200, radius: 16 }, id: 'tp2', properties: { pairedId: 'tp1' } },
    ],
    theme: { primary: '#4a3d3d', secondary: '#312525', accent: '#f43f5e' }
  },
];

export const PLAYER_COLORS = ['#4ade80', '#60a5fa', '#f472b6', '#fbbf24'];
