'use client';

import { useState } from 'react';
import { Player, GameState, PLAYER_COLORS, PLAYER_AVATARS } from '@/types/game';

interface LobbyProps {
  gameState: GameState;
  currentPlayerId: string;
  onReady: () => void;
  onStartGame: () => void;
}

export default function Lobby({
  gameState,
  currentPlayerId,
  onReady,
  onStartGame,
}: LobbyProps) {
  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  const isHost = currentPlayer?.isHost || false;
  const allReady = gameState.players.length >= 1 && gameState.players.every(p => p.isReady);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-white/20">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display text-white mb-2 drop-shadow-lg">
            ⛳ Minigolf Lobby
          </h1>
          <div className="flex items-center justify-center gap-2 text-white/80">
            <span className="bg-white/20 px-4 py-1 rounded-full text-sm font-mono">
              Room: {gameState.roomId}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-sm transition-colors"
              title="Copy invite link"
            >
              📋 Copy Link
            </button>
          </div>
        </div>

        {/* Players List */}
        <div className="mb-8">
          <h2 className="text-xl text-white/90 mb-4 font-semibold">
            Players ({gameState.players.length}/4)
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((slot) => {
              const player = gameState.players[slot];
              if (player) {
                return (
                  <div
                    key={player.id}
                    className={`
                      relative p-4 rounded-2xl border-2 transition-all
                      ${player.id === currentPlayerId ? 'border-yellow-400 shadow-lg shadow-yellow-400/20' : 'border-white/20'}
                      ${player.isReady ? 'bg-green-500/30' : 'bg-white/10'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-lg"
                        style={{ backgroundColor: player.color }}
                      >
                        {player.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold truncate">
                            {player.name}
                          </span>
                          {player.isHost && (
                            <span className="text-yellow-400 text-xs bg-yellow-400/20 px-2 py-0.5 rounded-full">
                              👑 Host
                            </span>
                          )}
                        </div>
                        <div className={`text-sm ${player.isReady ? 'text-green-400' : 'text-white/50'}`}>
                          {player.isReady ? '✓ Ready' : 'Not Ready'}
                        </div>
                      </div>
                    </div>
                    {player.id === currentPlayerId && (
                      <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                        You
                      </div>
                    )}
                  </div>
                );
              } else {
                return (
                  <div
                    key={`empty-${slot}`}
                    className="p-4 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 flex items-center justify-center"
                  >
                    <div className="text-white/40 text-center">
                      <div className="text-3xl mb-1">👤</div>
                      <span className="text-sm">Waiting...</span>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4">
          {!currentPlayer?.isReady && (
            <button
              onClick={onReady}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-[1.02] shadow-lg"
            >
              ✓ Ready Up!
            </button>
          )}
          
          {isHost && (
            <button
              onClick={onStartGame}
              disabled={!allReady}
              className={`
                w-full py-4 font-bold text-lg rounded-xl transition-all transform shadow-lg
                ${allReady
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white hover:scale-[1.02]'
                  : 'bg-gray-500/50 text-white/50 cursor-not-allowed'
                }
              `}
            >
              {allReady ? '🚀 Start Game!' : 'Waiting for all players...'}
            </button>
          )}

          {!isHost && currentPlayer?.isReady && (
            <div className="text-center text-white/60 py-4">
              Waiting for host to start the game...
            </div>
          )}
        </div>

        {/* Game Info */}
        <div className="mt-8 pt-6 border-t border-white/20">
          <h3 className="text-white/80 font-semibold mb-3">How to Play</h3>
          <ul className="text-white/60 text-sm space-y-2">
            <li>🎯 Click and drag on the ball to aim</li>
            <li>💪 Drag further for more power</li>
            <li>🏆 Lowest score wins!</li>
            <li>⚠️ Watch out for water hazards and sand traps</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
