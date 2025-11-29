import { GameState, Player, Ball, PLAYER_COLORS } from '@/types/game';
import { LEVELS } from './levels';

export function createInitialGameState(roomId: string): GameState {
  return {
    roomId,
    players: [],
    currentLevel: 1,
    currentPlayerIndex: 0,
    balls: {},
    gamePhase: 'lobby',
    levelScores: {},
  };
}

export function addPlayer(state: GameState, playerId: string, name: string, isHost: boolean = false): GameState {
  if (state.players.length >= 4) return state;
  if (state.players.find(p => p.id === playerId)) return state;

  const playerIndex = state.players.length;
  const newPlayer: Player = {
    id: playerId,
    name: name || `Player ${playerIndex + 1}`,
    color: PLAYER_COLORS[playerIndex],
    score: [],
    totalScore: 0,
    isHost,
    isReady: false,
    currentStrokes: 0,
    hasFinishedHole: false,
  };

  return {
    ...state,
    players: [...state.players, newPlayer],
  };
}

export function removePlayer(state: GameState, playerId: string): GameState {
  const newPlayers = state.players.filter(p => p.id !== playerId);
  
  // If host left, assign new host
  if (newPlayers.length > 0 && !newPlayers.some(p => p.isHost)) {
    newPlayers[0].isHost = true;
  }

  const newBalls = { ...state.balls };
  delete newBalls[playerId];

  return {
    ...state,
    players: newPlayers,
    balls: newBalls,
  };
}

export function setPlayerReady(state: GameState, playerId: string, ready: boolean): GameState {
  return {
    ...state,
    players: state.players.map(p => 
      p.id === playerId ? { ...p, isReady: ready } : p
    ),
  };
}

export function startGame(state: GameState): GameState {
  const level = LEVELS[0];
  const balls: Record<string, Ball> = {};
  
  state.players.forEach((player, index) => {
    const offset = index * 15;
    balls[player.id] = {
      position: { 
        x: level.startPosition.x, 
        y: level.startPosition.y + offset - (state.players.length * 7.5) 
      },
      velocity: { x: 0, y: 0 },
      radius: 10,
      color: player.color,
      isMoving: false,
    };
  });

  const levelScores: Record<string, number[]> = {};
  state.players.forEach(player => {
    levelScores[player.id] = [];
  });

  return {
    ...state,
    gamePhase: 'playing',
    currentLevel: 1,
    currentPlayerIndex: 0,
    balls,
    levelScores,
    players: state.players.map(p => ({
      ...p,
      currentStrokes: 0,
      hasFinishedHole: false,
      score: [],
      totalScore: 0,
    })),
  };
}

export function updateBallState(state: GameState, playerId: string, ball: Ball): GameState {
  return {
    ...state,
    balls: {
      ...state.balls,
      [playerId]: ball,
    },
  };
}

export function incrementStrokes(state: GameState, playerId: string): GameState {
  return {
    ...state,
    players: state.players.map(p =>
      p.id === playerId ? { ...p, currentStrokes: p.currentStrokes + 1 } : p
    ),
  };
}

export function playerFinishedHole(state: GameState, playerId: string): GameState {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return state;

  const newLevelScores = { ...state.levelScores };
  if (!newLevelScores[playerId]) newLevelScores[playerId] = [];
  newLevelScores[playerId][state.currentLevel - 1] = player.currentStrokes;

  const newPlayers = state.players.map(p => {
    if (p.id === playerId) {
      const newScore = [...p.score, p.currentStrokes];
      return {
        ...p,
        hasFinishedHole: true,
        score: newScore,
        totalScore: newScore.reduce((a, b) => a + b, 0),
      };
    }
    return p;
  });

  // Check if all players finished
  const allFinished = newPlayers.every(p => p.hasFinishedHole);

  return {
    ...state,
    players: newPlayers,
    levelScores: newLevelScores,
    gamePhase: allFinished ? 'between-holes' : state.gamePhase,
  };
}

export function nextLevel(state: GameState): GameState {
  const nextLevelNum = state.currentLevel + 1;
  
  if (nextLevelNum > LEVELS.length) {
    return {
      ...state,
      gamePhase: 'finished',
    };
  }

  const level = LEVELS[nextLevelNum - 1];
  const balls: Record<string, Ball> = {};
  
  state.players.forEach((player, index) => {
    const offset = index * 15;
    balls[player.id] = {
      position: { 
        x: level.startPosition.x, 
        y: level.startPosition.y + offset - (state.players.length * 7.5)
      },
      velocity: { x: 0, y: 0 },
      radius: 10,
      color: player.color,
      isMoving: false,
    };
  });

  return {
    ...state,
    currentLevel: nextLevelNum,
    currentPlayerIndex: 0,
    balls,
    gamePhase: 'playing',
    players: state.players.map(p => ({
      ...p,
      currentStrokes: 0,
      hasFinishedHole: false,
    })),
  };
}

export function resetBallToStart(state: GameState, playerId: string): GameState {
  const level = LEVELS[state.currentLevel - 1];
  const playerIndex = state.players.findIndex(p => p.id === playerId);
  const offset = playerIndex * 15;

  return {
    ...state,
    balls: {
      ...state.balls,
      [playerId]: {
        ...state.balls[playerId],
        position: { 
          x: level.startPosition.x, 
          y: level.startPosition.y + offset - (state.players.length * 7.5)
        },
        velocity: { x: 0, y: 0 },
        isMoving: false,
      },
    },
  };
}

export function nextTurn(state: GameState): GameState {
  // Find next player who hasn't finished the hole
  let nextIndex = state.currentPlayerIndex;
  let attempts = 0;
  
  do {
    nextIndex = (nextIndex + 1) % state.players.length;
    attempts++;
    if (attempts > state.players.length) break;
  } while (state.players[nextIndex].hasFinishedHole);

  return {
    ...state,
    currentPlayerIndex: nextIndex,
  };
}

export function getCurrentPlayer(state: GameState): Player | undefined {
  return state.players[state.currentPlayerIndex];
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
