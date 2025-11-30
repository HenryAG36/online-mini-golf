'use client';

import React, { useState } from 'react';
import { GameRoom } from '@/lib/types';

interface LobbyProps {
  room: GameRoom;
  playerId: string;
  onStartGame: () => void;
  onLeave: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ room, playerId, onStartGame, onLeave }) => {
  const [copied, setCopied] = useState(false);
  const isHost = room.hostId === playerId;
  
  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Decorative golf balls */}
        <div className="absolute top-20 left-10 w-16 h-16 bg-white rounded-full opacity-10 animate-float" />
        <div className="absolute top-40 right-20 w-12 h-12 bg-white rounded-full opacity-10 animate-float-delayed" />
        <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-white rounded-full opacity-5 animate-float" />
      </div>
      
      <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20">
        <h2 className="text-3xl font-bold text-white text-center mb-2 font-serif">
          Waiting Room
        </h2>
        
        <p className="text-emerald-200 text-center mb-6">
          Share this code with friends to join!
        </p>

        {/* Room Code */}
        <div 
          onClick={copyRoomCode}
          className="bg-white/20 rounded-xl p-4 mb-6 cursor-pointer hover:bg-white/30 transition-colors group"
        >
          <p className="text-emerald-200 text-sm text-center mb-1">Room Code</p>
          <p className="text-4xl font-mono font-bold text-white text-center tracking-widest">
            {room.id}
          </p>
          <p className="text-emerald-300 text-xs text-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {copied ? '✓ Copied!' : 'Click to copy'}
          </p>
        </div>

        {/* Players */}
        <div className="mb-6">
          <p className="text-emerald-200 text-sm mb-3">
            Players ({room.players.length}/4)
          </p>
          <div className="space-y-2">
            {room.players.map((player) => (
              <div 
                key={player.id}
                className="flex items-center gap-3 bg-white/10 rounded-lg p-3"
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                  style={{ backgroundColor: player.color }}
                >
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">
                    {player.name}
                    {player.id === playerId && (
                      <span className="text-emerald-300 text-sm ml-2">(You)</span>
                    )}
                  </p>
                  {player.id === room.hostId && (
                    <p className="text-yellow-400 text-xs">👑 Host</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-400 text-xs">Ready</span>
                </div>
              </div>
            ))}
            
            {/* Empty slots */}
            {Array.from({ length: 4 - room.players.length }).map((_, i) => (
              <div 
                key={`empty-${i}`}
                className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-dashed border-white/20"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-white/40 text-xl">?</span>
                </div>
                <p className="text-white/40">Waiting for player...</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {isHost ? (
            <button
              onClick={onStartGame}
              disabled={room.players.length < 1}
              className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl 
                       hover:from-yellow-500 hover:to-orange-600 transition-all transform hover:scale-[1.02] 
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                       shadow-lg hover:shadow-xl"
            >
              Start Game ⛳
            </button>
          ) : (
            <div className="text-center py-4 bg-white/10 rounded-xl">
              <p className="text-white/80">Waiting for host to start...</p>
              <div className="flex justify-center gap-1 mt-2">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          
          <button
            onClick={onLeave}
            className="w-full py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
