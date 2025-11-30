import Matter from 'matter-js';
import { Level, Obstacle, Point } from '@/types/game';

const { Engine, World, Bodies, Body, Events, Vector } = Matter;

export interface GameEngineConfig {
  level: Level;
  onBallStopped: (position: Point) => void;
  onHoleComplete: () => void;
  onWaterHazard: () => void;
  onBumperHit: () => void;
  onTeleport: () => void;
}

export class GameEngine {
  private engine: Matter.Engine;
  private ball: Matter.Body | null = null;
  private hole: Matter.Body | null = null;
  private obstacles: Matter.Body[] = [];
  private windmills: { body: Matter.Body; speed: number; center: Point }[] = [];
  private teleporters: { body: Matter.Body; target: Point }[] = [];
  private config: GameEngineConfig;
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private stationaryTime: number = 0;
  private readonly BALL_RADIUS = 10;
  private readonly HOLE_RADIUS = 18;
  private readonly FRICTION = 0.02;
  private readonly AIR_FRICTION = 0.001;
  private readonly SAND_FRICTION = 0.15;
  private readonly RESTITUTION = 0.7;
  private readonly BUMPER_RESTITUTION = 1.5;
  private readonly VELOCITY_THRESHOLD = 0.1;
  private readonly STATIONARY_TIME_THRESHOLD = 500;

  constructor(config: GameEngineConfig) {
    this.config = config;
    this.engine = Engine.create({
      gravity: { x: 0, y: 0 },
    });
    this.engine.world.gravity.scale = 0;
    this.setupLevel(config.level);
  }

  private setupLevel(level: Level) {
    // Clear existing bodies
    World.clear(this.engine.world, false);
    this.obstacles = [];
    this.windmills = [];
    this.teleporters = [];

    // Create ball
    this.ball = Bodies.circle(level.tee.x, level.tee.y, this.BALL_RADIUS, {
      restitution: this.RESTITUTION,
      friction: this.FRICTION,
      frictionAir: this.AIR_FRICTION,
      label: 'ball',
      render: { fillStyle: '#ffffff' },
    });

    // Create hole (sensor)
    this.hole = Bodies.circle(level.hole.x, level.hole.y, this.HOLE_RADIUS, {
      isStatic: true,
      isSensor: true,
      label: 'hole',
    });

    World.add(this.engine.world, [this.ball, this.hole]);

    // Create obstacles
    level.obstacles.forEach((obstacle, index) => {
      const body = this.createObstacle(obstacle, index);
      if (body) {
        World.add(this.engine.world, body);
        this.obstacles.push(body);
      }
    });

    // Setup collision detection
    this.setupCollisionDetection();
  }

  private createObstacle(obstacle: Obstacle, index: number): Matter.Body | null {
    switch (obstacle.type) {
      case 'wall':
        return Bodies.rectangle(
          obstacle.x + (obstacle.width || 0) / 2,
          obstacle.y + (obstacle.height || 0) / 2,
          obstacle.width || 10,
          obstacle.height || 10,
          {
            isStatic: true,
            restitution: 0.8,
            label: `wall-${index}`,
          }
        );

      case 'sand':
        return Bodies.rectangle(
          obstacle.x + (obstacle.width || 0) / 2,
          obstacle.y + (obstacle.height || 0) / 2,
          obstacle.width || 50,
          obstacle.height || 50,
          {
            isStatic: true,
            isSensor: true,
            label: `sand-${index}`,
          }
        );

      case 'water':
        return Bodies.rectangle(
          obstacle.x + (obstacle.width || 0) / 2,
          obstacle.y + (obstacle.height || 0) / 2,
          obstacle.width || 50,
          obstacle.height || 50,
          {
            isStatic: true,
            isSensor: true,
            label: `water-${index}`,
          }
        );

      case 'bumper':
        return Bodies.circle(obstacle.x, obstacle.y, obstacle.radius || 25, {
          isStatic: true,
          restitution: this.BUMPER_RESTITUTION,
          label: `bumper-${index}`,
        });

      case 'windmill':
        const windmillBody = Bodies.rectangle(
          obstacle.x,
          obstacle.y,
          obstacle.width || 80,
          obstacle.height || 10,
          {
            isStatic: true,
            label: `windmill-${index}`,
          }
        );
        this.windmills.push({
          body: windmillBody,
          speed: obstacle.speed || 2,
          center: { x: obstacle.x, y: obstacle.y },
        });
        return windmillBody;

      case 'teleporter':
        const teleporterBody = Bodies.circle(
          obstacle.x,
          obstacle.y,
          obstacle.radius || 20,
          {
            isStatic: true,
            isSensor: true,
            label: `teleporter-${index}`,
          }
        );
        this.teleporters.push({
          body: teleporterBody,
          target: { x: obstacle.targetX || obstacle.x, y: obstacle.targetY || obstacle.y },
        });
        return teleporterBody;

      case 'ramp':
        return Bodies.rectangle(
          obstacle.x + (obstacle.width || 0) / 2,
          obstacle.y + (obstacle.height || 0) / 2,
          obstacle.width || 100,
          obstacle.height || 20,
          {
            isStatic: true,
            angle: ((obstacle.angle || 0) * Math.PI) / 180,
            label: `ramp-${index}`,
          }
        );

      default:
        return null;
    }
  }

