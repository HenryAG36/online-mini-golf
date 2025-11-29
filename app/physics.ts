import { Ball, Wall, Obstacle, Level, Vector2, Circle, Rectangle } from './types';

const FRICTION = 0.985;
const MIN_VELOCITY = 0.15;
const WALL_BOUNCE = 0.75;
const MAX_POWER = 15;

export function createBall(x: number, y: number): Ball {
  return {
    position: { x, y },
    velocity: { x: 0, y: 0 },
    radius: 10,
  };
}

export function shootBall(ball: Ball, power: number, angle: number): Ball {
  const clampedPower = Math.min(power, MAX_POWER);
  return {
    ...ball,
    velocity: {
      x: Math.cos(angle) * clampedPower,
      y: Math.sin(angle) * clampedPower,
    },
  };
}

export function isBallMoving(ball: Ball): boolean {
  const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
  return speed > MIN_VELOCITY;
}

export function updateBall(
  ball: Ball,
  level: Level,
  windmillAngles: Map<number, number>,
  movingWallOffsets: Map<number, number>
): { ball: Ball; inWater: boolean; teleported: boolean } {
  let newBall = { ...ball };
  let inWater = false;
  let teleported = false;

  // Apply velocity
  newBall.position = {
    x: newBall.position.x + newBall.velocity.x,
    y: newBall.position.y + newBall.velocity.y,
  };

  // Apply friction
  newBall.velocity = {
    x: newBall.velocity.x * FRICTION,
    y: newBall.velocity.y * FRICTION,
  };

  // Check obstacles
  for (let i = 0; i < level.obstacles.length; i++) {
    const obstacle = level.obstacles[i];
    
    if (obstacle.type === 'sand') {
      const rect = obstacle.shape as Rectangle;
      if (isPointInRect(newBall.position, rect)) {
        const friction = obstacle.properties?.friction || 0.95;
        newBall.velocity = {
          x: newBall.velocity.x * friction,
          y: newBall.velocity.y * friction,
        };
      }
    }
    
    if (obstacle.type === 'water') {
      const rect = obstacle.shape as Rectangle;
      if (isPointInRect(newBall.position, rect)) {
        inWater = true;
      }
    }
    
    if (obstacle.type === 'ramp') {
      // Ramps act as safe zones over water - no special physics
    }
    
    if (obstacle.type === 'bumper') {
      const circle = obstacle.shape as Circle;
      const dist = distance(newBall.position, { x: circle.x, y: circle.y });
      if (dist < newBall.radius + circle.radius) {
        const bounceFactor = obstacle.properties?.bounceFactor || 1.3;
        const normal = normalize({
          x: newBall.position.x - circle.x,
          y: newBall.position.y - circle.y,
        });
        
        // Push ball out
        newBall.position = {
          x: circle.x + normal.x * (newBall.radius + circle.radius + 1),
          y: circle.y + normal.y * (newBall.radius + circle.radius + 1),
        };
        
        // Reflect velocity
        const dot = newBall.velocity.x * normal.x + newBall.velocity.y * normal.y;
        newBall.velocity = {
          x: (newBall.velocity.x - 2 * dot * normal.x) * bounceFactor,
          y: (newBall.velocity.y - 2 * dot * normal.y) * bounceFactor,
        };
      }
    }
    
    if (obstacle.type === 'windmill') {
      const circle = obstacle.shape as Circle;
      const angle = windmillAngles.get(i) || 0;
      
      // Check collision with windmill blades
      const bladeLength = circle.radius;
      const bladeWidth = 12;
      
      for (let b = 0; b < 4; b++) {
        const bladeAngle = angle + (b * Math.PI / 2);
        const bladeEnd = {
          x: circle.x + Math.cos(bladeAngle) * bladeLength,
          y: circle.y + Math.sin(bladeAngle) * bladeLength,
        };
        
        if (lineCircleCollision(
          { x: circle.x, y: circle.y },
          bladeEnd,
          bladeWidth,
          newBall.position,
          newBall.radius
        )) {
          // Push ball away from blade
          const perpAngle = bladeAngle + Math.PI / 2;
          const pushForce = 3;
          newBall.velocity = {
            x: newBall.velocity.x + Math.cos(perpAngle) * pushForce,
            y: newBall.velocity.y + Math.sin(perpAngle) * pushForce,
          };
          newBall.position = {
            x: newBall.position.x + Math.cos(perpAngle) * (newBall.radius + bladeWidth / 2),
            y: newBall.position.y + Math.sin(perpAngle) * (newBall.radius + bladeWidth / 2),
          };
        }
      }
    }
    
    if (obstacle.type === 'moving-wall') {
      const rect = obstacle.shape as Rectangle;
      const offset = movingWallOffsets.get(i) || 0;
      const adjustedRect = { ...rect, y: rect.y + offset };
      
      if (rectCircleCollision(adjustedRect, newBall.position, newBall.radius)) {
        // Bounce off moving wall
        const centerX = adjustedRect.x + adjustedRect.width / 2;
        if (newBall.position.x < centerX) {
          newBall.position.x = adjustedRect.x - newBall.radius - 1;
          newBall.velocity.x = -Math.abs(newBall.velocity.x) * WALL_BOUNCE;
        } else {
          newBall.position.x = adjustedRect.x + adjustedRect.width + newBall.radius + 1;
          newBall.velocity.x = Math.abs(newBall.velocity.x) * WALL_BOUNCE;
        }
      }
    }
    
    if (obstacle.type === 'teleporter' && !teleported) {
      const circle = obstacle.shape as Circle;
      const dist = distance(newBall.position, { x: circle.x, y: circle.y });
      
      if (dist < circle.radius && isBallMoving(newBall)) {
        const pairedId = obstacle.properties?.pairedId;
        const paired = level.obstacles.find(o => o.id === pairedId);
        
        if (paired && paired.type === 'teleporter') {
          const pairedCircle = paired.shape as Circle;
          newBall.position = { x: pairedCircle.x, y: pairedCircle.y };
          teleported = true;
        }
      }
    }
  }

  // Check wall collisions
  for (const wall of level.walls) {
    const collision = lineCircleCollision(
      wall.start,
      wall.end,
      wall.thickness,
      newBall.position,
      newBall.radius
    );
    
    if (collision) {
      const wallDir = normalize({
        x: wall.end.x - wall.start.x,
        y: wall.end.y - wall.start.y,
      });
      const normal = { x: -wallDir.y, y: wallDir.x };
      
      // Determine which side of the wall the ball is on
      const wallCenter = {
        x: (wall.start.x + wall.end.x) / 2,
        y: (wall.start.y + wall.end.y) / 2,
      };
      const toBall = {
        x: newBall.position.x - wallCenter.x,
        y: newBall.position.y - wallCenter.y,
      };
      
      if (toBall.x * normal.x + toBall.y * normal.y < 0) {
        normal.x = -normal.x;
        normal.y = -normal.y;
      }
      
      // Push ball out of wall
      const closest = closestPointOnLine(wall.start, wall.end, newBall.position);
      const pushDist = newBall.radius + wall.thickness / 2 + 1;
      newBall.position = {
        x: closest.x + normal.x * pushDist,
        y: closest.y + normal.y * pushDist,
      };
      
      // Reflect velocity
      const dot = newBall.velocity.x * normal.x + newBall.velocity.y * normal.y;
      newBall.velocity = {
        x: (newBall.velocity.x - 2 * dot * normal.x) * WALL_BOUNCE,
        y: (newBall.velocity.y - 2 * dot * normal.y) * WALL_BOUNCE,
      };
    }
  }

  // Stop ball if very slow
  if (!isBallMoving(newBall)) {
    newBall.velocity = { x: 0, y: 0 };
  }

  return { ball: newBall, inWater, teleported };
}

