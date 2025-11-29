'use client';

import React, { useState } from 'react';
import { Player } from '@/lib/types';

interface LobbyProps {
  roomId: string;
  players: Player[];
  currentPlayerId: string;
  isHost: boolean;
  onReady: (ready: boolean) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export default function Lobby({
  roomId,
  players,
  currentPlayerId,
  isHost,
  onReady,
  onStartGame,
  onLeaveRoom,
}: LobbyProps) {
  const [copied, setCopied] = useState(false);
  
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const allPlayersReady = players.every(p => p.isReady || p.isHost);
  const canStart = players.length >= 1 && (allPlayersReady || players.length === 1);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="lobby">
      <div className="lobby-header">
        <h2>Game Lobby</h2>
        <button className="leave-btn" onClick={onLeaveRoom}>
          Leave Room
        </button>
      </div>

      <div className="room-code-section">
        <span className="label">Room Code</span>
        <div className="room-code-display">
          <span className="code">{roomId}</span>
          <button className="copy-btn" onClick={copyRoomCode}>
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
        <p className="share-hint">Share this code with friends to join!</p>
      </div>

      <div className="players-section">
        <h3>Players ({players.length}/4)</h3>
        <div className="players-list">
          {players.map((player, index) => (
            <div 
              key={player.id} 
              className={`player-card ${player.id === currentPlayerId ? 'current' : ''}`}
            >
              <div className="player-avatar" style={{ backgroundColor: player.color }}>
                {player.name.charAt(0).toUpperCase()}
              </div>
              <div className="player-info">
                <span className="player-name">
                  {player.name}
                  {player.isHost && <span className="host-badge">HOST</span>}
                  {player.id === currentPlayerId && <span className="you-badge">YOU</span>}
                </span>
                <span className={`player-status ${player.isReady || player.isHost ? 'ready' : ''}`}>
                  {player.isHost ? 'Ready' : player.isReady ? 'Ready' : 'Not Ready'}
                </span>
              </div>
              <div className="player-ball" style={{ backgroundColor: player.color }} />
            </div>
          ))}
          
          {/* Empty slots */}
          {Array.from({ length: 4 - players.length }).map((_, i) => (
            <div key={`empty-${i}`} className="player-card empty">
              <div className="player-avatar empty">?</div>
              <div className="player-info">
                <span className="player-name">Waiting for player...</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lobby-actions">
        {!isHost && currentPlayer && (
          <button
            className={`ready-btn ${currentPlayer.isReady ? 'ready' : ''}`}
            onClick={() => onReady(!currentPlayer.isReady)}
          >
            {currentPlayer.isReady ? 'Cancel Ready' : "I'm Ready!"}
          </button>
        )}
        
        {isHost && (
          <button
            className="start-btn"
            onClick={onStartGame}
            disabled={!canStart}
          >
            {canStart ? 'Start Game' : 'Waiting for players...'}
          </button>
        )}
      </div>

      <style jsx>{`
        .lobby {
          background: var(--bg-card);
          border-radius: 24px;
          padding: 32px;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .lobby-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .lobby-header h2 {
          font-size: 28px;
          color: var(--accent);
        }

        .leave-btn {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
        }

        .leave-btn:hover {
          background: rgba(239, 68, 68, 0.3);
        }

        .room-code-section {
          text-align: center;
          margin-bottom: 32px;
          padding: 20px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 16px;
        }

        .label {
          font-size: 12px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .room-code-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 8px;
        }

        .code {
          font-family: 'Fredoka', sans-serif;
          font-size: 36px;
          font-weight: 700;
          letter-spacing: 4px;
          color: var(--accent);
          text-shadow: 0 0 20px var(--accent-glow);
        }

        .copy-btn {
          background: var(--accent);
          color: var(--bg-dark);
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
        }

        .copy-btn:hover {
          transform: scale(1.05);
        }

        .share-hint {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 12px;
        }

        .players-section h3 {
          font-size: 18px;
          margin-bottom: 16px;
          color: var(--text-primary);
        }

        .players-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .player-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          border: 2px solid transparent;
          transition: all 0.2s ease;
        }

        .player-card.current {
          border-color: var(--accent);
          background: rgba(34, 211, 238, 0.1);
        }

        .player-card.empty {
          opacity: 0.4;
        }

        .player-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Fredoka', sans-serif;
          font-size: 20px;
          font-weight: 600;
          color: white;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .player-avatar.empty {
          background: var(--bg-card-hover);
          color: var(--text-secondary);
        }

        .player-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .player-name {
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .host-badge {
          font-size: 10px;
          background: var(--warning);
          color: var(--bg-dark);
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
        }

        .you-badge {
          font-size: 10px;
          background: var(--accent);
          color: var(--bg-dark);
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
        }

        .player-status {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .player-status.ready {
          color: var(--success);
        }

        .player-ball {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          box-shadow: inset -3px -3px 6px rgba(0, 0, 0, 0.3),
                      inset 3px 3px 6px rgba(255, 255, 255, 0.2);
        }

        .lobby-actions {
          margin-top: 32px;
          display: flex;
          justify-content: center;
        }

        .ready-btn, .start-btn {
          padding: 16px 48px;
          font-size: 18px;
          font-weight: 600;
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .ready-btn {
          background: var(--bg-card-hover);
          color: var(--text-primary);
        }

        .ready-btn:hover {
          background: var(--accent);
          color: var(--bg-dark);
        }

        .ready-btn.ready {
          background: var(--success);
          color: white;
        }

        .start-btn {
          background: linear-gradient(135deg, var(--accent), #06b6d4);
          color: var(--bg-dark);
          animation: pulse-glow 2s infinite;
        }

        .start-btn:disabled {
          background: var(--bg-card-hover);
          color: var(--text-secondary);
          animation: none;
          cursor: not-allowed;
        }

        .start-btn:not(:disabled):hover {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}
