'use client';

import React from 'react';
import { Player } from '@/lib/types';
import { Level, levels } from '@/lib/levels';

interface GameUIProps {
  level: Level;
  players: Player[];
  currentPlayerId: string;
  currentTurnPlayerId: string;
  gameState: 'playing' | 'between-holes' | 'finished';
  isHost: boolean;
  onNextLevel: () => void;
  finalScores?: { playerId: string; name: string; color?: string; totalScore: number }[];
  onPlayAgain?: () => void;
}

export default function GameUI({
  level,
  players,
  currentPlayerId,
  currentTurnPlayerId,
  gameState,
  isHost,
  onNextLevel,
  finalScores,
  onPlayAgain,
}: GameUIProps) {
  const currentTurnPlayer = players.find(p => p.id === currentTurnPlayerId);
  const myPlayer = players.find(p => p.id === currentPlayerId);
  const isMyTurn = currentPlayerId === currentTurnPlayerId;

  const getScoreName = (strokes: number, par: number) => {
    const diff = strokes - par;
    if (strokes === 1) return 'Hole in One! 🎉';
    if (diff === -3) return 'Albatross! 🦅';
    if (diff === -2) return 'Eagle! 🦅';
    if (diff === -1) return 'Birdie! 🐦';
    if (diff === 0) return 'Par';
    if (diff === 1) return 'Bogey';
    if (diff === 2) return 'Double Bogey';
    if (diff === 3) return 'Triple Bogey';
    return `+${diff}`;
  };

  if (gameState === 'finished' && finalScores) {
    return (
      <div className="game-over-overlay">
        <div className="game-over-card">
          <h2>🏆 Game Complete! 🏆</h2>
          
          <div className="final-standings">
            {finalScores.map((score, index) => (
              <div 
                key={score.playerId} 
                className={`standing-row ${index === 0 ? 'winner' : ''} ${score.playerId === currentPlayerId ? 'you' : ''}`}
              >
                <span className="position">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                </span>
                <div className="player-ball" style={{ backgroundColor: score.color }} />
                <span className="player-name">{score.name}</span>
                <span className="total-score">{score.totalScore}</span>
              </div>
            ))}
          </div>

          {isHost && (
            <button className="play-again-btn" onClick={onPlayAgain}>
              Play Again
            </button>
          )}
        </div>

        <style jsx>{`
          .game-over-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100;
            animation: fadeIn 0.3s ease;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .game-over-card {
            background: var(--bg-card);
            border-radius: 24px;
            padding: 40px;
            text-align: center;
            animation: bounce-in 0.5s ease;
            max-width: 400px;
            width: 90%;
          }

          .game-over-card h2 {
            font-size: 32px;
            margin-bottom: 32px;
            background: linear-gradient(135deg, #ffd700, #ffaa00);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .final-standings {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 32px;
          }

          .standing-row {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            border: 2px solid transparent;
          }

          .standing-row.winner {
            background: rgba(255, 215, 0, 0.1);
            border-color: #ffd700;
          }

          .standing-row.you {
            border-color: var(--accent);
          }

          .position {
            font-size: 24px;
            width: 40px;
          }

          .player-ball {
            width: 24px;
            height: 24px;
            border-radius: 50%;
          }

          .player-name {
            flex: 1;
            text-align: left;
            font-weight: 500;
          }

          .total-score {
            font-family: 'Fredoka', sans-serif;
            font-size: 24px;
            font-weight: 600;
            color: var(--accent);
          }

          .play-again-btn {
            background: linear-gradient(135deg, var(--accent), #06b6d4);
            color: var(--bg-dark);
            padding: 16px 48px;
            font-size: 18px;
            font-weight: 600;
            border-radius: 12px;
          }

          .play-again-btn:hover {
            transform: scale(1.05);
          }
        `}</style>
      </div>
    );
  }

  if (gameState === 'between-holes') {
    return (
      <div className="between-holes-overlay">
        <div className="between-holes-card">
          <h3>Hole {level.id} Complete!</h3>
          
          <div className="hole-scores">
            {players.map((player) => {
              const holeScore = player.scores[player.scores.length - 1] || 0;
              return (
                <div 
                  key={player.id} 
                  className={`score-row ${player.id === currentPlayerId ? 'you' : ''}`}
                >
                  <div className="player-ball" style={{ backgroundColor: player.color }} />
                  <span className="player-name">{player.name}</span>
                  <span className="hole-strokes">{holeScore}</span>
                  <span className="score-name">{getScoreName(holeScore, level.par)}</span>
                </div>
              );
            })}
          </div>

          {isHost && (
            <button className="next-hole-btn" onClick={onNextLevel}>
              {level.id >= levels.length ? 'See Results' : 'Next Hole →'}
            </button>
          )}
          
          {!isHost && (
            <p className="waiting-text">Waiting for host to continue...</p>
          )}
        </div>

        <style jsx>{`
          .between-holes-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100;
            animation: fadeIn 0.3s ease;
          }

          .between-holes-card {
            background: var(--bg-card);
            border-radius: 24px;
            padding: 32px;
            text-align: center;
            animation: slide-up 0.5s ease;
            max-width: 400px;
            width: 90%;
          }

          .between-holes-card h3 {
            font-size: 28px;
            color: var(--accent);
            margin-bottom: 24px;
          }

          .hole-scores {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 24px;
          }

          .score-row {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
            border: 2px solid transparent;
          }

          .score-row.you {
            border-color: var(--accent);
          }

          .player-ball {
            width: 20px;
            height: 20px;
            border-radius: 50%;
          }

          .player-name {
            flex: 1;
            text-align: left;
          }

          .hole-strokes {
            font-family: 'Fredoka', sans-serif;
            font-size: 24px;
            font-weight: 600;
            color: var(--accent);
            min-width: 40px;
          }

          .score-name {
            font-size: 12px;
            color: var(--success);
            min-width: 100px;
            text-align: right;
          }

          .next-hole-btn {
            background: linear-gradient(135deg, var(--accent), #06b6d4);
            color: var(--bg-dark);
            padding: 16px 48px;
            font-size: 18px;
            font-weight: 600;
            border-radius: 12px;
          }

          .next-hole-btn:hover {
            transform: scale(1.05);
          }

          .waiting-text {
            color: var(--text-secondary);
            font-size: 14px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="game-ui">
      {/* Header */}
      <div className="game-header">
        <div className="level-info">
          <span className="hole-number">Hole {level.id}</span>
          <span className="level-name">{level.name}</span>
        </div>
        <div className="par-info">
          <span className="label">Par</span>
          <span className="value">{level.par}</span>
        </div>
      </div>

      {/* Turn indicator */}
      <div className={`turn-indicator ${isMyTurn ? 'your-turn' : ''}`}>
        <div className="turn-ball" style={{ backgroundColor: currentTurnPlayer?.color }} />
        <span>
          {isMyTurn ? "Your Turn!" : `${currentTurnPlayer?.name}'s Turn`}
        </span>
      </div>

      {/* Current strokes */}
      {myPlayer && (
        <div className="stroke-counter">
          <span className="label">Strokes</span>
          <span className="count">{myPlayer.currentStrokes}</span>
        </div>
      )}

      {/* Scoreboard */}
      <div className="scoreboard">
        <div className="scoreboard-header">
          <span>Scoreboard</span>
        </div>
        <div className="scores-list">
          {players.map((player) => {
            const totalScore = player.scores.reduce((a, b) => a + b, 0);
            return (
              <div 
                key={player.id}
                className={`score-item ${player.id === currentPlayerId ? 'you' : ''} ${player.hasCompletedHole ? 'completed' : ''}`}
              >
                <div className="player-ball" style={{ backgroundColor: player.color }} />
                <span className="name">{player.name}</span>
                <span className="current">{player.currentStrokes}</span>
                <span className="total">({totalScore})</span>
                {player.hasCompletedHole && <span className="check">✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      {isMyTurn && !myPlayer?.hasCompletedHole && (
        <div className="instructions">
          Click and drag to aim, release to shoot!
        </div>
      )}

      <style jsx>{`
        .game-ui {
          position: absolute;
          top: 20px;
          left: 20px;
          right: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          pointer-events: none;
        }

        .game-ui > * {
          pointer-events: auto;
        }

        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .level-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .hole-number {
          font-family: 'Fredoka', sans-serif;
          font-size: 32px;
          font-weight: 700;
          color: white;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        }

        .level-name {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.8);
        }

        .par-info {
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          padding: 12px 20px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .par-info .label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
        }

        .par-info .value {
          font-family: 'Fredoka', sans-serif;
          font-size: 28px;
          font-weight: 600;
          color: var(--accent);
        }

        .turn-indicator {
          align-self: flex-start;
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          padding: 10px 20px;
          border-radius: 25px;
          font-weight: 500;
        }

        .turn-indicator.your-turn {
          background: linear-gradient(135deg, var(--accent), #06b6d4);
          color: var(--bg-dark);
          animation: pulse-glow 2s infinite;
        }

        .turn-ball {
          width: 20px;
          height: 20px;
          border-radius: 50%;
        }

        .stroke-counter {
          align-self: flex-start;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          padding: 10px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .stroke-counter .label {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
        }

        .stroke-counter .count {
          font-family: 'Fredoka', sans-serif;
          font-size: 24px;
          font-weight: 600;
          color: white;
        }

        .scoreboard {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          overflow: hidden;
          min-width: 200px;
        }

        .scoreboard-header {
          background: rgba(0, 0, 0, 0.3);
          padding: 12px 16px;
          font-family: 'Fredoka', sans-serif;
          font-weight: 600;
          font-size: 14px;
          color: var(--accent);
        }

        .scores-list {
          padding: 8px;
        }

        .score-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 14px;
        }

        .score-item.you {
          background: rgba(34, 211, 238, 0.2);
        }

        .score-item.completed {
          opacity: 0.6;
        }

        .score-item .player-ball {
          width: 16px;
          height: 16px;
          border-radius: 50%;
        }

        .score-item .name {
          flex: 1;
        }

        .score-item .current {
          font-family: 'Fredoka', sans-serif;
          font-weight: 600;
          font-size: 16px;
        }

        .score-item .total {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .score-item .check {
          color: var(--success);
        }

        .instructions {
          position: fixed;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          padding: 12px 24px;
          border-radius: 25px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          animation: float 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
