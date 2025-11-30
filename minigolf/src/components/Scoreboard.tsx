'use client';

import React from 'react';
import { GameRoom } from '@/lib/types';
import { LEVELS } from '@/lib/levels';

interface ScoreboardProps {
  room: GameRoom;
  playerId: string;
  onClose?: () => void;
  isFullScreen?: boolean;
  onPlayAgain?: () => void;
  onLeave?: () => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ 
  room, 
  playerId, 
  onClose,
  isFullScreen = false,
  onPlayAgain,
  onLeave,
}) => {
  // Sort players by total strokes (lowest first)
  const sortedPlayers = [...room.players].sort((a, b) => {
    const aTotal = a.totalStrokes + (a.currentStrokes || 0);
    const bTotal = b.totalStrokes + (b.currentStrokes || 0);
    return aTotal - bTotal;
  });

  const getParScore = (levelIndex: number, strokes: number) => {
    const level = LEVELS[levelIndex];
    if (!level) return null;
    const diff = strokes - level.par;
    if (diff === 0) return { text: 'Par', color: 'text-white' };
    if (diff === -1) return { text: 'Birdie', color: 'text-green-400' };
    if (diff === -2) return { text: 'Eagle', color: 'text-yellow-400' };
    if (diff <= -3) return { text: 'Albatross', color: 'text-purple-400' };
    if (diff === 1) return { text: 'Bogey', color: 'text-orange-400' };
    if (diff === 2) return { text: 'Double', color: 'text-red-400' };
    return { text: `+${diff}`, color: 'text-red-500' };
  };

  const content = (
    <div className={`${isFullScreen ? 'p-4' : 'p-6'}`}>
      {!isFullScreen && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl"
        >
          ×
        </button>
      )}
      
      <h2 className="text-2xl font-bold text-white text-center mb-6 font-serif">
        {room.status === 'finished' ? '🏆 Final Scores 🏆' : '📊 Scoreboard'}
      </h2>

      {/* Players ranking */}
      <div className="space-y-3 mb-6">
        {sortedPlayers.map((player, index) => {
          const totalStrokes = player.totalStrokes + (player.currentStrokes || 0);
          const isWinner = room.status === 'finished' && index === 0;
          
          return (
            <div 
              key={player.id}
              className={`flex items-center gap-3 rounded-xl p-3 ${
                isWinner 
                  ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border border-yellow-400/50' 
                  : 'bg-white/10'
              } ${player.id === playerId ? 'ring-2 ring-white/30' : ''}`}
            >
              <div className="w-8 text-center">
                {index === 0 && room.status === 'finished' ? (
                  <span className="text-2xl">🥇</span>
                ) : index === 1 && room.status === 'finished' ? (
                  <span className="text-2xl">🥈</span>
                ) : index === 2 && room.status === 'finished' ? (
                  <span className="text-2xl">🥉</span>
                ) : (
                  <span className="text-white/60 font-bold">{index + 1}</span>
                )}
              </div>
              
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
              </div>
              
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{totalStrokes}</p>
                <p className="text-xs text-white/60">strokes</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed scores by hole */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/60">
              <th className="text-left py-2 px-2">Hole</th>
              {sortedPlayers.map(player => (
                <th key={player.id} className="text-center py-2 px-2">
                  <div 
                    className="w-6 h-6 rounded-full mx-auto"
                    style={{ backgroundColor: player.color }}
                  />
                </th>
              ))}
              <th className="text-center py-2 px-2">Par</th>
            </tr>
          </thead>
          <tbody>
            {LEVELS.slice(0, room.currentLevel).map((level, levelIndex) => (
              <tr key={level.id} className="border-t border-white/10">
                <td className="py-2 px-2 text-white/80">{level.id}</td>
                {sortedPlayers.map(player => {
                  const strokes = player.strokes[levelIndex] ?? (levelIndex === room.currentLevel - 1 ? player.currentStrokes : '-');
                  const parScore = typeof strokes === 'number' ? getParScore(levelIndex, strokes) : null;
                  
                  return (
                    <td key={player.id} className="text-center py-2 px-2">
                      <span className={parScore?.color || 'text-white'}>
                        {strokes}
                      </span>
                    </td>
                  );
                })}
                <td className="text-center py-2 px-2 text-white/60">{level.par}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-white/30 font-bold">
              <td className="py-2 px-2 text-white">Total</td>
              {sortedPlayers.map(player => (
                <td key={player.id} className="text-center py-2 px-2 text-white">
                  {player.totalStrokes + (player.currentStrokes || 0)}
                </td>
              ))}
              <td className="text-center py-2 px-2 text-white/60">
                {LEVELS.slice(0, room.currentLevel).reduce((sum, l) => sum + l.par, 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Actions for finished game */}
      {isFullScreen && room.status === 'finished' && (
        <div className="mt-6 space-y-3">
          {onPlayAgain && (
            <button
              onClick={onPlayAgain}
              className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl 
                       hover:from-yellow-500 hover:to-orange-600 transition-all"
            >
              Play Again 🔄
            </button>
          )}
          {onLeave && (
            <button
              onClick={onLeave}
              className="w-full py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
            >
              Back to Home
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (isFullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl max-w-2xl w-full shadow-2xl border border-white/20">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-emerald-900 to-green-800 rounded-3xl max-w-2xl w-full shadow-2xl border border-white/20 relative max-h-[90vh] overflow-y-auto">
        {content}
      </div>
    </div>
  );
};

export default Scoreboard;