export function checkHole(ball: Ball, level: Level): boolean {
  const dist = distance(ball.position, level.hole.position);
  const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
  
  // Ball needs to be close enough and slow enough to go in
  return dist < level.hole.radius && speed < 4;
}

// Utility functions
function distance(a: Vector2, b: Vector2): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function normalize(v: Vector2): Vector2 {
  const len = Math.sqrt(v.x ** 2 + v.y ** 2);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

function isPointInRect(point: Vector2, rect: Rectangle): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

function closestPointOnLine(start: Vector2, end: Vector2, point: Vector2): Vector2 {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len2 = dx * dx + dy * dy;
  
  if (len2 === 0) return start;
  
  let t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  
  return {
    x: start.x + t * dx,
    y: start.y + t * dy,
  };
}

function lineCircleCollision(
  start: Vector2,
  end: Vector2,
  lineThickness: number,
  circleCenter: Vector2,
  circleRadius: number
): boolean {
  const closest = closestPointOnLine(start, end, circleCenter);
  const dist = distance(closest, circleCenter);
  return dist < circleRadius + lineThickness / 2;
}

function rectCircleCollision(rect: Rectangle, circleCenter: Vector2, circleRadius: number): boolean {
  const closestX = Math.max(rect.x, Math.min(circleCenter.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circleCenter.y, rect.y + rect.height));
  
  const dist = distance({ x: closestX, y: closestY }, circleCenter);
  return dist < circleRadius;
}
