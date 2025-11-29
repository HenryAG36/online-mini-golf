'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Ball, Level, Obstacle, Circle, Rectangle } from '../types';
import { createBall, shootBall, updateBall, isBallMoving, checkHole } from '../physics';
import styles from './GameCanvas.module.css';

interface GameCanvasProps {
  level: Level;
  playerColor: string;
  playerName: string;
  isMyTurn: boolean;
  onShot: (strokes: number) => void;
  onHoleComplete: (strokes: number) => void;
  currentStrokes: number;
}

export default function GameCanvas({
  level,
  playerColor,
  playerName,
  isMyTurn,
  onShot,
  onHoleComplete,
  currentStrokes,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ball, setBall] = useState<Ball>(() => createBall(level.tee.x, level.tee.y));
  const [isAiming, setIsAiming] = useState(false);
  const [aimStart, setAimStart] = useState<{ x: number; y: number } | null>(null);
  const [aimEnd, setAimEnd] = useState<{ x: number; y: number } | null>(null);
  const [strokes, setStrokes] = useState(currentStrokes);
  const [isRolling, setIsRolling] = useState(false);
  const [scored, setScored] = useState(false);
  const [windmillAngles, setWindmillAngles] = useState<Map<number, number>>(new Map());
  const [movingWallOffsets, setMovingWallOffsets] = useState<Map<number, number>>(new Map());
  const [showSplash, setShowSplash] = useState(false);

  // Reset ball when level changes
  useEffect(() => {
    setBall(createBall(level.tee.x, level.tee.y));
    setStrokes(currentStrokes);
    setScored(false);
    setIsRolling(false);
    setShowSplash(false);
  }, [level.id, level.tee.x, level.tee.y, currentStrokes]);

  // Animation loop for obstacles
  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();
    // Track direction changes locally to avoid mutating obstacle properties
    const directionTracker = new Map<number, number>();
    level.obstacles.forEach((obstacle, index) => {
      if (obstacle.type === 'moving-wall') {
        directionTracker.set(index, obstacle.properties?.direction || 1);
      }
    });

    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Update windmill angles using callback pattern
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

      // Update moving wall offsets using callback pattern
      setMovingWallOffsets(prev => {
        const newOffsets = new Map<number, number>();
        level.obstacles.forEach((obstacle, index) => {
          if (obstacle.type === 'moving-wall') {
            const currentOffset = prev.get(index) || 0;
            const speed = obstacle.properties?.speed || 1;
            let direction = directionTracker.get(index) || 1;
            let newOffset = currentOffset + speed * direction * 60 * delta;
            
            // Bounce between -80 and 80
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
        const result = updateBall(currentBall, level, windmillAngles, movingWallOffsets);
        
        if (result.inWater) {
          // Check if ball is on a ramp (bridge)
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
        
        if (!isBallMoving(result.ball)) {
          setIsRolling(false);
          return { ...result.ball, velocity: { x: 0, y: 0 } };
        }
        
        return result.ball;
      });

      animationFrame = requestAnimationFrame(physicsLoop);
    };

    animationFrame = requestAnimationFrame(physicsLoop);
    return () => cancelAnimationFrame(animationFrame);
  }, [isRolling, scored, level, windmillAngles, movingWallOffsets, strokes, onHoleComplete]);

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
        
        // Sand texture dots
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
        
        // Water pattern
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
        
        // Outer glow
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
        
        // Main bumper
        ctx.fillStyle = level.theme?.accent || '#f472b6';
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(circle.x - circle.radius * 0.3, circle.y - circle.radius * 0.3, circle.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      
      if (obstacle.type === 'windmill') {
        const circle = obstacle.shape as Circle;
        const angle = windmillAngles.get(index) || 0;
        
        // Center hub
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Blades
        ctx.fillStyle = '#94a3b8';
        for (let i = 0; i < 4; i++) {
          const bladeAngle = angle + (i * Math.PI / 2);
          ctx.save();
          ctx.translate(circle.x, circle.y);
          ctx.rotate(bladeAngle);
          ctx.fillRect(-6, 0, 12, circle.radius);
          ctx.restore();
        }
        
        // Center dot
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
        
        // Stripes
        ctx.fillStyle = '#fbbf24';
        const stripeHeight = 10;
        for (let y = rect.y + offset; y < rect.y + offset + rect.height; y += stripeHeight * 2) {
          ctx.fillRect(rect.x, y, rect.width, stripeHeight);
        }
      }
      
      if (obstacle.type === 'teleporter') {
        const circle = obstacle.shape as Circle;
        const time = Date.now() / 1000;
        
        // Pulsing glow
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
        
        // Main portal
        ctx.fillStyle = '#7c3aed';
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner swirl
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

    // Draw hole
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(level.hole.position.x, level.hole.position.y, level.hole.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Hole rim
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

    // Draw ball shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(ball.position.x + 3, ball.position.y + 3, ball.radius, ball.radius * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw ball
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

    // Draw aim line
    if (isAiming && aimStart && aimEnd && isMyTurn && !isRolling && !scored) {
      const dx = aimStart.x - aimEnd.x;
      const dy = aimStart.y - aimEnd.y;
      const power = Math.min(Math.sqrt(dx * dx + dy * dy), 150);
      const angle = Math.atan2(dy, dx);
      
      // Direction line
      ctx.strokeStyle = playerColor;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(ball.position.x, ball.position.y);
      ctx.lineTo(
        ball.position.x + Math.cos(angle) * power,
        ball.position.y + Math.sin(angle) * power
      );
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Power indicator
      const powerPercent = power / 150;
      ctx.fillStyle = powerPercent > 0.7 ? '#ef4444' : powerPercent > 0.4 ? '#fbbf24' : '#4ade80';
      ctx.fillRect(20, 520, 100 * powerPercent, 10);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 520, 100, 10);
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
      ctx.fillText('HOLE!', level.hole.position.x, level.hole.position.y - 50);
      
      // Celebration particles
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

  }, [ball, level, isAiming, aimStart, aimEnd, playerColor, isMyTurn, isRolling, scored, windmillAngles, movingWallOffsets, showSplash]);

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
    if (!isMyTurn || isRolling || scored) return;
    
    const coords = getCanvasCoords(e);
    const dist = Math.sqrt(
      (coords.x - ball.position.x) ** 2 + (coords.y - ball.position.y) ** 2
    );
    
    if (dist < 50) {
      setIsAiming(true);
      setAimStart(coords);
      setAimEnd(coords);
    }
  }, [isMyTurn, isRolling, scored, ball.position, getCanvasCoords]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isAiming) return;
    setAimEnd(getCanvasCoords(e));
  }, [isAiming, getCanvasCoords]);

  const handlePointerUp = useCallback(() => {
    if (!isAiming || !aimStart || !aimEnd) return;
    
    const dx = aimStart.x - aimEnd.x;
    const dy = aimStart.y - aimEnd.y;
    const power = Math.min(Math.sqrt(dx * dx + dy * dy) / 10, 15);
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
        {isMyTurn && !isRolling && !scored && (
          <div className={styles.instruction}>
            Drag from ball to aim and shoot
          </div>
        )}
        {!isMyTurn && !scored && (
          <div className={styles.waiting}>
            Waiting for other player...
          </div>
        )}
        {isRolling && (
          <div className={styles.rolling}>Rolling...</div>
        )}
      </div>
    </div>
  );
}
