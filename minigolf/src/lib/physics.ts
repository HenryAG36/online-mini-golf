import { Ball, Level, Point, Vector, Obstacle, FRICTION, WALL_BOUNCE, SAND_FRICTION, HOLE_ATTRACTION } from './types';

const BALL_RADIUS = 10;
const MIN_VELOCITY = 0.1;

// Vector math helpers
export const vectorLength = (v: Vector): number => Math.sqrt(v.x * v.x + v.y * v.y);
export const normalize = (v: Vector): Vector => {
  const len = vectorLength(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
};
export const dot = (a: Vector, b: Vector): number => a.x * b.x + a.y * b.y;
export const subtract = (a: Point, b: Point): Vector => ({ x: a.x - b.x, y: a.y - b.y });
export const add = (a: Point, b: Vector): Point => ({ x: a.x + b.x, y: a.y + b.y });
export const scale = (v: Vector, s: number): Vector => ({ x: v.x * s, y: v.y * s });
export const distance = (a: Point, b: Point): number => vectorLength(subtract(a, b));

// Check if point is inside polygon
export const pointInPolygon = (point: Point, polygon: Point[]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    if (((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
};

// Line segment intersection
export const lineIntersection = (
  p1: Point, p2: Point, p3: Point, p4: Point
): Point | null => {
  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (Math.abs(denom) < 0.0001) return null;
  
  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;
  
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: p1.x + ua * (p2.x - p1.x),
      y: p1.y + ua * (p2.y - p1.y)
    };
  }
  return null;
};

// Get wall normal
export const getWallNormal = (p1: Point, p2: Point): Vector => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  return { x: -dy / len, y: dx / len };
};

// Reflect velocity off wall
export const reflect = (velocity: Vector, normal: Vector): Vector => {
  const d = dot(velocity, normal);
  return {
    x: velocity.x - 2 * d * normal.x,
    y: velocity.y - 2 * d * normal.y
  };
};

// Check and handle wall collisions
export const handleWallCollisions = (
  position: Point,
  velocity: Vector,
  walls: Obstacle[]
): { position: Point; velocity: Vector; hit: boolean } => {
  let hit = false;
  let newVelocity = { ...velocity };
  let newPosition = { ...position };
  
  for (const wall of walls) {
    if (wall.type !== 'wall' || !wall.points) continue;
    
    const points = wall.points;
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      
      // Check if ball is close to this wall segment
      const closestPoint = closestPointOnSegment(newPosition, p1, p2);
      const dist = distance(newPosition, closestPoint);
      
      if (dist < BALL_RADIUS) {
        hit = true;
        const normal = getWallNormal(p1, p2);
        
        // Push ball out of wall
        const overlap = BALL_RADIUS - dist;
        const pushDir = normalize(subtract(newPosition, closestPoint));
        newPosition = add(newPosition, scale(pushDir, overlap + 1));
        
        // Reflect velocity
        const dotProduct = dot(newVelocity, normal);
        if (dotProduct < 0) {
          newVelocity = scale(reflect(newVelocity, normal), WALL_BOUNCE);
        }
      }
    }
  }
  
  return { position: newPosition, velocity: newVelocity, hit };
};

// Closest point on line segment
export const closestPointOnSegment = (p: Point, a: Point, b: Point): Point => {
  const ab = subtract(b, a);
  const ap = subtract(p, a);
  const t = Math.max(0, Math.min(1, dot(ap, ab) / dot(ab, ab)));
  return add(a, scale(ab, t));
};

// Check collision with bouncer
export const handleBouncerCollision = (
  position: Point,
  velocity: Vector,
  bouncer: Obstacle
): { position: Point; velocity: Vector; hit: boolean } => {
  if (!bouncer.position || !bouncer.radius) {
    return { position, velocity, hit: false };
  }
  
  const dist = distance(position, bouncer.position);
  const combinedRadius = BALL_RADIUS + bouncer.radius;
  
  if (dist < combinedRadius) {
    const normal = normalize(subtract(position, bouncer.position));
    const overlap = combinedRadius - dist;
    
    // Push out
    const newPosition = add(position, scale(normal, overlap + 1));
    
    // Bounce with extra force
    const speed = vectorLength(velocity);
    const newVelocity = scale(normal, Math.max(speed * 1.2, 5));
    
    return { position: newPosition, velocity: newVelocity, hit: true };
  }
  
  return { position, velocity, hit: false };
};

// Check if in sand
export const isInSand = (position: Point, obstacles: Obstacle[]): boolean => {
  for (const obs of obstacles) {
    if (obs.type === 'sand' && obs.position && obs.width && obs.height) {
      if (position.x > obs.position.x && 
          position.x < obs.position.x + obs.width &&
          position.y > obs.position.y && 
          position.y < obs.position.y + obs.height) {
        return true;
      }
    }
  }
  return false;
};

// Check if in water
export const isInWater = (position: Point, obstacles: Obstacle[]): boolean => {
  for (const obs of obstacles) {
    if (obs.type === 'water' && obs.position && obs.width && obs.height) {
      const centerX = obs.position.x + obs.width / 2;
      const centerY = obs.position.y + obs.height / 2;
      const dist = distance(position, { x: centerX, y: centerY });
      if (dist < Math.min(obs.width, obs.height) / 2) {
        return true;
      }
    }
  }
  return false;
};

