'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Matter from 'matter-js';
import { Level, Obstacle } from '@/lib/levels';
import { Player, BallState } from '@/lib/types';

interface GameCanvasProps {
  level: Level;
  players: Player[];
  currentPlayerId: string;
  isMyTurn: boolean;
  onShoot: (power: number, angle: number) => void;
  onBallUpdate: (state: BallState) => void;
  onHoleComplete: (strokes: number) => void;
  otherBallStates: Map<string, BallState>;
  currentStrokes: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const BALL_RADIUS = 12;
const HOLE_RADIUS = 18;
const MAX_POWER = 25;

export default function GameCanvas({
  level,
  players,
  currentPlayerId,
  isMyTurn,
  onShoot,
  onBallUpdate,
  onHoleComplete,
  otherBallStates,
  currentStrokes,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const ballRef = useRef<Matter.Body | null>(null);
  const animationRef = useRef<number>(0);
  const obstaclesRef = useRef<Matter.Body[]>([]);
  const windmillsRef = useRef<{ body: Matter.Body; obstacle: Obstacle; angle: number }[]>([]);
  const movingWallsRef = useRef<{ body: Matter.Body; obstacle: Obstacle; originalY: number; direction: number }[]>([]);
  const teleportersRef = useRef<Obstacle[]>([]);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragEnd, setDragEnd] = useState({ x: 0, y: 0 });
  const [ballMoving, setBallMoving] = useState(false);
  const [hasCompletedHole, setHasCompletedHole] = useState(false);
  const [showHoleAnimation, setShowHoleAnimation] = useState(false);
  
  const inWaterRef = useRef(false);
  const lastValidPositionRef = useRef({ x: level.ball.x, y: level.ball.y });

  // Store state in refs for game loop access
  const stateRef = useRef({
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    dragEnd: { x: 0, y: 0 },
    hasCompletedHole: false,
    showHoleAnimation: false,
    currentStrokes: 0,
  });

  // Update refs when state changes
  useEffect(() => {
    stateRef.current.isDragging = isDragging;
    stateRef.current.dragStart = dragStart;
    stateRef.current.dragEnd = dragEnd;
    stateRef.current.hasCompletedHole = hasCompletedHole;
    stateRef.current.showHoleAnimation = showHoleAnimation;
    stateRef.current.currentStrokes = currentStrokes;
  }, [isDragging, dragStart, dragEnd, hasCompletedHole, showHoleAnimation, currentStrokes]);

  // Initialize physics engine
  useEffect(() => {
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 },
    });
    engineRef.current = engine;

    // Create ball
    const ball = Matter.Bodies.circle(level.ball.x, level.ball.y, BALL_RADIUS, {
      restitution: 0.7,
      friction: 0.05,
      frictionAir: 0.02,
      label: 'ball',
    });
    ballRef.current = ball;
    Matter.Composite.add(engine.world, ball);

    // Create obstacles
    const bodies: Matter.Body[] = [];
    const windmills: typeof windmillsRef.current = [];
    const movingWalls: typeof movingWallsRef.current = [];
    const teleporters: Obstacle[] = [];

    level.obstacles.forEach((obs) => {
      if (obs.type === 'wall') {
        const wall = Matter.Bodies.rectangle(obs.x, obs.y, obs.width!, obs.height!, {
          isStatic: true,
          restitution: 0.8,
          label: 'wall',
        });
        bodies.push(wall);
        Matter.Composite.add(engine.world, wall);
      } else if (obs.type === 'bumper') {
        const bumper = Matter.Bodies.circle(obs.x, obs.y, obs.radius!, {
          isStatic: true,
          restitution: 1.5,
          label: 'bumper',
        });
        bodies.push(bumper);
        Matter.Composite.add(engine.world, bumper);
      } else if (obs.type === 'windmill') {
        const windmill = Matter.Bodies.rectangle(obs.x, obs.y, obs.width!, obs.height!, {
          isStatic: true,
          restitution: 0.8,
          label: 'windmill',
        });
        windmills.push({ body: windmill, obstacle: obs, angle: 0 });
        bodies.push(windmill);
        Matter.Composite.add(engine.world, windmill);
      } else if (obs.type === 'moving-wall') {
        const wall = Matter.Bodies.rectangle(obs.x, obs.y, obs.width!, obs.height!, {
          isStatic: true,
          restitution: 0.8,
          label: 'moving-wall',
        });
        movingWalls.push({ body: wall, obstacle: obs, originalY: obs.y, direction: 1 });
        bodies.push(wall);
        Matter.Composite.add(engine.world, wall);
      } else if (obs.type === 'teleporter') {
        teleporters.push(obs);
      }
    });

