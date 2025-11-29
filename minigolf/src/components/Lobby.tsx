'use client';

import React, { useState } from 'react';
import { Player, PLAYER_COLORS } from '@/types/game';

interface LobbyProps {
  roomCode: string;
  players: Player[];
  isHost: boolean;
  myPlayerId: string;
  onStart: () => void;
  onReady: () => void;
  onLeave: () => void;
}

export default function Lobby({
  roomCode,
  players,
  isHost,
  myPlayerId,
  onStart,
  onReady,
  onLeave,
}: LobbyProps) {
  const [copied, setCopied] = useState(false);
  const myPlayer = players.find(p => p.id === myPlayerId);
  const allReady = players.length >= 1 && players.every(p => p.isReady || p.isHost);
  const canStart = isHost && players.length >= 1 && allReady;

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 flex items-center justify-center p-4">
      <div className="relative">
        {/* Decorative elements */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-emerald-400/20 rounded-full blur-3xl"></div>
        
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 max-w-lg w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="font-display text-4xl text-white mb-2">Game Lobby</h2>
            <p className="text-emerald-200 font-body">Waiting for players...</p>
          </div>

          {/* Room Code */}
          <div className="mb-8">
            <p className="text-emerald-200 text-sm mb-2 text-center font-body">Share this code with friends:</p>
            <button
              onClick={copyCode}
              className="w-full bg-black/30 rounded-xl p-4 flex items-center justify-center gap-3 hover:bg-black/40 transition-colors group"
            >
              <span className="font-display text-3xl tracking-[0.3em] text-white">{roomCode}</span>
              <svg
                className={`w-6 h-6 transition-colors ${copied ? 'text-emerald-400' : 'text-white/60 group-hover:text-white'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {copied ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                )}
              </svg>
            </button>
            {copied && <p className="text-emerald-400 text-sm text-center mt-2 font-body">Copied to clipboard!</p>}
          </div>

          {/* Players */}
          <div className="mb-8">
            <h3 className="text-white font-display text-xl mb-4">Players ({players.length}/4)</h3>
            <div className="space-y-3">
              {[0, 1, 2, 3].map(index => {
                const player = players[index];
                return (
                  <div
                    key={index}
                    className={`rounded-xl p-4 flex items-center gap-4 transition-all ${
                      player
                        ? 'bg-white/10 border border-white/20'
                        : 'bg-black/10 border border-dashed border-white/10'
                    }`}
                  >
                    {player ? (
                      <>
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                          style={{ backgroundColor: player.color }}
                        >
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-body font-semibold">
                            {player.name}
                            {player.id === myPlayerId && (
                              <span className="text-emerald-400 text-sm ml-2">(You)</span>
                            )}
                          </p>
                          <p className="text-emerald-200/60 text-sm font-body">
                            {player.isHost ? '👑 Host' : player.isReady ? '✓ Ready' : 'Waiting...'}
                          </p>
                        </div>
                        {!player.isHost && player.id === myPlayerId && (
                          <button
                            onClick={onReady}
                            className={`px-4 py-2 rounded-lg font-body font-semibold transition-all ${
                              player.isReady
                                ? 'bg-emerald-500 text-white'
                                : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                          >
                            {player.isReady ? 'Ready!' : 'Ready Up'}
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                          <span className="text-white/30 text-xl">?</span>
                        </div>
                        <p className="text-white/30 font-body">Waiting for player...</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={onLeave}
              className="flex-1 py-3 rounded-xl font-display text-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors border border-red-500/30"
            >
              Leave
            </button>
            {isHost && (
              <button
                onClick={onStart}
                disabled={!canStart}
                className={`flex-1 py-3 rounded-xl font-display text-lg transition-all ${
                  canStart
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/30'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                }`}
              >
                Start Game
              </button>
            )}
          </div>

          {isHost && !canStart && players.length > 1 && (
            <p className="text-center text-amber-300/70 text-sm mt-4 font-body">
              Waiting for all players to ready up...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
