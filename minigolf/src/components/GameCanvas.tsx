'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Level, Point, Player } from '@/types/game';
import { GameEngine } from '@/lib/gameEngine';

interface GameCanvasProps {
  level: Level;
  currentPlayer: Player | null;
  isMyTurn: boolean;
  onShoot: (angle: number, power: number) => void;
  onBallStopped: (position: Point) => void;
  onHoleComplete: () => void;
  onWaterHazard: () => void;
  ballPosition?: Point;
  disabled?: boolean;
}

const THEME_COLORS = {
  classic: {
    grass: '#4CAF50',
    grassDark: '#388E3C',
    border: '#2E7D32',
  },
  beach: {
    grass: '#F5DEB3',
    grassDark: '#DEB887',
    border: '#8B4513',
  },
  castle: {
    grass: '#6B8E23',
    grassDark: '#556B2F',
    border: '#4A4A4A',
  },
  space: {
    grass: '#1a1a2e',
    grassDark: '#16213e',
    border: '#7B68EE',
  },
  jungle: {
    grass: '#228B22',
    grassDark: '#006400',
    border: '#8B4513',
  },
  candy: {
    grass: '#FFB6C1',
    grassDark: '#FF69B4',
    border: '#FF1493',
  },
};

export default function GameCanvas({
  level,
  currentPlayer,
  isMyTurn,
  onShoot,
  onBallStopped,
  onHoleComplete,
  onWaterHazard,
  ballPosition,
  disabled = false,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [isAiming, setIsAiming] = useState(false);
  const [aimStart, setAimStart] = useState<Point | null>(null);
  const [aimEnd, setAimEnd] = useState<Point | null>(null);
  const [power, setPower] = useState(0);
  const [windmillAngles, setWindmillAngles] = useState<number[]>([]);
  const animationRef = useRef<number | null>(null);

  const themeColors = THEME_COLORS[level.theme] || THEME_COLORS.classic;

  // Initialize game engine
  useEffect(() => {
    engineRef.current = new GameEngine({
      level,
      onBallStopped: (pos) => {
        onBallStopped(pos);
      },
      onHoleComplete: () => {
        onHoleComplete();
      },
      onWaterHazard: () => {
        onWaterHazard();
        // Reset ball to tee after water hazard
        setTimeout(() => {
          engineRef.current?.resetBall();
        }, 500);
      },
      onBumperHit: () => {
        // Play bumper sound effect here if desired
      },
      onTeleport: () => {
        // Play teleport sound effect here if desired
      },
    });

    return () => {
      engineRef.current?.destroy();
    };
  }, [level, onBallStopped, onHoleComplete, onWaterHazard]);

  // Set ball position when received from multiplayer
  useEffect(() => {
    if (ballPosition && engineRef.current) {
      engineRef.current.setBallPosition(ballPosition);
    }
  }, [ballPosition]);

  // Animation loop for rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Update windmill angles
      if (engineRef.current) {
        setWindmillAngles(engineRef.current.getWindmillAngles());
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background
      drawBackground(ctx, canvas.width, canvas.height);

      // Draw obstacles
      drawObstacles(ctx);

      // Draw hole
      drawHole(ctx);

      // Draw ball
      drawBall(ctx);

      // Draw aim line
      if (isAiming && aimStart && aimEnd && isMyTurn) {
        drawAimLine(ctx, aimStart, aimEnd);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [level, isAiming, aimStart, aimEnd, isMyTurn, windmillAngles]);

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, themeColors.grass);
    gradient.addColorStop(1, themeColors.grassDark);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < width; i += 20) {
      for (let j = 0; j < height; j += 20) {
        if ((i + j) % 40 === 0) {
          ctx.fillRect(i, j, 20, 20);
        }
      }
    }
  };

  const drawObstacles = (ctx: CanvasRenderingContext2D) => {
    let windmillIndex = 0;

    level.obstacles.forEach((obstacle) => {
      switch (obstacle.type) {
        case 'wall':
          // Wall shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.fillRect(
            obstacle.x + 3,
            obstacle.y + 3,
            obstacle.width || 10,
            obstacle.height || 10
          );
          // Wall
          const wallGradient = ctx.createLinearGradient(
            obstacle.x,
            obstacle.y,
            obstacle.x + (obstacle.width || 10),
            obstacle.y + (obstacle.height || 10)
          );
          wallGradient.addColorStop(0, '#8B4513');
          wallGradient.addColorStop(0.5, '#A0522D');
          wallGradient.addColorStop(1, '#8B4513');
          ctx.fillStyle = wallGradient;
          ctx.fillRect(obstacle.x, obstacle.y, obstacle.width || 10, obstacle.height || 10);
          ctx.strokeStyle = '#5D3A1A';
          ctx.lineWidth = 2;
          ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width || 10, obstacle.height || 10);
          break;

        case 'sand':
          ctx.fillStyle = '#F4D03F';
          ctx.beginPath();
          ctx.roundRect(
            obstacle.x,
            obstacle.y,
            obstacle.width || 50,
            obstacle.height || 50,
            8
          );
          ctx.fill();
          // Sand texture dots
          ctx.fillStyle = 'rgba(139, 119, 42, 0.4)';
          for (let i = 0; i < 20; i++) {
            const dotX = obstacle.x + Math.random() * (obstacle.width || 50);
            const dotY = obstacle.y + Math.random() * (obstacle.height || 50);
            ctx.beginPath();
            ctx.arc(dotX, dotY, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
          break;

        case 'water':
          // Water with animated effect
          const waterGradient = ctx.createRadialGradient(
            obstacle.x + (obstacle.width || 50) / 2,
            obstacle.y + (obstacle.height || 50) / 2,
            0,
            obstacle.x + (obstacle.width || 50) / 2,
            obstacle.y + (obstacle.height || 50) / 2,
            Math.max(obstacle.width || 50, obstacle.height || 50) / 2
          );
          waterGradient.addColorStop(0, '#4169E1');
          waterGradient.addColorStop(1, '#1E90FF');
          ctx.fillStyle = waterGradient;
          ctx.beginPath();
          ctx.roundRect(
            obstacle.x,
            obstacle.y,
            obstacle.width || 50,
            obstacle.height || 50,
            8
          );
          ctx.fill();
          // Water ripples
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 1;
          const time = Date.now() / 1000;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(
              obstacle.x + (obstacle.width || 50) / 2,
              obstacle.y + (obstacle.height || 50) / 2,
              10 + i * 8 + Math.sin(time * 2 + i) * 3,
              0,
              Math.PI * 2
            );
            ctx.stroke();
          }
          break;

        case 'bumper':
          // Bumper glow
          const bumperGlow = ctx.createRadialGradient(
            obstacle.x,
            obstacle.y,
            0,
            obstacle.x,
            obstacle.y,
            (obstacle.radius || 25) * 1.5
          );
          bumperGlow.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
          bumperGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
          ctx.fillStyle = bumperGlow;
          ctx.beginPath();
          ctx.arc(obstacle.x, obstacle.y, (obstacle.radius || 25) * 1.5, 0, Math.PI * 2);
          ctx.fill();
          // Bumper body
          const bumperGradient = ctx.createRadialGradient(
            obstacle.x - 5,
            obstacle.y - 5,
            0,
            obstacle.x,
            obstacle.y,
            obstacle.radius || 25
          );
          bumperGradient.addColorStop(0, '#FFD700');
          bumperGradient.addColorStop(0.7, '#FFA500');
          bumperGradient.addColorStop(1, '#FF8C00');
          ctx.fillStyle = bumperGradient;
          ctx.beginPath();
          ctx.arc(obstacle.x, obstacle.y, obstacle.radius || 25, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#B8860B';
          ctx.lineWidth = 3;
          ctx.stroke();
          break;

        case 'windmill':
          // Windmill center
          ctx.fillStyle = '#8B4513';
          ctx.beginPath();
          ctx.arc(obstacle.x, obstacle.y, 12, 0, Math.PI * 2);
          ctx.fill();
          // Windmill blade with rotation
          ctx.save();
          ctx.translate(obstacle.x, obstacle.y);
          ctx.rotate(windmillAngles[windmillIndex] || 0);
          ctx.fillStyle = '#D2691E';
          ctx.fillRect(
            -(obstacle.width || 80) / 2,
            -(obstacle.height || 10) / 2,
            obstacle.width || 80,
            obstacle.height || 10
          );
          ctx.strokeStyle = '#8B4513';
          ctx.lineWidth = 2;
          ctx.strokeRect(
            -(obstacle.width || 80) / 2,
            -(obstacle.height || 10) / 2,
            obstacle.width || 80,
            obstacle.height || 10
          );
          ctx.restore();
          windmillIndex++;
          break;

        case 'teleporter':
          // Teleporter portal effect
          const portalGradient = ctx.createRadialGradient(
            obstacle.x,
            obstacle.y,
            0,
            obstacle.x,
            obstacle.y,
            (obstacle.radius || 20) * 1.5
          );
          portalGradient.addColorStop(0, '#9B59B6');
          portalGradient.addColorStop(0.5, '#8E44AD');
          portalGradient.addColorStop(1, 'rgba(142, 68, 173, 0)');
          ctx.fillStyle = portalGradient;
          ctx.beginPath();
          ctx.arc(obstacle.x, obstacle.y, (obstacle.radius || 20) * 1.5, 0, Math.PI * 2);
          ctx.fill();
          // Inner portal
          ctx.fillStyle = '#2C3E50';
          ctx.beginPath();
          ctx.arc(obstacle.x, obstacle.y, obstacle.radius || 20, 0, Math.PI * 2);
          ctx.fill();
          // Spiral effect
          ctx.strokeStyle = '#9B59B6';
          ctx.lineWidth = 2;
          const spiralTime = Date.now() / 500;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(
              obstacle.x,
              obstacle.y,
              (obstacle.radius || 20) * (0.3 + i * 0.25),
              spiralTime + i,
              spiralTime + i + Math.PI
            );
            ctx.stroke();
          }
          break;

        case 'ramp':
          ctx.save();
          ctx.translate(
            obstacle.x + (obstacle.width || 100) / 2,
            obstacle.y + (obstacle.height || 20) / 2
          );
          ctx.rotate(((obstacle.angle || 0) * Math.PI) / 180);
          const rampGradient = ctx.createLinearGradient(
            -(obstacle.width || 100) / 2,
            0,
            (obstacle.width || 100) / 2,
            0
          );
          rampGradient.addColorStop(0, '#696969');
          rampGradient.addColorStop(0.5, '#A9A9A9');
          rampGradient.addColorStop(1, '#696969');
          ctx.fillStyle = rampGradient;
          ctx.fillRect(
            -(obstacle.width || 100) / 2,
            -(obstacle.height || 20) / 2,
            obstacle.width || 100,
            obstacle.height || 20
          );
          ctx.restore();
          break;
      }
    });
  };

  const drawHole = (ctx: CanvasRenderingContext2D) => {
    // Hole shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(level.hole.x + 2, level.hole.y + 2, 20, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hole
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(level.hole.x, level.hole.y, 18, 0, Math.PI * 2);
    ctx.fill();

    // Hole rim
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Flag pole
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(level.hole.x + 15, level.hole.y - 50, 4, 55);

    // Flag
    ctx.fillStyle = '#FF4444';
    ctx.beginPath();
    ctx.moveTo(level.hole.x + 19, level.hole.y - 50);
    ctx.lineTo(level.hole.x + 45, level.hole.y - 40);
    ctx.lineTo(level.hole.x + 19, level.hole.y - 30);
    ctx.closePath();
    ctx.fill();

    // Flag highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(level.hole.x + 19, level.hole.y - 50);
    ctx.lineTo(level.hole.x + 35, level.hole.y - 45);
    ctx.lineTo(level.hole.x + 19, level.hole.y - 40);
    ctx.closePath();
    ctx.fill();
  };

  const drawBall = (ctx: CanvasRenderingContext2D) => {
    const ballPos = engineRef.current?.getBallPosition();
    if (!ballPos) return;

    const playerColor = currentPlayer?.color || '#ffffff';

    // Ball shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(ballPos.x + 3, ballPos.y + 3, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ball
    const ballGradient = ctx.createRadialGradient(
      ballPos.x - 3,
      ballPos.y - 3,
      0,
      ballPos.x,
      ballPos.y,
      10
    );
    ballGradient.addColorStop(0, '#ffffff');
    ballGradient.addColorStop(0.5, playerColor);
    ballGradient.addColorStop(1, adjustColor(playerColor, -30));
    ctx.fillStyle = ballGradient;
    ctx.beginPath();
    ctx.arc(ballPos.x, ballPos.y, 10, 0, Math.PI * 2);
    ctx.fill();

    // Ball highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(ballPos.x - 3, ballPos.y - 3, 4, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawAimLine = (ctx: CanvasRenderingContext2D, start: Point, end: Point) => {
    const dx = start.x - end.x;
    const dy = start.y - end.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 150;
    const currentPower = Math.min(distance / maxDistance, 1) * 100;
    
    // Direction arrow
    const arrowLength = Math.min(distance * 2, 200);
    const angle = Math.atan2(dy, dx);
    const endX = start.x + Math.cos(angle) * arrowLength;
    const endY = start.y + Math.sin(angle) * arrowLength;

    // Power gradient color
    const powerColor = getPowerColor(currentPower);

    // Draw dashed trajectory line
    ctx.setLineDash([10, 5]);
    ctx.strokeStyle = powerColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw arrow head
    const arrowSize = 15;
    const arrowAngle = Math.PI / 6;
    ctx.fillStyle = powerColor;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowSize * Math.cos(angle - arrowAngle),
      endY - arrowSize * Math.sin(angle - arrowAngle)
    );
    ctx.lineTo(
      endX - arrowSize * Math.cos(angle + arrowAngle),
      endY - arrowSize * Math.sin(angle + arrowAngle)
    );
    ctx.closePath();
    ctx.fill();

    // Power indicator circle
    ctx.strokeStyle = powerColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(start.x, start.y, 20 + currentPower / 3, 0, Math.PI * 2);
    ctx.stroke();
  };

  const getPowerColor = (power: number): string => {
    if (power < 33) return '#4CAF50';
    if (power < 66) return '#FFC107';
    return '#F44336';
  };

  const adjustColor = (color: string, amount: number): string => {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMyTurn || disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const ballPos = engineRef.current?.getBallPosition();
    if (!ballPos) return;

    setIsAiming(true);
    setAimStart(ballPos);
    setAimEnd({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    });
  }, [isMyTurn, disabled]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isAiming) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    setAimEnd({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    });
  }, [isAiming]);

  const handleMouseUp = useCallback(() => {
    if (!isAiming || !aimStart || !aimEnd) return;

    const dx = aimStart.x - aimEnd.x;
    const dy = aimStart.y - aimEnd.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 10) {
      setIsAiming(false);
      setAimStart(null);
      setAimEnd(null);
      return;
    }

    const maxDistance = 150;
    const normalizedPower = Math.min(distance / maxDistance, 1) * 100;
    const angle = Math.atan2(dy, dx);

    setIsAiming(false);
    setAimStart(null);
    setAimEnd(null);
    setPower(normalizedPower);

    // Execute shot
    engineRef.current?.shoot(angle, normalizedPower);
    onShoot(angle, normalizedPower);
  }, [isAiming, aimStart, aimEnd, onShoot]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isMyTurn || disabled) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches[0];
    
    const ballPos = engineRef.current?.getBallPosition();
    if (!ballPos) return;

    setIsAiming(true);
    setAimStart(ballPos);
    setAimEnd({
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    });
  }, [isMyTurn, disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isAiming) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches[0];

    setAimEnd({
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    });
  }, [isAiming]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handleMouseUp();
  }, [handleMouseUp]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={level.bounds.width}
        height={level.bounds.height}
        className="w-full max-w-4xl rounded-xl shadow-2xl border-4 cursor-crosshair"
        style={{ borderColor: themeColors.border }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      {isMyTurn && !disabled && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
          🎯 Click and drag to aim and shoot!
        </div>
      )}
    </div>
  );
}
