import { Ball, Wall, Obstacle, Level, Vector2, Circle, Rectangle } from './types';

const FRICTION = 0.982;
const MIN_VELOCITY = 0.1;
const WALL_BOUNCE = 0.6;
const MAX_POWER = 8;
const MIN_POWER = 1.5;
const HOLE_GRAVITY_RADIUS = 40;
const HOLE_GRAVITY_STRENGTH = 0.12;
const BALL_BOUNCE = 0.4; // 40% energy transfer on ball collision
const BALL_RADIUS = 6; // Smaller ball

export function createBall(x: number, y: number): Ball {
  return {
    position: { x, y },
    velocity: { x: 0, y: 0 },
    radius: BALL_RADIUS,
  };
}

export function shootBall(ball: Ball, power: number, angle: number): Ball {
  // Smoother power curve for better control
  const normalizedPower = Math.max(0, Math.min(1, power));
  const curvedPower = MIN_POWER + (normalizedPower * 0.7 + normalizedPower * normalizedPower * 0.3) * (MAX_POWER - MIN_POWER);
  
  return {
    ...ball,
    velocity: {
      x: Math.cos(angle) * curvedPower,
      y: Math.sin(angle) * curvedPower,
    },
  };
}

export function isBallMoving(ball: Ball): boolean {
  const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
  return speed > MIN_VELOCITY;
}

export function handleBallCollision(ball1: Ball, ball2: Ball): { ball1: Ball; ball2: Ball; collided: boolean } {
  const dx = ball2.position.x - ball1.position.x;
  const dy = ball2.position.y - ball1.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = ball1.radius + ball2.radius;

  if (dist < minDist && dist > 0) {
    const nx = dx / dist;
    const ny = dy / dist;

    const dvx = ball1.velocity.x - ball2.velocity.x;
    const dvy = ball1.velocity.y - ball2.velocity.y;
    const dvn = dvx * nx + dvy * ny;

    if (dvn > 0) {
      const impulse = dvn * BALL_BOUNCE;
      const overlap = minDist - dist;
      const separationX = (overlap / 2 + 0.5) * nx;
      const separationY = (overlap / 2 + 0.5) * ny;

      return {
        ball1: {
          ...ball1,
          position: {
            x: ball1.position.x - separationX,
            y: ball1.position.y - separationY,
          },
          velocity: {
            x: ball1.velocity.x - impulse * nx,
            y: ball1.velocity.y - impulse * ny,
          },
        },
        ball2: {
          ...ball2,
          position: {
            x: ball2.position.x + separationX,
            y: ball2.position.y + separationY,
          },
          velocity: {
            x: ball2.velocity.x + impulse * nx,
            y: ball2.velocity.y + impulse * ny,
          },
        },
        collided: true,
      };
    }
  }

  return { ball1, ball2, collided: false };
}

interface CollisionInfo {
  originalIndex: number;
  originalPosition: Vector2;
  newVelocity: Vector2;
}

