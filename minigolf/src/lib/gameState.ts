import { GameState, Player, GameAction, PLAYER_COLORS, PLAYER_AVATARS } from '@/types/game';
import { TOTAL_LEVELS } from './levels';

export function createInitialGameState(roomId: string): GameState {
  return {
    roomId,
    players: [],
    currentLevel: 1,
    currentPlayerIndex: 0,
    phase: 'lobby',
    ballInMotion: false,
  };
}

export function createPlayer(id: string, name: string, isHost: boolean, existingPlayers: Player[]): Player {
  const colorIndex = existingPlayers.length % PLAYER_COLORS.length;
  return {
    id,
    name,
    color: PLAYER_COLORS[colorIndex],
    avatar: PLAYER_AVATARS[colorIndex],
    scores: [],
    currentStrokes: 0,
    isHost,
    isReady: isHost,
    hasFinishedHole: false,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'PLAYER_JOIN': {
      if (state.players.length >= 4 || state.phase !== 'lobby') {
        return state;
      }
      return {
        ...state,
        players: [...state.players, action.player],
      };
    }

    case 'PLAYER_LEAVE': {
      const newPlayers = state.players.filter(p => p.id !== action.playerId);
      let newHostIndex = -1;
      
      // If the leaving player was host, assign new host
      if (state.players.find(p => p.id === action.playerId)?.isHost && newPlayers.length > 0) {
        newHostIndex = 0;
        newPlayers[0].isHost = true;
      }

      // Adjust current player index if needed
      let newCurrentIndex = state.currentPlayerIndex;
      const leavingPlayerIndex = state.players.findIndex(p => p.id === action.playerId);
      if (leavingPlayerIndex !== -1 && leavingPlayerIndex <= state.currentPlayerIndex) {
        newCurrentIndex = Math.max(0, state.currentPlayerIndex - 1);
      }
      if (newCurrentIndex >= newPlayers.length) {
        newCurrentIndex = 0;
      }

      return {
        ...state,
        players: newPlayers,
        currentPlayerIndex: newCurrentIndex,
      };
    }

    case 'PLAYER_READY': {
      return {
        ...state,
        players: state.players.map(p =>
          p.id === action.playerId ? { ...p, isReady: true } : p
        ),
      };
    }

    case 'START_GAME': {
      return {
        ...state,
        phase: 'playing',
        currentLevel: 1,
        currentPlayerIndex: 0,
        players: state.players.map(p => ({
          ...p,
          scores: [],
          currentStrokes: 0,
          hasFinishedHole: false,
        })),
      };
    }

    case 'TAKE_SHOT': {
      return {
        ...state,
        ballInMotion: true,
        players: state.players.map(p =>
          p.id === action.shot.playerId
            ? { ...p, currentStrokes: p.currentStrokes + 1 }
            : p
        ),
      };
    }

    case 'BALL_STOPPED': {
      return {
        ...state,
        ballInMotion: false,
        players: state.players.map(p =>
          p.id === action.playerId ? { ...p, ballPosition: action.position } : p
        ),
      };
    }

    case 'HOLE_COMPLETE': {
      const updatedPlayers = state.players.map(p =>
        p.id === action.playerId
          ? {
              ...p,
              hasFinishedHole: true,
              scores: [...p.scores, action.strokes],
            }
          : p
      );

      const allFinished = updatedPlayers.every(p => p.hasFinishedHole);
      
      // Find next player who hasn't finished
      let nextPlayerIndex = state.currentPlayerIndex;
      if (!allFinished) {
        for (let i = 0; i < updatedPlayers.length; i++) {
          const idx = (state.currentPlayerIndex + 1 + i) % updatedPlayers.length;
          if (!updatedPlayers[idx].hasFinishedHole) {
            nextPlayerIndex = idx;
            break;
          }
        }
      }

      return {
        ...state,
        players: updatedPlayers,
        currentPlayerIndex: nextPlayerIndex,
        phase: allFinished ? 'between-holes' : 'playing',
        ballInMotion: false,
      };
    }

    case 'NEXT_HOLE': {
      const nextLevel = state.currentLevel + 1;
      
      if (nextLevel > TOTAL_LEVELS) {
        // Game over - determine winner
        const playerTotals = state.players.map(p => ({
          id: p.id,
          total: p.scores.reduce((a, b) => a + b, 0),
        }));
        const winner = playerTotals.reduce((min, p) => 
          p.total < min.total ? p : min
        );

        return {
          ...state,
          phase: 'finished',
          winner: winner.id,
        };
      }

      return {
        ...state,
        currentLevel: nextLevel,
        currentPlayerIndex: 0,
        phase: 'playing',
        players: state.players.map(p => ({
          ...p,
          currentStrokes: 0,
          hasFinishedHole: false,
          ballPosition: undefined,
        })),
      };
    }

    case 'GAME_OVER': {
      return {
        ...state,
        phase: 'finished',
      };
    }

    default:
      return state;
  }
}

export function getTotalScore(player: Player): number {
  return player.scores.reduce((a, b) => a + b, 0);
}

export function getScoreLabel(strokes: number, par: number): string {
  const diff = strokes - par;
  if (strokes === 1) return 'HOLE IN ONE! 🎯';
  if (diff === -3) return 'Albatross! 🦅';
  if (diff === -2) return 'Eagle! 🦅';
  if (diff === -1) return 'Birdie! 🐦';
  if (diff === 0) return 'Par';
  if (diff === 1) return 'Bogey';
  if (diff === 2) return 'Double Bogey';
  if (diff >= 3) return `+${diff}`;
  return `${diff}`;
}

export function canStartGame(state: GameState): boolean {
  return state.players.length >= 1 && state.players.every(p => p.isReady);
}

export function getCurrentPlayer(state: GameState): Player | undefined {
  return state.players[state.currentPlayerIndex];
}

export function isPlayerTurn(state: GameState, playerId: string): boolean {
  const currentPlayer = getCurrentPlayer(state);
  return currentPlayer?.id === playerId && !state.ballInMotion && state.phase === 'playing';
}