    obstaclesRef.current = bodies;
    windmillsRef.current = windmills;
    movingWallsRef.current = movingWalls;
    teleportersRef.current = teleporters;
    lastValidPositionRef.current = { x: level.ball.x, y: level.ball.y };
    inWaterRef.current = false;

    // Reset state for new level
    setHasCompletedHole(false);
    setShowHoleAnimation(false);
    setBallMoving(false);

    return () => {
      Matter.Engine.clear(engine);
      cancelAnimationFrame(animationRef.current);
    };
  }, [level]);

  // Game loop
  useEffect(() => {
    if (!engineRef.current || !ballRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const engine = engineRef.current;
    const ball = ballRef.current;

    let lastTime = performance.now();

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Update physics
      Matter.Engine.update(engine, deltaTime);

      // Update windmills
      windmillsRef.current.forEach((wm) => {
        wm.angle += wm.obstacle.speed || 0.02;
        Matter.Body.setAngle(wm.body, wm.angle);
      });

      // Update moving walls
      movingWallsRef.current.forEach((mw) => {
        const speed = mw.obstacle.speed || 2;
        const newY = mw.body.position.y + speed * mw.direction;
        
        if (newY > mw.originalY + 100 || newY < mw.originalY - 100) {
          mw.direction *= -1;
        }
        
        Matter.Body.setPosition(mw.body, { x: mw.body.position.x, y: newY });
      });

      // Check ball velocity
      const speed = Math.sqrt(ball.velocity.x ** 2 + ball.velocity.y ** 2);
      const isMoving = speed > 0.1;
      setBallMoving(isMoving);

      // Apply friction for sand
      const sandAreas = level.obstacles.filter(o => o.type === 'sand');
      sandAreas.forEach((sand) => {
        if (
          ball.position.x > sand.x - sand.width! / 2 &&
          ball.position.x < sand.x + sand.width! / 2 &&
          ball.position.y > sand.y - sand.height! / 2 &&
          ball.position.y < sand.y + sand.height! / 2
        ) {
          Matter.Body.setVelocity(ball, {
            x: ball.velocity.x * 0.95,
            y: ball.velocity.y * 0.95,
          });
        }
      });

      // Check water hazard
      const waterAreas = level.obstacles.filter(o => o.type === 'water');
      waterAreas.forEach((water) => {
        if (
          ball.position.x > water.x - water.width! / 2 &&
          ball.position.x < water.x + water.width! / 2 &&
          ball.position.y > water.y - water.height! / 2 &&
          ball.position.y < water.y + water.height! / 2
        ) {
          if (!inWaterRef.current) {
            inWaterRef.current = true;
            // Reset to last valid position
            setTimeout(() => {
              Matter.Body.setPosition(ball, lastValidPositionRef.current);
              Matter.Body.setVelocity(ball, { x: 0, y: 0 });
              inWaterRef.current = false;
            }, 500);
          }
        }
      });

      // Check teleporters
      if (!isMoving || speed < 5) {
        teleportersRef.current.forEach((teleporter) => {
          const dist = Math.sqrt(
            (ball.position.x - teleporter.x) ** 2 +
            (ball.position.y - teleporter.y) ** 2
          );
          if (dist < (teleporter.radius || 30) && teleporter.linkedTo !== undefined) {
            const linkedTeleporter = teleportersRef.current[teleporter.linkedTo];
            if (linkedTeleporter) {
              Matter.Body.setPosition(ball, { x: linkedTeleporter.x, y: linkedTeleporter.y });
              Matter.Body.setVelocity(ball, {
                x: ball.velocity.x * 0.5,
                y: ball.velocity.y * 0.5,
              });
            }
          }
        });
      }

      // Store last valid position when not in hazard
      if (!inWaterRef.current && isMoving) {
        lastValidPositionRef.current = { x: ball.position.x, y: ball.position.y };
      }

      // Check if ball is in hole
      const distToHole = Math.sqrt(
        (ball.position.x - level.hole.x) ** 2 +
        (ball.position.y - level.hole.y) ** 2
      );

      if (distToHole < HOLE_RADIUS && speed < 5 && !stateRef.current.hasCompletedHole) {
        setHasCompletedHole(true);
        setShowHoleAnimation(true);
        Matter.Body.setVelocity(ball, { x: 0, y: 0 });
        
        setTimeout(() => {
          onHoleComplete(stateRef.current.currentStrokes);
        }, 1000);
      }

      // Update other players about ball position
      if (isMoving) {
        onBallUpdate({
          x: ball.position.x,
          y: ball.position.y,
          vx: ball.velocity.x,
          vy: ball.velocity.y,
          isMoving,
        });
      }

      // === RENDER ===
      // Clear canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw background based on theme
      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      if (level.theme === 'desert') {
        gradient.addColorStop(0, '#f4d03f');
        gradient.addColorStop(1, '#c27c0e');
      } else if (level.theme === 'ice') {
        gradient.addColorStop(0, '#a8d8ea');
        gradient.addColorStop(1, '#81b1ce');
      } else if (level.theme === 'space') {
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
          const starX = (i * 73) % CANVAS_WIDTH;
          const starY = (i * 37) % CANVAS_HEIGHT;
          ctx.beginPath();
          ctx.arc(starX, starY, Math.random() * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        gradient.addColorStop(0, '#4a8c3f');
        gradient.addColorStop(1, '#2d5a27');
      }
      
      if (level.theme !== 'space') {
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      // Draw grass pattern for grass theme
      if (level.theme === 'grass' || !level.theme) {
        ctx.strokeStyle = 'rgba(45, 90, 39, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < CANVAS_WIDTH; i += 20) {
          for (let j = 0; j < CANVAS_HEIGHT; j += 20) {
            ctx.beginPath();
            ctx.moveTo(i, j);
            ctx.lineTo(i + 5, j - 8);
            ctx.stroke();
          }
        }
      }

      // Draw obstacles
      level.obstacles.forEach((obs) => {
        if (obs.type === 'water') {
          const time = Date.now() / 1000;
          ctx.fillStyle = '#3b8bbd';
          ctx.fillRect(obs.x - obs.width! / 2, obs.y - obs.height! / 2, obs.width!, obs.height!);
          
          ctx.fillStyle = 'rgba(107, 197, 240, 0.5)';
          for (let i = 0; i < obs.width!; i += 30) {
            const waveY = Math.sin(time * 2 + i * 0.1) * 5;
            ctx.beginPath();
            ctx.arc(obs.x - obs.width! / 2 + i + 15, obs.y + waveY, 10, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (obs.type === 'sand') {
          ctx.fillStyle = obs.color || '#e8d4a8';
          ctx.fillRect(obs.x - obs.width! / 2, obs.y - obs.height! / 2, obs.width!, obs.height!);
          
          ctx.fillStyle = 'rgba(200, 180, 140, 0.5)';
          for (let i = 0; i < 20; i++) {
            const dotX = obs.x - obs.width! / 2 + Math.random() * obs.width!;
            const dotY = obs.y - obs.height! / 2 + Math.random() * obs.height!;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (obs.type === 'teleporter') {
          const time = Date.now() / 500;
          const radius = obs.radius || 30;
          
          ctx.save();
          ctx.translate(obs.x, obs.y);
          ctx.rotate(time);
          
          const teleGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
          teleGradient.addColorStop(0, obs.color || '#9b59b6');
          teleGradient.addColorStop(0.5, 'rgba(155, 89, 182, 0.5)');
          teleGradient.addColorStop(1, 'rgba(155, 89, 182, 0)');
          
          ctx.fillStyle = teleGradient;
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 0; i < Math.PI * 4; i += 0.1) {
            const r = (i / (Math.PI * 4)) * radius;
            const spiralX = Math.cos(i) * r;
            const spiralY = Math.sin(i) * r;
            if (i === 0) ctx.moveTo(spiralX, spiralY);
            else ctx.lineTo(spiralX, spiralY);
          }
          ctx.stroke();
          ctx.restore();
        } else if (obs.type === 'bumper') {
          const radius = obs.radius || 25;
          
          ctx.shadowColor = '#ff6b6b';
          ctx.shadowBlur = 20;
          
          const bumperGradient = ctx.createRadialGradient(
            obs.x - radius / 3, obs.y - radius / 3, 0,
            obs.x, obs.y, radius
          );
          bumperGradient.addColorStop(0, '#ff9999');
          bumperGradient.addColorStop(1, '#ff6b6b');
          
          ctx.fillStyle = bumperGradient;
          ctx.beginPath();
          ctx.arc(obs.x, obs.y, radius, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.shadowBlur = 0;
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(obs.x - radius / 3, obs.y - radius / 3, radius / 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw walls from physics bodies
      obstaclesRef.current.forEach((body) => {
        if (body.label === 'wall' || body.label === 'moving-wall') {
          ctx.save();
          ctx.translate(body.position.x, body.position.y);
          ctx.rotate(body.angle);
          
          const width = (body.bounds.max.x - body.bounds.min.x);
          const height = (body.bounds.max.y - body.bounds.min.y);
          
          const wallGradient = ctx.createLinearGradient(-width/2, 0, width/2, 0);
          wallGradient.addColorStop(0, '#8b4513');
          wallGradient.addColorStop(0.5, '#a0522d');
          wallGradient.addColorStop(1, '#8b4513');
          
          ctx.fillStyle = wallGradient;
          ctx.fillRect(-width / 2, -height / 2, width, height);
          
          ctx.strokeStyle = 'rgba(139, 69, 19, 0.5)';
          ctx.lineWidth = 1;
          for (let i = -width/2; i < width/2; i += 8) {
            ctx.beginPath();
            ctx.moveTo(i, -height/2);
            ctx.lineTo(i, height/2);
            ctx.stroke();
          }
          
          ctx.restore();
        } else if (body.label === 'windmill') {
          ctx.save();
          ctx.translate(body.position.x, body.position.y);
          ctx.rotate(body.angle);
          
          const width = (body.bounds.max.x - body.bounds.min.x);
          const height = (body.bounds.max.y - body.bounds.min.y);
          
          ctx.fillStyle = '#e74c3c';
          ctx.fillRect(-width / 2, -height / 2, width, height);
          
          ctx.restore();
          
          ctx.fillStyle = '#2c3e50';
          ctx.beginPath();
          ctx.arc(body.position.x, body.position.y, 15, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw hole
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(level.hole.x, level.hole.y, HOLE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw flag
      const flagPoleHeight = 50;
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(level.hole.x - 2, level.hole.y - flagPoleHeight, 4, flagPoleHeight);
      
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.moveTo(level.hole.x + 2, level.hole.y - flagPoleHeight);
      ctx.lineTo(level.hole.x + 30, level.hole.y - flagPoleHeight + 12);
      ctx.lineTo(level.hole.x + 2, level.hole.y - flagPoleHeight + 24);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Fredoka';
      ctx.textAlign = 'center';
      ctx.fillText(String(level.id), level.hole.x + 14, level.hole.y - flagPoleHeight + 16);

      // Draw other players' balls
      otherBallStates.forEach((state, odPlayerId) => {
        if (odPlayerId !== currentPlayerId) {
          const player = players.find(p => p.id === odPlayerId);
          if (player && !player.hasCompletedHole) {
            ctx.fillStyle = player.color;
            ctx.beginPath();
            ctx.arc(state.x, state.y, BALL_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.arc(state.x - 3, state.y - 3, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // Draw current player's ball
      if (!stateRef.current.hasCompletedHole) {
        const currentPlayer = players.find(p => p.id === currentPlayerId);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(ball.position.x + 3, ball.position.y + 3, BALL_RADIUS, BALL_RADIUS * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const ballGradient = ctx.createRadialGradient(
          ball.position.x - 3, ball.position.y - 3, 0,
          ball.position.x, ball.position.y, BALL_RADIUS
        );
        ballGradient.addColorStop(0, 'white');
        ballGradient.addColorStop(1, currentPlayer?.color || '#f5f5f5');
        
        ctx.fillStyle = ballGradient;
        ctx.beginPath();
        ctx.arc(ball.position.x, ball.position.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(ball.position.x - 4, ball.position.y - 4, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw aiming line
      if (stateRef.current.isDragging && isMyTurn && !ballMoving && !stateRef.current.hasCompletedHole) {
        const dx = stateRef.current.dragStart.x - stateRef.current.dragEnd.x;
        const dy = stateRef.current.dragStart.y - stateRef.current.dragEnd.y;
        const distance = Math.min(Math.sqrt(dx * dx + dy * dy), MAX_POWER * 8);
        const power = distance / 8;
        
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + power / MAX_POWER * 0.5})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(ball.position.x, ball.position.y);
        ctx.lineTo(ball.position.x + dx, ball.position.y + dy);
        ctx.stroke();
        ctx.setLineDash([]);
        
        const dotCount = Math.floor(power / 3);
        for (let i = 1; i <= dotCount; i++) {
          const t = i / (MAX_POWER / 3);
          ctx.fillStyle = `hsl(${120 - power * 4}, 70%, 50%)`;
          ctx.beginPath();
          ctx.arc(ball.position.x + (dx * t * 0.8), ball.position.y + (dy * t * 0.8), 4, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(20, CANVAS_HEIGHT - 40, 150, 20);
        
        const powerColor = `hsl(${120 - power * 4}, 70%, 50%)`;
        ctx.fillStyle = powerColor;
        ctx.fillRect(22, CANVAS_HEIGHT - 38, (power / MAX_POWER) * 146, 16);
        
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, CANVAS_HEIGHT - 40, 150, 20);
      }

      // Hole complete animation
      if (stateRef.current.showHoleAnimation) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        ctx.font = 'bold 48px Fredoka';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#4ecdc4';
        ctx.fillText('HOLE IN!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        
        ctx.font = '24px Outfit';
        ctx.fillStyle = 'white';
        ctx.fillText(`${stateRef.current.currentStrokes} stroke${stateRef.current.currentStrokes !== 1 ? 's' : ''}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [level, players, currentPlayerId, isMyTurn, ballMoving, otherBallStates, onBallUpdate, onHoleComplete]);

  // Mouse/touch handlers
  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isMyTurn || ballMoving || hasCompletedHole) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = (clientX - rect.left) * (CANVAS_WIDTH / rect.width);
    const y = (clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
    
    setIsDragging(true);
    setDragStart({ x, y });
    setDragEnd({ x, y });
  }, [isMyTurn, ballMoving, hasCompletedHole]);

  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = (clientX - rect.left) * (CANVAS_WIDTH / rect.width);
    const y = (clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
    
    setDragEnd({ x, y });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !ballRef.current) return;
    
    const dx = dragStart.x - dragEnd.x;
    const dy = dragStart.y - dragEnd.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 10) {
      const power = Math.min(distance / 8, MAX_POWER);
      const angle = Math.atan2(dy, dx);
      
      Matter.Body.setVelocity(ballRef.current, {
        x: Math.cos(angle) * power,
        y: Math.sin(angle) * power,
      });
      
      onShoot(power, angle);
    }
    
    setIsDragging(false);
  }, [isDragging, dragStart, dragEnd, onShoot]);

  return (
    <div className="game-canvas-container">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        style={{
          cursor: isMyTurn && !ballMoving && !hasCompletedHole ? 'crosshair' : 'default',
          touchAction: 'none',
        }}
      />
      <style jsx>{`
        .game-canvas-container {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
                      inset 0 0 0 4px rgba(255, 255, 255, 0.1);
        }
        
        canvas {
          display: block;
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  );
}