// Check windmill collision
export const handleWindmillCollision = (
  position: Point,
  velocity: Vector,
  windmill: Obstacle,
  time: number
): { position: Point; velocity: Vector; hit: boolean } => {
  if (!windmill.position || !windmill.width || !windmill.height) {
    return { position, velocity, hit: false };
  }
  
  const speed = windmill.speed || 2;
  const angle = (time * speed) % (Math.PI * 2);
  
  // Calculate rotated blade corners
  const halfW = windmill.width / 2;
  const halfH = windmill.height / 2;
  
  // Two blades (opposite directions)
  const blades = [angle, angle + Math.PI];
  
  for (const bladeAngle of blades) {
    const bCos = Math.cos(bladeAngle);
    const bSin = Math.sin(bladeAngle);
    
    // Blade endpoints
    const p1: Point = {
      x: windmill.position.x + bCos * halfW,
      y: windmill.position.y + bSin * halfW
    };
    const p2: Point = {
      x: windmill.position.x - bCos * halfW,
      y: windmill.position.y - bSin * halfW
    };
    
    const closest = closestPointOnSegment(position, p1, p2);
    const dist = distance(position, closest);
    
    if (dist < BALL_RADIUS + halfH) {
      // Get perpendicular direction for bounce
      const normal = normalize(subtract(position, closest));
      const overlap = BALL_RADIUS + halfH - dist;
      const newPosition = add(position, scale(normal, overlap + 2));
      
      // Add blade's rotational momentum
      const tangent = { x: -bSin, y: bCos };
      const bladeSpeed = speed * halfW * 0.5;
      const newVelocity = {
        x: normal.x * vectorLength(velocity) * WALL_BOUNCE + tangent.x * bladeSpeed,
        y: normal.y * vectorLength(velocity) * WALL_BOUNCE + tangent.y * bladeSpeed
      };
      
      return { position: newPosition, velocity: newVelocity, hit: true };
    }
  }
  
  return { position, velocity, hit: false };
};

// Check if ball is in hole
export const isInHole = (position: Point, hole: Point, holeRadius: number): boolean => {
  const dist = distance(position, hole);
  return dist < holeRadius - BALL_RADIUS * 0.5;
};

// Apply hole attraction when close
export const applyHoleAttraction = (
  position: Point,
  velocity: Vector,
  hole: Point,
  holeRadius: number
): Vector => {
  const dist = distance(position, hole);
  const speed = vectorLength(velocity);
  
  if (dist < holeRadius * 2 && speed < 3) {
    const toHole = normalize(subtract(hole, position));
    const attraction = HOLE_ATTRACTION * (1 - dist / (holeRadius * 2));
    return {
      x: velocity.x + toHole.x * attraction,
      y: velocity.y + toHole.y * attraction
    };
  }
  
  return velocity;
};

// Main physics update
export const updateBall = (
  ball: Ball,
  level: Level,
  time: number
): Ball => {
  if (!ball.isMoving || ball.inHole) return ball;
  
  let { position, velocity } = ball;
  
  // Apply velocity
  position = add(position, velocity);
  
  // Handle wall collisions
  const wallResult = handleWallCollisions(position, velocity, level.walls);
  position = wallResult.position;
  velocity = wallResult.velocity;
  
  // Handle obstacle collisions
  for (const obs of level.obstacles) {
    if (obs.type === 'bouncer') {
      const result = handleBouncerCollision(position, velocity, obs);
      position = result.position;
      velocity = result.velocity;
    } else if (obs.type === 'windmill') {
      const result = handleWindmillCollision(position, velocity, obs, time);
      position = result.position;
      velocity = result.velocity;
    }
  }
  
  // Check water - reset to tee with penalty
  if (isInWater(position, level.obstacles)) {
    return {
      position: { ...level.tee },
      velocity: { x: 0, y: 0 },
      isMoving: false,
      inHole: false
    };
  }
  
  // Apply friction (more in sand)
  const inSand = isInSand(position, level.obstacles);
  const friction = inSand ? SAND_FRICTION : FRICTION;
  velocity = scale(velocity, friction);
  
  // Apply hole attraction
  velocity = applyHoleAttraction(position, velocity, level.hole, level.holeRadius);
  
  // Check if in hole
  const speed = vectorLength(velocity);
  if (isInHole(position, level.hole, level.holeRadius) && speed < 5) {
    return {
      position: { ...level.hole },
      velocity: { x: 0, y: 0 },
      isMoving: false,
      inHole: true
    };
  }
  
  // Stop if velocity is very low
  if (speed < MIN_VELOCITY) {
    return {
      position,
      velocity: { x: 0, y: 0 },
      isMoving: false,
      inHole: false
    };
  }
  
  return {
    position,
    velocity,
    isMoving: true,
    inHole: false
  };
};

// Calculate shot velocity from angle and power
export const calculateShotVelocity = (angle: number, power: number): Vector => {
  return {
    x: Math.cos(angle) * power,
    y: Math.sin(angle) * power
  };
};
