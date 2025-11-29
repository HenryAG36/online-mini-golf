const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// In-memory game state
const rooms = new Map();
const playerSockets = new Map();

const PLAYER_COLORS = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a855f7'];
const TOTAL_LEVELS = 12;

function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('createRoom', (playerName, callback) => {
      const roomId = generateRoomId();
      
      const player = {
        id: socket.id,
        name: playerName,
        color: PLAYER_COLORS[0],
        scores: [],
        currentStrokes: 0,
        isReady: false,
        isHost: true,
        hasCompletedHole: false,
      };

      const room = {
        id: roomId,
        players: [player],
        currentLevel: 1,
        gameState: 'lobby',
        currentTurn: 0,
        maxPlayers: 4,
      };

      rooms.set(roomId, room);
      playerSockets.set(socket.id, roomId);
      socket.join(roomId);

      callback(roomId);
      io.to(roomId).emit('roomUpdate', room);
    });

    socket.on('joinRoom', (roomId, playerName, callback) => {
      const room = rooms.get(roomId.toUpperCase());

      if (!room) {
        callback(false, 'Room not found');
        return;
      }

      if (room.gameState !== 'lobby') {
        callback(false, 'Game already in progress');
        return;
      }

      if (room.players.length >= room.maxPlayers) {
        callback(false, 'Room is full');
        return;
      }

      const player = {
        id: socket.id,
        name: playerName,
        color: PLAYER_COLORS[room.players.length],
        scores: [],
        currentStrokes: 0,
        isReady: false,
        isHost: false,
        hasCompletedHole: false,
      };

      room.players.push(player);
      playerSockets.set(socket.id, room.id);
      socket.join(room.id);

      callback(true);
      io.to(room.id).emit('roomUpdate', room);
      io.to(room.id).emit('playerJoined', player);
    });

    socket.on('setReady', (ready) => {
      const roomId = playerSockets.get(socket.id);
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.isReady = ready;
        io.to(roomId).emit('roomUpdate', room);
      }
    });

    socket.on('startGame', () => {
      const roomId = playerSockets.get(socket.id);
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player?.isHost) return;

      // Check if all players are ready
      const allReady = room.players.every(p => p.isReady || p.isHost);
      if (!allReady && room.players.length > 1) {
        socket.emit('error', 'All players must be ready');
        return;
      }

      room.gameState = 'playing';
      room.currentLevel = 1;
      room.currentTurn = 0;
      room.players.forEach(p => {
        p.scores = [];
        p.currentStrokes = 0;
        p.hasCompletedHole = false;
      });

      io.to(roomId).emit('roomUpdate', room);
    });

    socket.on('shoot', (power, angle) => {
      const roomId = playerSockets.get(socket.id);
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.currentStrokes++;
        io.to(roomId).emit('playerShot', socket.id, { power, angle });
        io.to(roomId).emit('roomUpdate', room);
      }
    });

    socket.on('updateBallPosition', (state) => {
      const roomId = playerSockets.get(socket.id);
      if (!roomId) return;

      socket.to(roomId).emit('ballUpdate', socket.id, state);
    });

    socket.on('completeHole', (strokes) => {
      const roomId = playerSockets.get(socket.id);
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.scores.push(strokes);
        player.hasCompletedHole = true;
        
        io.to(roomId).emit('holeComplete', socket.id, strokes);

        // Check if all players completed the hole
        const allComplete = room.players.every(p => p.hasCompletedHole);
        if (allComplete) {
          room.gameState = 'between-holes';
          io.to(roomId).emit('levelComplete');
        }

        io.to(roomId).emit('roomUpdate', room);
      }
    });

    socket.on('nextLevel', () => {
      const roomId = playerSockets.get(socket.id);
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (!player?.isHost) return;

      if (room.currentLevel >= TOTAL_LEVELS) {
        room.gameState = 'finished';
        const finalScores = room.players
          .map(p => ({
            playerId: p.id,
            name: p.name,
            color: p.color,
            totalScore: p.scores.reduce((a, b) => a + b, 0),
          }))
          .sort((a, b) => a.totalScore - b.totalScore);

        io.to(roomId).emit('gameOver', finalScores);
        io.to(roomId).emit('roomUpdate', room);
        return;
      }

      room.currentLevel++;
      room.currentTurn = 0;
      room.players.forEach(p => {
        p.currentStrokes = 0;
        p.hasCompletedHole = false;
        p.ballPosition = undefined;
      });
      room.gameState = 'playing';

      io.to(roomId).emit('roomUpdate', room);
    });

    socket.on('sendChat', (message) => {
      const roomId = playerSockets.get(socket.id);
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        io.to(roomId).emit('chatMessage', socket.id, player.name, message);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      const roomId = playerSockets.get(socket.id);
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room) return;

      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex === -1) return;

      const wasHost = room.players[playerIndex].isHost;
      room.players.splice(playerIndex, 1);
      playerSockets.delete(socket.id);

      if (room.players.length === 0) {
        rooms.delete(roomId);
        return;
      }

      if (wasHost) {
        room.players[0].isHost = true;
      }

      // Reassign colors
      room.players.forEach((p, i) => {
        p.color = PLAYER_COLORS[i];
      });

      io.to(roomId).emit('playerLeft', socket.id);
      io.to(roomId).emit('roomUpdate', room);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
