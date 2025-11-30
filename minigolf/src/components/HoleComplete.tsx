'use client';

import { Player } from '@/types/game';
import { LEVELS } from '@/lib/levels';
import { getScoreLabel, getTotalScore } from '@/lib/gameState';

interface HoleCompleteProps {
  players: Player[];
  currentLevel: number;
  currentPlayerId: string;
  onNextHole: () => void;
  isHost: boolean;
}

export default function HoleComplete({
  players,
  currentLevel,
  currentPlayerId,
  onNextHole,
  isHost,
}: HoleCompleteProps) {
  const level = LEVELS[currentLevel - 1];
  const sortedPlayers = [...players].sort((a, b) => {
    const scoreA = a.scores[currentLevel - 1] || 999;
    const scoreB = b.scores[currentLevel - 1] || 999;
    return scoreA - scoreB;
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-emerald-800 to-green-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">⛳</div>
          <h2 className="text-3xl font-display text-white mb-1">Hole {currentLevel} Complete!</h2>
          <p className="text-white/70">{level?.name} - Par {level?.par}</p>
        </div>

        {/* Results */}
        <div className="space-y-3 mb-6">
          {sortedPlayers.map((player, index) => {
            const score = player.scores[currentLevel - 1];
            const isMe = player.id === currentPlayerId;
            const scoreLabel = getScoreLabel(score || 0, level?.par || 0);
            const isBest = index === 0;

            return (
              <div
                key={player.id}
                className={`
                  flex items-center gap-3 p-3 rounded-xl
                  ${isBest ? 'bg-yellow-500/20 ring-2 ring-yellow-400' : 'bg-white/10'}
                  ${isMe ? 'border-l-4 border-l-yellow-400' : ''}
                `}
              >
                {/* Position */}
                <div className="w-8 text-center text-xl">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </div>

                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                  style={{ backgroundColor: player.color }}
                >
                  {player.avatar}
                </div>

                {/* Name & Score Label */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{player.name}</span>
                    {isMe && (
                      <span className="text-xs bg-yellow-400/20 text-yellow-400 px-1.5 py-0.5 rounded">
                        You
                      </span>
                    )}
                  </div>
                  <div className={`text-sm ${
                    score && score <= (level?.par || 0) ? 'text-green-400' : 'text-white/60'
                  }`}>
                    {scoreLabel}
                  </div>
                </div>

                {/* Strokes */}
                <div className="text-right">
                  <div className="text-white font-bold text-2xl">{score}</div>
                  <div className="text-white/50 text-xs">strokes</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall Standings */}
        <div className="bg-white/10 rounded-xl p-4 mb-6">
          <h3 className="text-white/80 font-semibold mb-2 text-sm">Overall Standings</h3>
          <div className="flex gap-2 flex-wrap">
            {[...players]
              .sort((a, b) => getTotalScore(a) - getTotalScore(b))
              .map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1"
                >
                  <span className="text-xs">{index + 1}.</span>
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-xs"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.avatar}
                  </span>
                  <span className="text-white/80 text-sm font-medium">
                    {getTotalScore(player)}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Next Hole Button */}
        {isHost ? (
          <button
            onClick={onNextHole}
            className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-[1.02] shadow-lg"
          >
            {currentLevel < LEVELS.length ? '➡️ Next Hole' : '🏆 View Final Results'}
          </button>
        ) : (
          <div className="text-center text-white/60 py-4">
            Waiting for host to continue...
          </div>
        )}
      </div>
    </div>
  );
}
