'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import { Player, Vector2 } from '../types';
import { levels, PLAYER_COLORS } from '../levels';
import { v4 as uuidv4 } from 'uuid';

interface BallState {
  position: Vector2;
  velocity: Vector2;
  isMoving: boolean;
}

interface PlayerWithBall extends Player {
  ballState: BallState;
  hasFinishedHole: boolean;
}

interface GameContextType {
  playerId: string;
  roomCode: string | null;
  isHost: boolean;
  isConnected: boolean;
  error: string | null;
  players: PlayerWithBall[];
  currentPlayerIndex: number;
  currentLevel: number;
  gamePhase: 'lobby' | 'playing' | 'results';
  isMyTurn: boolean;
  pendingCollisionVelocity: Vector2 | null;
  clearPendingCollision: () => void;
  createRoom: (playerName: string) => Promise<string>;
  joinRoom: (code: string, playerName: string) => Promise<void>;
  leaveRoom: () => void;
  startGame: () => void;
  updateBallPosition: (position: Vector2, velocity: Vector2, isMoving: boolean) => void;
  broadcastCollision: (targetPlayerId: string, newVelocity: Vector2) => void;
  endTurn: () => void;
  completeHole: (strokes: number) => void;
  nextLevel: () => void;
  toggleReady: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

interface GameProviderProps {
  children: React.ReactNode;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function assignPlayerColors(players: PlayerWithBall[]): PlayerWithBall[] {
  return players.map((p, i) => ({
    ...p,
    color: PLAYER_COLORS[i % PLAYER_COLORS.length],
  }));
}

export function GameProvider({ children }: GameProviderProps) {
  const [playerId] = useState(() => {
    if (typeof window !== 'undefined') {
      const existing = sessionStorage.getItem('minigolf-player-id');
      if (existing) return existing;
      const newId = uuidv4();
      sessionStorage.setItem('minigolf-player-id', newId);
      return newId;
    }
    return uuidv4();
  });
  
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerWithBall[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [gamePhase, setGamePhase] = useState<'lobby' | 'playing' | 'results'>('lobby');
  
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<ReturnType<Pusher['subscribe']> | null>(null);
  const lastBallUpdateRef = useRef<number>(0);
  const [pendingCollisionVelocity, setPendingCollisionVelocity] = useState<Vector2 | null>(null);
  
  const clearPendingCollision = useCallback(() => {
    setPendingCollisionVelocity(null);
  }, []);

  const isPusherConfigured = typeof window !== 'undefined' && 
    process.env.NEXT_PUBLIC_PUSHER_KEY && 
    process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  // Check if it's my turn - I'm the current player and haven't finished the hole
  const myPlayer = players.find(p => p.id === playerId);
  const currentPlayer = players[currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === playerId && !myPlayer?.hasFinishedHole;

  const initPusher = useCallback((code: string, myPlayerId: string) => {
    if (!isPusherConfigured) {
      setIsConnected(true);
      return;
    }

    if (pusherRef.current) {
      pusherRef.current.disconnect();
    }

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    pusherRef.current = pusher;
    const channel = pusher.subscribe(`game-${code}`);
    channelRef.current = channel;

    channel.bind('pusher:subscription_succeeded', () => {
      setIsConnected(true);
    });

    channel.bind('player-joined', (data: { player: Player; players: Player[] }) => {
      setPlayers(prev => {
        const newPlayers: PlayerWithBall[] = data.players.map(p => {
          const existing = prev.find(ep => ep.id === p.id);
          return {
            ...p,
            ballState: existing?.ballState || { position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, isMoving: false },
            hasFinishedHole: existing?.hasFinishedHole || false,
          };
        });
        return assignPlayerColors(newPlayers);
      });
    });

    channel.bind('player-left', (data: { playerId: string; players: Player[] }) => {
      setPlayers(prev => {
        const newPlayers: PlayerWithBall[] = data.players.map(p => {
          const existing = prev.find(ep => ep.id === p.id);
          return {
            ...p,
            ballState: existing?.ballState || { position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, isMoving: false },
            hasFinishedHole: existing?.hasFinishedHole || false,
          };
        });
        return assignPlayerColors(newPlayers);
      });
    });

    channel.bind('player-ready', (data: { playerId: string; isReady: boolean }) => {
      setPlayers(prev => prev.map(p => 
        p.id === data.playerId ? { ...p, isReady: data.isReady } : p
      ));
    });

    channel.bind('game-started', (data: { players: Player[]; level: number }) => {
      const level = levels[data.level || 0];
      setGamePhase('playing');
      setCurrentLevel(data.level || 0);
      setCurrentPlayerIndex(0);
      setPlayers(prev => assignPlayerColors(prev.map(p => ({
        ...p,
        scores: [],
        hasFinishedHole: false,
        ballState: { position: { x: level.tee.x, y: level.tee.y }, velocity: { x: 0, y: 0 }, isMoving: false },
      }))));
    });

    channel.bind('ball-update', (data: { playerId: string; position: Vector2; velocity: Vector2; isMoving: boolean }) => {
      if (data.playerId === myPlayerId) return;
      setPlayers(prev => prev.map(p => 
        p.id === data.playerId 
          ? { ...p, ballState: { position: data.position, velocity: data.velocity, isMoving: data.isMoving } }
          : p
      ));
    });

    channel.bind('ball-collision', (data: { targetPlayerId: string; newVelocity: Vector2 }) => {
      console.log('Received ball-collision event:', data, 'myPlayerId:', myPlayerId);
      if (data.targetPlayerId === myPlayerId) {
        console.log('Collision is for me! Setting velocity:', data.newVelocity);
        setPendingCollisionVelocity(data.newVelocity);
      }
    });

    channel.bind('turn-ended', (data: { playerId: string; nextPlayerIndex: number }) => {
      setCurrentPlayerIndex(data.nextPlayerIndex);
    });

    channel.bind('hole-completed', (data: { playerId: string; strokes: number; currentLevel: number; nextPlayerIndex: number }) => {
      setPlayers(prev => prev.map(p => {
        if (p.id === data.playerId) {
          const newScores = [...p.scores];
          newScores[data.currentLevel] = data.strokes;
          return { ...p, scores: newScores, hasFinishedHole: true };
        }
        return p;
      }));
      setCurrentPlayerIndex(data.nextPlayerIndex);
    });

    channel.bind('next-level', (data: { level: number }) => {
      if (data.level >= levels.length) {
        setGamePhase('results');
      } else {
        const level = levels[data.level];
        setCurrentLevel(data.level);
        setCurrentPlayerIndex(0);
        setPlayers(prev => prev.map(p => ({
          ...p,
          hasFinishedHole: false,
          ballState: { position: { x: level.tee.x, y: level.tee.y }, velocity: { x: 0, y: 0 }, isMoving: false },
        })));
      }
    });

    pusher.connection.bind('error', (err: Error) => {
      console.error('Pusher error:', err);
      setError('Connection error. Please try again.');
    });
  }, [isPusherConfigured]);

  useEffect(() => {
    return () => {
      if (channelRef.current) channelRef.current.unbind_all();
      if (pusherRef.current) pusherRef.current.disconnect();
    };
  }, []);

  const sendEvent = useCallback(async (eventName: string, data: Record<string, unknown>) => {
    if (!roomCode || !isPusherConfigured) return;

    try {
      await fetch('/api/pusher/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: `game-${roomCode}`,
          event: eventName,
          data,
        }),
      });
    } catch (err) {
      console.error('Failed to send event:', err);
    }
  }, [roomCode, isPusherConfigured]);

