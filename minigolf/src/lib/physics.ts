import { Ball, Vector2D, Wall, Obstacle, Hole, Level } from '@/types/game';

const FRICTION = 0.985;
const MIN_VELOCITY = 0.1;
const BOUNCE_DAMPING = 0.7;
const MAX_POWER = 25;

export function normalize(v: Vector2D): Vector2D {
  const mag = Math.sqrt(v.x * v.x + v.y * v.y);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
}

export function magnitude(v: Vector2D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function dot(a: Vector2D, b: Vector2D): number {
  return a.x * b.x + a.y * b.y;
}

export function subtract(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function add(a: Vector2D, b: Vector2D): Vector2D {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function scale(v: Vector2D, s: number): Vector2D {
  return { x: v.x * s, y: v.y * s };
}

export function distance(a: Vector2D, b: Vector2D): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function calculateShot(start: Vector2D, end: Vector2D): Vector2D {
  const dx = start.x - end.x;
  const dy = start.y - end.y;
  const power = Math.min(Math.sqrt(dx * dx + dy * dy), MAX_POWER * 10) / 10;
  const angle = Math.atan2(dy, dx);
  
  return {
    x: Math.cos(angle) * power,
    y: Math.sin(angle) * power,
  };
}

export function updateBall(ball: Ball, level: Level, deltaTime: number): Ball {
  if (!ball.isMoving) return ball;

  let newVelocity = { ...ball.velocity };
  let newPosition = {
    x: ball.position.x + newVelocity.x * deltaTime,
    y: ball.position.y + newVelocity.y * deltaTime,
  };

  // Check obstacles
  for (const obstacle of level.obstacles) {
    const result = handleObstacleCollision(newPosition, newVelocity, ball.radius, obstacle);
    newPosition = result.position;
    newVelocity = result.velocity;
  }

  // Check wall collisions
  for (const wall of level.walls) {
    const result = handleWallCollision(newPosition, newVelocity, ball.radius, wall);
    newPosition = result.position;
    newVelocity = result.velocity;
  }

  // Check bounds
  const boundsResult = handleBoundsCollision(newPosition, newVelocity, ball.radius, level.bounds);
  newPosition = boundsResult.position;
  newVelocity = boundsResult.velocity;

  // Apply friction
  newVelocity.x *= FRICTION;
  newVelocity.y *= FRICTION;

  // Check if ball stopped
  const speed = magnitude(newVelocity);
  const isMoving = speed > MIN_VELOCITY;

  if (!isMoving) {
    newVelocity = { x: 0, y: 0 };
  }

  return {
    ...ball,
    position: newPosition,
    velocity: newVelocity,
    isMoving,
  };
}

function handleWallCollision(
  position: Vector2D,
  velocity: Vector2D,
  radius: number,
  wall: Wall
): { position: Vector2D; velocity: Vector2D } {
  const wallVec = subtract(wall.end, wall.start);
  const wallLen = magnitude(wallVec);
  const wallUnit = normalize(wallVec);
  
  const ballToStart = subtract(position, wall.start);
  const projection = dot(ballToStart, wallUnit);
  
  if (projection < 0 || projection > wallLen) {
    return { position, velocity };
  }
  
  const closestPoint = add(wall.start, scale(wallUnit, projection));
  const distToWall = distance(position, closestPoint);
  
  if (distToWall < radius) {
    // Calculate normal
    const normal = normalize(subtract(position, closestPoint));
    
    // Reflect velocity
    const dotProduct = dot(velocity, normal);
    let newVelocity = subtract(velocity, scale(normal, 2 * dotProduct));
    
    // Apply damping based on wall type
    let damping = BOUNCE_DAMPING;
    if (wall.type === 'bouncy') damping = 1.2;
    if (wall.type === 'sticky') damping = 0.3;
    
    newVelocity = scale(newVelocity, damping);
    
    // Push ball out of wall
    const overlap = radius - distToWall;
    const newPosition = add(position, scale(normal, overlap + 1));
    
    return { position: newPosition, velocity: newVelocity };
  }
  
  return { position, velocity };
}

function handleBoundsCollision(
  position: Vector2D,
  velocity: Vector2D,
  radius: number,
  bounds: { width: number; height: number }
): { position: Vector2D; velocity: Vector2D } {
  let newPosition = { ...position };
  let newVelocity = { ...velocity };
  
  if (position.x - radius < 0) {
    newPosition.x = radius;
    newVelocity.x = -velocity.x * BOUNCE_DAMPING;
  }
  if (position.x + radius > bounds.width) {
    newPosition.x = bounds.width - radius;
    newVelocity.x = -velocity.x * BOUNCE_DAMPING;
  }
  if (position.y - radius < 0) {
    newPosition.y = radius;
    newVelocity.y = -velocity.y * BOUNCE_DAMPING;
  }
  if (position.y + radius > bounds.height) {
    newPosition.y = bounds.height - radius;
    newVelocity.y = -velocity.y * BOUNCE_DAMPING;
  }
  
  return { position: newPosition, velocity: newVelocity };
}

function handleObstacleCollision(
  position: Vector2D,
  velocity: Vector2D,
  radius: number,
  obstacle: Obstacle
): { position: Vector2D; velocity: Vector2D } {
  const { type, position: obsPos, size } = obstacle;
  
  switch (type) {
    case 'bumper': {
      const bumperRadius = size.x / 2;
      const dist = distance(position, obsPos);
      if (dist < radius + bumperRadius) {
        const normal = normalize(subtract(position, obsPos));
        const newVelocity = scale(normal, magnitude(velocity) * 1.5);
        const overlap = radius + bumperRadius - dist;
        const newPosition = add(position, scale(normal, overlap + 1));
        return { position: newPosition, velocity: newVelocity };
      }
      break;
    }
    
    case 'sand': {
      if (
        position.x > obsPos.x - size.x / 2 &&
        position.x < obsPos.x + size.x / 2 &&
        position.y > obsPos.y - size.y / 2 &&
        position.y < obsPos.y + size.y / 2
      ) {
        return {
          position,
          velocity: scale(velocity, 0.95),
        };
      }
      break;
    }
    
    case 'water': {
      if (
        position.x > obsPos.x - size.x / 2 &&
        position.x < obsPos.x + size.x / 2 &&
        position.y > obsPos.y - size.y / 2 &&
        position.y < obsPos.y + size.y / 2
      ) {
        // Ball in water - will be handled by game logic to reset
        return { position, velocity: { x: 0, y: 0 } };
      }
      break;
    }
    
    case 'spinner': {
      const spinnerRadius = size.x / 2;
      const dist = distance(position, obsPos);
      if (dist < radius + spinnerRadius + 20) {
        // Add rotational force
        const angle = Math.atan2(position.y - obsPos.y, position.x - obsPos.x);
        const spinForce = 0.3;
        const perpAngle = angle + Math.PI / 2;
        return {
          position,
          velocity: add(velocity, {
            x: Math.cos(perpAngle) * spinForce,
            y: Math.sin(perpAngle) * spinForce,
          }),
        };
      }
      break;
    }
    
    case 'ramp': {
      if (
        position.x > obsPos.x - size.x / 2 &&
        position.x < obsPos.x + size.x / 2 &&
        position.y > obsPos.y - size.y / 2 &&
        position.y < obsPos.y + size.y / 2
      ) {
        const rampAngle = obstacle.rotation || 0;
        const boost = 1.3;
        return {
          position,
          velocity: {
            x: velocity.x * boost + Math.cos(rampAngle) * 2,
            y: velocity.y * boost + Math.sin(rampAngle) * 2,
          },
        };
      }
      break;
    }
    
    case 'portal': {
      const portalRadius = size.x / 2;
      const dist = distance(position, obsPos);
      if (dist < radius + portalRadius && obstacle.properties?.targetPosition) {
        return {
          position: obstacle.properties.targetPosition,
          velocity,
        };
      }
      break;
    }
  }
  
  return { position, velocity };
}

export function checkHoleCollision(ball: Ball, hole: Hole): boolean {
  const dist = distance(ball.position, hole.position);
  const speed = magnitude(ball.velocity);
  
  // Ball must be slow enough to fall in
  if (dist < hole.radius && speed < 8) {
    return true;
  }
  
  return false;
}

export function isInWater(position: Vector2D, obstacles: Obstacle[]): boolean {
  for (const obstacle of obstacles) {
    if (obstacle.type === 'water') {
      if (
        position.x > obstacle.position.x - obstacle.size.x / 2 &&
        position.x < obstacle.position.x + obstacle.size.x / 2 &&
        position.y > obstacle.position.y - obstacle.size.y / 2 &&
        position.y < obstacle.position.y + obstacle.size.y / 2
      ) {
        return true;
      }
    }
  }
  return false;
}
