'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Level, Player, Ball, MAX_POWER, Point } from '@/lib/types';
import { updateBall, distance } from '@/lib/physics';

interface GameCanvasProps {
  level: Level;
  players: Player[];
  currentPlayerId: string | null;
  currentTurnPlayerId: string;
  onShot: (angle: number, power: number) => void;
  onBallUpdate: (playerId: string, ball: Ball) => void;
  onTurnEnd: () => void;
  isMyTurn: boolean;
}

const BALL_RADIUS = 10;

export const GameCanvas: React.FC<GameCanvasProps> = ({
  level,
  players,
  currentPlayerId,
  currentTurnPlayerId,
  onShot,
  onBallUpdate,
  onTurnEnd,
  isMyTurn,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAiming, setIsAiming] = useState(false);
  const [aimStart, setAimStart] = useState<Point | null>(null);
  const [aimEnd, setAimEnd] = useState<Point | null>(null);
  const [time, setTime] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Get current player's ball
  const myPlayer = players.find(p => p.id === currentPlayerId);

  // Check if any ball is moving
  const anyBallMoving = players.some(p => p.ball.isMoving);

  // Game loop
  useEffect(() => {
    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      setTime(t => t + deltaTime);

      // Update physics for all moving balls
      players.forEach(player => {
        if (player.ball.isMoving) {
          const newBall = updateBall(player.ball, level, time);
          
          if (newBall.position.x !== player.ball.position.x ||
              newBall.position.y !== player.ball.position.y ||
              newBall.isMoving !== player.ball.isMoving) {
            onBallUpdate(player.id, newBall);
            
            // If ball stopped moving and it's this player's turn, end turn
            if (!newBall.isMoving && player.id === currentTurnPlayerId) {
              setTimeout(() => onTurnEnd(), 500);
            }
          }
        }
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [players, level, time, currentTurnPlayerId, onBallUpdate, onTurnEnd]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = level.theme.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grass (main area)
    ctx.fillStyle = level.theme.grass;
    ctx.beginPath();
    ctx.roundRect(50, Math.min(...level.walls.map(w => w.points?.[0]?.y || 100)) - 30, 
                  level.bounds.width - 100, 
                  level.bounds.height - 40, 20);
    ctx.fill();

    // Draw obstacles first (under balls)
    level.obstacles.forEach(obs => {
      if (obs.type === 'sand' && obs.position && obs.width && obs.height) {
        ctx.fillStyle = '#F4D03F';
        ctx.beginPath();
        ctx.ellipse(
          obs.position.x + obs.width / 2,
          obs.position.y + obs.height / 2,
          obs.width / 2,
          obs.height / 2,
          0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Sand texture dots
        ctx.fillStyle = '#E6B800';
        for (let i = 0; i < 20; i++) {
          const x = obs.position.x + Math.random() * obs.width;
          const y = obs.position.y + Math.random() * obs.height;
          const dist = Math.sqrt(
            Math.pow((x - obs.position.x - obs.width/2) / (obs.width/2), 2) +
            Math.pow((y - obs.position.y - obs.height/2) / (obs.height/2), 2)
          );
          if (dist < 1) {
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      if (obs.type === 'water' && obs.position && obs.width && obs.height) {
        // Water gradient
        const gradient = ctx.createRadialGradient(
          obs.position.x + obs.width / 2,
          obs.position.y + obs.height / 2,
          0,
          obs.position.x + obs.width / 2,
          obs.position.y + obs.height / 2,
          Math.max(obs.width, obs.height) / 2
        );
        gradient.addColorStop(0, '#4FC3F7');
        gradient.addColorStop(1, '#0288D1');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(
          obs.position.x + obs.width / 2,
          obs.position.y + obs.height / 2,
          obs.width / 2,
          obs.height / 2,
          0, 0, Math.PI * 2
        );
        ctx.fill();

        // Animated water ripples
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        const ripplePhase = (time * 2) % 1;
        for (let i = 0; i < 3; i++) {
          const phase = (ripplePhase + i * 0.33) % 1;
          ctx.globalAlpha = 1 - phase;
          ctx.beginPath();
          ctx.ellipse(
            obs.position.x + obs.width / 2,
            obs.position.y + obs.height / 2,
            (obs.width / 2) * phase * 0.8,
            (obs.height / 2) * phase * 0.8,
            0, 0, Math.PI * 2
          );
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      if (obs.type === 'bouncer' && obs.position && obs.radius) {
        // Bouncer with glow effect
        const gradient = ctx.createRadialGradient(
          obs.position.x, obs.position.y, 0,
          obs.position.x, obs.position.y, obs.radius
        );
        gradient.addColorStop(0, '#FF6B6B');
        gradient.addColorStop(0.7, '#E53935');
        gradient.addColorStop(1, '#B71C1C');
        
        // Glow
        ctx.shadowColor = '#FF6B6B';
        ctx.shadowBlur = 15;
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(obs.position.x, obs.position.y, obs.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(obs.position.x - obs.radius * 0.3, obs.position.y - obs.radius * 0.3, obs.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
      }

      if (obs.type === 'windmill' && obs.position && obs.width && obs.height) {
        const speed = obs.speed || 2;
        const angle = (time * speed) % (Math.PI * 2);
        
        ctx.save();
        ctx.translate(obs.position.x, obs.position.y);
        
        // Draw center hub
        ctx.fillStyle = '#5D4037';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw blades
        ctx.rotate(angle);
        const bladeGradient = ctx.createLinearGradient(-obs.width/2, 0, obs.width/2, 0);
        bladeGradient.addColorStop(0, '#8D6E63');
        bladeGradient.addColorStop(0.5, '#A1887F');
        bladeGradient.addColorStop(1, '#8D6E63');
        
        ctx.fillStyle = bladeGradient;
        ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
        
        ctx.rotate(Math.PI);
        ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
        
        ctx.restore();
      }
    });

    // Draw walls
    ctx.fillStyle = '#4A5568';
    ctx.strokeStyle = '#2D3748';
    ctx.lineWidth = 2;
    
    level.walls.forEach(wall => {
      if (wall.points && wall.points.length >= 3) {
        ctx.beginPath();
        ctx.moveTo(wall.points[0].x, wall.points[0].y);
        wall.points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    });

    // Draw hole
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(level.hole.x, level.hole.y, level.holeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Hole inner ring
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(level.hole.x, level.hole.y, level.holeRadius - 3, 0, Math.PI * 2);
    ctx.stroke();
    
    // Flag
    const flagHeight = 50;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(level.hole.x, level.hole.y);
    ctx.lineTo(level.hole.x, level.hole.y - flagHeight);
    ctx.stroke();
    
    // Flag triangle
    ctx.fillStyle = level.theme.accent;
    ctx.beginPath();
    ctx.moveTo(level.hole.x, level.hole.y - flagHeight);
    ctx.lineTo(level.hole.x + 25, level.hole.y - flagHeight + 12);
    ctx.lineTo(level.hole.x, level.hole.y - flagHeight + 24);
    ctx.closePath();
    ctx.fill();

    // Draw tee marker
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(level.tee.x, level.tee.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw aim line if aiming
    if (isAiming && aimStart && aimEnd && isMyTurn && !anyBallMoving && myPlayer && !myPlayer.ball.inHole) {
      const dx = aimStart.x - aimEnd.x;
      const dy = aimStart.y - aimEnd.y;
      const power = Math.min(Math.sqrt(dx * dx + dy * dy) / 10, MAX_POWER);
      const angle = Math.atan2(dy, dx);
      
      // Power indicator
      const powerPercent = power / MAX_POWER;
      const powerColor = `hsl(${120 - powerPercent * 120}, 80%, 50%)`;
      
      // Draw aim line
      ctx.strokeStyle = powerColor;
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(myPlayer.ball.position.x, myPlayer.ball.position.y);
      ctx.lineTo(
        myPlayer.ball.position.x + Math.cos(angle) * power * 8,
        myPlayer.ball.position.y + Math.sin(angle) * power * 8
      );
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw power arrow
      const arrowLen = 15;
      const arrowAngle = 0.5;
      const endX = myPlayer.ball.position.x + Math.cos(angle) * power * 8;
      const endY = myPlayer.ball.position.y + Math.sin(angle) * power * 8;
      
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - Math.cos(angle - arrowAngle) * arrowLen,
        endY - Math.sin(angle - arrowAngle) * arrowLen
      );
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - Math.cos(angle + arrowAngle) * arrowLen,
        endY - Math.sin(angle + arrowAngle) * arrowLen
      );
      ctx.stroke();
    }

    // Draw balls
    players.forEach(player => {
      if (player.ball.inHole) return;
      
      const { x, y } = player.ball.position;
      
      // Ball shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(x + 3, y + 3, BALL_RADIUS, BALL_RADIUS * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Ball gradient
      const ballGradient = ctx.createRadialGradient(
        x - BALL_RADIUS * 0.3, y - BALL_RADIUS * 0.3, 0,
        x, y, BALL_RADIUS
      );
      ballGradient.addColorStop(0, '#fff');
      ballGradient.addColorStop(0.3, player.color);
      ballGradient.addColorStop(1, shadeColor(player.color, -30));
      
      ctx.fillStyle = ballGradient;
      ctx.beginPath();
      ctx.arc(x, y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      
      // Ball outline
      ctx.strokeStyle = shadeColor(player.color, -40);
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(x - BALL_RADIUS * 0.3, y - BALL_RADIUS * 0.3, BALL_RADIUS * 0.3, 0, Math.PI * 2);
      ctx.fill();
      
      // Player indicator if it's their turn
      if (player.id === currentTurnPlayerId && !anyBallMoving) {
        ctx.strokeStyle = player.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(x, y, BALL_RADIUS + 8 + Math.sin(time * 4) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

  }, [level, players, isAiming, aimStart, aimEnd, time, currentTurnPlayerId, isMyTurn, anyBallMoving, myPlayer]);

  // Mouse/Touch handlers
  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isMyTurn || anyBallMoving || !myPlayer || myPlayer.ball.inHole) return;
    
    const point = getCanvasPoint(e);
    const ballPos = myPlayer.ball.position;
    
    // Only start aiming if clicking near the ball
    if (distance(point, ballPos) < 50) {
      setIsAiming(true);
      setAimStart(point);
      setAimEnd(point);
    }
  }, [isMyTurn, anyBallMoving, myPlayer, getCanvasPoint]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isAiming) return;
    e.preventDefault();
    setAimEnd(getCanvasPoint(e));
  }, [isAiming, getCanvasPoint]);

  const handleEnd = useCallback(() => {
    if (!isAiming || !aimStart || !aimEnd || !myPlayer) {
      setIsAiming(false);
      return;
    }

    const dx = aimStart.x - aimEnd.x;
    const dy = aimStart.y - aimEnd.y;
    const power = Math.min(Math.sqrt(dx * dx + dy * dy) / 10, MAX_POWER);
    const angle = Math.atan2(dy, dx);

    if (power > 0.5) {
      onShot(angle, power);
    }

    setIsAiming(false);
    setAimStart(null);
    setAimEnd(null);
  }, [isAiming, aimStart, aimEnd, myPlayer, onShot]);

  return (
    <canvas
      ref={canvasRef}
      width={level.bounds.width}
      height={level.bounds.height}
      className="max-w-full h-auto rounded-xl shadow-2xl cursor-crosshair touch-none"
      style={{ 
        maxHeight: '70vh',
        aspectRatio: `${level.bounds.width} / ${level.bounds.height}` 
      }}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    />
  );
};

// Helper function to shade colors
function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1);
}

export default GameCanvas;