  private setupCollisionDetection() {
    Events.on(this.engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const labels = [pair.bodyA.label, pair.bodyB.label];
        
        // Check for hole
        if (labels.includes('ball') && labels.includes('hole')) {
          this.handleHoleIn();
        }

        // Check for water hazard
        if (labels.includes('ball') && labels.some(l => l.startsWith('water-'))) {
          this.handleWaterHazard();
        }

        // Check for bumper
        if (labels.includes('ball') && labels.some(l => l.startsWith('bumper-'))) {
          this.config.onBumperHit();
        }

        // Check for teleporter
        const teleporterLabel = labels.find(l => l.startsWith('teleporter-'));
        if (labels.includes('ball') && teleporterLabel) {
          const index = parseInt(teleporterLabel.split('-')[1]);
          this.handleTeleport(index);
        }
      });
    });

    Events.on(this.engine, 'collisionActive', (event) => {
      event.pairs.forEach((pair) => {
        const labels = [pair.bodyA.label, pair.bodyB.label];
        
        // Check for sand (slow down ball)
        if (labels.includes('ball') && labels.some(l => l.startsWith('sand-'))) {
          if (this.ball) {
            Body.setVelocity(this.ball, {
              x: this.ball.velocity.x * 0.95,
              y: this.ball.velocity.y * 0.95,
            });
          }
        }
      });
    });
  }

  private handleHoleIn() {
    if (this.ball) {
      Body.setVelocity(this.ball, { x: 0, y: 0 });
      Body.setPosition(this.ball, this.config.level.hole);
    }
    this.isRunning = false;
    setTimeout(() => {
      this.config.onHoleComplete();
    }, 500);
  }

  private handleWaterHazard() {
    this.config.onWaterHazard();
  }

  private handleTeleport(index: number) {
    const teleporter = this.teleporters[index];
    if (teleporter && this.ball) {
      Body.setPosition(this.ball, teleporter.target);
      this.config.onTeleport();
    }
  }

  public shoot(angle: number, power: number) {
    if (!this.ball || this.isRunning) return;

    const normalizedPower = power / 100;
    const maxVelocity = 25;
    const velocity = normalizedPower * maxVelocity;

    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity;

    Body.setVelocity(this.ball, { x: vx, y: vy });
    this.isRunning = true;
    this.stationaryTime = 0;
    this.lastTime = performance.now();
    this.startGameLoop();
  }

  private startGameLoop() {
    const loop = (time: number) => {
      if (!this.isRunning) return;

      const delta = time - this.lastTime;
      this.lastTime = time;

      // Update windmills
      this.windmills.forEach((windmill) => {
        Body.rotate(windmill.body, (windmill.speed * delta) / 1000);
      });

      // Update physics
      Engine.update(this.engine, delta);

      // Check if ball has stopped
      if (this.ball) {
        const speed = Vector.magnitude(this.ball.velocity);
        
        if (speed < this.VELOCITY_THRESHOLD) {
          this.stationaryTime += delta;
          
          if (this.stationaryTime >= this.STATIONARY_TIME_THRESHOLD) {
            Body.setVelocity(this.ball, { x: 0, y: 0 });
            this.isRunning = false;
            this.config.onBallStopped({
              x: this.ball.position.x,
              y: this.ball.position.y,
            });
            return;
          }
        } else {
          this.stationaryTime = 0;
        }
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  public getBallPosition(): Point | null {
    return this.ball ? { x: this.ball.position.x, y: this.ball.position.y } : null;
  }

  public setBallPosition(position: Point) {
    if (this.ball) {
      Body.setPosition(this.ball, position);
      Body.setVelocity(this.ball, { x: 0, y: 0 });
    }
  }

  public resetBall() {
    if (this.ball) {
      Body.setPosition(this.ball, this.config.level.tee);
      Body.setVelocity(this.ball, { x: 0, y: 0 });
    }
    this.isRunning = false;
    this.stationaryTime = 0;
  }

  public isInMotion(): boolean {
    return this.isRunning;
  }

  public getWindmillAngles(): number[] {
    return this.windmills.map(w => w.body.angle);
  }

  public destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    World.clear(this.engine.world, false);
    Engine.clear(this.engine);
  }
}
