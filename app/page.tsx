'use client';

import { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import GameCanvas from './components/GameCanvas';
import { levels, PLAYER_COLORS } from './levels';
import styles from './page.module.css';

function GameContent() {
  const {
    playerId,
    roomCode,
    isHost,
    players,
    currentPlayerIndex,
    currentLevel,
    gamePhase,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    recordShot,
    completeHole,
    nextLevel,
    toggleReady,
    error,
  } = useGame();

  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [holeComplete, setHoleComplete] = useState(false);
  const [holeStrokes, setHoleStrokes] = useState(0);

  const currentPlayer = players[currentPlayerIndex];
  const myPlayer = players.find(p => p.id === playerId);
  const isMyTurn = currentPlayer?.id === playerId;

  const handleCreate = async () => {
    if (!playerName.trim()) {
      setLocalError('Please enter your name');
      return;
    }
    setLocalError(null);
    try {
      await createRoom(playerName.trim());
    } catch (err) {
      setLocalError('Failed to create room');
    }
  };

  const handleJoin = async () => {
    if (!playerName.trim()) {
      setLocalError('Please enter your name');
      return;
    }
    if (!joinCode.trim()) {
      setLocalError('Please enter a room code');
      return;
    }
    setLocalError(null);
    try {
      await joinRoom(joinCode.trim().toUpperCase(), playerName.trim());
    } catch (err: unknown) {
      if (err instanceof Error) {
        setLocalError(err.message);
      } else {
        setLocalError('Failed to join room');
      }
    }
  };

  const handleHoleComplete = (strokes: number) => {
    setHoleStrokes(strokes);
    setHoleComplete(true);
    completeHole(strokes);
  };

  const handleNextHole = () => {
    setHoleComplete(false);
    nextLevel();
  };

  const getTotalScore = (player: typeof players[0]) => {
    return player.scores.reduce((sum, s) => sum + (s || 0), 0);
  };

  const getTotalPar = () => {
    return levels.slice(0, currentLevel + 1).reduce((sum, l) => sum + l.par, 0);
  };

  // Landing / Lobby Screen
  if (gamePhase === 'lobby' && !roomCode) {
    return (
      <div className={styles.container}>
        <div className={styles.hero}>
          <div className={styles.logoContainer}>
            <div className={styles.ball}></div>
            <div className={styles.hole}></div>
          </div>
          <h1 className={styles.title}>Mini Golf</h1>
          <p className={styles.subtitle}>Play with friends • Up to 4 players</p>
        </div>

        <div className={styles.card}>
          <input
            type="text"
            placeholder="Your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className={styles.input}
            maxLength={12}
          />

          {!isJoining ? (
            <>
              <button onClick={handleCreate} className={styles.primaryButton}>
                Create Game
              </button>
              <button 
                onClick={() => setIsJoining(true)} 
                className={styles.secondaryButton}
              >
                Join Game
              </button>
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="Room code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className={styles.input}
                maxLength={4}
              />
              <button onClick={handleJoin} className={styles.primaryButton}>
                Join
              </button>
              <button 
                onClick={() => setIsJoining(false)} 
                className={styles.textButton}
              >
                Back
              </button>
            </>
          )}

          {(localError || error) && (
            <p className={styles.error}>{localError || error}</p>
          )}
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>🏌️</span>
            <span>18 Holes</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>🌀</span>
            <span>Obstacles</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>👥</span>
            <span>Multiplayer</span>
          </div>
        </div>
      </div>
    );
  }

  // Waiting Room
  if (gamePhase === 'lobby' && roomCode) {
    const allReady = players.length >= 1 && players.every(p => p.isReady || p.id === playerId);

    return (
      <div className={styles.container}>
        <div className={styles.waitingRoom}>
          <div className={styles.roomHeader}>
            <button onClick={leaveRoom} className={styles.backButton}>
              ← Leave
            </button>
            <div className={styles.roomCodeContainer}>
              <span className={styles.roomCodeLabel}>Room Code</span>
              <span className={styles.roomCode}>{roomCode}</span>
            </div>
          </div>

          <h2 className={styles.waitingTitle}>Waiting for Players</h2>
          <p className={styles.waitingSubtitle}>
            Share the room code with friends to join
          </p>

          <div className={styles.playerList}>
            {players.map((player, index) => (
              <div 
                key={player.id} 
                className={styles.playerCard}
                style={{ borderColor: player.color }}
              >
                <div 
                  className={styles.playerAvatar}
                  style={{ backgroundColor: player.color }}
                >
                  {player.name[0].toUpperCase()}
                </div>
                <div className={styles.playerInfo}>
                  <span className={styles.playerName}>
                    {player.name}
                    {player.id === playerId && ' (You)'}
                  </span>
                  {index === 0 && <span className={styles.hostBadge}>Host</span>}
                </div>
                {player.isReady && (
                  <span className={styles.readyBadge}>Ready</span>
                )}
              </div>
            ))}
            
            {/* Empty slots */}
            {Array.from({ length: 4 - players.length }).map((_, i) => (
              <div key={`empty-${i}`} className={styles.emptySlot}>
                <div className={styles.emptyAvatar}>?</div>
                <span className={styles.emptyText}>Waiting...</span>
              </div>
            ))}
          </div>

          <div className={styles.lobbyActions}>
            {!isHost && (
              <button 
                onClick={toggleReady}
                className={myPlayer?.isReady ? styles.readyButton : styles.primaryButton}
              >
                {myPlayer?.isReady ? '✓ Ready!' : 'Ready Up'}
              </button>
            )}
            
            {isHost && (
              <button 
                onClick={startGame}
                className={styles.primaryButton}
                disabled={players.length < 1}
              >
                Start Game ({players.length}/4 players)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Game Screen
  if (gamePhase === 'playing') {
    const level = levels[currentLevel];

    // Hole complete overlay
    if (holeComplete) {
      const par = level.par;
      const diff = holeStrokes - par;
      let scoreText = '';
      if (diff === -3) scoreText = 'Albatross!';
      else if (diff === -2) scoreText = 'Eagle!';
      else if (diff === -1) scoreText = 'Birdie!';
      else if (diff === 0) scoreText = 'Par';
      else if (diff === 1) scoreText = 'Bogey';
      else if (diff === 2) scoreText = 'Double Bogey';
      else if (diff > 2) scoreText = `+${diff}`;
      else scoreText = `${diff}`;

      return (
        <div className={styles.container}>
          <div className={styles.holeComplete}>
            <div className={styles.holeCompleteCard}>
              <h2 className={styles.holeCompleteTitle}>Hole {currentLevel + 1} Complete!</h2>
              <div className={styles.scoreDisplay}>
                <span className={styles.strokesLarge}>{holeStrokes}</span>
                <span className={styles.scoreText}>{scoreText}</span>
              </div>
              <div className={styles.parInfo}>
                Par {par} • {holeStrokes} stroke{holeStrokes !== 1 ? 's' : ''}
              </div>

              {players.length > 1 && (
                <div className={styles.standings}>
                  <h3>Standings</h3>
                  {[...players]
                    .sort((a, b) => getTotalScore(a) - getTotalScore(b))
                    .map((player, index) => (
                      <div 
                        key={player.id} 
                        className={styles.standingRow}
                        style={{ borderLeftColor: player.color }}
                      >
                        <span className={styles.standingPosition}>{index + 1}</span>
                        <span className={styles.standingName}>{player.name}</span>
                        <span className={styles.standingScore}>
                          {getTotalScore(player)} ({getTotalScore(player) - getTotalPar() >= 0 ? '+' : ''}{getTotalScore(player) - getTotalPar()})
                        </span>
                      </div>
                    ))}
                </div>
              )}

              <button 
                onClick={handleNextHole} 
                className={styles.primaryButton}
              >
                {currentLevel + 1 >= levels.length ? 'See Results' : 'Next Hole →'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.gameContainer}>
        {/* Top bar with player info */}
        <div className={styles.gameHeader}>
          <div className={styles.levelProgress}>
            Hole {currentLevel + 1} / {levels.length}
          </div>
          
          <div className={styles.playerTurn}>
            {players.length > 1 && (
              <>
                <div 
                  className={styles.turnIndicator}
                  style={{ backgroundColor: currentPlayer?.color }}
                />
                <span>{isMyTurn ? 'Your turn' : `${currentPlayer?.name}'s turn`}</span>
              </>
            )}
          </div>
        </div>

        {/* Game canvas */}
        <GameCanvas
          level={level}
          playerColor={myPlayer?.color || PLAYER_COLORS[0]}
          playerName={myPlayer?.name || 'Player'}
          isMyTurn={isMyTurn || players.length === 1}
          onShot={recordShot}
          onHoleComplete={handleHoleComplete}
          currentStrokes={myPlayer?.scores[currentLevel] || 0}
        />

        {/* Scoreboard for multiplayer */}
        {players.length > 1 && (
          <div className={styles.miniScoreboard}>
            {players.map(player => (
              <div 
                key={player.id}
                className={`${styles.miniScore} ${player.id === currentPlayer?.id ? styles.active : ''}`}
                style={{ borderColor: player.color }}
              >
                <span className={styles.miniName}>{player.name}</span>
                <span className={styles.miniTotal}>{getTotalScore(player)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Results Screen
  if (gamePhase === 'results') {
    const sortedPlayers = [...players].sort((a, b) => getTotalScore(a) - getTotalScore(b));
    const totalPar = levels.reduce((sum, l) => sum + l.par, 0);

    return (
      <div className={styles.container}>
        <div className={styles.results}>
          <h1 className={styles.resultsTitle}>Game Complete!</h1>
          
          <div className={styles.podium}>
            {sortedPlayers.slice(0, 3).map((player, index) => (
              <div 
                key={player.id}
                className={`${styles.podiumPlace} ${styles[`place${index + 1}`]}`}
              >
                <div 
                  className={styles.podiumAvatar}
                  style={{ backgroundColor: player.color }}
                >
                  {player.name[0].toUpperCase()}
                </div>
                <span className={styles.podiumName}>{player.name}</span>
                <span className={styles.podiumScore}>
                  {getTotalScore(player)} ({getTotalScore(player) - totalPar >= 0 ? '+' : ''}{getTotalScore(player) - totalPar})
                </span>
                <div className={styles.podiumRank}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.scorecard}>
            <h3>Scorecard</h3>
            <div className={styles.scorecardTable}>
              <div className={styles.scorecardHeader}>
                <span>Hole</span>
                <span>Par</span>
                {sortedPlayers.map(p => (
                  <span key={p.id} style={{ color: p.color }}>{p.name}</span>
                ))}
              </div>
              {levels.map((level, i) => (
                <div key={level.id} className={styles.scorecardRow}>
                  <span>{i + 1}</span>
                  <span>{level.par}</span>
                  {sortedPlayers.map(p => (
                    <span key={p.id}>{p.scores[i] || '-'}</span>
                  ))}
                </div>
              ))}
              <div className={styles.scorecardTotal}>
                <span>Total</span>
                <span>{totalPar}</span>
                {sortedPlayers.map(p => (
                  <span key={p.id} style={{ color: p.color, fontWeight: 600 }}>
                    {getTotalScore(p)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button onClick={leaveRoom} className={styles.primaryButton}>
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default function Home() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}
