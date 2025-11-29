'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import { Player, GameState } from '../types';
import { levels, PLAYER_COLORS } from '../levels';
import { v4 as uuidv4 } from 'uuid';

interface GameContextType {
  // Connection state
  playerId: string;
  roomCode: string | null;
  isHost: boolean;
  isConnected: boolean;
  error: string | null;
  
  // Game state
  players: Player[];
  currentPlayerIndex: number;
  currentLevel: number;
  gamePhase: 'lobby' | 'playing' | 'results';
  
  // Actions
  createRoom: (playerName: string) => Promise<string>;
  joinRoom: (code: string, playerName: string) => Promise<void>;
  leaveRoom: () => void;
  startGame: () => void;
  recordShot: (strokes: number) => void;
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

// Generate a simple room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function GameProvider({ children }: GameProviderProps) {
  const [playerId] = useState(() => uuidv4());
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [gamePhase, setGamePhase] = useState<'lobby' | 'playing' | 'results'>('lobby');
  
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<ReturnType<Pusher['subscribe']> | null>(null);

  // Check if Pusher is configured
  const isPusherConfigured = typeof window !== 'undefined' && 
    process.env.NEXT_PUBLIC_PUSHER_KEY && 
    process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  // Initialize Pusher connection
  const initPusher = useCallback((code: string) => {
    if (!isPusherConfigured) {
      // Use local-only mode
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
      setPlayers(data.players);
    });

    channel.bind('player-left', (data: { playerId: string; players: Player[] }) => {
      setPlayers(data.players);
    });

    channel.bind('player-ready', (data: { playerId: string; isReady: boolean }) => {
      setPlayers(prev => prev.map(p => 
        p.id === data.playerId ? { ...p, isReady: data.isReady } : p
      ));
    });

    channel.bind('game-started', () => {
      setGamePhase('playing');
      setCurrentLevel(0);
      setCurrentPlayerIndex(0);
    });

    channel.bind('shot-recorded', (data: { playerId: string; strokes: number }) => {
      // Update strokes display
    });

    channel.bind('hole-completed', (data: { playerId: string; strokes: number; nextPlayerIndex: number }) => {
      setPlayers(prev => prev.map(p => {
        if (p.id === data.playerId) {
          const newScores = [...p.scores];
          newScores[currentLevel] = data.strokes;
          return { ...p, scores: newScores };
        }
        return p;
      }));
      setCurrentPlayerIndex(data.nextPlayerIndex);
    });

    channel.bind('next-level', (data: { level: number }) => {
      if (data.level >= levels.length) {
        setGamePhase('results');
      } else {
        setCurrentLevel(data.level);
        setCurrentPlayerIndex(0);
      }
    });

    pusher.connection.bind('error', (err: Error) => {
      console.error('Pusher error:', err);
      setError('Connection error. Please try again.');
    });
  }, [isPusherConfigured, currentLevel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pusherRef.current) {
        pusherRef.current.disconnect();
      }
    };
  }, []);

  const sendEvent = useCallback(async (eventName: string, data: Record<string, unknown>) => {
    if (!roomCode) return;

    if (!isPusherConfigured) {
      // Local-only mode: directly update state
      return;
    }

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
    setRoomCode(code);
    setIsHost(true);
    
    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      color: PLAYER_COLORS[0],
      scores: [],
      isReady: false,
    };
    
    setPlayers([newPlayer]);
    initPusher(code);
    
    // Register room and player
    if (isPusherConfigured) {
      await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, player: newPlayer }),
      });
    }
    
    return code;
  }, [playerId, initPusher, isPusherConfigured]);

  const joinRoom = useCallback(async (code: string, playerName: string): Promise<void> => {
    setError(null);
    
    const colorIndex = Math.floor(Math.random() * PLAYER_COLORS.length);
    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      color: PLAYER_COLORS[colorIndex],
      scores: [],
      isReady: false,
    };

    if (isPusherConfigured) {
      // Verify room exists and join
      const response = await fetch(`/api/rooms/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: newPlayer }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to join room');
      }

      const data = await response.json();
      setPlayers(data.players.map((p: Player, i: number) => ({
        ...p,
        color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      })));
    } else {
      // Local mode - just add player
      setPlayers(prev => {
        const newPlayers = [...prev, { ...newPlayer, color: PLAYER_COLORS[prev.length % PLAYER_COLORS.length] }];
        return newPlayers;
      });
    }

    setRoomCode(code);
    setIsHost(false);
    initPusher(code);
  }, [playerId, initPusher, isPusherConfigured]);

  const leaveRoom = useCallback(() => {
    if (roomCode && isPusherConfigured) {
      fetch(`/api/rooms/${roomCode}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId }),
      });
    }

    if (channelRef.current) {
      channelRef.current.unbind_all();
    }
    if (pusherRef.current) {
      pusherRef.current.disconnect();
    }

    setRoomCode(null);
    setIsHost(false);
    setIsConnected(false);
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setCurrentLevel(0);
    setGamePhase('lobby');
  }, [roomCode, playerId, isPusherConfigured]);

  const toggleReady = useCallback(() => {
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        const newReady = !p.isReady;
        sendEvent('player-ready', { playerId, isReady: newReady });
        return { ...p, isReady: newReady };
      }
      return p;
    }));
  }, [playerId, sendEvent]);

  const startGame = useCallback(() => {
    if (!isHost) return;
    
    setGamePhase('playing');
    setCurrentLevel(0);
    setCurrentPlayerIndex(0);
    setPlayers(prev => prev.map(p => ({ ...p, scores: [] })));
    
    sendEvent('game-started', {});
  }, [isHost, sendEvent]);

  const recordShot = useCallback((strokes: number) => {
    sendEvent('shot-recorded', { playerId, strokes });
  }, [playerId, sendEvent]);

  const completeHole = useCallback((strokes: number) => {
    setPlayers(prev => {
      const updated = prev.map(p => {
        if (p.id === playerId) {
          const newScores = [...p.scores];
          newScores[currentLevel] = strokes;
          return { ...p, scores: newScores };
        }
        return p;
      });
      return updated;
    });

    // Check if all players have completed this hole
    const allComplete = players.every(p => {
      if (p.id === playerId) return true;
      return p.scores[currentLevel] !== undefined;
    });

    let nextIndex = currentPlayerIndex;
    if (!allComplete) {
      nextIndex = (currentPlayerIndex + 1) % players.length;
      setCurrentPlayerIndex(nextIndex);
    }

    sendEvent('hole-completed', { playerId, strokes, nextPlayerIndex: nextIndex });
  }, [playerId, currentLevel, currentPlayerIndex, players, sendEvent]);

  const nextLevel = useCallback(() => {
    const next = currentLevel + 1;
    if (next >= levels.length) {
      setGamePhase('results');
    } else {
      setCurrentLevel(next);
      setCurrentPlayerIndex(0);
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
      createRoom,
      joinRoom,
      leaveRoom,
      startGame,
      recordShot,
      completeHole,
      nextLevel,
      toggleReady,
    }}>
      {children}
    </GameContext.Provider>
  );
}
