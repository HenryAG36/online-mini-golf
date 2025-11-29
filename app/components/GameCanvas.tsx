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
}

interface GameCanvasProps {
  level: Level;
  playerColor: string;
  playerName: string;
  playerId: string;
  isMyTurn: boolean;
  onShot: (strokes: number) => void;
  onHoleComplete: (strokes: number) => void;
  onBallUpdate: (position: Vector2, velocity: Vector2) => void;
  onBallCollision: (targetPlayerId: string, newVelocity: Vector2) => void;
  otherPlayers: PlayerBallState[];
  currentStrokes: number;
  hasFinishedHole: boolean;
  externalVelocity: Vector2 | null;
  onExternalVelocityApplied: () => void;
}

const BALL_RADIUS = 6;
const HOLE_RADIUS = 10;
const TILE_SIZE = 30;

// Colors
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

// Draw minimalist top-down 3D ball
function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  rotation: number
) {
  // Shadow (directly below, slightly offset)
  ctx.fillStyle = COLORS.shadow;
  ctx.beginPath();
  ctx.ellipse(x + 1, y + 1, radius * 0.9, radius * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Main ball - flat color with subtle edge darkening
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, color);
  grad.addColorStop(0.85, color);
  grad.addColorStop(1, darkenColor(color, 30));
  
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Outline
  ctx.strokeStyle = darkenColor(color, 50);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Simple dimple pattern (top-down view, shows rotation)
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  
  ctx.fillStyle = darkenColor(color, 20);
  // Center dimple
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.15, 0, Math.PI * 2);
  ctx.fill();
  
  // Ring of dimples
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

// Darken a hex color
function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
  const b = Math.max(0, (num & 0x0000FF) - amount);
  return `rgb(${r},${g},${b})`;
}

// Draw chess-tile grass pattern
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

