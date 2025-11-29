'use client';

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Lobby } from '@/components/Lobby';
import { Game } from '@/components/Game';
import { GameRoom } from '@/lib/types';
import { getPusherClient, EVENTS, getRoomChannel } from '@/lib/pusher';
import { getLevel } from '@/lib/levels';

type Screen = 'home' | 'lobby' | 'game';

export default function Home() {
  const [screen, setScreen] = useState<Screen>('home');
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState<string>('');
  const [roomCode, setRoomCode] = useState('');
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Generate player ID on mount
  useEffect(() => {
    const storedId = localStorage.getItem('minigolf-player-id');
    const storedName = localStorage.getItem('minigolf-player-name');
    
    if (storedId) {
      setPlayerId(storedId);
    } else {
      const newId = uuidv4();
      setPlayerId(newId);
      localStorage.setItem('minigolf-player-id', newId);
    }
    
    if (storedName) {
      setPlayerName(storedName);
    }
  }, []);

  // Save name when it changes
  useEffect(() => {
    if (playerName) {
      localStorage.setItem('minigolf-player-name', playerName);
    }
  }, [playerName]);

  // Subscribe to room updates
  useEffect(() => {
    if (!room) return;
    
    const roomId = room.id;
    const pusher = getPusherClient();
    
    if (!pusher) {
      // Fall back to polling if Pusher isn't configured
      const pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/rooms?roomId=${roomId}`);
          if (res.ok) {
            const data = await res.json();
            setRoom(data.room);
            
            // Check if game started
            if (data.room.status === 'playing' && screen === 'lobby') {
              setScreen('game');
            }
          }
        } catch (e) {
          console.error('Poll failed:', e);
        }
      }, 1000);
      
      return () => clearInterval(pollInterval);
    }

    const channel = pusher.subscribe(getRoomChannel(roomId));

    channel.bind(EVENTS.PLAYER_JOINED, (data: { room: GameRoom }) => {
      setRoom(data.room);
    });

    channel.bind(EVENTS.PLAYER_LEFT, (data: { room: GameRoom }) => {
      setRoom(data.room);
    });

    channel.bind(EVENTS.GAME_STARTED, (data: { room: GameRoom }) => {
      setRoom(data.room);
      setScreen('game');
    });

    channel.bind(EVENTS.GAME_STATE, (data: { room: GameRoom }) => {
      setRoom(data.room);
      if (data.room.status === 'playing' && screen === 'lobby') {
        setScreen('game');
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(getRoomChannel(roomId));
    };
  }, [room, screen]);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, playerName: playerName.trim() }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room');
      }
      
      setRoom(data.room);
      setScreen('lobby');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomId: roomCode.toUpperCase().trim(), 
          playerId, 
          playerName: playerName.trim() 
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join room');
      }
      
      setRoom(data.room);
      setScreen('lobby');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (!room) return;
    
    const firstLevel = getLevel(1)!;
    const updatedPlayers = room.players.map(p => ({
      ...p,
      ball: {
        position: { x: firstLevel.tee.x, y: firstLevel.tee.y },
        velocity: { x: 0, y: 0 },
        isMoving: false,
        inHole: false,
      },
      isReady: true,
    }));

    const startedRoom: GameRoom = {
      ...room,
      players: updatedPlayers,
      status: 'playing',
      currentLevel: 1,
      currentPlayerIndex: 0,
    };

    try {
      await fetch('/api/rooms/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomId: room.id, 
          room: startedRoom,
          event: EVENTS.GAME_STARTED,
        }),
      });
      
      setRoom(startedRoom);
      setScreen('game');
    } catch (err) {
      console.error('Failed to start game:', err);
    }
  };

  const handleLeave = () => {
    setRoom(null);
    setRoomCode('');
    setScreen('home');
  };

  const handleRoomUpdate = (updatedRoom: GameRoom) => {
    setRoom(updatedRoom);
  };

  // Render screens
  if (screen === 'lobby' && room) {
    return (
      <Lobby 
        room={room} 
        playerId={playerId}
        onStartGame={handleStartGame}
        onLeave={handleLeave}
      />
    );
  }

  if (screen === 'game' && room) {
    return (
      <Game 
        room={room}
        playerId={playerId}
        onRoomUpdate={handleRoomUpdate}
        onLeave={handleLeave}
      />
    );
  }

  // Home screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-blob animation-delay-4000" />
        
        {/* Golf balls */}
        <div className="absolute top-[15%] left-[10%] w-16 h-16 bg-white rounded-full opacity-10 animate-float" />
        <div className="absolute top-[60%] right-[15%] w-12 h-12 bg-white rounded-full opacity-10 animate-float-delayed" />
        <div className="absolute bottom-[20%] left-[20%] w-20 h-20 bg-white rounded-full opacity-5 animate-float" />
        <div className="absolute top-[30%] right-[25%] w-8 h-8 bg-white rounded-full opacity-10 animate-float-delayed" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <span className="text-8xl animate-bounce-slow">⛳</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-2 font-serif tracking-tight">
            Mini<span className="text-yellow-400">Golf</span>
          </h1>
          <p className="text-emerald-200 text-lg">
            Play with friends • Up to 4 players
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">
          {/* Name Input */}
          <div className="mb-6">
            <label className="block text-emerald-200 text-sm mb-2">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name..."
              maxLength={20}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 
                       focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Create Room Button */}
          <button
            onClick={handleCreateRoom}
            disabled={isLoading}
            className="w-full py-4 mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl 
                     hover:from-yellow-500 hover:to-orange-600 transition-all transform hover:scale-[1.02] 
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                     shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating...
              </span>
            ) : (
              'Create New Game 🎮'
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-transparent px-4 text-white/40 text-sm">or join existing</span>
            </div>
          </div>

          {/* Join Room */}
          <div className="flex gap-2">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Room Code"
              maxLength={6}
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 
                       focus:outline-none focus:ring-2 focus:ring-emerald-400/50 uppercase font-mono tracking-widest text-center"
            />
            <button
              onClick={handleJoinRoom}
              disabled={isLoading || !roomCode}
              className="px-6 py-3 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-emerald-300/60 text-sm">
            10 unique holes • Real-time multiplayer
          </p>
          <div className="flex justify-center gap-4 mt-3 text-2xl">
            <span title="Water hazards">💧</span>
            <span title="Sand traps">🏖️</span>
            <span title="Windmills">🌬️</span>
            <span title="Bouncers">🔴</span>
          </div>
        </div>
      </div>
    </div>
  );
}
