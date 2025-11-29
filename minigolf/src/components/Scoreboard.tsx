'use client';

import React from 'react';
import { Player } from '@/types/game';
import { LEVELS } from '@/lib/levels';

interface ScoreboardProps {
  players: Player[];
  currentLevel: number;
  currentPlayerId: string;
  compact?: boolean;
}

export default function Scoreboard({
  players,
  currentLevel,
  currentPlayerId,
  compact = false,
}: ScoreboardProps) {
  const sortedPlayers = [...players].sort((a, b) => a.totalScore - b.totalScore);

  if (compact) {
    return (
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        <h3 className="text-white font-display text-lg mb-3">Scores</h3>
        <div className="space-y-2">
          {sortedPlayers.map((player, index) => (
            <div
              key={player.id}
              className={`flex items-center gap-3 ${
                player.id === currentPlayerId ? 'text-yellow-300' : 'text-white'
              }`}
            >
              <span className="font-display text-lg">{index + 1}.</span>
              <div
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: player.color }}
              />
              <span className="flex-1 font-body truncate">{player.name}</span>
              <span className="font-display">
                {player.totalScore > 0 ? player.totalScore : '-'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
      <h2 className="text-white font-display text-2xl mb-4 text-center">Scoreboard</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/20">
              <th className="text-left py-2 px-2 text-emerald-200 font-body text-sm">Player</th>
              {LEVELS.slice(0, currentLevel).map((level, idx) => (
                <th key={level.id} className="text-center py-2 px-2 text-emerald-200 font-body text-sm">
                  <span className="hidden sm:inline">Hole {idx + 1}</span>
                  <span className="sm:hidden">{idx + 1}</span>
                </th>
              ))}
              <th className="text-center py-2 px-2 text-yellow-300 font-display">Total</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map((player, rank) => (
              <tr
                key={player.id}
                className={`border-b border-white/10 ${
                  player.id === currentPlayerId ? 'bg-white/10' : ''
                }`}
              >
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-white">{rank + 1}.</span>
                    <div
                      className="w-6 h-6 rounded-full flex-shrink-0"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="text-white font-body truncate max-w-[100px]">
                      {player.name}
                    </span>
                  </div>
                </td>
                {LEVELS.slice(0, currentLevel).map((level, idx) => {
                  const score = player.score[idx];
                  const par = level.par;
                  const diff = score ? score - par : null;
                  
                  return (
                    <td key={level.id} className="text-center py-3 px-2">
                      {score !== undefined ? (
                        <span
                          className={`font-display ${
                            diff === null ? 'text-white' :
                            diff < 0 ? 'text-emerald-400' :
                            diff === 0 ? 'text-white' :
                            diff === 1 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}
                        >
                          {score}
                        </span>
                      ) : (
                        <span className="text-white/30">-</span>
                      )}
                    </td>
                  );
                })}
                <td className="text-center py-3 px-2">
                  <span className="font-display text-yellow-300 text-lg">
                    {player.totalScore > 0 ? player.totalScore : '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-white/20">
              <td className="py-2 px-2 text-emerald-200 font-body text-sm">Par</td>
              {LEVELS.slice(0, currentLevel).map((level) => (
                <td key={level.id} className="text-center py-2 px-2 text-emerald-200 font-body text-sm">
                  {level.par}
                </td>
              ))}
              <td className="text-center py-2 px-2 text-emerald-200 font-body text-sm">
                {LEVELS.slice(0, currentLevel).reduce((sum, l) => sum + l.par, 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
