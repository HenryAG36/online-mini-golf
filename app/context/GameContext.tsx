'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import { Player } from '../types';
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

// Assign consistent colors based on player index
function assignPlayerColors(players: Player[]): Player[] {
  return players.map((p, i) => ({
    ...p,
    color: PLAYER_COLORS[i % PLAYER_COLORS.length],
  }));
}

export function GameProvider({ children }: GameProviderProps) {
  const [playerId] = useState(() => {
    // Try to get existing ID from sessionStorage for page refreshes
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
  const initPusher = useCallback((code: string, currentPlayerId: string) => {
    if (!isPusherConfigured) {
      // Use local-only mode
      setIsConnected(true);
      return;
    }

    // Disconnect existing connection
    if (pusherRef.current) {
      pusherRef.current.disconnect();
    }

    console.log('Initializing Pusher for room:', code);
    
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    pusherRef.current = pusher;

    const channel = pusher.subscribe(`game-${code}`);
    channelRef.current = channel;

    channel.bind('pusher:subscription_succeeded', () => {
      console.log('Pusher subscription succeeded');
      setIsConnected(true);
    });

    channel.bind('player-joined', (data: { player: Player; players: Player[] }) => {
      console.log('Player joined event received:', data);
      // Update players list with consistent colors
      setPlayers(assignPlayerColors(data.players));
    });

    channel.bind('player-left', (data: { playerId: string; players: Player[] }) => {
      console.log('Player left event received:', data);
      setPlayers(assignPlayerColors(data.players));
    });

    channel.bind('player-ready', (data: { playerId: string; isReady: boolean }) => {
      console.log('Player ready event received:', data);
      setPlayers(prev => prev.map(p => 
        p.id === data.playerId ? { ...p, isReady: data.isReady } : p
      ));
    });

    channel.bind('game-started', (data: { players: Player[] }) => {
      console.log('Game started event received:', data);
      setGamePhase('playing');
      setCurrentLevel(0);
      setCurrentPlayerIndex(0);
      if (data.players) {
        setPlayers(assignPlayerColors(data.players.map(p => ({ ...p, scores: [] }))));
      }
    });

    channel.bind('shot-recorded', (data: { playerId: string; strokes: number }) => {
      console.log('Shot recorded:', data);
    });

    channel.bind('hole-completed', (data: { playerId: string; strokes: number; currentLevel: number; nextPlayerIndex: number; allComplete: boolean }) => {
      console.log('Hole completed event received:', data);
      
      setPlayers(prev => prev.map(p => {
        if (p.id === data.playerId) {
          const newScores = [...p.scores];
          newScores[data.currentLevel] = data.strokes;
          return { ...p, scores: newScores };
        }
        return p;
      }));
      
      if (!data.allComplete) {
        setCurrentPlayerIndex(data.nextPlayerIndex);
      }
    });

    channel.bind('next-level', (data: { level: number }) => {
      console.log('Next level event received:', data);
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

    pusher.connection.bind('connected', () => {
      console.log('Pusher connected');
    });

    pusher.connection.bind('disconnected', () => {
      console.log('Pusher disconnected');
    });
  }, [isPusherConfigured]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all();
      }
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
      const response = await fetch('/api/pusher/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: `game-${roomCode}`,
          event: eventName,
          data,
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to send event:', await response.text());
      }
    } catch (err) {
      console.error('Failed to send event:', err);
    }
  }, [roomCode, isPusherConfigured]);

  const createRoom = useCallback(async (playerName: string): Promise<string> => {
    const code = generateRoomCode();
    
    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      color: PLAYER_COLORS[0],
      scores: [],
      isReady: true, // Host is always ready
    };
    
    // Initialize Pusher first so we receive events
    initPusher(code, playerId);
    
    setRoomCode(code);
    setIsHost(true);
    setPlayers([newPlayer]);
    
    // Register room and player on server
    if (isPusherConfigured) {
      try {
        await fetch('/api/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, player: newPlayer }),
        });
      } catch (err) {
        console.error('Failed to create room on server:', err);
      }
    }
    
    return code;
  }, [playerId, initPusher, isPusherConfigured]);

  const joinRoom = useCallback(async (code: string, playerName: string): Promise<void> => {
    setError(null);
    
    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      color: PLAYER_COLORS[0], // Will be reassigned
      scores: [],
      isReady: false,
    };

    // Initialize Pusher first so we receive the join confirmation
    initPusher(code, playerId);

    if (isPusherConfigured) {
      // Verify room exists and join
      const response = await fetch(`/api/rooms/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: newPlayer }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to join room');
      }

      const data = await response.json();
      // Set players with consistent colors
      setPlayers(assignPlayerColors(data.players));
    } else {
      // Local mode - just add player
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
    setError(null);
  }, [roomCode, playerId, isPusherConfigured]);

  const toggleReady = useCallback(() => {
    setPlayers(prev => {
      const updated = prev.map(p => {
        if (p.id === playerId) {
          const newReady = !p.isReady;
          // Send event after state update
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
    
    const resetPlayers = players.map(p => ({ ...p, scores: [] }));
    
    setGamePhase('playing');
    setCurrentLevel(0);
    setCurrentPlayerIndex(0);
    setPlayers(resetPlayers);
    
    sendEvent('game-started', { players: resetPlayers });
  }, [isHost, players, sendEvent]);

  const recordShot = useCallback((strokes: number) => {
    sendEvent('shot-recorded', { playerId, strokes });
  }, [playerId, sendEvent]);

  const completeHole = useCallback((strokes: number) => {
    // Update local state
    setPlayers(prev => {
      const updated = prev.map(p => {
        if (p.id === playerId) {
          const newScores = [...p.scores];
          newScores[currentLevel] = strokes;
          return { ...p, scores: newScores };
        }
        return p;
      });
      
      // Calculate next player
      const currentPlayerPos = updated.findIndex(p => p.id === playerId);
      const nextIndex = (currentPlayerPos + 1) % updated.length;
      
      // Check if all players have completed this hole
      const allComplete = updated.every(p => p.scores[currentLevel] !== undefined);
      
      // Send event with all info
      sendEvent('hole-completed', { 
        playerId, 
        strokes, 
        currentLevel,
        nextPlayerIndex: nextIndex,
        allComplete
      });
      
      // Update turn locally if not all complete
      if (!allComplete) {
        setCurrentPlayerIndex(nextIndex);
      }
      
      return updated;
    });
  }, [playerId, currentLevel, sendEvent]);

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
