'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Ball, Level, Circle, Rectangle, Vector2 } from '../types';
import { createBall, shootBall, updateBall, isBallMoving, checkHole, getBallRotation } from '../physics';
import styles from './GameCanvas.module.css';

interface PlayerBallState {
  oderId: string;
  odosition: Vector2;
  velocity: Vector2;
  color: string;
  name: string;
  hasFinished: boolean;
  isMoving: boolean;
}

interface GameCanvasProps {
  level: Level;
  playerColor: string;
  playerName: string;
  playerId: string;
  isMyTurn: boolean;
  onShot: (strokes: number) => void;
  onHoleComplete: (strokes: number) => void;
  onBallUpdate: (position: Vector2, velocity: Vector2, isMoving: boolean) => void;
  onBallCollision: (targetPlayerId: string, newPosition: Vector2, newVelocity: Vector2, velocityChange: Vector2) => void;
  onTurnEnd: () => void;
  otherPlayers: PlayerBallState[];
  currentStrokes: number;
  hasFinishedHole: boolean;
  externalVelocity: Vector2 | null;
  onExternalVelocityApplied: () => void;
  currentTurnPlayerName: string;
}

const BALL_RADIUS = 6;
const HOLE_RADIUS = 10;
const TILE_SIZE = 30;

const COLORS = {
  grassLight: '#90c965',
  grassDark: '#7bb850',
  sand: '#e8d5a3',
  sandDark: '#d4c08a',
  water: '#5ba3e8',
  waterDark: '#4287c7',
  wallMain: '#6b7c8a',
  wallDark: '#4a5862',
  shadow: 'rgba(0,0,0,0.2)',
};

function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  rotation: number
) {
  ctx.fillStyle = COLORS.shadow;
  ctx.beginPath();
  ctx.ellipse(x + 1, y + 1, radius * 0.9, radius * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();

  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, color);
  grad.addColorStop(0.85, color);
  grad.addColorStop(1, darkenColor(color, 30));
  
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = darkenColor(color, 50);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  
  ctx.fillStyle = darkenColor(color, 20);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.15, 0, Math.PI * 2);
  ctx.fill();
  
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const dx = Math.cos(angle) * radius * 0.55;
    const dy = Math.sin(angle) * radius * 0.55;
    ctx.beginPath();
    ctx.arc(dx, dy, radius * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
  const b = Math.max(0, (num & 0x0000FF) - amount);
  return `rgb(${r},${g},${b})`;
}

function drawChessGrass(
  ctx: CanvasRenderingContext2D,
  bounds: { x: number; y: number; width: number; height: number }
) {
  const startX = Math.floor(bounds.x / TILE_SIZE) * TILE_SIZE;
  const startY = Math.floor(bounds.y / TILE_SIZE) * TILE_SIZE;
  
  for (let y = startY; y < bounds.y + bounds.height + TILE_SIZE; y += TILE_SIZE) {
    for (let x = startX; x < bounds.x + bounds.width + TILE_SIZE; x += TILE_SIZE) {
      const isLight = ((Math.floor(x / TILE_SIZE) + Math.floor(y / TILE_SIZE)) % 2) === 0;
      ctx.fillStyle = isLight ? COLORS.grassLight : COLORS.grassDark;
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    }
  }
}

// Draw tapered shot indicator line
function drawShotIndicator(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  startWidth: number
) {
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length < 5) return;

  const angle = Math.atan2(dy, dx);
  const perpX = Math.cos(angle + Math.PI / 2);
  const perpY = Math.sin(angle + Math.PI / 2);

  // Create tapered shape - thick at start, thin at end
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 1;

  ctx.beginPath();
  // Start (thick end) - left side
  ctx.moveTo(startX + perpX * startWidth / 2, startY + perpY * startWidth / 2);
  // End point (tapered to a point)
  ctx.lineTo(endX, endY);
  // Start (thick end) - right side
  ctx.lineTo(startX - perpX * startWidth / 2, startY - perpY * startWidth / 2);
  ctx.closePath();
  
  ctx.fill();
  ctx.stroke();
}