export default function GameCanvas({
  level,
  playerColor,
  playerId,
  onShot,
  onHoleComplete,
  onBallUpdate,
  onBallCollision,
  otherPlayers,
  currentStrokes,
  hasFinishedHole,
  externalVelocity,
  onExternalVelocityApplied,
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

  // Apply external velocity (from collision)
  useEffect(() => {
    if (externalVelocity && !scored) {
      setBall(prev => ({
        ...prev,
        velocity: {
          x: prev.velocity.x + externalVelocity.x,
          y: prev.velocity.y + externalVelocity.y,
        },
      }));
      setIsRolling(true);
      onExternalVelocityApplied();
    }
  }, [externalVelocity, scored, onExternalVelocityApplied]);

  // Reset ball when level changes
  useEffect(() => {
    setBall(createBall(level.tee.x, level.tee.y));
    setStrokes(currentStrokes);
    setScored(hasFinishedHole);
    setIsRolling(false);
    setShowSplash(false);
    setBallRotation(0);
  }, [level.id, level.tee.x, level.tee.y, currentStrokes, hasFinishedHole]);

  // Animation loop for obstacles
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

  // Physics update loop
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

        // Broadcast collision to other players
        if (result.collidedBalls.length > 0) {
          result.collidedBalls.forEach((collidedBall, index) => {
            // Find which player this ball belongs to
            const hitPlayer = otherPlayers.find(p => 
              Math.abs(p.odosition.x - otherBalls[index]?.position.x) < 1 &&
              Math.abs(p.odosition.y - otherBalls[index]?.position.y) < 1
            );
            if (hitPlayer) {
              // Send the velocity change to that player
              onBallCollision(hitPlayer.oderId, collidedBall.velocity);
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
            onBallUpdate(level.tee, { x: 0, y: 0 });
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
        if (now - lastBroadcastRef.current > 33) {
          onBallUpdate(result.ball.position, result.ball.velocity);
          lastBroadcastRef.current = now;
        }
        
        if (!isBallMoving(result.ball)) {
          setIsRolling(false);
          onBallUpdate(result.ball.position, { x: 0, y: 0 });
          return { ...result.ball, velocity: { x: 0, y: 0 } };
        }
        
        return result.ball;
      });

      animationFrame = requestAnimationFrame(physicsLoop);
    };

    animationFrame = requestAnimationFrame(physicsLoop);
    return () => cancelAnimationFrame(animationFrame);
  }, [isRolling, scored, level, windmillAngles, movingWallOffsets, strokes, onHoleComplete, onBallUpdate, onBallCollision, otherPlayers]);

  // Draw the game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#2d4a3e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw course with clipping
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(level.walls[0].start.x, level.walls[0].start.y);
    level.walls.forEach(wall => {
      ctx.lineTo(wall.end.x, wall.end.y);
    });
    ctx.closePath();
    ctx.clip();
    
    // Chess-tile grass
    drawChessGrass(ctx, level.bounds);
    
    ctx.restore();

    // Draw obstacles
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
        
        // Simple wave lines
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
        
        // Shadow
        ctx.fillStyle = COLORS.shadow;
        ctx.beginPath();
        ctx.arc(circle.x + 2, circle.y + 2, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Blades
        ctx.fillStyle = '#78909c';
        for (let i = 0; i < 4; i++) {
          const bladeAngle = angle + (i * Math.PI / 2);
          ctx.save();
          ctx.translate(circle.x, circle.y);
          ctx.rotate(bladeAngle);
          ctx.fillRect(-4, 0, 8, circle.radius);
          ctx.restore();
        }
        
        // Hub
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

    // Draw walls
    level.walls.forEach(wall => {
      const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);
      const perpX = Math.cos(angle + Math.PI / 2);
      const perpY = Math.sin(angle + Math.PI / 2);
      const halfThick = wall.thickness / 2;

      // Shadow
      ctx.fillStyle = COLORS.shadow;
      ctx.beginPath();
      ctx.moveTo(wall.start.x - perpX * halfThick + 2, wall.start.y - perpY * halfThick + 2);
      ctx.lineTo(wall.end.x - perpX * halfThick + 2, wall.end.y - perpY * halfThick + 2);
      ctx.lineTo(wall.end.x + perpX * halfThick + 2, wall.end.y + perpY * halfThick + 2);
      ctx.lineTo(wall.start.x + perpX * halfThick + 2, wall.start.y + perpY * halfThick + 2);
      ctx.closePath();
      ctx.fill();

      // Main wall
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

    // Draw hole
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

    // Draw tee
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(level.tee.x, level.tee.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw other players' balls
    otherPlayers.forEach(player => {
      if (player.hasFinished) return;
      
      drawBall(ctx, player.odosition.x, player.odosition.y, BALL_RADIUS, player.color, 0);
      
      // Name tag
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      const textWidth = ctx.measureText(player.name).width;
      ctx.fillRect(player.odosition.x - textWidth / 2 - 3, player.odosition.y - 18, textWidth + 6, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(player.name, player.odosition.x, player.odosition.y - 9);
    });

    // Draw my ball
    if (!scored) {
      drawBall(ctx, ball.position.x, ball.position.y, ball.radius, playerColor, ballRotation);
    }

    // Aim line
    if (isAiming && aimStart && aimEnd && !isRolling && !scored) {
      const dx = aimStart.x - aimEnd.x;
      const dy = aimStart.y - aimEnd.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const power = Math.min(distance / 150, 1);
      const angle = Math.atan2(dy, dx);
      const displayDist = Math.min(distance, 150);
      
      // Dotted line
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = playerColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ball.position.x, ball.position.y);
      ctx.lineTo(
        ball.position.x + Math.cos(angle) * displayDist,
        ball.position.y + Math.sin(angle) * displayDist
      );
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Arrow
      if (displayDist > 20) {
        const arrowX = ball.position.x + Math.cos(angle) * displayDist;
        const arrowY = ball.position.y + Math.sin(angle) * displayDist;
        
        ctx.fillStyle = playerColor;
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - Math.cos(angle - 0.4) * 10, arrowY - Math.sin(angle - 0.4) * 10);
        ctx.lineTo(arrowX - Math.cos(angle + 0.4) * 10, arrowY - Math.sin(angle + 0.4) * 10);
        ctx.closePath();
        ctx.fill();
      }
      
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

  }, [ball, level, isAiming, aimStart, aimEnd, playerColor, isRolling, scored, windmillAngles, movingWallOffsets, showSplash, ballRotation, otherPlayers]);

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

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isRolling || scored) return;
    setIsAiming(true);
    setAimStart(getCanvasCoords(e));
    setAimEnd(getCanvasCoords(e));
  }, [isRolling, scored, getCanvasCoords]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isAiming) return;
    setAimEnd(getCanvasCoords(e));
  }, [isAiming, getCanvasCoords]);

  const handlePointerUp = useCallback(() => {
    if (!isAiming || !aimStart || !aimEnd) {
      setIsAiming(false);
      return;
    }
    
    const dx = aimStart.x - aimEnd.x;
    const dy = aimStart.y - aimEnd.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const power = Math.min(distance / 150, 1);
    const angle = Math.atan2(dy, dx);
    
    if (power > 0.05) {
      setBall(shootBall(ball, power, angle));
      setStrokes(s => s + 1);
      setIsRolling(true);
      onShot(strokes + 1);
    }
    
    setIsAiming(false);
    setAimStart(null);
    setAimEnd(null);
  }, [isAiming, aimStart, aimEnd, ball, strokes, onShot]);

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
        className={styles.canvas}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />
      
      <div className={styles.footer}>
        {!isRolling && !scored && (
          <div className={styles.instruction}>
            Drag to aim • Release to shoot
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