export function updateBall(
  ball: Ball,
  level: Level,
  windmillAngles: Map<number, number>,
  movingWallOffsets: Map<number, number>,
  otherBalls: Ball[] = []
): { ball: Ball; inWater: boolean; teleported: boolean; collisions: CollisionInfo[] } {
  let newBall = { ...ball };
  let inWater = false;
  let teleported = false;
  const collisions: CollisionInfo[] = [];

  newBall.position = {
    x: newBall.position.x + newBall.velocity.x,
    y: newBall.position.y + newBall.velocity.y,
  };

  // Hole gravity
  const holePos = level.hole.position;
  const toHoleX = holePos.x - newBall.position.x;
  const toHoleY = holePos.y - newBall.position.y;
  const distToHole = Math.sqrt(toHoleX * toHoleX + toHoleY * toHoleY);
  
  if (distToHole < HOLE_GRAVITY_RADIUS && distToHole > 0) {
    const gravityStrength = HOLE_GRAVITY_STRENGTH * (1 - distToHole / HOLE_GRAVITY_RADIUS);
    newBall.velocity = {
      x: newBall.velocity.x + (toHoleX / distToHole) * gravityStrength,
      y: newBall.velocity.y + (toHoleY / distToHole) * gravityStrength,
    };
  }

  newBall.velocity = {
    x: newBall.velocity.x * FRICTION,
    y: newBall.velocity.y * FRICTION,
  };

  // Ball collisions
  for (let i = 0; i < otherBalls.length; i++) {
    const otherBall = otherBalls[i];
    const result = handleBallCollision(newBall, otherBall);
    if (result.collided) {
      newBall = result.ball1;
      collisions.push({
        originalIndex: i,
        originalPosition: otherBall.position,
        newVelocity: result.ball2.velocity,
      });
    }
  }

  // Obstacles
  for (let i = 0; i < level.obstacles.length; i++) {
    const obstacle = level.obstacles[i];
    
    if (obstacle.type === 'sand') {
      const rect = obstacle.shape as Rectangle;
      if (isPointInRect(newBall.position, rect)) {
        const friction = obstacle.properties?.friction || 0.92;
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
    
    if (obstacle.type === 'bumper') {
      const circle = obstacle.shape as Circle;
      const dist = distance(newBall.position, { x: circle.x, y: circle.y });
      if (dist < newBall.radius + circle.radius) {
        const bounceFactor = obstacle.properties?.bounceFactor || 1.2;
        const normal = normalize({
          x: newBall.position.x - circle.x,
          y: newBall.position.y - circle.y,
        });
        
        newBall.position = {
          x: circle.x + normal.x * (newBall.radius + circle.radius + 1),
          y: circle.y + normal.y * (newBall.radius + circle.radius + 1),
        };
        
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
      const bladeLength = circle.radius;
      const bladeWidth = 10;
      
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
          const perpAngle = bladeAngle + Math.PI / 2;
          const pushForce = 2;
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
          
          // Calculate exit direction based on ball velocity
          const speed = Math.sqrt(newBall.velocity.x ** 2 + newBall.velocity.y ** 2);
          let exitDirX = newBall.velocity.x;
          let exitDirY = newBall.velocity.y;
          
          // Normalize the exit direction
          if (speed > 0) {
            exitDirX /= speed;
            exitDirY /= speed;
          } else {
            // If no velocity, use direction from source to destination
            const toDestX = pairedCircle.x - circle.x;
            const toDestY = pairedCircle.y - circle.y;
            const toDestLen = Math.sqrt(toDestX ** 2 + toDestY ** 2);
            if (toDestLen > 0) {
              exitDirX = toDestX / toDestLen;
              exitDirY = toDestY / toDestLen;
            }
          }
          
          // Place ball just outside the destination portal radius
          const exitOffset = pairedCircle.radius + newBall.radius + 2;
          newBall.position = { 
            x: pairedCircle.x + exitDirX * exitOffset, 
            y: pairedCircle.y + exitDirY * exitOffset 
          };
          teleported = true;
        }
      }
    }
  }

  // Wall collisions
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
      
      const closest = closestPointOnLine(wall.start, wall.end, newBall.position);
      const pushDist = newBall.radius + wall.thickness / 2 + 1;
      newBall.position = {
        x: closest.x + normal.x * pushDist,
        y: closest.y + normal.y * pushDist,
      };
      
      const dot = newBall.velocity.x * normal.x + newBall.velocity.y * normal.y;
      newBall.velocity = {
        x: (newBall.velocity.x - 2 * dot * normal.x) * WALL_BOUNCE,
        y: (newBall.velocity.y - 2 * dot * normal.y) * WALL_BOUNCE,
      };
    }
  }

  if (!isBallMoving(newBall)) {
    newBall.velocity = { x: 0, y: 0 };
  }

  return { ball: newBall, inWater, teleported, collisions };
}

export function checkHole(ball: Ball, level: Level): boolean {
  const dist = distance(ball.position, level.hole.position);
  const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
  // Smaller hole radius check
  return dist < level.hole.radius * 0.7 && speed < 4;
}

export function getBallRotation(ball: Ball, previousRotation: number): number {
  const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
  if (speed < 0.1) return previousRotation;
  return previousRotation + speed / ball.radius;
}

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
  return { x: start.x + t * dx, y: start.y + t * dy };
}

function lineCircleCollision(
  start: Vector2,
  end: Vector2,
  lineThickness: number,
  circleCenter: Vector2,
  circleRadius: number
): boolean {
  const closest = closestPointOnLine(start, end, circleCenter);
  return distance(closest, circleCenter) < circleRadius + lineThickness / 2;
}

function rectCircleCollision(rect: Rectangle, circleCenter: Vector2, circleRadius: number): boolean {
  const closestX = Math.max(rect.x, Math.min(circleCenter.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circleCenter.y, rect.y + rect.height));
  return distance({ x: closestX, y: closestY }, circleCenter) < circleRadius;
}
