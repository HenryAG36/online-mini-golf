'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Ball, Level, Vector2D, GameState, Obstacle } from '@/types/game';
import { updateBall, calculateShot, checkHoleCollision, isInWater, magnitude, distance } from '@/lib/physics';

interface GameCanvasProps {
  level: Level;
  balls: Record<string, Ball>;
  currentPlayerId: string;
  myPlayerId: string;
  onShoot: (velocity: Vector2D) => void;
  onBallUpdate: (ball: Ball) => void;
  onHoleComplete: () => void;
  canShoot: boolean;
  gamePhase: string;
}

const THEME_COLORS = {
  grass: { bg: '#2d5a27', fairway: '#3d7a37', accent: '#1a3d15' },
  desert: { bg: '#c4a35a', fairway: '#d4b36a', accent: '#a48940' },
  ice: { bg: '#a8d8ea', fairway: '#b8e8fa', accent: '#88b8ca' },
  space: { bg: '#1a1a2e', fairway: '#16213e', accent: '#0f3460' },
  candy: { bg: '#ff6b9d', fairway: '#ff8fb3', accent: '#c44569' },
  volcano: { bg: '#2c1810', fairway: '#4a2c2a', accent: '#8b4513' },
};

export default function GameCanvas({
  level,
  balls,
  currentPlayerId,
  myPlayerId,
  onShoot,
  onBallUpdate,
  onHoleComplete,
  canShoot,
  gamePhase,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Vector2D | null>(null);
  const [dragEnd, setDragEnd] = useState<Vector2D | null>(null);
  const [scale, setScale] = useState(1);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const localBallRef = useRef<Ball | null>(null);
  const spinnerAngleRef = useRef(0);

  // Calculate scale based on container size
  useEffect(() => {
    const updateScale = () => {
      const container = canvasRef.current?.parentElement;
      if (container) {
        const containerWidth = container.clientWidth - 32;
        const containerHeight = window.innerHeight * 0.6;
        const scaleX = containerWidth / level.bounds.width;
        const scaleY = containerHeight / level.bounds.height;
        setScale(Math.min(scaleX, scaleY, 1.2));
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [level.bounds]);

  // Game loop
  useEffect(() => {
    const myBall = balls[myPlayerId];
    if (myBall && myBall.isMoving) {
      localBallRef.current = myBall;
    }

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = Math.min((timestamp - lastTimeRef.current) / 16, 2);
      lastTimeRef.current = timestamp;

      spinnerAngleRef.current += 0.02;

      if (localBallRef.current?.isMoving) {
        const newBall = updateBall(localBallRef.current, level, deltaTime);
        localBallRef.current = newBall;

        // Check if ball fell in water
        if (isInWater(newBall.position, level.obstacles) && !newBall.isMoving) {
          // Ball stopped in water - this will be handled by parent
        }

        // Check if ball reached hole
        if (checkHoleCollision(newBall, level.hole)) {
          localBallRef.current = {
            ...newBall,
            position: level.hole.position,
            velocity: { x: 0, y: 0 },
            isMoving: false,
          };
          onBallUpdate(localBallRef.current);
          onHoleComplete();
        } else {
          onBallUpdate(newBall);
        }
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [balls, myPlayerId, level, onBallUpdate, onHoleComplete]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const theme = THEME_COLORS[level.theme];

    // Clear and draw background
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background pattern
    drawBackgroundPattern(ctx, level, theme);

    // Draw obstacles
    level.obstacles.forEach(obstacle => drawObstacle(ctx, obstacle, spinnerAngleRef.current));

    // Draw walls
    level.walls.forEach(wall => {
      ctx.strokeStyle = wall.type === 'bouncy' ? '#ff6b6b' : wall.type === 'sticky' ? '#9b59b6' : '#5d4037';
      ctx.lineWidth = wall.type === 'bouncy' ? 6 : 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(wall.start.x, wall.start.y);
      ctx.lineTo(wall.end.x, wall.end.y);
      ctx.stroke();

      // Add wall highlight
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(wall.start.x, wall.start.y - 2);
      ctx.lineTo(wall.end.x, wall.end.y - 2);
      ctx.stroke();
    });

    // Draw hole
    const gradient = ctx.createRadialGradient(
      level.hole.position.x, level.hole.position.y, 0,
      level.hole.position.x, level.hole.position.y, level.hole.radius
    );
    gradient.addColorStop(0, '#000');
    gradient.addColorStop(0.7, '#1a1a1a');
    gradient.addColorStop(1, '#333');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(level.hole.position.x, level.hole.position.y, level.hole.radius, 0, Math.PI * 2);
    ctx.fill();

    // Hole rim
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw flag
    drawFlag(ctx, level.hole.position, level.id);

    // Draw all balls
    Object.entries(balls).forEach(([playerId, ball]) => {
      const currentBall = playerId === myPlayerId && localBallRef.current ? localBallRef.current : ball;
      drawBall(ctx, currentBall, playerId === currentPlayerId);
    });

    // Draw aiming line if dragging
    if (isDragging && dragStart && dragEnd && canShoot && currentPlayerId === myPlayerId) {
      const myBall = localBallRef.current || balls[myPlayerId];
      if (myBall) {
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(myBall.position.x, myBall.position.y);
        
        // Draw in opposite direction of drag
        const dx = dragStart.x - dragEnd.x;
        const dy = dragStart.y - dragEnd.y;
        const power = Math.min(Math.sqrt(dx * dx + dy * dy), 250);
        const angle = Math.atan2(dy, dx);
        
        ctx.lineTo(
          myBall.position.x + Math.cos(angle) * power,
          myBall.position.y + Math.sin(angle) * power
        );
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw power indicator
        const powerPercent = (power / 250) * 100;
        ctx.fillStyle = powerPercent > 70 ? '#ff6b6b' : powerPercent > 40 ? '#ffd93d' : '#6bcb77';
        ctx.font = 'bold 16px Nunito, sans-serif';
        ctx.fillText(`${Math.round(powerPercent)}%`, myBall.position.x + 30, myBall.position.y - 20);
      }
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balls, level, isDragging, dragStart, dragEnd, canShoot, currentPlayerId, myPlayerId]);

  const drawBackgroundPattern = (ctx: CanvasRenderingContext2D, level: Level, theme: any) => {
    // Draw subtle grass/terrain pattern
    ctx.fillStyle = theme.fairway;
    
    for (let x = 0; x < level.bounds.width; x += 30) {
      for (let y = 0; y < level.bounds.height; y += 30) {
        if ((x + y) % 60 === 0) {
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  };

  const drawObstacle = (ctx: CanvasRenderingContext2D, obstacle: Obstacle, spinAngle: number) => {
    const { type, position, size } = obstacle;

    switch (type) {
      case 'bumper':
        const bumperGradient = ctx.createRadialGradient(
          position.x, position.y, 0,
          position.x, position.y, size.x / 2
        );
        bumperGradient.addColorStop(0, '#ff9f43');
        bumperGradient.addColorStop(0.5, '#ee5a24');
        bumperGradient.addColorStop(1, '#c0392b');
        
        ctx.fillStyle = bumperGradient;
        ctx.beginPath();
        ctx.arc(position.x, position.y, size.x / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Shine effect
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(position.x - size.x / 6, position.y - size.y / 6, size.x / 6, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'sand':
        ctx.fillStyle = '#e8d5a3';
        ctx.fillRect(position.x - size.x / 2, position.y - size.y / 2, size.x, size.y);
        
        // Sand texture
        ctx.fillStyle = '#d4c192';
        for (let i = 0; i < 20; i++) {
          const dotX = position.x - size.x / 2 + Math.random() * size.x;
          const dotY = position.y - size.y / 2 + Math.random() * size.y;
          ctx.beginPath();
          ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'water':
        const waterGradient = ctx.createLinearGradient(
          position.x - size.x / 2, position.y - size.y / 2,
          position.x + size.x / 2, position.y + size.y / 2
        );
        waterGradient.addColorStop(0, '#3498db');
        waterGradient.addColorStop(0.5, '#2980b9');
        waterGradient.addColorStop(1, '#1a5276');
        
        ctx.fillStyle = waterGradient;
        ctx.fillRect(position.x - size.x / 2, position.y - size.y / 2, size.x, size.y);
        
        // Water ripples
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(position.x, position.y, 15 + i * 15 + (spinAngle * 5) % 15, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;

      case 'spinner':
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(spinAngle);
        
        // Spinner arms
        ctx.fillStyle = '#9b59b6';
        for (let i = 0; i < 4; i++) {
          ctx.rotate(Math.PI / 2);
          ctx.fillRect(-5, 0, 10, size.x / 2);
        }
        
        // Center
        ctx.fillStyle = '#8e44ad';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        break;

      case 'ramp':
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(obstacle.rotation || 0);
        
        const rampGradient = ctx.createLinearGradient(-size.x / 2, 0, size.x / 2, 0);
        rampGradient.addColorStop(0, '#2ecc71');
        rampGradient.addColorStop(1, '#27ae60');
        
        ctx.fillStyle = rampGradient;
        ctx.fillRect(-size.x / 2, -size.y / 2, size.x, size.y);
        
        // Arrow
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(size.x / 4, 0);
        ctx.lineTo(-size.x / 4, -size.y / 4);
        ctx.lineTo(-size.x / 4, size.y / 4);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
        break;

      case 'portal':
        const portalGradient = ctx.createRadialGradient(
          position.x, position.y, 0,
          position.x, position.y, size.x / 2
        );
        portalGradient.addColorStop(0, '#e056fd');
        portalGradient.addColorStop(0.5, '#be2edd');
        portalGradient.addColorStop(1, '#8e44ad');
        
        ctx.fillStyle = portalGradient;
        ctx.beginPath();
        ctx.arc(position.x, position.y, size.x / 2 + Math.sin(spinAngle * 3) * 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Swirl effect
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const angle = spinAngle + (i * Math.PI * 2 / 3);
          const radius = (size.x / 2) * (0.3 + i * 0.2);
          ctx.arc(position.x, position.y, radius, angle, angle + Math.PI);
        }
        ctx.stroke();
        break;
    }
  };

  const drawBall = (ctx: CanvasRenderingContext2D, ball: Ball, isCurrentPlayer: boolean) => {
    // Ball shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(ball.position.x + 3, ball.position.y + 3, ball.radius, ball.radius * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ball
    const ballGradient = ctx.createRadialGradient(
      ball.position.x - ball.radius / 3, ball.position.y - ball.radius / 3, 0,
      ball.position.x, ball.position.y, ball.radius
    );
    ballGradient.addColorStop(0, lightenColor(ball.color, 30));
    ballGradient.addColorStop(0.7, ball.color);
    ballGradient.addColorStop(1, darkenColor(ball.color, 30));
    
    ctx.fillStyle = ballGradient;
    ctx.beginPath();
    ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Ball outline for current player
    if (isCurrentPlayer) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Glow effect
      ctx.shadowColor = ball.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(ball.position.x, ball.position.y, ball.radius + 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(ball.position.x - ball.radius / 3, ball.position.y - ball.radius / 3, ball.radius / 3, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawFlag = (ctx: CanvasRenderingContext2D, position: Vector2D, levelNum: number) => {
    const flagHeight = 50;
    const flagWidth = 25;
    
    // Pole
    ctx.fillStyle = '#ddd';
    ctx.fillRect(position.x + 12, position.y - flagHeight - 10, 3, flagHeight + 10);
    
    // Flag
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(position.x + 15, position.y - flagHeight - 10);
    ctx.lineTo(position.x + 15 + flagWidth, position.y - flagHeight + 5);
    ctx.lineTo(position.x + 15, position.y - flagHeight + 20);
    ctx.closePath();
    ctx.fill();
    
    // Level number
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Nunito, sans-serif';
    ctx.fillText(String(levelNum), position.x + 20, position.y - flagHeight + 8);
  };

  const lightenColor = (color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  };

  const darkenColor = (color: string, percent: number): string => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  };

  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent): Vector2D => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0;
      clientY = e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY ?? 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canShoot || currentPlayerId !== myPlayerId) return;
    
    const myBall = localBallRef.current || balls[myPlayerId];
    if (!myBall || myBall.isMoving) return;

    const pos = getCanvasCoordinates(e);
    const dist = distance(pos, myBall.position);
    
    // Must click near the ball to start aiming
    if (dist < 50) {
      setIsDragging(true);
      setDragStart(pos);
      setDragEnd(pos);
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const pos = getCanvasCoordinates(e);
    setDragEnd(pos);
  };

  const handlePointerUp = () => {
    if (!isDragging || !dragStart || !dragEnd) {
      setIsDragging(false);
      return;
    }

    const myBall = localBallRef.current || balls[myPlayerId];
    if (!myBall) {
      setIsDragging(false);
      return;
    }

    const velocity = calculateShot(dragStart, dragEnd);
    
    if (magnitude(velocity) > 0.5) {
      const newBall: Ball = {
        ...myBall,
        velocity,
        isMoving: true,
      };
      localBallRef.current = newBall;
      onShoot(velocity);
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={level.bounds.width}
        height={level.bounds.height}
        style={{
          width: level.bounds.width * scale,
          height: level.bounds.height * scale,
          cursor: canShoot && currentPlayerId === myPlayerId ? 'crosshair' : 'default',
        }}
        className="rounded-xl shadow-2xl border-4 border-amber-900/50"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />
      
      {/* Instructions overlay */}
      {canShoot && currentPlayerId === myPlayerId && gamePhase === 'playing' && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-body">
          Click near ball and drag to aim
        </div>
      )}
    </div>
  );
}
