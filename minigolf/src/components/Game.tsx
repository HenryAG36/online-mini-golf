'use client';

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { GameCanvas } from './GameCanvas';
import { Scoreboard } from './Scoreboard';
import { GameRoom, Ball } from '@/lib/types';
import { getLevel, getTotalLevels } from '@/lib/levels';
import { calculateShotVelocity } from '@/lib/physics';
import { getPusherClient, EVENTS, getRoomChannel } from '@/lib/pusher';

interface GameProps {
  room: GameRoom;
  playerId: string;
  onRoomUpdate: (room: GameRoom) => void;
  onLeave: () => void;
}

export const Game: React.FC<GameProps> = ({ room, playerId, onRoomUpdate, onLeave }) => {
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [localRoom, setLocalRoom] = useState(room);
  const channelRef = useRef<ReturnType<typeof import('pusher-js').default.prototype.subscribe> | null>(null);
  
  const level = getLevel(localRoom.currentLevel)!;
  const currentPlayer = localRoom.players[localRoom.currentPlayerIndex];
  const myPlayer = localRoom.players.find(p => p.id === playerId);
  const isMyTurn = currentPlayer?.id === playerId;

  // Subscribe to Pusher channel for real-time updates
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(getRoomChannel(localRoom.id));
    channelRef.current = channel;

    channel.bind(EVENTS.GAME_STATE, (data: { room: GameRoom }) => {
      setLocalRoom(data.room);
      onRoomUpdate(data.room);
    });

    channel.bind(EVENTS.BALL_UPDATE, (data: { playerId: string; ball: Ball }) => {
      setLocalRoom(prev => ({
        ...prev,
        players: prev.players.map(p =>
          p.id === data.playerId ? { ...p, ball: data.ball } : p
        ),
      }));
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(getRoomChannel(localRoom.id));
    };
  }, [localRoom.id, onRoomUpdate]);

  // Sync local room with prop
  useEffect(() => {
    setLocalRoom(room);
  }, [room]);

  // Handle shot
  const handleShot = useCallback(async (angle: number, power: number) => {
    if (!isMyTurn || !myPlayer || myPlayer.ball.isMoving || myPlayer.ball.inHole) return;

    const velocity = calculateShotVelocity(angle, power);
    const newBall: Ball = {
      ...myPlayer.ball,
      velocity,
      isMoving: true,
    };

    // Update local state immediately
    const updatedPlayers = localRoom.players.map(p =>
      p.id === playerId 
        ? { ...p, ball: newBall, currentStrokes: p.currentStrokes + 1 }
        : p
    );
    
    const updatedRoom = { ...localRoom, players: updatedPlayers };
    setLocalRoom(updatedRoom);

    // Sync to server
    try {
      await fetch('/api/rooms/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomId: localRoom.id, 
          room: updatedRoom,
          event: EVENTS.SHOT_MADE,
        }),
      });
    } catch (error) {
      console.error('Failed to sync shot:', error);
    }
  }, [isMyTurn, myPlayer, localRoom, playerId]);

  // Handle ball update
  const handleBallUpdate = useCallback((ballPlayerId: string, ball: Ball) => {
    setLocalRoom(prev => {
      const updatedPlayers = prev.players.map(p =>
        p.id === ballPlayerId ? { ...p, ball } : p
      );
      return { ...prev, players: updatedPlayers };
    });
  }, []);

  // Handle turn end
  const handleTurnEnd = useCallback(async () => {
    const allHoled = localRoom.players.every(p => p.ball.inHole);
    
    if (allHoled) {
      // Move to next level or end game
      const nextLevelNum = localRoom.currentLevel + 1;
      
      if (nextLevelNum > getTotalLevels()) {
        // Game finished
        const updatedPlayers = localRoom.players.map(p => ({
          ...p,
          strokes: [...p.strokes, p.currentStrokes],
          totalStrokes: p.totalStrokes + p.currentStrokes,
        }));

        const finishedRoom: GameRoom = {
          ...localRoom,
          players: updatedPlayers,
          status: 'finished',
        };

        setLocalRoom(finishedRoom);
        onRoomUpdate(finishedRoom);
        setShowScoreboard(true);

        await fetch('/api/rooms/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            roomId: localRoom.id, 
            room: finishedRoom,
            event: EVENTS.GAME_STATE,
          }),
        });
        return;
      }

      // Next level
      const nextLevel = getLevel(nextLevelNum)!;
      const updatedPlayers = localRoom.players.map(p => ({
        ...p,
        strokes: [...p.strokes, p.currentStrokes],
        totalStrokes: p.totalStrokes + p.currentStrokes,
        currentStrokes: 0,
        ball: {
          position: { x: nextLevel.tee.x, y: nextLevel.tee.y },
          velocity: { x: 0, y: 0 },
          isMoving: false,
          inHole: false,
        },
      }));

      const newRoom: GameRoom = {
        ...localRoom,
        players: updatedPlayers,
        currentLevel: nextLevelNum,
        currentPlayerIndex: 0,
      };

      setLocalRoom(newRoom);
      onRoomUpdate(newRoom);

      await fetch('/api/rooms/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomId: localRoom.id, 
          room: newRoom,
          event: EVENTS.LEVEL_COMPLETE,
        }),
      });
    } else {
      // Next player
      let nextIndex = localRoom.currentPlayerIndex;
      const playersCount = localRoom.players.length;
      
      for (let i = 0; i < playersCount; i++) {
        nextIndex = (nextIndex + 1) % playersCount;
        if (!localRoom.players[nextIndex].ball.inHole) {
          break;
        }
      }

      const newRoom = { ...localRoom, currentPlayerIndex: nextIndex };
      setLocalRoom(newRoom);
      onRoomUpdate(newRoom);

      await fetch('/api/rooms/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          roomId: localRoom.id, 
          room: newRoom,
          event: EVENTS.TURN_CHANGED,
        }),
      });
    }
  }, [localRoom, onRoomUpdate]);

  // Handle play again
  const handlePlayAgain = async () => {
    const firstLevel = getLevel(1)!;
    const resetPlayers = localRoom.players.map(p => ({
      ...p,
      strokes: [],
      totalStrokes: 0,
      currentStrokes: 0,
      ball: {
        position: { x: firstLevel.tee.x, y: firstLevel.tee.y },
        velocity: { x: 0, y: 0 },
        isMoving: false,
        inHole: false,
      },
    }));

    const newRoom: GameRoom = {
      ...localRoom,
      players: resetPlayers,
      currentLevel: 1,
      currentPlayerIndex: 0,
      status: 'playing',
    };

    setLocalRoom(newRoom);
    setShowScoreboard(false);
    onRoomUpdate(newRoom);

    await fetch('/api/rooms/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        roomId: localRoom.id, 
        room: newRoom,
        event: EVENTS.GAME_STARTED,
      }),
    });
  };

  if (localRoom.status === 'finished') {
    return (
      <Scoreboard 
        room={localRoom} 
        playerId={playerId}
        isFullScreen
        onPlayAgain={localRoom.hostId === playerId ? handlePlayAgain : undefined}
        onLeave={onLeave}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white font-serif">⛳ MiniGolf</h1>
            <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1">
              <span className="text-white/60 text-sm">Room:</span>
              <span className="text-white font-mono">{localRoom.id}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowScoreboard(true)}
              className="px-3 py-1.5 bg-white/10 rounded-lg text-white text-sm hover:bg-white/20 transition-colors"
            >
              📊 Scores
            </button>
            <button
              onClick={onLeave}
              className="px-3 py-1.5 bg-red-500/20 rounded-lg text-red-300 text-sm hover:bg-red-500/30 transition-colors"
            >
              Leave
            </button>
          </div>
        </div>
      </header>

      {/* Game Info Bar */}
      <div className="bg-black/20 px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-white/60">
              Hole <span className="text-white font-bold">{localRoom.currentLevel}</span>/{getTotalLevels()}
            </span>
            <span className="text-white/60">
              &ldquo;{level.name}&rdquo;
            </span>
            <span className="text-white/60">
              Par <span className="text-white">{level.par}</span>
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-white/60">Turn:</span>
            <div 
              className="w-5 h-5 rounded-full"
              style={{ backgroundColor: currentPlayer?.color }}
            />
            <span className="text-white font-medium">
              {currentPlayer?.name}
              {isMyTurn && <span className="text-yellow-400 ml-1">(You!)</span>}
            </span>
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <GameCanvas
            level={level}
            players={localRoom.players}
            currentPlayerId={playerId}
            currentTurnPlayerId={currentPlayer?.id || ''}
            onShot={handleShot}
            onBallUpdate={handleBallUpdate}
            onTurnEnd={handleTurnEnd}
            isMyTurn={isMyTurn}
          />
        </div>
      </main>

      {/* Players Footer */}
      <footer className="bg-black/30 backdrop-blur-sm border-t border-white/10 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {localRoom.players.map(player => (
              <div 
                key={player.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  player.id === currentPlayer?.id 
                    ? 'bg-white/20 ring-2 ring-white/40' 
                    : 'bg-white/5'
                }`}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg"
                  style={{ backgroundColor: player.color }}
                >
                  {player.ball.inHole ? '✓' : player.currentStrokes}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">
                    {player.name}
                    {player.id === playerId && <span className="text-white/40 ml-1">(You)</span>}
                  </p>
                  <p className="text-white/40 text-xs">
                    {player.ball.inHole ? 'In hole!' : `${player.currentStrokes} strokes`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>

      {/* Instructions overlay for current player */}
      {isMyTurn && myPlayer && !myPlayer.ball.isMoving && !myPlayer.ball.inHole && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-xl px-6 py-3 text-center animate-pulse">
          <p className="text-white font-medium">Your turn! 🎯</p>
          <p className="text-white/60 text-sm">Drag from ball to aim & release to shoot</p>
        </div>
      )}

      {/* Scoreboard Modal */}
      {showScoreboard && (
        <Scoreboard 
          room={localRoom} 
          playerId={playerId}
          onClose={() => setShowScoreboard(false)}
        />
      )}
    </div>
  );
};

export default Game;
