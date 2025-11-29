'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Ball, Level, Obstacle, Circle, Rectangle, Vector2 } from '../types';
import { createBall, shootBall, updateBall, isBallMoving, checkHole, getBallRotation, handleBallCollision } from '../physics';
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

export default function GameCanvas({
  level,
  playerColor,
  playerName,
  playerId,
  isMyTurn,
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
        // Create balls from other players for collision detection
        const otherBalls: Ball[] = otherPlayers
          .filter(p => !p.hasFinished)
          .map(p => ({
            position: p.odosition,
            velocity: p.velocity,
            radius: 10,
          }));

        const result = updateBall(currentBall, level, windmillAngles, movingWallOffsets, otherBalls);
        
        // Update ball rotation for rolling animation
        setBallRotation(prev => getBallRotation(result.ball, prev));
        
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
            // Broadcast reset position
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
        
        // Broadcast ball position (throttled to ~30fps)
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

    // Clear canvas
    ctx.fillStyle = level.theme?.secondary || '#1a2e26';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw course background
    ctx.fillStyle = level.theme?.primary || '#2d4a3e';
    ctx.beginPath();
    ctx.moveTo(level.walls[0].start.x, level.walls[0].start.y);
    level.walls.forEach(wall => {
      ctx.lineTo(wall.end.x, wall.end.y);
    });
    ctx.closePath();
    ctx.fill();

    // Draw obstacles
    level.obstacles.forEach((obstacle, index) => {
      if (obstacle.type === 'sand') {
        const rect = obstacle.shape as Rectangle;
        ctx.fillStyle = '#c9b896';
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        
        ctx.fillStyle = '#b5a482';
        for (let i = 0; i < 20; i++) {
          const x = rect.x + Math.random() * rect.width;
          const y = rect.y + Math.random() * rect.height;
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      if (obstacle.type === 'water') {
        const rect = obstacle.shape as Rectangle;
        ctx.fillStyle = '#2563eb40';
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        
        ctx.strokeStyle = '#3b82f650';
        ctx.lineWidth = 1;
        for (let y = rect.y + 10; y < rect.y + rect.height; y += 15) {
          ctx.beginPath();
          ctx.moveTo(rect.x, y);
          for (let x = rect.x; x < rect.x + rect.width; x += 10) {
            ctx.lineTo(x + 5, y + Math.sin((x + Date.now() / 200) / 10) * 3);
          }
          ctx.stroke();
        }
      }
      
      if (obstacle.type === 'ramp') {
        const rect = obstacle.shape as Rectangle;
        ctx.fillStyle = '#8b7355';
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        ctx.strokeStyle = '#6b5344';
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      }
      
      if (obstacle.type === 'bumper') {
        const circle = obstacle.shape as Circle;
        
        const gradient = ctx.createRadialGradient(
          circle.x, circle.y, circle.radius * 0.5,
          circle.x, circle.y, circle.radius * 1.3
        );
        gradient.addColorStop(0, level.theme?.accent || '#f472b6');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius * 1.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = level.theme?.accent || '#f472b6';
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(circle.x - circle.radius * 0.3, circle.y - circle.radius * 0.3, circle.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      
      if (obstacle.type === 'windmill') {
        const circle = obstacle.shape as Circle;
        const angle = windmillAngles.get(index) || 0;
        
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#94a3b8';
        for (let i = 0; i < 4; i++) {
          const bladeAngle = angle + (i * Math.PI / 2);
          ctx.save();
          ctx.translate(circle.x, circle.y);
          ctx.rotate(bladeAngle);
          ctx.fillRect(-6, 0, 12, circle.radius);
          ctx.restore();
        }
        
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      
      if (obstacle.type === 'moving-wall') {
        const rect = obstacle.shape as Rectangle;
        const offset = movingWallOffsets.get(index) || 0;
        
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(rect.x, rect.y + offset, rect.width, rect.height);
        
        ctx.fillStyle = '#fbbf24';
        const stripeHeight = 10;
        for (let y = rect.y + offset; y < rect.y + offset + rect.height; y += stripeHeight * 2) {
          ctx.fillRect(rect.x, y, rect.width, stripeHeight);
        }
      }
      
      if (obstacle.type === 'teleporter') {
        const circle = obstacle.shape as Circle;
        const time = Date.now() / 1000;
        
        const pulseSize = Math.sin(time * 3) * 5 + circle.radius + 5;
        const gradient = ctx.createRadialGradient(
          circle.x, circle.y, 0,
          circle.x, circle.y, pulseSize
        );
        gradient.addColorStop(0, '#c084fc');
        gradient.addColorStop(0.5, '#a855f780');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#7c3aed';
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 4; a += 0.1) {
          const r = (a / (Math.PI * 4)) * (circle.radius - 4);
          const x = circle.x + Math.cos(a + time * 2) * r;
          const y = circle.y + Math.sin(a + time * 2) * r;
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    });

    // Draw walls
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    level.walls.forEach(wall => {
      ctx.beginPath();
      ctx.moveTo(wall.start.x, wall.start.y);
      ctx.lineTo(wall.end.x, wall.end.y);
      ctx.stroke();
    });

    // Draw hole with gravity indicator
    const holeGradient = ctx.createRadialGradient(
      level.hole.position.x, level.hole.position.y, level.hole.radius,
      level.hole.position.x, level.hole.position.y, 60
    );
    holeGradient.addColorStop(0, 'rgba(15, 23, 42, 0.3)');
    holeGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = holeGradient;
    ctx.beginPath();
    ctx.arc(level.hole.position.x, level.hole.position.y, 60, 0, Math.PI * 2);
    ctx.fill();

    // Draw hole
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(level.hole.position.x, level.hole.position.y, level.hole.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Flag
    if (!scored) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(level.hole.position.x + 2, level.hole.position.y - 35);
      ctx.lineTo(level.hole.position.x + 22, level.hole.position.y - 28);
      ctx.lineTo(level.hole.position.x + 2, level.hole.position.y - 20);
      ctx.fill();
      
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(level.hole.position.x + 2, level.hole.position.y);
      ctx.lineTo(level.hole.position.x + 2, level.hole.position.y - 38);
      ctx.stroke();
    }

    // Draw tee marker
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.arc(level.tee.x, level.tee.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw other players' balls
    otherPlayers.forEach(player => {
      if (player.hasFinished) return;
      
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(player.odosition.x + 3, player.odosition.y + 3, 10, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Ball
      const otherBallGradient = ctx.createRadialGradient(
        player.odosition.x - 3,
        player.odosition.y - 3,
        0,
        player.odosition.x,
        player.odosition.y,
        10
      );
      otherBallGradient.addColorStop(0, '#ffffff');
      otherBallGradient.addColorStop(0.3, player.color);
      otherBallGradient.addColorStop(1, player.color);
      
      ctx.fillStyle = otherBallGradient;
      ctx.beginPath();
      ctx.arc(player.odosition.x, player.odosition.y, 10, 0, Math.PI * 2);
      ctx.fill();
      
      // Rolling stripe
      const speed = Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2);
      if (speed > 0.5) {
        ctx.save();
        ctx.translate(player.odosition.x, player.odosition.y);
        ctx.rotate(Math.atan2(player.velocity.y, player.velocity.x));
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(-10, -2, 20, 4);
        ctx.restore();
      }
      
      // Name tag
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.font = '10px "DM Sans"';
      const textWidth = ctx.measureText(player.name).width;
      ctx.fillRect(player.odosition.x - textWidth / 2 - 4, player.odosition.y - 26, textWidth + 8, 14);
      ctx.fillStyle = player.color;
      ctx.textAlign = 'center';
      ctx.fillText(player.name, player.odosition.x, player.odosition.y - 16);
    });

    // Draw my ball (if not scored)
    if (!scored) {
      // Ball shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(ball.position.x + 3, ball.position.y + 3, ball.radius, ball.radius * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ball with gradient
      const ballGradient = ctx.createRadialGradient(
        ball.position.x - ball.radius * 0.3,
        ball.position.y - ball.radius * 0.3,
        0,
        ball.position.x,
        ball.position.y,
        ball.radius
      );
      ballGradient.addColorStop(0, '#ffffff');
      ballGradient.addColorStop(0.3, playerColor);
      ballGradient.addColorStop(1, playerColor);
      
      ctx.fillStyle = ballGradient;
      ctx.beginPath();
      ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();

      // Rolling animation - draw stripe on ball
      ctx.save();
      ctx.translate(ball.position.x, ball.position.y);
      ctx.rotate(ballRotation);
      
      // Draw a stripe to show rotation
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.ellipse(0, 0, ball.radius * 0.8, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw a dot for reference
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.arc(ball.radius * 0.5, 0, 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }

    // Draw aim line
    if (isAiming && aimStart && aimEnd && !isRolling && !scored) {
      const dx = aimStart.x - aimEnd.x;
      const dy = aimStart.y - aimEnd.y;
      const power = Math.min(Math.sqrt(dx * dx + dy * dy), 150);
      const angle = Math.atan2(dy, dx);
      
      // Direction line with dots
      ctx.fillStyle = playerColor;
      const numDots = Math.floor(power / 15);
      for (let i = 1; i <= numDots; i++) {
        const dotDist = (i / numDots) * power;
        const dotX = ball.position.x + Math.cos(angle) * dotDist;
        const dotY = ball.position.y + Math.sin(angle) * dotDist;
        const dotSize = 3 + (i / numDots) * 2;
        ctx.beginPath();
        ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Arrow head
      if (power > 20) {
        const arrowX = ball.position.x + Math.cos(angle) * power;
        const arrowY = ball.position.y + Math.sin(angle) * power;
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - Math.cos(angle - 0.4) * 15, arrowY - Math.sin(angle - 0.4) * 15);
        ctx.lineTo(arrowX - Math.cos(angle + 0.4) * 15, arrowY - Math.sin(angle + 0.4) * 15);
        ctx.closePath();
        ctx.fill();
      }
      
      // Power indicator bar
      const powerPercent = power / 150;
      const barWidth = 100;
      const barHeight = 10;
      const barX = 20;
      const barY = 520;
      
      // Background
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      // Fill with gradient
      const powerGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
      powerGradient.addColorStop(0, '#4ade80');
      powerGradient.addColorStop(0.5, '#fbbf24');
      powerGradient.addColorStop(1, '#ef4444');
      ctx.fillStyle = powerGradient;
      ctx.fillRect(barX, barY, barWidth * powerPercent, barHeight);
      
      // Border
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
      
      // Power text
      ctx.fillStyle = '#f1f5f9';
      ctx.font = '12px "DM Sans"';
      ctx.textAlign = 'left';
      ctx.fillText(`${Math.round(powerPercent * 100)}%`, barX + barWidth + 8, barY + 9);
    }

    // Draw splash effect
    if (showSplash) {
      ctx.fillStyle = '#3b82f6';
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const dist = 20 + Math.random() * 15;
        ctx.beginPath();
        ctx.arc(
          ball.position.x + Math.cos(angle) * dist,
          ball.position.y + Math.sin(angle) * dist,
          3 + Math.random() * 3,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    // Draw scored effect
    if (scored) {
      ctx.fillStyle = level.theme?.accent || '#4ade80';
      ctx.font = 'bold 32px "DM Sans"';
      ctx.textAlign = 'center';
      ctx.fillText('IN THE HOLE!', level.hole.position.x, level.hole.position.y - 50);
      
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + Date.now() / 500;
        const dist = 40 + Math.sin(Date.now() / 200 + i) * 10;
        ctx.fillStyle = i % 2 === 0 ? playerColor : level.theme?.accent || '#4ade80';
        ctx.beginPath();
        ctx.arc(
          level.hole.position.x + Math.cos(angle) * dist,
          level.hole.position.y + Math.sin(angle) * dist,
          4,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
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
    const dist = Math.sqrt(
      (coords.x - ball.position.x) ** 2 + (coords.y - ball.position.y) ** 2
    );
    
    // Allow aiming from anywhere, but start from ball position
    if (dist < 100) {
      setIsAiming(true);
      setAimStart(coords);
      setAimEnd(coords);
    }
  }, [isRolling, scored, ball.position, getCanvasCoords]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isAiming) return;
    const coords = getCanvasCoords(e);
    setAimEnd(coords);
  }, [isAiming, getCanvasCoords]);

  const handlePointerUp = useCallback(() => {
    if (!isAiming || !aimStart || !aimEnd) {
      setIsAiming(false);
      return;
    }
    
    const dx = aimStart.x - aimEnd.x;
    const dy = aimStart.y - aimEnd.y;
    const rawPower = Math.sqrt(dx * dx + dy * dy);
    const power = Math.min(rawPower / 10, 15); // Clamp power
    const angle = Math.atan2(dy, dx);
    
    if (power > 0.5) {
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
            Drag from ball to aim and release to shoot
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
