'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GameState, Player, Ball, Vector2D, GameMessage } from '@/types/game';
import { LEVELS, getTotalLevels } from '@/lib/levels';
import {
  createInitialGameState,
  addPlayer,
  removePlayer,
  setPlayerReady,
  startGame,
  updateBallState,
  incrementStrokes,
  playerFinishedHole,
  nextLevel,
  resetBallToStart,
  nextTurn,
  getCurrentPlayer,
  generateRoomCode,
} from '@/lib/gameState';
import { MultiplayerManager } from '@/lib/multiplayer';
import { isInWater } from '@/lib/physics';
import GameCanvas from '@/components/GameCanvas';
import Lobby from '@/components/Lobby';
import Scoreboard from '@/components/Scoreboard';

type Screen = 'home' | 'lobby' | 'game' | 'results';

export default function Home() {
  const [screen, setScreen] = useState<Screen>('home');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId] = useState(() => uuidv4());
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [showBetweenHoles, setShowBetweenHoles] = useState(false);
  const [holeScore, setHoleScore] = useState<{ player: string; strokes: number; par: number } | null>(null);
  
  const multiplayerRef = useRef<MultiplayerManager | null>(null);
  const lastBallUpdateRef = useRef<number>(0);

  // Handle multiplayer messages
  const handleMessage = useCallback((message: GameMessage) => {
    switch (message.type) {
      case 'join':
        setGameState(prev => {
          if (!prev) return prev;
          return addPlayer(prev, message.playerId, message.data.name);
        });
        break;

      case 'leave':
        setGameState(prev => {
          if (!prev) return prev;
          return removePlayer(prev, message.playerId);
        });
        break;

      case 'ready':
        setGameState(prev => {
          if (!prev) return prev;
          return setPlayerReady(prev, message.playerId, message.data.ready);
        });
        break;

      case 'start':
        setGameState(prev => {
          if (!prev) return prev;
          return startGame(prev);
        });
        setScreen('game');
        break;

      case 'shoot':
        setGameState(prev => {
          if (!prev) return prev;
          const ball = prev.balls[message.playerId];
          if (ball) {
            return {
              ...incrementStrokes(prev, message.playerId),
              balls: {
                ...prev.balls,
                [message.playerId]: {
                  ...ball,
                  velocity: message.data.velocity,
                  isMoving: true,
                },
              },
            };
          }
          return prev;
        });
        break;

      case 'ball-update':
        setGameState(prev => {
          if (!prev) return prev;
          return updateBallState(prev, message.playerId, message.data.ball);
        });
        break;

      case 'hole-complete':
        setGameState(prev => {
          if (!prev) return prev;
          return playerFinishedHole(prev, message.playerId);
        });
        break;

      case 'next-level':
        setGameState(prev => {
          if (!prev) return prev;
          const newState = nextLevel(prev);
          if (newState.gamePhase === 'finished') {
            setScreen('results');
          }
          return newState;
        });
        setShowBetweenHoles(false);
        break;

      case 'sync':
        setGameState(message.data.state);
        break;
    }
  }, []);

  // Create room
  const createRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    const roomCode = generateRoomCode();
    const initialState = createInitialGameState(roomCode);
    const stateWithHost = addPlayer(initialState, playerId, playerName.trim(), true);
    
    setGameState(stateWithHost);
    
    // Initialize multiplayer
    multiplayerRef.current = new MultiplayerManager(roomCode, playerId);
    multiplayerRef.current.connect(handleMessage);
    
    setScreen('lobby');
    setError('');
  };

  // Join room
  const joinRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!joinCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    const code = joinCode.trim().toUpperCase();
    
    // For simplicity, we'll create a local state and sync via broadcast channel
    const initialState = createInitialGameState(code);
    const stateWithPlayer = addPlayer(initialState, playerId, playerName.trim());
    
    setGameState(stateWithPlayer);
    
    // Initialize multiplayer
    multiplayerRef.current = new MultiplayerManager(code, playerId);
    multiplayerRef.current.connect(handleMessage);
    
    // Announce join
    multiplayerRef.current.send({
      type: 'join',
      data: { name: playerName.trim() },
    });
    
    setScreen('lobby');
    setError('');
  };

  // Handle ready up
  const handleReady = () => {
    if (!gameState) return;
    
    const myPlayer = gameState.players.find(p => p.id === playerId);
    if (!myPlayer) return;
    
    const newReady = !myPlayer.isReady;
    setGameState(prev => prev ? setPlayerReady(prev, playerId, newReady) : prev);
    
    multiplayerRef.current?.send({
      type: 'ready',
      data: { ready: newReady },
    });
  };

  // Handle start game
  const handleStart = () => {
    if (!gameState) return;
    
    const newState = startGame(gameState);
    setGameState(newState);
    setScreen('game');
    
    multiplayerRef.current?.send({
      type: 'start',
      data: { state: newState },
    });
  };

  // Handle leave
  const handleLeave = () => {
    multiplayerRef.current?.send({ type: 'leave', data: {} });
    multiplayerRef.current?.disconnect();
    multiplayerRef.current = null;
    setGameState(null);
    setScreen('home');
  };

  // Handle shoot
  const handleShoot = (velocity: Vector2D) => {
    if (!gameState) return;
    
    const newState = incrementStrokes(gameState, playerId);
    setGameState(newState);
    
    multiplayerRef.current?.send({
      type: 'shoot',
      data: { velocity },
    });
  };

  // Handle ball update
  const handleBallUpdate = (ball: Ball) => {
    if (!gameState) return;
    
    const newState = updateBallState(gameState, playerId, ball);
    
    // Check if ball landed in water
    if (!ball.isMoving && isInWater(ball.position, LEVELS[gameState.currentLevel - 1].obstacles)) {
      const resetState = resetBallToStart(newState, playerId);
      setGameState(resetState);
      multiplayerRef.current?.send({
        type: 'ball-update',
        data: { ball: resetState.balls[playerId] },
      });
      return;
    }
    
    setGameState(newState);
    
    // Throttle ball updates to reduce network traffic
    const now = Date.now();
    if (now - lastBallUpdateRef.current > 50) {
      lastBallUpdateRef.current = now;
      multiplayerRef.current?.send({
        type: 'ball-update',
        data: { ball },
      });
    }
  };

  // Handle hole complete
  const handleHoleComplete = () => {
    if (!gameState) return;
    
    const myPlayer = gameState.players.find(p => p.id === playerId);
    if (!myPlayer) return;
    
    const level = LEVELS[gameState.currentLevel - 1];
    setHoleScore({
      player: myPlayer.name,
      strokes: myPlayer.currentStrokes,
      par: level.par,
    });
    
    const newState = playerFinishedHole(gameState, playerId);
    setGameState(newState);
    
    multiplayerRef.current?.send({
      type: 'hole-complete',
      data: {},
    });
    
    // Clear score popup after delay
    setTimeout(() => setHoleScore(null), 3000);
  };

  // Check if all players finished
  useEffect(() => {
    if (gameState?.gamePhase === 'between-holes') {
      setShowBetweenHoles(true);
    }
  }, [gameState?.gamePhase]);

  // Handle next level
  const handleNextLevel = () => {
    if (!gameState) return;
    
    const isHost = gameState.players.find(p => p.id === playerId)?.isHost;
    if (!isHost) return;
    
    const newState = nextLevel(gameState);
    setGameState(newState);
    
    if (newState.gamePhase === 'finished') {
      setScreen('results');
    }
    
    multiplayerRef.current?.send({
      type: 'next-level',
      data: {},
    });
    
    setShowBetweenHoles(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      multiplayerRef.current?.disconnect();
    };
  }, []);

  // Get current game info
  const currentLevel = gameState ? LEVELS[gameState.currentLevel - 1] : null;
  const currentPlayer = gameState ? getCurrentPlayer(gameState) : null;
  const isMyTurn = currentPlayer?.id === playerId;
  const myBall = gameState?.balls[playerId];
  const canShoot = isMyTurn && myBall && !myBall.isMoving && gameState?.gamePhase === 'playing';

  // Home screen
  if (screen === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 flex items-center justify-center p-4">
        <div className="relative">
          {/* Decorative golf balls */}
          <div className="absolute -top-16 -left-16 w-32 h-32 rounded-full bg-white/10 animate-float"></div>
          <div className="absolute -bottom-8 -right-12 w-24 h-24 rounded-full bg-white/5 animate-float" style={{ animationDelay: '1s' }}></div>
          
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl border border-white/20 max-w-md w-full">
            {/* Logo/Title */}
            <div className="text-center mb-10">
              <div className="inline-block mb-4">
                <div className="w-20 h-20 mx-auto bg-white rounded-full shadow-lg flex items-center justify-center">
                  <span className="text-4xl">⛳</span>
                </div>
              </div>
              <h1 className="font-display text-5xl md:text-6xl text-gradient mb-2">Mini Golf</h1>
              <p className="text-emerald-200 font-body text-lg">Online Multiplayer</p>
            </div>

            {/* Name Input */}
            <div className="mb-6">
              <label className="block text-emerald-200 text-sm mb-2 font-body">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={15}
                className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/20 text-white placeholder-white/40 font-body focus:border-emerald-400 transition-colors"
              />
            </div>

            {/* Create Game Button */}
            <button
              onClick={createRoom}
              className="w-full py-4 mb-4 rounded-xl font-display text-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/30 btn-press transition-all"
            >
              Create Game
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-px bg-white/20"></div>
              <span className="text-white/40 font-body text-sm">or join a friend</span>
              <div className="flex-1 h-px bg-white/20"></div>
            </div>

            {/* Join Game */}
            <div className="flex gap-3">
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Room code"
                maxLength={6}
                className="flex-1 px-4 py-3 rounded-xl bg-black/30 border border-white/20 text-white placeholder-white/40 font-display text-center tracking-widest uppercase focus:border-emerald-400 transition-colors"
              />
              <button
                onClick={joinRoom}
                className="px-6 py-3 rounded-xl font-display bg-amber-500 text-white hover:bg-amber-400 shadow-lg shadow-amber-500/30 btn-press transition-all"
              >
                Join
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <p className="mt-4 text-red-400 text-center font-body text-sm">{error}</p>
            )}

            {/* Features */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <span className="text-2xl">👥</span>
                  <p className="text-emerald-200 text-xs font-body mt-1">Up to 4 Players</p>
                </div>
                <div>
                  <span className="text-2xl">🏆</span>
                  <p className="text-emerald-200 text-xs font-body mt-1">{getTotalLevels()} Fun Levels</p>
                </div>
                <div>
                  <span className="text-2xl">🎮</span>
                  <p className="text-emerald-200 text-xs font-body mt-1">Free to Play</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Lobby screen
  if (screen === 'lobby' && gameState) {
    return (
      <Lobby
        roomCode={gameState.roomId}
        players={gameState.players}
        isHost={gameState.players.find(p => p.id === playerId)?.isHost || false}
        myPlayerId={playerId}
        onStart={handleStart}
        onReady={handleReady}
        onLeave={handleLeave}
      />
    );
  }

  // Game screen
  if (screen === 'game' && gameState && currentLevel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="font-display text-2xl md:text-3xl text-white">
                Hole {gameState.currentLevel} - {currentLevel.name}
              </h1>
              <p className="text-emerald-200 font-body">Par {currentLevel.par}</p>
            </div>
            
            <div className="flex items-center gap-4">
              {currentPlayer && (
                <div className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded-full">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: currentPlayer.color }}
                  />
                  <span className="text-white font-body">
                    {currentPlayer.name}&apos;s turn
                  </span>
                </div>
              )}
              
              <button
                onClick={handleLeave}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors font-body text-sm border border-red-500/30"
              >
                Leave
              </button>
            </div>
          </div>

          {/* Game Area */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Canvas */}
            <div className="flex-1 flex justify-center">
              <GameCanvas
                level={currentLevel}
                balls={gameState.balls}
                currentPlayerId={currentPlayer?.id || ''}
                myPlayerId={playerId}
                onShoot={handleShoot}
                onBallUpdate={handleBallUpdate}
                onHoleComplete={handleHoleComplete}
                canShoot={canShoot || false}
                gamePhase={gameState.gamePhase}
              />
            </div>

            {/* Sidebar */}
            <div className="lg:w-80 space-y-4">
              {/* Strokes counter */}
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <h3 className="text-white font-display text-lg mb-3">Current Hole</h3>
                <div className="space-y-2">
                  {gameState.players.map(player => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between ${
                        player.hasFinishedHole ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: player.color }}
                        />
                        <span className="text-white font-body text-sm">{player.name}</span>
                      </div>
                      <span className="font-display text-white">
                        {player.hasFinishedHole ? '✓' : player.currentStrokes}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compact scoreboard */}
              <Scoreboard
                players={gameState.players}
                currentLevel={gameState.currentLevel}
                currentPlayerId={currentPlayer?.id || ''}
                compact
              />
            </div>
          </div>

          {/* Hole Score Popup */}
          {holeScore && (
            <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
              <div className="bg-black/80 backdrop-blur-xl rounded-2xl p-8 animate-score-popup border border-white/20">
                <div className="text-center">
                  <p className="text-emerald-400 font-body mb-2">Hole Complete!</p>
                  <p className="font-display text-4xl text-white mb-2">{holeScore.strokes}</p>
                  <p className="text-emerald-200 font-body">
                    {holeScore.strokes < holeScore.par && `${holeScore.par - holeScore.strokes} under par! 🎉`}
                    {holeScore.strokes === holeScore.par && 'Par! 👍'}
                    {holeScore.strokes === holeScore.par + 1 && 'Bogey'}
                    {holeScore.strokes === holeScore.par + 2 && 'Double Bogey'}
                    {holeScore.strokes > holeScore.par + 2 && `+${holeScore.strokes - holeScore.par}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Between Holes Modal */}
          {showBetweenHoles && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gradient-to-br from-emerald-800 to-teal-800 rounded-2xl p-8 max-w-2xl w-full border border-white/20">
                <h2 className="font-display text-3xl text-white text-center mb-6">
                  Hole {gameState.currentLevel} Complete!
                </h2>
                
                <Scoreboard
                  players={gameState.players}
                  currentLevel={gameState.currentLevel}
                  currentPlayerId={playerId}
                />
                
                {gameState.players.find(p => p.id === playerId)?.isHost && (
                  <button
                    onClick={handleNextLevel}
                    className="w-full mt-6 py-4 rounded-xl font-display text-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/30 btn-press transition-all"
                  >
                    {gameState.currentLevel < getTotalLevels() ? 'Next Hole' : 'View Results'}
                  </button>
                )}
                
                {!gameState.players.find(p => p.id === playerId)?.isHost && (
                  <p className="text-center text-emerald-200 font-body mt-6">
                    Waiting for host to continue...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Results screen
  if (screen === 'results' && gameState) {
    const sortedPlayers = [...gameState.players].sort((a, b) => a.totalScore - b.totalScore);
    const winner = sortedPlayers[0];
    const totalPar = LEVELS.reduce((sum, l) => sum + l.par, 0);

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 max-w-2xl w-full">
          <div className="text-center mb-8">
            <span className="text-6xl mb-4 block animate-celebrate">🏆</span>
            <h1 className="font-display text-4xl text-gradient mb-2">Game Complete!</h1>
            <p className="text-emerald-200 font-body">Total Par: {totalPar}</p>
          </div>

          {/* Winner */}
          <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-xl p-6 mb-6 border border-yellow-500/30">
            <div className="flex items-center justify-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-display text-white shadow-lg"
                style={{ backgroundColor: winner.color }}
              >
                {winner.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-yellow-300 font-display text-2xl">{winner.name}</p>
                <p className="text-yellow-100/70 font-body">
                  Winner with {winner.totalScore} strokes
                  {winner.totalScore < totalPar && ` (${totalPar - winner.totalScore} under par!)`}
                  {winner.totalScore === totalPar && ' (Even par!)'}
                  {winner.totalScore > totalPar && ` (+${winner.totalScore - totalPar})`}
                </p>
              </div>
            </div>
          </div>

          {/* Full Scoreboard */}
          <Scoreboard
            players={gameState.players}
            currentLevel={getTotalLevels()}
            currentPlayerId={playerId}
          />

          {/* Play Again */}
          <button
            onClick={() => {
              multiplayerRef.current?.disconnect();
              multiplayerRef.current = null;
              setGameState(null);
              setScreen('home');
            }}
            className="w-full mt-6 py-4 rounded-xl font-display text-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/30 btn-press transition-all"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}
