'use client';

import { Player } from '@/types/game';
import { LEVELS, TOTAL_LEVELS } from '@/lib/levels';
import { getTotalScore } from '@/lib/gameState';
import confetti from '@/lib/confetti';
import { useEffect } from 'react';

interface GameResultsProps {
  players: Player[];
  winnerId?: string;
  currentPlayerId: string;
  onPlayAgain: () => void;
}

export default function GameResults({
  players,
  winnerId,
  currentPlayerId,
  onPlayAgain,
}: GameResultsProps) {
  const sortedPlayers = [...players].sort((a, b) => getTotalScore(a) - getTotalScore(b));
  const winner = sortedPlayers[0];
  const isWinner = winner?.id === currentPlayerId;
  const totalPar = LEVELS.reduce((sum, l) => sum + l.par, 0);

  useEffect(() => {
    // Trigger confetti for winner
    if (isWinner) {
      confetti();
    }
  }, [isWinner]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-white/20">
        {/* Trophy Animation */}
        <div className="text-center mb-8">
          <div className="text-8xl mb-4 animate-bounce-slow">🏆</div>
          <h1 className="text-4xl font-display text-white mb-2 drop-shadow-lg">
            Game Complete!
          </h1>
          <p className="text-white/70 text-lg">
            {TOTAL_LEVELS} holes played
          </p>
        </div>

        {/* Winner Announcement */}
        {winner && (
          <div className={`
            text-center mb-8 p-6 rounded-2xl
            ${isWinner ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-2 border-yellow-400' : 'bg-white/10'}
          `}>
            <div className="text-6xl mb-2">{winner.avatar}</div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {isWinner ? '🎉 You Won! 🎉' : `${winner.name} Wins!`}
            </h2>
            <div className="text-white/70">
              Final Score: {getTotalScore(winner)} ({getTotalScore(winner) - totalPar >= 0 ? '+' : ''}{getTotalScore(winner) - totalPar} to par)
            </div>
          </div>
        )}

        {/* Final Standings */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Final Standings</h3>
          <div className="space-y-3">
            {sortedPlayers.map((player, index) => {
              const totalScore = getTotalScore(player);
              const scoreDiff = totalScore - totalPar;
              const isMe = player.id === currentPlayerId;
              
              return (
                <div
                  key={player.id}
                  className={`
                    flex items-center gap-4 p-4 rounded-xl transition-all
                    ${index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 ring-2 ring-yellow-400/50' : 
                      index === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20' :
                      index === 2 ? 'bg-gradient-to-r from-amber-700/20 to-amber-800/20' : 'bg-white/5'}
                    ${isMe ? 'border-l-4 border-l-yellow-400' : ''}
                  `}
                >
                  {/* Position */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>

                  {/* Player */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.avatar}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{player.name}</span>
                      {isMe && (
                        <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="text-white font-bold text-2xl">{totalScore}</div>
                    <div className={`text-sm ${scoreDiff <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {scoreDiff === 0 ? 'Even' : scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hole-by-Hole Summary */}
        <details className="mb-8 text-white/60 text-sm bg-white/5 rounded-xl p-4">
          <summary className="cursor-pointer hover:text-white/80 transition-colors font-semibold">
            📊 Full Scorecard
          </summary>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 border-b border-white/10">
                  <th className="text-left py-2 sticky left-0 bg-white/5">Hole</th>
                  {LEVELS.map((l, i) => (
                    <th key={i} className="text-center py-2 px-2 min-w-[40px]">
                      {i + 1}
                    </th>
                  ))}
                  <th className="text-right py-2 px-2">OUT</th>
                </tr>
                <tr className="text-white/30 border-b border-white/10">
                  <th className="text-left py-2 sticky left-0 bg-white/5">Par</th>
                  {LEVELS.map((l, i) => (
                    <th key={i} className="text-center py-2 px-2">{l.par}</th>
                  ))}
                  <th className="text-right py-2 px-2">{totalPar}</th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.map((player) => (
                  <tr key={player.id} className="border-b border-white/5">
                    <td className="py-2 sticky left-0 bg-white/5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: player.color }}
                        />
                        <span className="truncate max-w-[80px]">{player.name}</span>
                      </div>
                    </td>
                    {LEVELS.map((l, i) => (
                      <td key={i} className="text-center py-2 px-2">
                        {player.scores[i] !== undefined ? (
                          <span className={`
                            px-2 py-0.5 rounded
                            ${player.scores[i] === 1 ? 'bg-yellow-400 text-yellow-900 font-bold' :
                              player.scores[i] < l.par ? 'text-green-400' :
                              player.scores[i] > l.par ? 'text-red-400' : ''}
                          `}>
                            {player.scores[i]}
                          </span>
                        ) : '-'}
                      </td>
                    ))}
                    <td className="text-right py-2 px-2 font-bold text-white">
                      {getTotalScore(player)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-[1.02] shadow-lg"
          >
            🔄 Play Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-lg rounded-xl transition-all"
          >
            🏠 New Room
          </button>
        </div>
      </div>
    </div>
  );
}
