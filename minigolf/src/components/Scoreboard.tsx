'use client';

import { Player } from '@/types/game';
import { LEVELS } from '@/lib/levels';
import { getTotalScore, getScoreLabel } from '@/lib/gameState';

interface ScoreboardProps {
  players: Player[];
  currentLevel: number;
  currentPlayerId: string;
  currentPlayerIndex: number;
}

export default function Scoreboard({
  players,
  currentLevel,
  currentPlayerId,
  currentPlayerIndex,
}: ScoreboardProps) {
  const level = LEVELS[currentLevel - 1];
  const sortedPlayers = [...players].sort((a, b) => getTotalScore(a) - getTotalScore(b));

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/20">
      <h2 className="text-xl font-display text-white mb-4 flex items-center gap-2">
        📊 Scoreboard
      </h2>

      {/* Current Hole Info */}
      <div className="mb-4 p-3 bg-white/10 rounded-xl">
        <div className="flex justify-between items-center text-white/90">
          <span className="font-semibold">Hole {currentLevel}</span>
          <span className="text-sm text-white/70">{level?.name}</span>
        </div>
        <div className="text-sm text-white/60 mt-1">
          Par {level?.par}
        </div>
      </div>

      {/* Players */}
      <div className="space-y-2">
        {sortedPlayers.map((player, index) => {
          const isCurrentTurn = players[currentPlayerIndex]?.id === player.id;
          const isMe = player.id === currentPlayerId;
          const totalScore = getTotalScore(player);
          const totalPar = LEVELS.slice(0, player.scores.length).reduce((sum, l) => sum + l.par, 0);
          const scoreDiff = totalScore - totalPar;

          return (
            <div
              key={player.id}
              className={`
                relative flex items-center gap-3 p-3 rounded-xl transition-all
                ${isCurrentTurn ? 'bg-yellow-500/30 ring-2 ring-yellow-400' : 'bg-white/5'}
                ${isMe ? 'border-l-4 border-l-yellow-400' : ''}
              `}
            >
              {/* Rank */}
              <div className="w-6 text-center">
                {index === 0 && players.some(p => p.scores.length > 0) && (
                  <span className="text-yellow-400">👑</span>
                )}
                {index > 0 && <span className="text-white/40 text-sm">{index + 1}</span>}
              </div>

              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-md"
                style={{ backgroundColor: player.color }}
              >
                {player.avatar}
              </div>

              {/* Name and Status */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium truncate">
                    {player.name}
                  </span>
                  {isMe && (
                    <span className="text-xs bg-yellow-400/20 text-yellow-400 px-1.5 py-0.5 rounded">
                      You
                    </span>
                  )}
                </div>
                <div className="text-xs text-white/50">
                  {isCurrentTurn && !player.hasFinishedHole ? (
                    <span className="text-yellow-400">⛳ Their turn</span>
                  ) : player.hasFinishedHole ? (
                    <span className="text-green-400">
                      ✓ {getScoreLabel(player.scores[currentLevel - 1] || 0, level?.par || 0)}
                    </span>
                  ) : (
                    <span>Strokes: {player.currentStrokes}</span>
                  )}
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <div className="text-white font-bold text-lg">
                  {totalScore || '-'}
                </div>
                {player.scores.length > 0 && (
                  <div className={`text-xs ${scoreDiff <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {scoreDiff === 0 ? 'E' : scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff}
                  </div>
                )}
              </div>

              {/* Turn indicator */}
              {isCurrentTurn && !player.hasFinishedHole && (
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-yellow-400 rounded-full animate-pulse" />
              )}
            </div>
          );
        })}
      </div>

      {/* Score Details */}
      {players.some(p => p.scores.length > 0) && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <details className="text-white/60 text-sm">
            <summary className="cursor-pointer hover:text-white/80 transition-colors">
              View Hole-by-Hole Scores
            </summary>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-white/40">
                    <th className="text-left py-1">Player</th>
                    {LEVELS.slice(0, Math.max(...players.map(p => p.scores.length), currentLevel)).map((l, i) => (
                      <th key={i} className="text-center py-1 px-1">
                        {i + 1}
                      </th>
                    ))}
                    <th className="text-right py-1">Total</th>
                  </tr>
                  <tr className="text-white/30">
                    <th className="text-left py-1">Par</th>
                    {LEVELS.slice(0, Math.max(...players.map(p => p.scores.length), currentLevel)).map((l, i) => (
                      <th key={i} className="text-center py-1 px-1">
                        {l.par}
                      </th>
                    ))}
                    <th className="text-right py-1">
                      {LEVELS.slice(0, Math.max(...players.map(p => p.scores.length), currentLevel)).reduce((s, l) => s + l.par, 0)}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => (
                    <tr key={player.id}>
                      <td className="py-1 flex items-center gap-1">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: player.color }}
                        />
                        <span className="truncate max-w-[60px]">{player.name}</span>
                      </td>
                      {LEVELS.slice(0, Math.max(...players.map(p => p.scores.length), currentLevel)).map((l, i) => (
                        <td key={i} className="text-center py-1 px-1">
                          {player.scores[i] !== undefined ? (
                            <span className={
                              player.scores[i] < l.par ? 'text-green-400' :
                              player.scores[i] > l.par ? 'text-red-400' : ''
                            }>
                              {player.scores[i]}
                            </span>
                          ) : (
                            <span className="text-white/20">-</span>
                          )}
                        </td>
                      ))}
                      <td className="text-right py-1 font-bold">
                        {getTotalScore(player) || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