export default function GameCanvas({
  level,
  playerColor,
  playerId,
  isMyTurn,
  onShot,
  onHoleComplete,
  onBallUpdate,
  onBallCollision,
  onTurnEnd,
  otherPlayers,
  currentStrokes,
  hasFinishedHole,
  externalVelocity,
  onExternalVelocityApplied,
  currentTurnPlayerName,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ball, setBall] = useState<Ball>(() => createBall(level.tee.x, level.tee.y));
  const [isAiming, setIsAiming] = useState(false);
  const [aimStart, setAimStart] = useState<{ x: number; y: number } | null>(null);
  const [aimEnd, setAimEnd] = useState<{ x: number; y: number } | null>(null);
  const [strokes, setStrokes] = useState(currentStrokes);
  const [isRolling, setIsRolling] = useState(false);
  const [scored, setScored] = useState(hasFinishedHole);
  const [windmillAngles, setWindmillAngles] = useState<Map<number, number>>(new Map());
  const [movingWallOffsets, setMovingWallOffsets] = useState<Map<number, number>>(new Map());
  const [showSplash, setShowSplash] = useState(false);
  const [ballRotation, setBallRotation] = useState(0);
  const lastBroadcastRef = useRef<number>(0);
  const wasRollingRef = useRef(false);
  const turnEndedRef = useRef(false);
  
  // Local simulation state for other players' balls (for instant collision feedback)
  const [localOtherBalls, setLocalOtherBalls] = useState<Map<string, { position: Vector2; velocity: Vector2; startTime: number }>>(new Map());

  useEffect(() => {
    if (externalVelocity && !scored) {
      console.log('Applying external velocity to my ball:', externalVelocity);
      setBall(prev => ({
        ...prev,
        velocity: {
          x: prev.velocity.x + externalVelocity.x,
          y: prev.velocity.y + externalVelocity.y,
        },
      }));
      setIsRolling(true);
      turnEndedRef.current = false; // Reset for new movement
      onExternalVelocityApplied();
    }
  }, [externalVelocity, scored, onExternalVelocityApplied]);

  useEffect(() => {
    setBall(createBall(level.tee.x, level.tee.y));
    setStrokes(currentStrokes);
    setScored(hasFinishedHole);
    setIsRolling(false);
    setShowSplash(false);
    setBallRotation(0);
  }, [level.id, level.tee.x, level.tee.y, currentStrokes, hasFinishedHole]);

  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();
    const directionTracker = new Map<number, number>();
    level.obstacles.forEach((obstacle, index) => {
      if (obstacle.type === 'moving-wall') {
        directionTracker.set(index, obstacle.properties?.direction || 1);
      }
    });

    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      setWindmillAngles(prev => {
        const newAngles = new Map<number, number>();
        level.obstacles.forEach((obstacle, index) => {
          if (obstacle.type === 'windmill') {
            const currentAngle = prev.get(index) || 0;
            const speed = obstacle.properties?.speed || 2;
            newAngles.set(index, currentAngle + speed * delta);
          }
        });
        return newAngles.size > 0 ? newAngles : prev;
      });

      setMovingWallOffsets(prev => {
        const newOffsets = new Map<number, number>();
        level.obstacles.forEach((obstacle, index) => {
          if (obstacle.type === 'moving-wall') {
            const currentOffset = prev.get(index) || 0;
            const speed = obstacle.properties?.speed || 1;
            let direction = directionTracker.get(index) || 1;
            let newOffset = currentOffset + speed * direction * 60 * delta;
            
            if (newOffset > 80 || newOffset < -80) {
              direction = -direction;
              directionTracker.set(index, direction);
              newOffset = Math.max(-80, Math.min(80, newOffset));
            }
            newOffsets.set(index, newOffset);
          }
        });
        return newOffsets.size > 0 ? newOffsets : prev;
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [level.obstacles]);

  useEffect(() => {
    if (!isRolling || scored) return;

    let animationFrame: number;

    const physicsLoop = () => {
      setBall((currentBall) => {
        const otherBalls: Ball[] = otherPlayers
          .filter(p => !p.hasFinished)
          .map(p => ({
            position: p.odosition,
            velocity: p.velocity,
            radius: BALL_RADIUS,
          }));

        const result = updateBall(currentBall, level, windmillAngles, movingWallOffsets, otherBalls);
        
        setBallRotation(prev => getBallRotation(result.ball, prev));

        // Handle ball-to-ball collisions
        if (result.collisions.length > 0) {
          const otherPlayersNotFinished = otherPlayers.filter(p => !p.hasFinished);
          
          result.collisions.forEach(collision => {
            // The index in collisions corresponds to the index in otherBalls/otherPlayersNotFinished
            const hitPlayer = otherPlayersNotFinished[collision.originalIndex];
            if (hitPlayer) {
              // Start local simulation for the hit ball
              setLocalOtherBalls(prev => {
                const newMap = new Map(prev);
                newMap.set(hitPlayer.oderId, {
                  position: collision.newPosition,
                  velocity: collision.newVelocity,
                  startTime: performance.now(),
                });
                return newMap;
              });
              // Broadcast to network
              onBallCollision(hitPlayer.oderId, collision.newPosition, collision.newVelocity, collision.velocityChange);
            }
          });
        }
        
        if (result.inWater) {
          const onRamp = level.obstacles.some(obs => {
            if (obs.type === 'ramp') {
              const rect = obs.shape as Rectangle;
              return (
                currentBall.position.x >= rect.x &&
                currentBall.position.x <= rect.x + rect.width &&
                currentBall.position.y >= rect.y &&
                currentBall.position.y <= rect.y + rect.height
              );
            }
            return false;
          });
          
          if (!onRamp) {
            setShowSplash(true);
            setTimeout(() => setShowSplash(false), 500);
            setStrokes(s => s + 1);
            setIsRolling(false);
            onBallUpdate(level.tee, { x: 0, y: 0 }, false);
            return createBall(level.tee.x, level.tee.y);
          }
        }
        
        if (checkHole(result.ball, level)) {
          setScored(true);
          setIsRolling(false);
          setTimeout(() => {
            onHoleComplete(strokes);
          }, 800);
          return { ...result.ball, velocity: { x: 0, y: 0 } };
        }
        
        const now = performance.now();
        const stillMoving = isBallMoving(result.ball);
        
        if (now - lastBroadcastRef.current > 16) { // ~60 fps
          onBallUpdate(result.ball.position, result.ball.velocity, stillMoving);
          lastBroadcastRef.current = now;
        }
        
        if (!stillMoving) {
          setIsRolling(false);
          onBallUpdate(result.ball.position, { x: 0, y: 0 }, false);
          // End turn when ball stops (only once!)
          if (!turnEndedRef.current) {
            turnEndedRef.current = true;
            setTimeout(() => {
              onTurnEnd();
            }, 100);
          }
          return { ...result.ball, velocity: { x: 0, y: 0 } };
        }
        
        return result.ball;
      });

      animationFrame = requestAnimationFrame(physicsLoop);
    };

    animationFrame = requestAnimationFrame(physicsLoop);
    return () => cancelAnimationFrame(animationFrame);
  }, [isRolling, scored, level, windmillAngles, movingWallOffsets, strokes, onHoleComplete, onBallUpdate, onBallCollision, onTurnEnd, otherPlayers]);

  // Local physics simulation for other players' balls (after collision)
  const hasLocalBalls = localOtherBalls.size > 0;
  useEffect(() => {
    if (!hasLocalBalls) return;

    let animationFrame: number;
    const FRICTION = 0.982;
    const MIN_VELOCITY = 0.1;
    const WALL_BOUNCE = 0.6;
    const LOCAL_SIM_DURATION = 2000; // 2 seconds before syncing back to network

    const simulateOtherBalls = () => {
      const now = performance.now();
      
      setLocalOtherBalls(prev => {
        if (prev.size === 0) return prev;
        
        const newMap = new Map<string, { position: Vector2; velocity: Vector2; startTime: number }>();

        prev.forEach((ballState, oderId) => {
          // Check if simulation has run for 2 seconds - sync back to network
          if (now - ballState.startTime > LOCAL_SIM_DURATION) {
            // Don't add to map - will fall back to network position
            return;
          }
          
          // Apply velocity
          let newPos = {
            x: ballState.position.x + ballState.velocity.x,
            y: ballState.position.y + ballState.velocity.y,
          };
          
          // Apply friction
          let newVel = {
            x: ballState.velocity.x * FRICTION,
            y: ballState.velocity.y * FRICTION,
          };
          
          // Wall collisions
          for (const wall of level.walls) {
            const collision = checkWallCollision(wall, newPos, BALL_RADIUS);
            if (collision) {
              // Calculate wall normal
              const wallDirX = wall.end.x - wall.start.x;
              const wallDirY = wall.end.y - wall.start.y;
              const wallLen = Math.sqrt(wallDirX ** 2 + wallDirY ** 2);
              const normalX = -wallDirY / wallLen;
              const normalY = wallDirX / wallLen;
              
              // Determine correct normal direction
              const wallCenterX = (wall.start.x + wall.end.x) / 2;
              const wallCenterY = (wall.start.y + wall.end.y) / 2;
              const toBallX = newPos.x - wallCenterX;
              const toBallY = newPos.y - wallCenterY;
              
              let nx = normalX;
              let ny = normalY;
              if (toBallX * nx + toBallY * ny < 0) {
                nx = -nx;
                ny = -ny;
              }
              
              // Push ball out of wall
              const closest = closestPointOnWall(wall, newPos);
              const pushDist = BALL_RADIUS + wall.thickness / 2 + 1;
              newPos = {
                x: closest.x + nx * pushDist,
                y: closest.y + ny * pushDist,
              };
              
              // Reflect velocity
              const dot = newVel.x * nx + newVel.y * ny;
              newVel = {
                x: (newVel.x - 2 * dot * nx) * WALL_BOUNCE,
                y: (newVel.y - 2 * dot * ny) * WALL_BOUNCE,
              };
            }
          }
          
          // Check if still moving
          const speed = Math.sqrt(newVel.x ** 2 + newVel.y ** 2);
          if (speed > MIN_VELOCITY) {
            newMap.set(oderId, { position: newPos, velocity: newVel, startTime: ballState.startTime });
          }
          // If stopped, don't add to map (will fall back to network position)
        });

        return newMap;
      });

      animationFrame = requestAnimationFrame(simulateOtherBalls);
    };

    animationFrame = requestAnimationFrame(simulateOtherBalls);
    return () => cancelAnimationFrame(animationFrame);
  }, [hasLocalBalls, level.walls]);

  // Helper functions for wall collision in local simulation
  function checkWallCollision(wall: { start: Vector2; end: Vector2; thickness: number }, pos: Vector2, radius: number): boolean {
    const closest = closestPointOnWall(wall, pos);
    const dx = pos.x - closest.x;
    const dy = pos.y - closest.y;
    const dist = Math.sqrt(dx ** 2 + dy ** 2);
    return dist < radius + wall.thickness / 2;
  }

  function closestPointOnWall(wall: { start: Vector2; end: Vector2 }, pos: Vector2): Vector2 {
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return wall.start;
    let t = ((pos.x - wall.start.x) * dx + (pos.y - wall.start.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return { x: wall.start.x + t * dx, y: wall.start.y + t * dy };
  }

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#2d4a3e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(level.walls[0].start.x, level.walls[0].start.y);
    level.walls.forEach(wall => {
      ctx.lineTo(wall.end.x, wall.end.y);
    });
    ctx.closePath();
    ctx.clip();
    drawChessGrass(ctx, level.bounds);
    ctx.restore();

    // Obstacles
    level.obstacles.forEach((obstacle, index) => {
      if (obstacle.type === 'sand') {
        const rect = obstacle.shape as Rectangle;
        ctx.fillStyle = COLORS.shadow;
        ctx.fillRect(rect.x + 2, rect.y + 2, rect.width, rect.height);
        ctx.fillStyle = COLORS.sand;
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        ctx.strokeStyle = COLORS.sandDark;
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      }
      
      if (obstacle.type === 'water') {
        const rect = obstacle.shape as Rectangle;
        const time = Date.now() / 1000;
        
        ctx.fillStyle = COLORS.water;
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        
        ctx.strokeStyle = COLORS.waterDark;
        ctx.lineWidth = 1.5;
        for (let y = rect.y + 8; y < rect.y + rect.height; y += 12) {
          ctx.beginPath();
          for (let x = rect.x; x < rect.x + rect.width; x += 4) {
            const wy = y + Math.sin((x / 15) + time * 2) * 2;
            if (x === rect.x) ctx.moveTo(x, wy);
            else ctx.lineTo(x, wy);
          }
          ctx.stroke();
        }
        
        ctx.strokeStyle = '#3a7bc8';
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      }
      
      if (obstacle.type === 'ramp') {
        const rect = obstacle.shape as Rectangle;
        ctx.fillStyle = '#8b6b4a';
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        ctx.strokeStyle = '#5d4632';
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      }
      
      if (obstacle.type === 'bumper') {
        const circle = obstacle.shape as Circle;
        ctx.fillStyle = COLORS.shadow;
        ctx.beginPath();
        ctx.arc(circle.x + 2, circle.y + 2, circle.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e84393';
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#a02d6b';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      if (obstacle.type === 'windmill') {
        const circle = obstacle.shape as Circle;
        const angle = windmillAngles.get(index) || 0;
        
        ctx.fillStyle = COLORS.shadow;
        ctx.beginPath();
        ctx.arc(circle.x + 2, circle.y + 2, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#78909c';
        for (let i = 0; i < 4; i++) {
          const bladeAngle = angle + (i * Math.PI / 2);
          ctx.save();
          ctx.translate(circle.x, circle.y);
          ctx.rotate(bladeAngle);
          ctx.fillRect(-4, 0, 8, circle.radius);
          ctx.restore();
        }
        
        ctx.fillStyle = '#546e7a';
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#37474f';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      if (obstacle.type === 'moving-wall') {
        const rect = obstacle.shape as Rectangle;
        const offset = movingWallOffsets.get(index) || 0;
        
        ctx.fillStyle = COLORS.shadow;
        ctx.fillRect(rect.x + 2, rect.y + offset + 2, rect.width, rect.height);
        ctx.fillStyle = '#ff9800';
        ctx.fillRect(rect.x, rect.y + offset, rect.width, rect.height);
        ctx.strokeStyle = '#e65100';
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.x, rect.y + offset, rect.width, rect.height);
      }
      
      if (obstacle.type === 'teleporter') {
        const circle = obstacle.shape as Circle;
        const time = Date.now() / 1000;
        
        const pulseSize = circle.radius + 3 + Math.sin(time * 3) * 3;
        ctx.fillStyle = 'rgba(156, 39, 176, 0.3)';
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#9c27b0';
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#6a1b9a';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Walls
    level.walls.forEach(wall => {
      const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
      const perpX = Math.cos(angle + Math.PI / 2);
      const perpY = Math.sin(angle + Math.PI / 2);
      const halfThick = wall.thickness / 2;

      ctx.fillStyle = COLORS.shadow;
      ctx.beginPath();
      ctx.moveTo(wall.start.x - perpX * halfThick + 2, wall.start.y - perpY * halfThick + 2);
      ctx.lineTo(wall.end.x - perpX * halfThick + 2, wall.end.y - perpY * halfThick + 2);
      ctx.lineTo(wall.end.x + perpX * halfThick + 2, wall.end.y + perpY * halfThick + 2);
      ctx.lineTo(wall.start.x + perpX * halfThick + 2, wall.start.y + perpY * halfThick + 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = COLORS.wallMain;
      ctx.beginPath();
      ctx.moveTo(wall.start.x - perpX * halfThick, wall.start.y - perpY * halfThick);
      ctx.lineTo(wall.end.x - perpX * halfThick, wall.end.y - perpY * halfThick);
      ctx.lineTo(wall.end.x + perpX * halfThick, wall.end.y + perpY * halfThick);
      ctx.lineTo(wall.start.x + perpX * halfThick, wall.start.y + perpY * halfThick);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = COLORS.wallDark;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Hole
    ctx.fillStyle = COLORS.shadow;
    ctx.beginPath();
    ctx.arc(level.hole.position.x + 1, level.hole.position.y + 1, HOLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(level.hole.position.x, level.hole.position.y, HOLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Flag
    if (!scored) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(level.hole.position.x + 1, level.hole.position.y - 28, 2, 30);
      ctx.fillStyle = '#e53935';
      ctx.beginPath();
      ctx.moveTo(level.hole.position.x + 3, level.hole.position.y - 28);
      ctx.lineTo(level.hole.position.x + 18, level.hole.position.y - 22);
      ctx.lineTo(level.hole.position.x + 3, level.hole.position.y - 16);
      ctx.closePath();
      ctx.fill();
    }

    // Tee
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(level.tee.x, level.tee.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Other players' balls
    otherPlayers.forEach(player => {
      if (player.hasFinished) return;
      
      // Use local simulation position if available, otherwise network position
      const localBall = localOtherBalls.get(player.oderId);
      const displayPos = localBall ? localBall.position : player.odosition;
      
      drawBall(ctx, displayPos.x, displayPos.y, BALL_RADIUS, player.color, 0);
      
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      const textWidth = ctx.measureText(player.name).width;
      ctx.fillRect(displayPos.x - textWidth / 2 - 3, displayPos.y - 18, textWidth + 6, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(player.name, displayPos.x, displayPos.y - 9);
    });

    // My ball
    if (!scored) {
      drawBall(ctx, ball.position.x, ball.position.y, ball.radius, playerColor, ballRotation);
    }

    // Shot indicator (white tapered line)
    if (isAiming && aimStart && aimEnd && !isRolling && !scored && isMyTurn) {
      const dx = aimStart.x - aimEnd.x;
      const dy = aimStart.y - aimEnd.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const power = Math.min(distance / 150, 1);
      const angle = Math.atan2(dy, dx);
      const displayDist = Math.min(distance, 150);
      
      // Calculate end point of indicator
      const endX = ball.position.x + Math.cos(angle) * displayDist;
      const endY = ball.position.y + Math.sin(angle) * displayDist;
      
      // Draw tapered indicator (thick at ball, thin at end)
      drawShotIndicator(ctx, ball.position.x, ball.position.y, endX, endY, BALL_RADIUS * 2);
      
      // Power bar
      const barX = 20;
      const barY = 560;
      const barW = 100;
      const barH = 12;
      
      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barW, barH);
      
      const powerColor = power < 0.4 ? '#4caf50' : power < 0.7 ? '#ff9800' : '#f44336';
      ctx.fillStyle = powerColor;
      ctx.fillRect(barX, barY, barW * power, barH);
      
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);
      
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${Math.round(power * 100)}%`, barX + barW + 6, barY + 9);
    }

    // Not your turn indicator
    if (!isMyTurn && !scored && !isRolling) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Waiting for ${currentTurnPlayerName}...`, canvas.width / 2, canvas.height - 18);
    }

    // Splash
    if (showSplash) {
      for (let i = 0; i < 8; i++) {
        const splashAngle = (i / 8) * Math.PI * 2;
        const splashDist = 10 + Math.random() * 12;
        ctx.fillStyle = i % 2 === 0 ? COLORS.water : '#fff';
        ctx.beginPath();
        ctx.arc(
          ball.position.x + Math.cos(splashAngle) * splashDist,
          ball.position.y + Math.sin(splashAngle) * splashDist,
          2 + Math.random() * 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    // Scored
    if (scored) {
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#333';
      ctx.fillText('HOLE!', level.hole.position.x + 2, level.hole.position.y - 35 + 2);
      ctx.fillStyle = '#4caf50';
      ctx.fillText('HOLE!', level.hole.position.x, level.hole.position.y - 35);
    }

  }, [ball, level, isAiming, aimStart, aimEnd, playerColor, isRolling, scored, isMyTurn, windmillAngles, movingWallOffsets, showSplash, ballRotation, otherPlayers, localOtherBalls, currentTurnPlayerName]);

  const getCanvasCoords = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const getDocumentCoords = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Only allow aiming if it's my turn and ball is not moving
    if (!isMyTurn || isRolling || scored) return;
    setIsAiming(true);
    // Always use ball position as the starting reference for aiming
    setAimStart({ x: ball.position.x, y: ball.position.y });
    setAimEnd(getCanvasCoords(e));
  }, [isMyTurn, isRolling, scored, getCanvasCoords, ball.position.x, ball.position.y]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isAiming) return;
    setAimEnd(getCanvasCoords(e));
  }, [isAiming, getCanvasCoords]);

  // Document-level mouse move handler for when mouse is outside canvas
  const handleDocumentMouseMove = useCallback((e: MouseEvent) => {
    if (!isAiming) return;
    setAimEnd(getDocumentCoords(e));
  }, [isAiming, getDocumentCoords]);

  // Document-level mouse up handler for when mouse is released outside canvas
  const handleDocumentMouseUp = useCallback(() => {
    if (!isAiming || !aimStart || !aimEnd || !isMyTurn) {
      setIsAiming(false);
      return;
    }
    
    // Calculate from ball position (aimStart) to cursor position (aimEnd)
    const dx = aimStart.x - aimEnd.x;
    const dy = aimStart.y - aimEnd.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const power = Math.min(distance / 150, 1);
    const angle = Math.atan2(dy, dx);
    
    if (power > 0.05) {
      setBall(shootBall(ball, power, angle));
      setStrokes(s => s + 1);
      setIsRolling(true);
      turnEndedRef.current = false; // Reset for new shot
      onShot(strokes + 1);
    }
    
    setIsAiming(false);
    setAimStart(null);
    setAimEnd(null);
  }, [isAiming, aimStart, aimEnd, isMyTurn, ball, strokes, onShot]);

  // Add document-level event listeners when aiming
  useEffect(() => {
    if (isAiming) {
      document.addEventListener('mousemove', handleDocumentMouseMove);
      document.addEventListener('mouseup', handleDocumentMouseUp);
      document.addEventListener('touchmove', handleDocumentMouseMove as unknown as EventListener);
      document.addEventListener('touchend', handleDocumentMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleDocumentMouseMove);
        document.removeEventListener('mouseup', handleDocumentMouseUp);
        document.removeEventListener('touchmove', handleDocumentMouseMove as unknown as EventListener);
        document.removeEventListener('touchend', handleDocumentMouseUp);
      };
    }
  }, [isAiming, handleDocumentMouseMove, handleDocumentMouseUp]);

  const handlePointerUp = useCallback(() => {
    if (!isAiming || !aimStart || !aimEnd || !isMyTurn) {
      setIsAiming(false);
      return;
    }
    
    // Calculate from ball position (aimStart) to cursor position (aimEnd)
    const dx = aimStart.x - aimEnd.x;
    const dy = aimStart.y - aimEnd.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const power = Math.min(distance / 150, 1);
    const angle = Math.atan2(dy, dx);
    
    if (power > 0.05) {
      setBall(shootBall(ball, power, angle));
      setStrokes(s => s + 1);
      setIsRolling(true);
      turnEndedRef.current = false; // Reset for new shot
      onShot(strokes + 1);
    }
    
    setIsAiming(false);
    setAimStart(null);
    setAimEnd(null);
  }, [isAiming, aimStart, aimEnd, isMyTurn, ball, strokes, onShot]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.levelInfo}>
          <span className={styles.levelName}>{level.name}</span>
          <span className={styles.par}>Par {level.par}</span>
        </div>
        <div className={styles.strokeInfo}>
          <span className={styles.strokeLabel}>Strokes</span>
          <span className={styles.strokeCount} style={{ color: playerColor }}>{strokes}</span>
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        width={600}
        height={600}
        className={`${styles.canvas} ${!isMyTurn && !scored ? styles.waiting : ''}`}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />
      
      <div className={styles.footer}>
        {isMyTurn && !isRolling && !scored && (
          <div className={styles.instruction}>
            Your turn! Drag to aim
          </div>
        )}
        {isRolling && (
          <div className={styles.rolling}>Rolling...</div>
        )}
        {scored && (
          <div className={styles.scored}>Waiting for others...</div>
        )}
      </div>
    </div>
  );
}