  const createRoom = useCallback(async (playerName: string): Promise<string> => {
    const code = generateRoomCode();
    
    const newPlayer: PlayerWithBall = {
      id: playerId,
      name: playerName,
      color: PLAYER_COLORS[0],
      scores: [],
      isReady: true,
      ballState: { position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, isMoving: false },
      hasFinishedHole: false,
    };
    
    initPusher(code, playerId);
    setRoomCode(code);
    setIsHost(true);
    setPlayers([newPlayer]);
    
    if (isPusherConfigured) {
      try {
        await fetch('/api/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, player: { id: newPlayer.id, name: newPlayer.name, color: newPlayer.color, scores: [], isReady: true } }),
        });
      } catch (err) {
        console.error('Failed to create room:', err);
      }
    }
    
    return code;
  }, [playerId, initPusher, isPusherConfigured]);

  const joinRoom = useCallback(async (code: string, playerName: string): Promise<void> => {
    setError(null);
    
    const newPlayer: PlayerWithBall = {
      id: playerId,
      name: playerName,
      color: PLAYER_COLORS[0],
      scores: [],
      isReady: false,
      ballState: { position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, isMoving: false },
      hasFinishedHole: false,
    };

    initPusher(code, playerId);

    if (isPusherConfigured) {
      const response = await fetch(`/api/rooms/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: { id: newPlayer.id, name: newPlayer.name, color: newPlayer.color, scores: [], isReady: false } }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to join room');
      }

      const data = await response.json();
      const playersWithBall: PlayerWithBall[] = data.players.map((p: Player) => ({
        ...p,
        ballState: { position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, isMoving: false },
        hasFinishedHole: false,
      }));
      setPlayers(assignPlayerColors(playersWithBall));
    } else {
      setPlayers(prev => assignPlayerColors([...prev, newPlayer]));
    }

    setRoomCode(code);
    setIsHost(false);
  }, [playerId, initPusher, isPusherConfigured]);

  const leaveRoom = useCallback(() => {
    if (roomCode && isPusherConfigured) {
      fetch(`/api/rooms/${roomCode}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      }).catch(err => console.error('Failed to leave room:', err));
    }

    if (channelRef.current) channelRef.current.unbind_all();
    if (pusherRef.current) pusherRef.current.disconnect();

    setRoomCode(null);
    setIsHost(false);
    setIsConnected(false);
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setCurrentLevel(0);
    setGamePhase('lobby');
    setError(null);
  }, [roomCode, playerId, isPusherConfigured]);

  const toggleReady = useCallback(() => {
    setPlayers(prev => {
      const updated = prev.map(p => {
        if (p.id === playerId) {
          const newReady = !p.isReady;
          sendEvent('player-ready', { playerId, isReady: newReady });
          return { ...p, isReady: newReady };
        }
        return p;
      });
      return updated;
    });
  }, [playerId, sendEvent]);

  const startGame = useCallback(() => {
    if (!isHost) return;
    
    const level = levels[0];
    const resetPlayers = players.map(p => ({ 
      ...p, 
      scores: [],
      hasFinishedHole: false,
      ballState: { position: { x: level.tee.x, y: level.tee.y }, velocity: { x: 0, y: 0 }, isMoving: false },
    }));
    
    setGamePhase('playing');
    setCurrentLevel(0);
    setCurrentPlayerIndex(0);
    setPlayers(resetPlayers);
    
    sendEvent('game-started', { players: resetPlayers.map(p => ({ id: p.id, name: p.name, color: p.color, scores: [], isReady: p.isReady })), level: 0 });
  }, [isHost, players, sendEvent]);

  const updateBallPosition = useCallback((position: Vector2, velocity: Vector2, isMoving: boolean) => {
    const now = performance.now();
    if (now - lastBallUpdateRef.current < 16) return; // ~60 fps
    lastBallUpdateRef.current = now;

    setPlayers(prev => prev.map(p => 
      p.id === playerId 
        ? { ...p, ballState: { position, velocity, isMoving } }
        : p
    ));

    sendEvent('ball-update', { playerId, position, velocity, isMoving });
  }, [playerId, sendEvent]);

  const broadcastCollision = useCallback((targetPlayerId: string, newVelocity: Vector2) => {
    sendEvent('ball-collision', { targetPlayerId, newVelocity });
  }, [sendEvent]);

  // End turn - move to next player who hasn't finished
  const endTurn = useCallback(() => {
    setPlayers(prev => {
      // Find next player who hasn't finished
      let nextIndex = currentPlayerIndex;
      let attempts = 0;
      do {
        nextIndex = (nextIndex + 1) % prev.length;
        attempts++;
      } while (prev[nextIndex]?.hasFinishedHole && attempts < prev.length);

      // If all players finished, stay on current
      if (attempts >= prev.length) {
        return prev;
      }

      setCurrentPlayerIndex(nextIndex);
      sendEvent('turn-ended', { playerId, nextPlayerIndex: nextIndex });
      return prev;
    });
  }, [currentPlayerIndex, playerId, sendEvent]);

  const completeHole = useCallback((strokes: number) => {
    setPlayers(prev => {
      const updated = prev.map(p => {
        if (p.id === playerId) {
          const newScores = [...p.scores];
          newScores[currentLevel] = strokes;
          return { ...p, scores: newScores, hasFinishedHole: true };
        }
        return p;
      });
      
      // Find next player who hasn't finished
      let nextIndex = currentPlayerIndex;
      let attempts = 0;
      do {
        nextIndex = (nextIndex + 1) % updated.length;
        attempts++;
      } while (updated[nextIndex]?.hasFinishedHole && attempts < updated.length);

      // If this was the last player, keep index
      const allFinished = updated.every(p => p.hasFinishedHole);
      if (!allFinished) {
        setCurrentPlayerIndex(nextIndex);
      }

      sendEvent('hole-completed', { playerId, strokes, currentLevel, nextPlayerIndex: nextIndex });
      
      return updated;
    });
  }, [playerId, currentLevel, currentPlayerIndex, sendEvent]);

  const nextLevel = useCallback(() => {
    const next = currentLevel + 1;
    
    if (next >= levels.length) {
      setGamePhase('results');
    } else {
      const level = levels[next];
      setCurrentLevel(next);
      setCurrentPlayerIndex(0);
      setPlayers(prev => prev.map(p => ({
        ...p,
        hasFinishedHole: false,
        ballState: { position: { x: level.tee.x, y: level.tee.y }, velocity: { x: 0, y: 0 }, isMoving: false },
      })));
    }
    
    sendEvent('next-level', { level: next });
  }, [currentLevel, sendEvent]);

  return (
    <GameContext.Provider value={{
      playerId,
      roomCode,
      isHost,
      isConnected,
      error,
      players,
      currentPlayerIndex,
      currentLevel,
      gamePhase,
      isMyTurn,
      pendingCollisionVelocity,
      clearPendingCollision,
      createRoom,
      joinRoom,
      leaveRoom,
      startGame,
      updateBallPosition,
      broadcastCollision,
      endTurn,
      completeHole,
      nextLevel,
      toggleReady,
    }}>
      {children}
    </GameContext.Provider>
  );
}
