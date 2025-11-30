import { Level } from './types';

export const levels: Level[] = [
  // Level 1: Simple intro - slight dogleg
  {
    id: 1,
    name: "First Swing",
    par: 2,
    tee: { x: 80, y: 200 },
    hole: { position: { x: 520, y: 350 }, radius: 10 },
    bounds: { x: 40, y: 120, width: 520, height: 360 },
    walls: [
      // Top wall with indent
      { start: { x: 40, y: 120 }, end: { x: 350, y: 120 }, thickness: 8 },
      { start: { x: 350, y: 120 }, end: { x: 350, y: 200 }, thickness: 8 },
      { start: { x: 350, y: 200 }, end: { x: 560, y: 200 }, thickness: 8 },
      // Right wall
      { start: { x: 560, y: 200 }, end: { x: 560, y: 480 }, thickness: 8 },
      // Bottom wall
      { start: { x: 560, y: 480 }, end: { x: 40, y: 480 }, thickness: 8 },
      // Left wall
      { start: { x: 40, y: 480 }, end: { x: 40, y: 120 }, thickness: 8 },
    ],
    obstacles: [],
    theme: { primary: '#2d4a3e', secondary: '#1a2e26', accent: '#4ade80' }
  },
  
  // Level 2: Tight L-Shape
  {
    id: 2,
    name: "The Corner",
    par: 3,
    tee: { x: 80, y: 150 },
    hole: { position: { x: 480, y: 420 }, radius: 10 },
    bounds: { x: 40, y: 80, width: 520, height: 440 },
    walls: [
      // Outer walls forming L
      { start: { x: 40, y: 80 }, end: { x: 220, y: 80 }, thickness: 8 },
      { start: { x: 220, y: 80 }, end: { x: 220, y: 280 }, thickness: 8 },
      { start: { x: 220, y: 280 }, end: { x: 560, y: 280 }, thickness: 8 },
      { start: { x: 560, y: 280 }, end: { x: 560, y: 520 }, thickness: 8 },
      { start: { x: 560, y: 520 }, end: { x: 300, y: 520 }, thickness: 8 },
      { start: { x: 300, y: 520 }, end: { x: 300, y: 360 }, thickness: 8 },
      { start: { x: 300, y: 360 }, end: { x: 120, y: 360 }, thickness: 8 },
      { start: { x: 120, y: 360 }, end: { x: 120, y: 220 }, thickness: 8 },
      { start: { x: 120, y: 220 }, end: { x: 40, y: 220 }, thickness: 8 },
      { start: { x: 40, y: 220 }, end: { x: 40, y: 80 }, thickness: 8 },
    ],
    obstacles: [],
    theme: { primary: '#3d3a4a', secondary: '#252331', accent: '#a78bfa' }
  },

  // Level 3: Bumper Alley - narrow corridor with bumpers
  {
    id: 3,
    name: "Bumper Alley",
    par: 3,
    tee: { x: 80, y: 300 },
    hole: { position: { x: 520, y: 300 }, radius: 10 },
    bounds: { x: 40, y: 200, width: 520, height: 200 },
    walls: [
      // Top wall
      { start: { x: 40, y: 200 }, end: { x: 560, y: 200 }, thickness: 8 },
      // Right wall
      { start: { x: 560, y: 200 }, end: { x: 560, y: 400 }, thickness: 8 },
      // Bottom wall
      { start: { x: 560, y: 400 }, end: { x: 40, y: 400 }, thickness: 8 },
      // Left wall
      { start: { x: 40, y: 400 }, end: { x: 40, y: 200 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'bumper', shape: { x: 200, y: 270, radius: 20 }, properties: { bounceFactor: 1.5 } },
      { type: 'bumper', shape: { x: 300, y: 330, radius: 20 }, properties: { bounceFactor: 1.5 } },
      { type: 'bumper', shape: { x: 400, y: 270, radius: 20 }, properties: { bounceFactor: 1.5 } },
    ],
    theme: { primary: '#4a3d3d', secondary: '#312525', accent: '#f472b6' }
  },

  // Level 4: Sandy Hourglass
  {
    id: 4,
    name: "Sandy Hourglass",
    par: 3,
    tee: { x: 100, y: 150 },
    hole: { position: { x: 500, y: 450 }, radius: 10 },
    bounds: { x: 40, y: 80, width: 520, height: 440 },
    walls: [
      // Top left area
      { start: { x: 40, y: 80 }, end: { x: 250, y: 80 }, thickness: 8 },
      { start: { x: 250, y: 80 }, end: { x: 250, y: 220 }, thickness: 8 },
      // Narrow middle top
      { start: { x: 250, y: 220 }, end: { x: 350, y: 260 }, thickness: 8 },
      // Top right area
      { start: { x: 350, y: 260 }, end: { x: 350, y: 80 }, thickness: 8 },
      { start: { x: 350, y: 80 }, end: { x: 560, y: 80 }, thickness: 8 },
      { start: { x: 560, y: 80 }, end: { x: 560, y: 520 }, thickness: 8 },
      // Bottom right
      { start: { x: 560, y: 520 }, end: { x: 350, y: 520 }, thickness: 8 },
      { start: { x: 350, y: 520 }, end: { x: 350, y: 340 }, thickness: 8 },
      // Narrow middle bottom
      { start: { x: 350, y: 340 }, end: { x: 250, y: 380 }, thickness: 8 },
      // Bottom left
      { start: { x: 250, y: 380 }, end: { x: 250, y: 520 }, thickness: 8 },
      { start: { x: 250, y: 520 }, end: { x: 40, y: 520 }, thickness: 8 },
      { start: { x: 40, y: 520 }, end: { x: 40, y: 80 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'sand', shape: { x: 250, y: 260, width: 100, height: 80 }, properties: { friction: 0.94 } },
    ],
    theme: { primary: '#4a4a3d', secondary: '#31312a', accent: '#fbbf24' }
  },

  // Level 5: Water Crossing - must cross through middle bridge
  {
    id: 5,
    name: "River Crossing",
    par: 3,
    tee: { x: 100, y: 300 },
    hole: { position: { x: 500, y: 300 }, radius: 10 },
    bounds: { x: 40, y: 180, width: 520, height: 240 },
    walls: [
      { start: { x: 40, y: 180 }, end: { x: 560, y: 180 }, thickness: 8 },
      { start: { x: 560, y: 180 }, end: { x: 560, y: 420 }, thickness: 8 },
      { start: { x: 560, y: 420 }, end: { x: 40, y: 420 }, thickness: 8 },
      { start: { x: 40, y: 420 }, end: { x: 40, y: 180 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'water', shape: { x: 240, y: 180, width: 120, height: 240 } },
      { type: 'ramp', shape: { x: 240, y: 265, width: 120, height: 70 } },
    ],
    theme: { primary: '#3d4a4a', secondary: '#253131', accent: '#60a5fa' }
  },

  // Level 6: Windmill Gauntlet - spawn area → narrow corridor → windmill → hole area
  {
    id: 6,
    name: "Windmill Gauntlet",
    par: 4,
    tee: { x: 80, y: 300 },
    hole: { position: { x: 520, y: 300 }, radius: 10 },
    bounds: { x: 40, y: 100, width: 520, height: 400 },
    walls: [
      // Left spawn area (wider)
      { start: { x: 40, y: 180 }, end: { x: 40, y: 420 }, thickness: 8 },
      { start: { x: 40, y: 180 }, end: { x: 150, y: 180 }, thickness: 8 },
      { start: { x: 40, y: 420 }, end: { x: 150, y: 420 }, thickness: 8 },
      // Narrow corridor to windmill
      { start: { x: 150, y: 180 }, end: { x: 150, y: 230 }, thickness: 8 },
      { start: { x: 150, y: 230 }, end: { x: 220, y: 230 }, thickness: 8 },
      { start: { x: 150, y: 420 }, end: { x: 150, y: 370 }, thickness: 8 },
      { start: { x: 150, y: 370 }, end: { x: 220, y: 370 }, thickness: 8 },
      // Windmill chamber
      { start: { x: 220, y: 230 }, end: { x: 220, y: 100 }, thickness: 8 },
      { start: { x: 220, y: 100 }, end: { x: 380, y: 100 }, thickness: 8 },
      { start: { x: 380, y: 100 }, end: { x: 380, y: 230 }, thickness: 8 },
      { start: { x: 220, y: 370 }, end: { x: 220, y: 500 }, thickness: 8 },
      { start: { x: 220, y: 500 }, end: { x: 380, y: 500 }, thickness: 8 },
      { start: { x: 380, y: 500 }, end: { x: 380, y: 370 }, thickness: 8 },
      // Narrow corridor from windmill
      { start: { x: 380, y: 230 }, end: { x: 450, y: 230 }, thickness: 8 },
      { start: { x: 450, y: 230 }, end: { x: 450, y: 180 }, thickness: 8 },
      { start: { x: 380, y: 370 }, end: { x: 450, y: 370 }, thickness: 8 },
      { start: { x: 450, y: 370 }, end: { x: 450, y: 420 }, thickness: 8 },
      // Right hole area
      { start: { x: 450, y: 180 }, end: { x: 560, y: 180 }, thickness: 8 },
      { start: { x: 560, y: 180 }, end: { x: 560, y: 420 }, thickness: 8 },
      { start: { x: 560, y: 420 }, end: { x: 450, y: 420 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'windmill', shape: { x: 300, y: 300, radius: 55 }, properties: { speed: 2 } },
    ],
    theme: { primary: '#3d4a42', secondary: '#25312a', accent: '#4ade80' }
  },

  // Level 7: Zigzag Maze
  {
    id: 7,
    name: "Zigzag",
    par: 4,
    tee: { x: 80, y: 130 },
    hole: { position: { x: 520, y: 470 }, radius: 10 },
    bounds: { x: 40, y: 80, width: 520, height: 440 },
    walls: [
      // Outer boundary
      { start: { x: 40, y: 80 }, end: { x: 200, y: 80 }, thickness: 8 },
      { start: { x: 200, y: 80 }, end: { x: 200, y: 200 }, thickness: 8 },
      { start: { x: 200, y: 200 }, end: { x: 560, y: 200 }, thickness: 8 },
      { start: { x: 560, y: 200 }, end: { x: 560, y: 320 }, thickness: 8 },
      { start: { x: 560, y: 320 }, end: { x: 200, y: 320 }, thickness: 8 },
      { start: { x: 200, y: 320 }, end: { x: 200, y: 400 }, thickness: 8 },
      { start: { x: 200, y: 400 }, end: { x: 560, y: 400 }, thickness: 8 },
      { start: { x: 560, y: 400 }, end: { x: 560, y: 520 }, thickness: 8 },
      { start: { x: 560, y: 520 }, end: { x: 40, y: 520 }, thickness: 8 },
      { start: { x: 40, y: 520 }, end: { x: 40, y: 400 }, thickness: 8 },
      { start: { x: 40, y: 400 }, end: { x: 120, y: 400 }, thickness: 8 },
      { start: { x: 120, y: 400 }, end: { x: 120, y: 200 }, thickness: 8 },
      { start: { x: 120, y: 200 }, end: { x: 40, y: 200 }, thickness: 8 },
      { start: { x: 40, y: 200 }, end: { x: 40, y: 80 }, thickness: 8 },
    ],
    obstacles: [],
    theme: { primary: '#4a3d4a', secondary: '#312531', accent: '#a78bfa' }
  },

  // Level 8: Portal Chambers
  {
    id: 8,
    name: "Portal Chambers",
    par: 3,
    tee: { x: 100, y: 300 },
    hole: { position: { x: 500, y: 300 }, radius: 10 },
    bounds: { x: 40, y: 150, width: 520, height: 300 },
    walls: [
      // Left chamber
      { start: { x: 40, y: 150 }, end: { x: 250, y: 150 }, thickness: 8 },
      { start: { x: 250, y: 150 }, end: { x: 250, y: 250 }, thickness: 8 },
      { start: { x: 250, y: 350 }, end: { x: 250, y: 450 }, thickness: 8 },
      { start: { x: 250, y: 450 }, end: { x: 40, y: 450 }, thickness: 8 },
      { start: { x: 40, y: 450 }, end: { x: 40, y: 150 }, thickness: 8 },
      // Dividing wall with gap
      { start: { x: 350, y: 150 }, end: { x: 350, y: 250 }, thickness: 8 },
      { start: { x: 350, y: 350 }, end: { x: 350, y: 450 }, thickness: 8 },
      // Right chamber
      { start: { x: 350, y: 150 }, end: { x: 560, y: 150 }, thickness: 8 },
      { start: { x: 560, y: 150 }, end: { x: 560, y: 450 }, thickness: 8 },
      { start: { x: 560, y: 450 }, end: { x: 350, y: 450 }, thickness: 8 },
      // Blocking wall forcing portal use
      { start: { x: 250, y: 250 }, end: { x: 350, y: 250 }, thickness: 8 },
      { start: { x: 250, y: 350 }, end: { x: 350, y: 350 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'teleporter', shape: { x: 150, y: 300, radius: 18 }, id: 'tp1', properties: { pairedId: 'tp2' } },
      { type: 'teleporter', shape: { x: 450, y: 300, radius: 18 }, id: 'tp2', properties: { pairedId: 'tp1' } },
    ],
    theme: { primary: '#3d3d4a', secondary: '#252531', accent: '#c084fc' }
  },

  // Level 9: Moving Wall Corridor
  {
    id: 9,
    name: "Timing Is Everything",
    par: 4,
    tee: { x: 80, y: 300 },
    hole: { position: { x: 520, y: 300 }, radius: 10 },
    bounds: { x: 40, y: 220, width: 520, height: 160 },
    walls: [
      { start: { x: 40, y: 220 }, end: { x: 560, y: 220 }, thickness: 8 },
      { start: { x: 560, y: 220 }, end: { x: 560, y: 380 }, thickness: 8 },
      { start: { x: 560, y: 380 }, end: { x: 40, y: 380 }, thickness: 8 },
      { start: { x: 40, y: 380 }, end: { x: 40, y: 220 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'moving-wall', shape: { x: 200, y: 260, width: 10, height: 60 }, properties: { speed: 1.8, direction: 1 } },
      { type: 'moving-wall', shape: { x: 300, y: 280, width: 10, height: 60 }, properties: { speed: 1.5, direction: -1 } },
      { type: 'moving-wall', shape: { x: 400, y: 260, width: 10, height: 60 }, properties: { speed: 2, direction: 1 } },
    ],
    theme: { primary: '#4a423d', secondary: '#312a25', accent: '#fb923c' }
  },

  // Level 10: Pinball Funnel
  {
    id: 10,
    name: "Pinball Funnel",
    par: 4,
    tee: { x: 100, y: 150 },
    hole: { position: { x: 500, y: 450 }, radius: 10 },
    bounds: { x: 40, y: 80, width: 520, height: 440 },
    walls: [
      // Wide top
      { start: { x: 40, y: 80 }, end: { x: 560, y: 80 }, thickness: 8 },
      // Funnel right side
      { start: { x: 560, y: 80 }, end: { x: 560, y: 200 }, thickness: 8 },
      { start: { x: 560, y: 200 }, end: { x: 450, y: 300 }, thickness: 8 },
      { start: { x: 450, y: 300 }, end: { x: 560, y: 400 }, thickness: 8 },
      { start: { x: 560, y: 400 }, end: { x: 560, y: 520 }, thickness: 8 },
      // Bottom
      { start: { x: 560, y: 520 }, end: { x: 40, y: 520 }, thickness: 8 },
      // Funnel left side
      { start: { x: 40, y: 520 }, end: { x: 40, y: 400 }, thickness: 8 },
      { start: { x: 40, y: 400 }, end: { x: 150, y: 300 }, thickness: 8 },
      { start: { x: 150, y: 300 }, end: { x: 40, y: 200 }, thickness: 8 },
      { start: { x: 40, y: 200 }, end: { x: 40, y: 80 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'bumper', shape: { x: 200, y: 150, radius: 18 }, properties: { bounceFactor: 1.5 } },
      { type: 'bumper', shape: { x: 400, y: 150, radius: 18 }, properties: { bounceFactor: 1.5 } },
      { type: 'bumper', shape: { x: 300, y: 220, radius: 22 }, properties: { bounceFactor: 1.6 } },
      { type: 'bumper', shape: { x: 250, y: 350, radius: 15 }, properties: { bounceFactor: 1.5 } },
      { type: 'bumper', shape: { x: 350, y: 350, radius: 15 }, properties: { bounceFactor: 1.5 } },
      { type: 'bumper', shape: { x: 300, y: 420, radius: 12 }, properties: { bounceFactor: 1.4 } },
    ],
    theme: { primary: '#4a3d42', secondary: '#312529', accent: '#f472b6' }
  },

  // Level 11: Snake with Sand
  {
    id: 11,
    name: "Sandy Snake",
    par: 4,
    tee: { x: 80, y: 130 },
    hole: { position: { x: 520, y: 470 }, radius: 10 },
    bounds: { x: 40, y: 80, width: 520, height: 440 },
    walls: [
      // Top corridor
      { start: { x: 40, y: 80 }, end: { x: 480, y: 80 }, thickness: 8 },
      { start: { x: 480, y: 80 }, end: { x: 480, y: 180 }, thickness: 8 },
      { start: { x: 480, y: 180 }, end: { x: 120, y: 180 }, thickness: 8 },
      { start: { x: 120, y: 180 }, end: { x: 120, y: 260 }, thickness: 8 },
      // Middle corridor
      { start: { x: 120, y: 260 }, end: { x: 480, y: 260 }, thickness: 8 },
      { start: { x: 480, y: 260 }, end: { x: 480, y: 340 }, thickness: 8 },
      { start: { x: 480, y: 340 }, end: { x: 120, y: 340 }, thickness: 8 },
      { start: { x: 120, y: 340 }, end: { x: 120, y: 420 }, thickness: 8 },
      // Bottom corridor
      { start: { x: 120, y: 420 }, end: { x: 560, y: 420 }, thickness: 8 },
      { start: { x: 560, y: 420 }, end: { x: 560, y: 520 }, thickness: 8 },
      { start: { x: 560, y: 520 }, end: { x: 40, y: 520 }, thickness: 8 },
      { start: { x: 40, y: 520 }, end: { x: 40, y: 80 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'sand', shape: { x: 260, y: 100, width: 100, height: 60 }, properties: { friction: 0.94 } },
      { type: 'sand', shape: { x: 260, y: 440, width: 100, height: 60 }, properties: { friction: 0.94 } },
    ],
    theme: { primary: '#3d4642', secondary: '#252e2a', accent: '#34d399' }
  },

  // Level 12: Twin Mills - Two chambers with windmills
  {
    id: 12,
    name: "Twin Terrors",
    par: 5,
    tee: { x: 80, y: 300 },
    hole: { position: { x: 520, y: 300 }, radius: 10 },
    bounds: { x: 40, y: 140, width: 520, height: 320 },
    walls: [
      // Left area
      { start: { x: 40, y: 140 }, end: { x: 200, y: 140 }, thickness: 8 },
      { start: { x: 200, y: 140 }, end: { x: 200, y: 250 }, thickness: 8 },
      { start: { x: 200, y: 350 }, end: { x: 200, y: 460 }, thickness: 8 },
      { start: { x: 200, y: 460 }, end: { x: 40, y: 460 }, thickness: 8 },
      { start: { x: 40, y: 460 }, end: { x: 40, y: 140 }, thickness: 8 },
      // First windmill chamber
      { start: { x: 200, y: 140 }, end: { x: 300, y: 140 }, thickness: 8 },
      { start: { x: 300, y: 140 }, end: { x: 300, y: 250 }, thickness: 8 },
      { start: { x: 300, y: 350 }, end: { x: 300, y: 460 }, thickness: 8 },
      { start: { x: 300, y: 460 }, end: { x: 200, y: 460 }, thickness: 8 },
      // Second windmill chamber
      { start: { x: 300, y: 140 }, end: { x: 400, y: 140 }, thickness: 8 },
      { start: { x: 400, y: 140 }, end: { x: 400, y: 250 }, thickness: 8 },
      { start: { x: 400, y: 350 }, end: { x: 400, y: 460 }, thickness: 8 },
      { start: { x: 400, y: 460 }, end: { x: 300, y: 460 }, thickness: 8 },
      // Right area
      { start: { x: 400, y: 140 }, end: { x: 560, y: 140 }, thickness: 8 },
      { start: { x: 560, y: 140 }, end: { x: 560, y: 460 }, thickness: 8 },
      { start: { x: 560, y: 460 }, end: { x: 400, y: 460 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'windmill', shape: { x: 250, y: 300, radius: 40 }, properties: { speed: 2.5 } },
      { type: 'windmill', shape: { x: 350, y: 300, radius: 40 }, properties: { speed: -2 } },
    ],
    theme: { primary: '#424a3d', secondary: '#2a3125', accent: '#a3e635' }
  },

  // Level 13: Island Bridge - narrow bridges over water
  {
    id: 13,
    name: "Bridge Builder",
    par: 4,
    tee: { x: 80, y: 300 },
    hole: { position: { x: 520, y: 300 }, radius: 10 },
    bounds: { x: 40, y: 200, width: 520, height: 200 },
    walls: [
      { start: { x: 40, y: 200 }, end: { x: 560, y: 200 }, thickness: 8 },
      { start: { x: 560, y: 200 }, end: { x: 560, y: 400 }, thickness: 8 },
      { start: { x: 560, y: 400 }, end: { x: 40, y: 400 }, thickness: 8 },
      { start: { x: 40, y: 400 }, end: { x: 40, y: 200 }, thickness: 8 },
    ],
    obstacles: [
      // Water hazards
      { type: 'water', shape: { x: 150, y: 200, width: 100, height: 200 } },
      { type: 'water', shape: { x: 350, y: 200, width: 100, height: 200 } },
      // Narrow bridges
      { type: 'ramp', shape: { x: 150, y: 275, width: 100, height: 50 } },
      { type: 'ramp', shape: { x: 350, y: 275, width: 100, height: 50 } },
    ],
    theme: { primary: '#3d464a', secondary: '#252e31', accent: '#38bdf8' }
  },

  // Level 14: Obstacle Course
  {
    id: 14,
    name: "Obstacle Course",
    par: 5,
    tee: { x: 80, y: 450 },
    hole: { position: { x: 520, y: 150 }, radius: 10 },
    bounds: { x: 40, y: 80, width: 520, height: 440 },
    walls: [
      // Three horizontal corridors
      { start: { x: 40, y: 80 }, end: { x: 560, y: 80 }, thickness: 8 },
      { start: { x: 560, y: 80 }, end: { x: 560, y: 200 }, thickness: 8 },
      { start: { x: 560, y: 200 }, end: { x: 120, y: 200 }, thickness: 8 },
      { start: { x: 120, y: 200 }, end: { x: 120, y: 280 }, thickness: 8 },
      { start: { x: 120, y: 280 }, end: { x: 560, y: 280 }, thickness: 8 },
      { start: { x: 560, y: 280 }, end: { x: 560, y: 360 }, thickness: 8 },
      { start: { x: 560, y: 360 }, end: { x: 120, y: 360 }, thickness: 8 },
      { start: { x: 120, y: 360 }, end: { x: 120, y: 520 }, thickness: 8 },
      { start: { x: 120, y: 520 }, end: { x: 40, y: 520 }, thickness: 8 },
      { start: { x: 40, y: 520 }, end: { x: 40, y: 360 }, thickness: 8 },
      { start: { x: 40, y: 360 }, end: { x: 40, y: 80 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'bumper', shape: { x: 300, y: 140, radius: 20 }, properties: { bounceFactor: 1.4 } },
      { type: 'windmill', shape: { x: 350, y: 320, radius: 30 }, properties: { speed: 2.5 } },
      { type: 'sand', shape: { x: 200, y: 400, width: 80, height: 80 }, properties: { friction: 0.94 } },
    ],
    theme: { primary: '#4a3d46', secondary: '#31252e', accent: '#e879f9' }
  },

  // Level 15: Portal Puzzle
  {
    id: 15,
    name: "Portal Puzzle",
    par: 4,
    tee: { x: 80, y: 450 },
    hole: { position: { x: 520, y: 150 }, radius: 10 },
    bounds: { x: 40, y: 80, width: 520, height: 440 },
    walls: [
      // Three separate chambers
      { start: { x: 40, y: 80 }, end: { x: 200, y: 80 }, thickness: 8 },
      { start: { x: 200, y: 80 }, end: { x: 200, y: 350 }, thickness: 8 },
      { start: { x: 200, y: 350 }, end: { x: 40, y: 350 }, thickness: 8 },
      { start: { x: 40, y: 350 }, end: { x: 40, y: 520 }, thickness: 8 },
      { start: { x: 40, y: 520 }, end: { x: 200, y: 520 }, thickness: 8 },
      { start: { x: 200, y: 520 }, end: { x: 200, y: 400 }, thickness: 8 },
      { start: { x: 200, y: 400 }, end: { x: 400, y: 400 }, thickness: 8 },
      { start: { x: 400, y: 400 }, end: { x: 400, y: 520 }, thickness: 8 },
      { start: { x: 400, y: 520 }, end: { x: 560, y: 520 }, thickness: 8 },
      { start: { x: 560, y: 520 }, end: { x: 560, y: 80 }, thickness: 8 },
      { start: { x: 560, y: 80 }, end: { x: 400, y: 80 }, thickness: 8 },
      { start: { x: 400, y: 80 }, end: { x: 400, y: 200 }, thickness: 8 },
      { start: { x: 400, y: 200 }, end: { x: 200, y: 200 }, thickness: 8 },
      { start: { x: 200, y: 200 }, end: { x: 200, y: 80 }, thickness: 8 },
      { start: { x: 40, y: 350 }, end: { x: 40, y: 80 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'teleporter', shape: { x: 120, y: 470, radius: 15 }, id: 'tp1', properties: { pairedId: 'tp2' } },
      { type: 'teleporter', shape: { x: 300, y: 300, radius: 15 }, id: 'tp2', properties: { pairedId: 'tp1' } },
      { type: 'teleporter', shape: { x: 300, y: 450, radius: 15 }, id: 'tp3', properties: { pairedId: 'tp4' } },
      { type: 'teleporter', shape: { x: 480, y: 150, radius: 15 }, id: 'tp4', properties: { pairedId: 'tp3' } },
    ],
    theme: { primary: '#463d4a', secondary: '#2e2531', accent: '#c084fc' }
  },

  // Level 16: Speed Track
  {
    id: 16,
    name: "Speed Track",
    par: 3,
    tee: { x: 80, y: 300 },
    hole: { position: { x: 520, y: 300 }, radius: 10 },
    bounds: { x: 40, y: 250, width: 520, height: 100 },
    walls: [
      { start: { x: 40, y: 250 }, end: { x: 560, y: 250 }, thickness: 8 },
      { start: { x: 560, y: 250 }, end: { x: 560, y: 350 }, thickness: 8 },
      { start: { x: 560, y: 350 }, end: { x: 40, y: 350 }, thickness: 8 },
      { start: { x: 40, y: 350 }, end: { x: 40, y: 250 }, thickness: 8 },
    ],
    obstacles: [],
    theme: { primary: '#4a4642', secondary: '#312e2a', accent: '#fbbf24' }
  },

  // Level 17: The Fortress - tight approach
  {
    id: 17,
    name: "The Fortress",
    par: 5,
    tee: { x: 80, y: 300 },
    hole: { position: { x: 400, y: 300 }, radius: 10 },
    bounds: { x: 40, y: 180, width: 520, height: 240 },
    walls: [
      // Outer walls
      { start: { x: 40, y: 180 }, end: { x: 560, y: 180 }, thickness: 8 },
      { start: { x: 560, y: 180 }, end: { x: 560, y: 420 }, thickness: 8 },
      { start: { x: 560, y: 420 }, end: { x: 40, y: 420 }, thickness: 8 },
      { start: { x: 40, y: 420 }, end: { x: 40, y: 180 }, thickness: 8 },
      // Fortress walls (square around hole with small entrance)
      { start: { x: 300, y: 230 }, end: { x: 500, y: 230 }, thickness: 8 },
      { start: { x: 500, y: 230 }, end: { x: 500, y: 370 }, thickness: 8 },
      { start: { x: 500, y: 370 }, end: { x: 300, y: 370 }, thickness: 8 },
      { start: { x: 300, y: 370 }, end: { x: 300, y: 320 }, thickness: 8 },
      { start: { x: 300, y: 280 }, end: { x: 300, y: 230 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'bumper', shape: { x: 200, y: 260, radius: 18 }, properties: { bounceFactor: 1.4 } },
      { type: 'bumper', shape: { x: 200, y: 340, radius: 18 }, properties: { bounceFactor: 1.4 } },
    ],
    theme: { primary: '#464a3d', secondary: '#2e3125', accent: '#84cc16' }
  },

  // Level 18: Grand Finale
  {
    id: 18,
    name: "Grand Finale",
    par: 6,
    tee: { x: 80, y: 470 },
    hole: { position: { x: 520, y: 130 }, radius: 10 },
    bounds: { x: 40, y: 80, width: 520, height: 440 },
    walls: [
      // Complex multi-room layout
      { start: { x: 40, y: 80 }, end: { x: 560, y: 80 }, thickness: 8 },
      { start: { x: 560, y: 80 }, end: { x: 560, y: 200 }, thickness: 8 },
      { start: { x: 560, y: 200 }, end: { x: 400, y: 200 }, thickness: 8 },
      { start: { x: 400, y: 200 }, end: { x: 400, y: 300 }, thickness: 8 },
      { start: { x: 400, y: 300 }, end: { x: 560, y: 300 }, thickness: 8 },
      { start: { x: 560, y: 300 }, end: { x: 560, y: 520 }, thickness: 8 },
      { start: { x: 560, y: 520 }, end: { x: 40, y: 520 }, thickness: 8 },
      { start: { x: 40, y: 520 }, end: { x: 40, y: 380 }, thickness: 8 },
      { start: { x: 40, y: 380 }, end: { x: 200, y: 380 }, thickness: 8 },
      { start: { x: 200, y: 380 }, end: { x: 200, y: 300 }, thickness: 8 },
      { start: { x: 200, y: 300 }, end: { x: 40, y: 300 }, thickness: 8 },
      { start: { x: 40, y: 300 }, end: { x: 40, y: 80 }, thickness: 8 },
      // Internal walls
      { start: { x: 200, y: 80 }, end: { x: 200, y: 200 }, thickness: 8 },
      { start: { x: 200, y: 200 }, end: { x: 300, y: 200 }, thickness: 8 },
      { start: { x: 300, y: 200 }, end: { x: 300, y: 380 }, thickness: 8 },
      { start: { x: 300, y: 380 }, end: { x: 400, y: 380 }, thickness: 8 },
      { start: { x: 400, y: 380 }, end: { x: 400, y: 420 }, thickness: 8 },
    ],
    obstacles: [
      { type: 'windmill', shape: { x: 120, y: 200, radius: 35 }, properties: { speed: -2 } },
      { type: 'windmill', shape: { x: 480, y: 410, radius: 35 }, properties: { speed: 2.5 } },
      { type: 'bumper', shape: { x: 350, y: 300, radius: 18 }, properties: { bounceFactor: 1.5 } },
      { type: 'water', shape: { x: 200, y: 420, width: 100, height: 100 } },
      { type: 'ramp', shape: { x: 200, y: 445, width: 100, height: 50 } },
      { type: 'teleporter', shape: { x: 120, y: 450, radius: 14 }, id: 'tp1', properties: { pairedId: 'tp2' } },
      { type: 'teleporter', shape: { x: 480, y: 140, radius: 14 }, id: 'tp2', properties: { pairedId: 'tp1' } },
    ],
    theme: { primary: '#4a3d3d', secondary: '#312525', accent: '#f43f5e' }
  },
];

export const PLAYER_COLORS = ['#60a5fa', '#f472b6', '#fbbf24', '#a78bfa'];
