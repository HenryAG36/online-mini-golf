'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import { GameRoom, Player, BallState } from '@/lib/types';
import { getLevel, levels } from '@/lib/levels';
import Lobby from '@/components/Lobby';
import GameCanvas from '@/components/GameCanvas';
import GameUI from '@/components/GameUI';

type GameView = 'home' | 'lobby' | 'game';

export default function Home() {
  const [view, setView] = useState<GameView>('home');
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [otherBallStates, setOtherBallStates] = useState<Map<string, BallState>>(new Map());
  const [finalScores, setFinalScores] = useState<{ playerId: string; name: string; color?: string; totalScore: number }[] | null>(null);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;
    setPlayerId(socket.id || '');

    socket.on('connect', () => {
      setPlayerId(socket.id || '');
    });

    socket.on('roomUpdate', (updatedRoom) => {
      setRoom(updatedRoom);
      if (updatedRoom.gameState === 'playing' && view === 'lobby') {
        setView('game');
      }
    });

    socket.on('ballUpdate', (ballPlayerId, state) => {
      setOtherBallStates((prev) => {
        const newMap = new Map(prev);
        newMap.set(ballPlayerId, state);
        return newMap;
      });
    });

    socket.on('error', (message) => {
      setError(message);
      setTimeout(() => setError(''), 3000);
    });

    socket.on('playerJoined', (player) => {
      console.log('Player joined:', player.name);
    });

    socket.on('playerLeft', (leftPlayerId) => {
      console.log('Player left:', leftPlayerId);
      setOtherBallStates((prev) => {
        const newMap = new Map(prev);
        newMap.delete(leftPlayerId);
        return newMap;
      });
    });

    socket.on('gameOver', (scores) => {
      setFinalScores(scores);
    });

    return () => {
      socket.off('roomUpdate');
      socket.off('ballUpdate');
      socket.off('error');
      socket.off('playerJoined');
      socket.off('playerLeft');
      socket.off('gameOver');
    };
  }, [view]);

  const createRoom = useCallback(() => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('createRoom', playerName.trim(), (roomId: string) => {
      setView('lobby');
    });
  }, [playerName]);

  const joinRoom = useCallback(() => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!joinCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    const socket = socketRef.current;
    if (!socket) return;

    socket.emit('joinRoom', joinCode.toUpperCase().trim(), playerName.trim(), (success: boolean, errorMsg?: string) => {
      if (success) {
        setView('lobby');
        setError('');
      } else {
        setError(errorMsg || 'Failed to join room');
      }
    });
  }, [playerName, joinCode]);

  const handleReady = useCallback((ready: boolean) => {
    socketRef.current?.emit('setReady', ready);
  }, []);

  const handleStartGame = useCallback(() => {
    socketRef.current?.emit('startGame');
  }, []);

  const handleLeaveRoom = useCallback(() => {
    socketRef.current?.emit('leaveRoom');
    setRoom(null);
    setView('home');
    setOtherBallStates(new Map());
    setFinalScores(null);
  }, []);

  const handleShoot = useCallback((power: number, angle: number) => {
    socketRef.current?.emit('shoot', power, angle);
  }, []);

  const handleBallUpdate = useCallback((state: BallState) => {
    socketRef.current?.emit('updateBallPosition', state);
  }, []);

  const handleHoleComplete = useCallback((strokes: number) => {
    socketRef.current?.emit('completeHole', strokes);
  }, []);

  const handleNextLevel = useCallback(() => {
    socketRef.current?.emit('nextLevel');
    setOtherBallStates(new Map());
  }, []);

  const handlePlayAgain = useCallback(() => {
    // Reset to lobby state
    setFinalScores(null);
    setOtherBallStates(new Map());
    setView('lobby');
    
    // Reset room state
    if (room) {
      room.gameState = 'lobby';
      room.currentLevel = 1;
      room.players.forEach(p => {
        p.scores = [];
        p.currentStrokes = 0;
        p.isReady = false;
        p.hasCompletedHole = false;
      });
      setRoom({ ...room });
    }
  }, [room]);

  const currentPlayer = room?.players.find(p => p.id === playerId);
  const isHost = currentPlayer?.isHost || false;
  const currentLevel = room ? getLevel(room.currentLevel) : null;
  const currentTurnPlayer = room?.players[room.currentTurn];
  const isMyTurn = currentTurnPlayer?.id === playerId;

  // Home screen
  if (view === 'home') {
    return (
      <div className="home-container">
        <div className="background-decoration">
          <div className="golf-ball ball-1" />
          <div className="golf-ball ball-2" />
          <div className="golf-ball ball-3" />
          <div className="flag-decoration" />
        </div>

        <div className="content">
          <div className="logo-section">
            <div className="logo">
              <span className="logo-icon">⛳</span>
              <h1>Mini Golf</h1>
              <span className="logo-subtitle">Online</span>
            </div>
            <p className="tagline">Play with friends • Up to 4 players</p>
          </div>

          <div className="game-card">
            <div className="input-group">
              <label>Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={15}
              />
            </div>

            <div className="actions">
              <button className="create-btn" onClick={createRoom}>
                <span className="btn-icon">🎮</span>
                Create Game
              </button>

              <div className="divider">
                <span>or join a game</span>
              </div>

              <div className="join-section">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Room Code"
                  maxLength={5}
                  className="code-input"
                />
                <button className="join-btn" onClick={joinRoom}>
                  Join
                </button>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}
          </div>

          <div className="features">
            <div className="feature">
              <span>🏌️</span>
              <span>{levels.length} Fun Holes</span>
            </div>
            <div className="feature">
              <span>👥</span>
              <span>Multiplayer</span>
            </div>
            <div className="feature">
              <span>🎯</span>
              <span>Real Physics</span>
            </div>
          </div>
        </div>

        <style jsx>{`
          .home-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            position: relative;
            overflow: hidden;
          }

          .background-decoration {
            position: fixed;
            inset: 0;
            pointer-events: none;
            overflow: hidden;
          }

          .golf-ball {
            position: absolute;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, #fff, #ddd);
            box-shadow: inset -5px -5px 15px rgba(0, 0, 0, 0.2);
            opacity: 0.1;
          }

          .ball-1 {
            top: 10%;
            left: 10%;
            animation: float 4s ease-in-out infinite;
          }

          .ball-2 {
            top: 60%;
            right: 15%;
            animation: float 5s ease-in-out infinite 1s;
          }

          .ball-3 {
            bottom: 20%;
            left: 20%;
            animation: float 6s ease-in-out infinite 2s;
          }

          .flag-decoration {
            position: absolute;
            top: 20%;
            right: 10%;
            width: 4px;
            height: 80px;
            background: #8b4513;
            opacity: 0.15;
          }

          .flag-decoration::after {
            content: '';
            position: absolute;
            top: 0;
            left: 4px;
            width: 40px;
            height: 30px;
            background: #e74c3c;
            clip-path: polygon(0 0, 100% 50%, 0 100%);
          }

          .content {
            max-width: 420px;
            width: 100%;
            z-index: 1;
          }

          .logo-section {
            text-align: center;
            margin-bottom: 40px;
          }

          .logo {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
          }

          .logo-icon {
            font-size: 64px;
            animation: float 3s ease-in-out infinite;
          }

          .logo h1 {
            font-size: 48px;
            font-weight: 700;
            background: linear-gradient(135deg, var(--accent), #4ade80);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            line-height: 1;
          }

          .logo-subtitle {
            font-size: 20px;
            color: var(--text-secondary);
            font-weight: 500;
            letter-spacing: 8px;
            text-transform: uppercase;
          }

          .tagline {
            margin-top: 16px;
            color: var(--text-secondary);
            font-size: 16px;
          }

          .game-card {
            background: var(--bg-card);
            border-radius: 24px;
            padding: 32px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }

          .input-group {
            margin-bottom: 24px;
          }

          .input-group label {
            display: block;
            font-size: 14px;
            color: var(--text-secondary);
            margin-bottom: 8px;
          }

          .input-group input {
            width: 100%;
            padding: 16px 20px;
            font-size: 18px;
            background: rgba(0, 0, 0, 0.3);
            border: 2px solid transparent;
            border-radius: 12px;
            color: var(--text-primary);
            transition: all 0.2s ease;
          }

          .input-group input:focus {
            border-color: var(--accent);
            background: rgba(0, 0, 0, 0.4);
          }

          .input-group input::placeholder {
            color: var(--text-secondary);
          }

          .actions {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .create-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            width: 100%;
            padding: 18px;
            font-size: 20px;
            font-weight: 600;
            background: linear-gradient(135deg, var(--accent), #06b6d4);
            color: var(--bg-dark);
            border-radius: 14px;
            box-shadow: 0 4px 20px var(--accent-glow);
          }

          .create-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 30px var(--accent-glow);
          }

          .btn-icon {
            font-size: 24px;
          }

          .divider {
            display: flex;
            align-items: center;
            gap: 16px;
            color: var(--text-secondary);
            font-size: 14px;
          }

          .divider::before,
          .divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: rgba(255, 255, 255, 0.1);
          }

          .join-section {
            display: flex;
            gap: 12px;
          }

          .code-input {
            flex: 1;
            padding: 14px 20px;
            font-size: 20px;
            font-family: 'Fredoka', sans-serif;
            font-weight: 600;
            text-align: center;
            letter-spacing: 4px;
            background: rgba(0, 0, 0, 0.3);
            border: 2px solid transparent;
            border-radius: 12px;
            color: var(--text-primary);
            text-transform: uppercase;
          }

          .code-input:focus {
            border-color: var(--accent);
          }

          .code-input::placeholder {
            letter-spacing: 1px;
            color: var(--text-secondary);
          }

          .join-btn {
            padding: 14px 28px;
            font-size: 16px;
            font-weight: 600;
            background: var(--bg-card-hover);
            color: var(--text-primary);
            border-radius: 12px;
          }

          .join-btn:hover {
            background: var(--accent);
            color: var(--bg-dark);
          }

          .error-message {
            margin-top: 16px;
            padding: 12px 16px;
            background: rgba(239, 68, 68, 0.2);
            border: 1px solid #ef4444;
            border-radius: 10px;
            color: #ef4444;
            font-size: 14px;
            text-align: center;
          }

          .features {
            display: flex;
            justify-content: center;
            gap: 32px;
            margin-top: 32px;
          }

          .feature {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: var(--text-secondary);
          }

          .feature span:first-child {
            font-size: 28px;
          }
        `}</style>
      </div>
    );
  }

  // Lobby screen
  if (view === 'lobby' && room) {
    return (
      <div className="lobby-container">
        <Lobby
          roomId={room.id}
          players={room.players}
          currentPlayerId={playerId}
          isHost={isHost}
          onReady={handleReady}
          onStartGame={handleStartGame}
          onLeaveRoom={handleLeaveRoom}
        />
        <style jsx>{`
          .lobby-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
        `}</style>
      </div>
    );
  }

  // Game screen
  if (view === 'game' && room && currentLevel) {
    return (
      <div className="game-container">
        <GameCanvas
          level={currentLevel}
          players={room.players}
          currentPlayerId={playerId}
          isMyTurn={isMyTurn && !currentPlayer?.hasCompletedHole}
          onShoot={handleShoot}
          onBallUpdate={handleBallUpdate}
          onHoleComplete={handleHoleComplete}
          otherBallStates={otherBallStates}
          currentStrokes={currentPlayer?.currentStrokes || 0}
        />
        <GameUI
          level={currentLevel}
          players={room.players}
          currentPlayerId={playerId}
          currentTurnPlayerId={currentTurnPlayer?.id || ''}
          gameState={room.gameState as 'playing' | 'between-holes' | 'finished'}
          isHost={isHost}
          onNextLevel={handleNextLevel}
          finalScores={finalScores || undefined}
          onPlayAgain={handlePlayAgain}
        />
        <style jsx>{`
          .game-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            position: relative;
          }
        `}</style>
      </div>
    );
  }

  return null;
}
