'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { GameState, Player, Point, PLAYER_COLORS, PLAYER_AVATARS } from '@/types/game';
import { LEVELS } from '@/lib/levels';
import { getPusherClient, getChannelName, EVENTS } from '@/lib/pusher';
import GameCanvas from '@/components/GameCanvas';
import Lobby from '@/components/Lobby';
import Scoreboard from '@/components/Scoreboard';
import HoleComplete from '@/components/HoleComplete';
import GameResults from '@/components/GameResults';

export default function GamePage() {
  const params = useParams();
  const roomId = params.roomId as string;
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [isJoining, setIsJoining] = useState(true);
  const [error, setError] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<any>(null);

  // Get or create player ID from localStorage
  useEffect(() => {
    const storedPlayerId = localStorage.getItem('minigolf-player-id');
    const storedPlayerName = localStorage.getItem('minigolf-player-name');
    
    if (storedPlayerId) {
      setPlayerId(storedPlayerId);
    } else {
      const newId = uuidv4();
      localStorage.setItem('minigolf-player-id', newId);
      setPlayerId(newId);
    }
    
    if (storedPlayerName) {
      setPlayerName(storedPlayerName);
    }
  }, []);

  // Connect to Pusher and join room
  useEffect(() => {
    if (!playerId || !playerName || !roomId) return;

    const pusher = getPusherClient();
    const channelName = getChannelName(roomId);
    
    // Subscribe to channel
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    channel.bind('pusher:subscription_succeeded', () => {
      setIsConnected(true);
      joinRoom();
    });

    // Bind to events
    channel.bind(EVENTS.PLAYER_JOINED, (data: any) => {
      setGameState(data.state);
    });

    channel.bind(EVENTS.PLAYER_LEFT, (data: any) => {
      setGameState(data.state);
    });

    channel.bind(EVENTS.PLAYER_READY, (data: any) => {
      setGameState(data.state);
    });

    channel.bind(EVENTS.GAME_STARTED, (data: any) => {
      setGameState(data.state);
    });

    channel.bind(EVENTS.SHOT_TAKEN, (data: any) => {
      setGameState(data.state);
    });

    channel.bind(EVENTS.BALL_STOPPED, (data: any) => {
      setGameState(data.state);
    });

    channel.bind(EVENTS.HOLE_COMPLETE, (data: any) => {
      setGameState(data.state);
    });

    channel.bind(EVENTS.NEXT_HOLE, (data: any) => {
      setGameState(data.state);
    });

    channel.bind(EVENTS.GAME_STATE_SYNC, (data: any) => {
      setGameState(data.state);
    });

    // Handle connection errors
    pusher.connection.bind('error', (err: any) => {
      console.error('Pusher connection error:', err);
      // If Pusher fails, still try to join the room (offline mode)
      joinRoom();
    });

    // If Pusher doesn't connect within 3 seconds, try joining anyway (offline/demo mode)
    const timeout = setTimeout(() => {
      if (!isConnected) {
        console.log('Pusher connection timeout, joining in offline mode');
        joinRoom();
      }
    }, 3000);

    return () => {
      clearTimeout(timeout);
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [playerId, playerName, roomId]);

  const joinRoom = async () => {
    if (!playerId || !playerName) return;

    try {
      const colorIndex = 0; // Will be adjusted on server
      const newPlayer: Player = {
        id: playerId,
        name: playerName,
        color: PLAYER_COLORS[colorIndex],
        avatar: PLAYER_AVATARS[colorIndex],
        scores: [],
        currentStrokes: 0,
        isHost: false,
        isReady: false,
        hasFinishedHole: false,
      };

      const response = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join-room',
          roomId,
          data: { player: newPlayer },
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setGameState(result.state);
        setIsJoining(false);
      } else {
        setError(result.error || 'Failed to join room');
      }
    } catch (err) {
      console.error('Failed to join room:', err);
      setError('Failed to connect to server');
    }
  };

  const handleSetName = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('minigolf-player-name', name);
  };

  const handleReady = async () => {
    await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'player-ready',
        roomId,
        data: { playerId },
      }),
    });
  };

  const handleStartGame = async () => {
    await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start-game',
        roomId,
        data: {},
      }),
    });
  };

  const handleShoot = async (angle: number, power: number) => {
    await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'take-shot',
        roomId,
        data: {
          playerId,
          shot: { angle, power },
        },
      }),
    });
  };

  const handleBallStopped = async (position: Point) => {
    await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ball-stopped',
        roomId,
        data: { playerId, position },
      }),
    });
  };

  const handleHoleComplete = async () => {
    await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'hole-complete',
        roomId,
        data: { playerId },
      }),
    });
  };

  const handleWaterHazard = () => {
    // Add a stroke penalty and reset ball (handled locally in GameCanvas)
    console.log('Water hazard!');
  };

  const handleNextHole = async () => {
    await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'next-hole',
        roomId,
        data: {},
      }),
    });
  };

  const handlePlayAgain = async () => {
    await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'play-again',
        roomId,
        data: {},
      }),
    });
  };

  // Name entry screen
  if (isJoining && !playerName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">⛳</div>
            <h1 className="text-3xl font-display text-white mb-2">Welcome to Minigolf!</h1>
            <p className="text-white/70">Enter your name to join the game</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') as string;
              if (name.trim()) {
                handleSetName(name.trim());
              }
            }}
            className="space-y-4"
          >
            <input
              type="text"
              name="name"
              placeholder="Your name..."
              maxLength={20}
              className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-lg"
              autoFocus
            />
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-[1.02] shadow-lg"
            >
              Join Game 🎯
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">⛳</div>
          <p className="text-white text-xl">Loading game...</p>
        </div>
      </div>
    );
  }

  // Lobby phase
  if (gameState.phase === 'lobby') {
    return (
      <Lobby
        gameState={gameState}
        currentPlayerId={playerId}
        onReady={handleReady}
        onStartGame={handleStartGame}
      />
    );
  }

  // Game finished
  if (gameState.phase === 'finished') {
    return (
      <GameResults
        players={gameState.players}
        winnerId={gameState.winner}
        currentPlayerId={playerId}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  // Playing phase
  const currentLevel = LEVELS[gameState.currentLevel - 1];
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const myPlayer = gameState.players.find(p => p.id === playerId);
  const isMyTurn = currentPlayer?.id === playerId && !myPlayer?.hasFinishedHole;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-display text-white flex items-center gap-2">
              ⛳ Minigolf
            </h1>
            <div className="hidden sm:flex items-center gap-2 text-white/60 text-sm">
              <span className="bg-white/10 px-3 py-1 rounded-full">
                Hole {gameState.currentLevel} of {LEVELS.length}
              </span>
              <span className="bg-white/10 px-3 py-1 rounded-full">
                {currentLevel?.name}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isMyTurn && !gameState.ballInMotion && (
              <span className="bg-yellow-500/20 text-yellow-400 px-4 py-1 rounded-full text-sm font-medium animate-pulse">
                Your Turn!
              </span>
            )}
            {gameState.ballInMotion && (
              <span className="bg-blue-500/20 text-blue-400 px-4 py-1 rounded-full text-sm font-medium">
                Ball in motion...
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 flex flex-col lg:flex-row gap-6">
        {/* Game Canvas */}
        <div className="flex-1">
          <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">{currentLevel?.name}</h2>
                <p className="text-white/60 text-sm">Par {currentLevel?.par}</p>
              </div>
              {myPlayer && !myPlayer.hasFinishedHole && (
                <div className="text-right">
                  <p className="text-white/60 text-sm">Your Strokes</p>
                  <p className="text-2xl font-bold text-white">{myPlayer.currentStrokes}</p>
                </div>
              )}
            </div>
            
            {currentLevel && (
              <GameCanvas
                level={currentLevel}
                currentPlayer={currentPlayer || null}
                isMyTurn={isMyTurn}
                onShoot={handleShoot}
                onBallStopped={handleBallStopped}
                onHoleComplete={handleHoleComplete}
                onWaterHazard={handleWaterHazard}
                disabled={gameState.ballInMotion || myPlayer?.hasFinishedHole}
              />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-80 space-y-4">
          <Scoreboard
            players={gameState.players}
            currentLevel={gameState.currentLevel}
            currentPlayerId={playerId}
            currentPlayerIndex={gameState.currentPlayerIndex}
          />

          {/* Legend */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
            <h3 className="text-white/80 font-semibold mb-3">Legend</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-white/60">
                <div className="w-4 h-4 rounded bg-[#F4D03F]"></div>
                <span>Sand (slow)</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <div className="w-4 h-4 rounded bg-[#4169E1]"></div>
                <span>Water (reset)</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <div className="w-4 h-4 rounded-full bg-[#FFD700]"></div>
                <span>Bumper</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <div className="w-4 h-4 rounded-full bg-[#9B59B6]"></div>
                <span>Teleporter</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Hole Complete Modal */}
      {gameState.phase === 'between-holes' && (
        <HoleComplete
          players={gameState.players}
          currentLevel={gameState.currentLevel}
          currentPlayerId={playerId}
          onNextHole={handleNextHole}
          isHost={myPlayer?.isHost || false}
        />
      )}
    </div>
  );
}
