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
  otherPlayers: PlayerBallState[];
  currentStrokes: number;
  hasFinishedHole: boolean;
}

// Cartoonish color palette
const COLORS = {
  grassLight: '#7ec850',
  grassMid: '#5a9c32',
  grassDark: '#3d7a1c',
  grassStroke: '#2d5a14',
  sand: '#e8d5a3',
  sandDark: '#c9b896',
  water: '#4a9eff',
  waterDark: '#2563eb',
  wallLight: '#8b9dc3',
  wallDark: '#5d6d7e',
  wallStroke: '#34495e',
  shadow: 'rgba(0,0,0,0.25)',
};

// Draw a 3D cartoon ball
function draw3DBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  baseColor: string,
  rotation: number,
  isMoving: boolean
) {
  // Shadow
  ctx.fillStyle = COLORS.shadow;
  ctx.beginPath();
  ctx.ellipse(x + 4, y + radius + 2, radius * 0.9, radius * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Parse base color to get RGB values
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.fillStyle = baseColor;
  tempCtx.fillRect(0, 0, 1, 1);
  const imageData = tempCtx.getImageData(0, 0, 1, 1).data;
  const r = imageData[0], g = imageData[1], b = imageData[2];

  // Create darker and lighter versions
  const darkColor = `rgb(${Math.max(0, r - 60)}, ${Math.max(0, g - 60)}, ${Math.max(0, b - 60)})`;
  const lightColor = `rgb(${Math.min(255, r + 40)}, ${Math.min(255, g + 40)}, ${Math.min(255, b + 40)})`;

  // Main ball body - cel shaded gradient
  const ballGradient = ctx.createRadialGradient(
    x - radius * 0.3, y - radius * 0.3, 0,
    x, y, radius
  );
  ballGradient.addColorStop(0, '#ffffff');
  ballGradient.addColorStop(0.15, lightColor);
  ballGradient.addColorStop(0.5, baseColor);
  ballGradient.addColorStop(0.85, darkColor);
  ballGradient.addColorStop(1, darkColor);

  ctx.fillStyle = ballGradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Cartoon outline
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Highlight (cartoon shine)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.ellipse(x - radius * 0.35, y - radius * 0.35, radius * 0.25, radius * 0.15, -Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  // Secondary highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.arc(x - radius * 0.15, y - radius * 0.5, radius * 0.12, 0, Math.PI * 2);
  ctx.fill();

  // Rolling stripe (shows rotation)
  if (isMoving) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    // Stripe across ball
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.7, -0.5, 0.5);
    ctx.stroke();
    
    // Dimple pattern
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for (let i = 0; i < 3; i++) {
      const angle = rotation + (i * Math.PI * 2 / 3);
      const dx = Math.cos(angle) * radius * 0.5;
      const dy = Math.sin(angle) * radius * 0.5;
      ctx.beginPath();
      ctx.arc(dx, dy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
}

// Draw grass texture
function drawGrassTexture(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  seed: number = 0
) {
  // Base grass color
  ctx.fillStyle = COLORS.grassMid;
  ctx.fillRect(x, y, width, height);

  // Grass pattern - small strokes
  const density = 0.15;
  const numBlades = Math.floor(width * height * density / 100);
  
  ctx.strokeStyle = COLORS.grassDark;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';

  // Use seed for consistent pattern
  const pseudoRandom = (i: number) => {
    const x = Math.sin(seed + i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };

  for (let i = 0; i < numBlades; i++) {
    const bx = x + pseudoRandom(i) * width;
    const by = y + pseudoRandom(i + 1000) * height;
    const length = 4 + pseudoRandom(i + 2000) * 6;
    const angle = -Math.PI / 2 + (pseudoRandom(i + 3000) - 0.5) * 0.8;

    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(angle) * length, by + Math.sin(angle) * length);
    ctx.stroke();
  }

  // Light grass highlights
  ctx.strokeStyle = COLORS.grassLight;
  ctx.lineWidth = 1;
  
  for (let i = 0; i < numBlades / 3; i++) {
    const bx = x + pseudoRandom(i + 5000) * width;
    const by = y + pseudoRandom(i + 6000) * height;
    const length = 3 + pseudoRandom(i + 7000) * 4;
    const angle = -Math.PI / 2 + (pseudoRandom(i + 8000) - 0.5) * 0.6;

    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(angle) * length, by + Math.sin(angle) * length);
    ctx.stroke();
  }
}

// Draw cartoon wall with 3D effect
function drawCartoonWall(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  thickness: number
) {
  const angle = Math.atan2(endY - startY, endX - startX);
  const perpX = Math.cos(angle + Math.PI / 2);
  const perpY = Math.sin(angle + Math.PI / 2);
  const halfThick = thickness / 2;

  // Shadow
  ctx.fillStyle = COLORS.shadow;
  ctx.beginPath();
  ctx.moveTo(startX - perpX * halfThick + 4, startY - perpY * halfThick + 4);
  ctx.lineTo(endX - perpX * halfThick + 4, endY - perpY * halfThick + 4);
  ctx.lineTo(endX + perpX * halfThick + 4, endY + perpY * halfThick + 4);
  ctx.lineTo(startX + perpX * halfThick + 4, startY + perpY * halfThick + 4);
  ctx.closePath();
  ctx.fill();

  // Main wall
  ctx.fillStyle = COLORS.wallLight;
  ctx.beginPath();
  ctx.moveTo(startX - perpX * halfThick, startY - perpY * halfThick);
  ctx.lineTo(endX - perpX * halfThick, endY - perpY * halfThick);
  ctx.lineTo(endX + perpX * halfThick, endY + perpY * halfThick);
  ctx.lineTo(startX + perpX * halfThick, startY + perpY * halfThick);
  ctx.closePath();
  ctx.fill();

  // Dark edge (3D effect)
  ctx.fillStyle = COLORS.wallDark;
  ctx.beginPath();
  ctx.moveTo(startX + perpX * halfThick, startY + perpY * halfThick);
  ctx.lineTo(endX + perpX * halfThick, endY + perpY * halfThick);
  ctx.lineTo(endX + perpX * halfThick - 3, endY + perpY * halfThick - 3);
  ctx.lineTo(startX + perpX * halfThick - 3, startY + perpY * halfThick - 3);
  ctx.closePath();
  ctx.fill();

  // Cartoon outline
  ctx.strokeStyle = COLORS.wallStroke;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(startX - perpX * halfThick, startY - perpY * halfThick);
  ctx.lineTo(endX - perpX * halfThick, endY - perpY * halfThick);
  ctx.lineTo(endX + perpX * halfThick, endY + perpY * halfThick);
  ctx.lineTo(startX + perpX * halfThick, startY + perpY * halfThick);
  ctx.closePath();
  ctx.stroke();
}

export default function GameCanvas({
  level,
  playerColor,
  playerName,
  playerId,
  onShot,
  onHoleComplete,
  onBallUpdate,
  otherPlayers,
  currentStrokes,
  hasFinishedHole,
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
            radius: 10,
          }));

        const result = updateBall(currentBall, level, windmillAngles, movingWallOffsets, otherBalls);
        
        setBallRotation(prev => getBallRotation(result.ball, prev));

        // Broadcast collided ball updates
        if (result.collidedBalls.length > 0) {
          result.collidedBalls.forEach(collidedBall => {
            // The collision physics already updated the other ball
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
  }, [isRolling, scored, level, windmillAngles, movingWallOffsets, strokes, onHoleComplete, onBallUpdate, otherPlayers]);

  // Draw the game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with sky color
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grass background for the course
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(level.walls[0].start.x, level.walls[0].start.y);
    level.walls.forEach(wall => {
      ctx.lineTo(wall.end.x, wall.end.y);
    });
    ctx.closePath();
    ctx.clip();
    
    // Draw grass texture
    drawGrassTexture(ctx, 0, 0, canvas.width, canvas.height, level.id);
    
    ctx.restore();

    // Draw obstacles
    level.obstacles.forEach((obstacle, index) => {
      if (obstacle.type === 'sand') {
        const rect = obstacle.shape as Rectangle;
        
        // Shadow
        ctx.fillStyle = COLORS.shadow;
        ctx.fillRect(rect.x + 3, rect.y + 3, rect.width, rect.height);
        
        // Sand base
        ctx.fillStyle = COLORS.sand;
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        
        // Sand texture dots
        ctx.fillStyle = COLORS.sandDark;
        for (let i = 0; i < 30; i++) {
          const sx = rect.x + Math.random() * rect.width;
          const sy = rect.y + Math.random() * rect.height;
          ctx.beginPath();
          ctx.arc(sx, sy, 1 + Math.random() * 2, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Cartoon outline
        ctx.strokeStyle = '#a08060';
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      }
      
      if (obstacle.type === 'water') {
        const rect = obstacle.shape as Rectangle;
        const time = Date.now() / 1000;
        
        // Water base
        ctx.fillStyle = COLORS.water;
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        
        // Animated waves
        ctx.strokeStyle = COLORS.waterDark;
        ctx.lineWidth = 2;
        for (let y = rect.y + 10; y < rect.y + rect.height; y += 12) {
          ctx.beginPath();
          ctx.moveTo(rect.x, y);
          for (let x = rect.x; x < rect.x + rect.width; x += 5) {
            ctx.lineTo(x, y + Math.sin((x / 20) + time * 3) * 3);
          }
          ctx.stroke();
        }
        
        // Sparkles
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        for (let i = 0; i < 5; i++) {
          const sx = rect.x + 20 + ((i * 37 + time * 50) % (rect.width - 40));
          const sy = rect.y + 10 + ((i * 23 + time * 30) % (rect.height - 20));
          ctx.beginPath();
          ctx.arc(sx, sy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Cartoon outline
        ctx.strokeStyle = '#1e40af';
        ctx.lineWidth = 3;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      }
      
      if (obstacle.type === 'ramp') {
        const rect = obstacle.shape as Rectangle;
        
        // Shadow
        ctx.fillStyle = COLORS.shadow;
        ctx.fillRect(rect.x + 3, rect.y + 3, rect.width, rect.height);
        
        // Wood planks
        ctx.fillStyle = '#a0522d';
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        
        // Plank lines
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 2;
        for (let y = rect.y + 8; y < rect.y + rect.height; y += 12) {
          ctx.beginPath();
          ctx.moveTo(rect.x, y);
          ctx.lineTo(rect.x + rect.width, y);
          ctx.stroke();
        }
        
        // Outline
        ctx.strokeStyle = '#5d3a1a';
        ctx.lineWidth = 3;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      }
      
      if (obstacle.type === 'bumper') {
        const circle = obstacle.shape as Circle;
        
        // Shadow
        ctx.fillStyle = COLORS.shadow;
        ctx.beginPath();
        ctx.arc(circle.x + 4, circle.y + 4, circle.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Bumper gradient
        const bumperGrad = ctx.createRadialGradient(
          circle.x - circle.radius * 0.3, circle.y - circle.radius * 0.3, 0,
          circle.x, circle.y, circle.radius
        );
        bumperGrad.addColorStop(0, '#ff6b9d');
        bumperGrad.addColorStop(0.5, '#e91e63');
        bumperGrad.addColorStop(1, '#ad1457');
        
        ctx.fillStyle = bumperGrad;
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Cartoon outline
        ctx.strokeStyle = '#880e4f';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Shine
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.ellipse(circle.x - circle.radius * 0.3, circle.y - circle.radius * 0.3, 
                    circle.radius * 0.3, circle.radius * 0.15, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      }
      
      if (obstacle.type === 'windmill') {
        const circle = obstacle.shape as Circle;
        const angle = windmillAngles.get(index) || 0;
        
        // Shadow
        ctx.fillStyle = COLORS.shadow;
        ctx.beginPath();
        ctx.arc(circle.x + 4, circle.y + 4, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Hub
        const hubGrad = ctx.createRadialGradient(
          circle.x - 4, circle.y - 4, 0,
          circle.x, circle.y, 15
        );
        hubGrad.addColorStop(0, '#90a4ae');
        hubGrad.addColorStop(1, '#546e7a');
        ctx.fillStyle = hubGrad;
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#37474f';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Blades with cartoon style
        for (let i = 0; i < 4; i++) {
          const bladeAngle = angle + (i * Math.PI / 2);
          ctx.save();
          ctx.translate(circle.x, circle.y);
          ctx.rotate(bladeAngle);
          
          // Blade shadow
          ctx.fillStyle = COLORS.shadow;
          ctx.fillRect(-5 + 2, 2 + 2, 10, circle.radius);
          
          // Blade
          const bladeGrad = ctx.createLinearGradient(-5, 0, 5, 0);
          bladeGrad.addColorStop(0, '#b0bec5');
          bladeGrad.addColorStop(0.5, '#eceff1');
          bladeGrad.addColorStop(1, '#78909c');
          ctx.fillStyle = bladeGrad;
          ctx.fillRect(-5, 0, 10, circle.radius);
          
          // Blade outline
          ctx.strokeStyle = '#455a64';
          ctx.lineWidth = 2;
          ctx.strokeRect(-5, 0, 10, circle.radius);
          
          ctx.restore();
        }
        
        // Center bolt
        ctx.fillStyle = '#37474f';
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      
      if (obstacle.type === 'moving-wall') {
        const rect = obstacle.shape as Rectangle;
        const offset = movingWallOffsets.get(index) || 0;
        
        // Shadow
        ctx.fillStyle = COLORS.shadow;
        ctx.fillRect(rect.x + 3, rect.y + offset + 3, rect.width, rect.height);
        
        // Warning stripes
        ctx.fillStyle = '#ffc107';
        ctx.fillRect(rect.x, rect.y + offset, rect.width, rect.height);
        
        ctx.fillStyle = '#212121';
        const stripeHeight = 10;
        for (let y = rect.y + offset; y < rect.y + offset + rect.height; y += stripeHeight * 2) {
          ctx.fillRect(rect.x, y, rect.width, stripeHeight);
        }
        
        // Outline
        ctx.strokeStyle = '#f57f17';
        ctx.lineWidth = 3;
        ctx.strokeRect(rect.x, rect.y + offset, rect.width, rect.height);
      }
      
      if (obstacle.type === 'teleporter') {
        const circle = obstacle.shape as Circle;
        const time = Date.now() / 1000;
        
        // Outer glow pulse
        const pulseSize = circle.radius + 8 + Math.sin(time * 4) * 5;
        const glowGrad = ctx.createRadialGradient(
          circle.x, circle.y, circle.radius,
          circle.x, circle.y, pulseSize
        );
        glowGrad.addColorStop(0, 'rgba(156, 39, 176, 0.8)');
        glowGrad.addColorStop(1, 'rgba(156, 39, 176, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Portal base
        const portalGrad = ctx.createRadialGradient(
          circle.x, circle.y, 0,
          circle.x, circle.y, circle.radius
        );
        portalGrad.addColorStop(0, '#e1bee7');
        portalGrad.addColorStop(0.5, '#9c27b0');
        portalGrad.addColorStop(1, '#4a148c');
        ctx.fillStyle = portalGrad;
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Swirl effect
        ctx.strokeStyle = '#e1bee7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 3; a += 0.2) {
          const r = (a / (Math.PI * 3)) * (circle.radius - 3);
          const sx = circle.x + Math.cos(a + time * 3) * r;
          const sy = circle.y + Math.sin(a + time * 3) * r;
          if (a === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
        
        // Outline
        ctx.strokeStyle = '#7b1fa2';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Draw walls with cartoon style
    level.walls.forEach(wall => {
      drawCartoonWall(ctx, wall.start.x, wall.start.y, wall.end.x, wall.end.y, wall.thickness);
    });

    // Draw hole with 3D effect
    // Hole shadow/depth
    const holeGrad = ctx.createRadialGradient(
      level.hole.position.x, level.hole.position.y, 0,
      level.hole.position.x, level.hole.position.y, level.hole.radius + 5
    );
    holeGrad.addColorStop(0, '#000000');
    holeGrad.addColorStop(0.7, '#1a1a1a');
    holeGrad.addColorStop(1, '#333333');
    
    ctx.fillStyle = holeGrad;
    ctx.beginPath();
    ctx.arc(level.hole.position.x, level.hole.position.y, level.hole.radius + 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Hole rim
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(level.hole.position.x, level.hole.position.y, level.hole.radius + 2, 0, Math.PI * 2);
    ctx.stroke();
    
    // Flag
    if (!scored) {
      // Flag pole shadow
      ctx.fillStyle = COLORS.shadow;
      ctx.fillRect(level.hole.position.x + 5, level.hole.position.y - 38, 3, 42);
      
      // Flag pole
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(level.hole.position.x + 2, level.hole.position.y - 40, 3, 44);
      
      // Flag
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.moveTo(level.hole.position.x + 5, level.hole.position.y - 40);
      ctx.lineTo(level.hole.position.x + 30, level.hole.position.y - 32);
      ctx.lineTo(level.hole.position.x + 5, level.hole.position.y - 24);
      ctx.closePath();
      ctx.fill();
      
      // Flag outline
      ctx.strokeStyle = '#b71c1c';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Flag shine
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.moveTo(level.hole.position.x + 8, level.hole.position.y - 38);
      ctx.lineTo(level.hole.position.x + 20, level.hole.position.y - 34);
      ctx.lineTo(level.hole.position.x + 8, level.hole.position.y - 30);
      ctx.closePath();
      ctx.fill();
    }

    // Draw tee marker
    ctx.fillStyle = COLORS.shadow;
    ctx.beginPath();
    ctx.arc(level.tee.x + 2, level.tee.y + 2, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(level.tee.x, level.tee.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw other players' balls
    otherPlayers.forEach(player => {
      if (player.hasFinished) return;
      
      const speed = Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2);
      draw3DBall(ctx, player.odosition.x, player.odosition.y, 10, player.color, 0, speed > 0.5);
      
      // Name tag with cartoon style
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      const textWidth = ctx.measureText(player.name).width;
      
      // Rounded rect for name
      const tagX = player.odosition.x - textWidth / 2 - 6;
      const tagY = player.odosition.y - 30;
      const tagW = textWidth + 12;
      const tagH = 16;
      
      ctx.beginPath();
      ctx.roundRect(tagX, tagY, tagW, tagH, 4);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px "DM Sans"';
      ctx.textAlign = 'center';
      ctx.fillText(player.name, player.odosition.x, player.odosition.y - 19);
    });

    // Draw my ball
    if (!scored) {
      const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
      draw3DBall(ctx, ball.position.x, ball.position.y, ball.radius, playerColor, ballRotation, speed > 0.5 || isRolling);
    }

    // Draw aim line with cartoon style
    if (isAiming && aimStart && aimEnd && !isRolling && !scored) {
      const dx = aimStart.x - aimEnd.x;
      const dy = aimStart.y - aimEnd.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const power = Math.min(distance / 150, 1);
      const angle = Math.atan2(dy, dx);
      const displayDist = Math.min(distance, 150);
      
      // Dotted trajectory line
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = playerColor;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ball.position.x, ball.position.y);
      ctx.lineTo(
        ball.position.x + Math.cos(angle) * displayDist,
        ball.position.y + Math.sin(angle) * displayDist
      );
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Arrow head
      if (displayDist > 30) {
        const arrowX = ball.position.x + Math.cos(angle) * displayDist;
        const arrowY = ball.position.y + Math.sin(angle) * displayDist;
        
        ctx.fillStyle = playerColor;
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - Math.cos(angle - 0.4) * 18, arrowY - Math.sin(angle - 0.4) * 18);
        ctx.lineTo(arrowX - Math.cos(angle) * 10, arrowY - Math.sin(angle) * 10);
        ctx.lineTo(arrowX - Math.cos(angle + 0.4) * 18, arrowY - Math.sin(angle + 0.4) * 18);
        ctx.closePath();
        ctx.fill();
      }
      
      // Power meter (cartoon style)
      const barX = 20;
      const barY = 540;
      const barW = 120;
      const barH = 16;
      
      // Background
      ctx.fillStyle = '#2d3748';
      ctx.beginPath();
      ctx.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 6);
      ctx.fill();
      
      // Power gradient
      const powerGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
      powerGrad.addColorStop(0, '#4ade80');
      powerGrad.addColorStop(0.5, '#fbbf24');
      powerGrad.addColorStop(1, '#ef4444');
      
      ctx.fillStyle = powerGrad;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW * power, barH, 4);
      ctx.fill();
      
      // Outline
      ctx.strokeStyle = '#1a202c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 4);
      ctx.stroke();
      
      // Power text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "DM Sans"';
      ctx.textAlign = 'left';
      ctx.fillText(`${Math.round(power * 100)}%`, barX + barW + 10, barY + 12);
    }

    // Splash effect
    if (showSplash) {
      for (let i = 0; i < 12; i++) {
        const splashAngle = (i / 12) * Math.PI * 2;
        const splashDist = 15 + Math.random() * 20;
        const splashSize = 3 + Math.random() * 4;
        
        ctx.fillStyle = i % 2 === 0 ? COLORS.water : '#ffffff';
        ctx.beginPath();
        ctx.arc(
          ball.position.x + Math.cos(splashAngle) * splashDist,
          ball.position.y + Math.sin(splashAngle) * splashDist,
          splashSize,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    // Scored celebration
    if (scored) {
      // Confetti
      for (let i = 0; i < 20; i++) {
        const confettiAngle = (i / 20) * Math.PI * 2 + Date.now() / 300;
        const confettiDist = 30 + Math.sin(Date.now() / 150 + i) * 20;
        const colors = ['#ff1744', '#ffc107', '#4caf50', '#2196f3', '#9c27b0'];
        
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.arc(
          level.hole.position.x + Math.cos(confettiAngle) * confettiDist,
          level.hole.position.y + Math.sin(confettiAngle) * confettiDist,
          4,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      
      // "HOLE IN!" text with cartoon style
      ctx.font = 'bold 36px "DM Sans"';
      ctx.textAlign = 'center';
      
      // Text shadow
      ctx.fillStyle = '#000000';
      ctx.fillText('HOLE!', level.hole.position.x + 3, level.hole.position.y - 50 + 3);
      
      // Text gradient
      const textGrad = ctx.createLinearGradient(
        level.hole.position.x - 60, level.hole.position.y - 70,
        level.hole.position.x + 60, level.hole.position.y - 30
      );
      textGrad.addColorStop(0, '#ffd700');
      textGrad.addColorStop(0.5, '#ffeb3b');
      textGrad.addColorStop(1, '#ffc107');
      ctx.fillStyle = textGrad;
      ctx.fillText('HOLE!', level.hole.position.x, level.hole.position.y - 50);
      
      // Text outline
      ctx.strokeStyle = '#ff6f00';
      ctx.lineWidth = 2;
      ctx.strokeText('HOLE!', level.hole.position.x, level.hole.position.y - 50);
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
    
    const coords = getCanvasCoords(e);
    setIsAiming(true);
    setAimStart(coords);
    setAimEnd(coords);
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
    const power = Math.min(distance / 150, 1); // Normalized 0-1
    const angle = Math.atan2(dy, dx);
    
    if (power > 0.08) { // Minimum threshold
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
            Drag anywhere to aim • Release to shoot
          </div>
        )}
        {isRolling && (
          <div className={styles.rolling}>Rolling...</div>
        )}
        {scored && (
          <div className={styles.scored}>Waiting for other players...</div>
        )}
      </div>
    </div>
  );
}
