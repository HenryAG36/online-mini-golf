# 🏌️ Mini Golf Online

A fun multiplayer mini golf game inspired by Plato! Play with up to 4 friends in real-time.

![Mini Golf Online](https://img.shields.io/badge/Players-Up%20to%204-brightgreen)
![Holes](https://img.shields.io/badge/Holes-12-blue)
![Built with](https://img.shields.io/badge/Built%20with-Next.js%20%2B%20Socket.io-black)

## ✨ Features

- **12 Unique Holes** - Each with creative obstacles and challenges
- **Real-time Multiplayer** - Play with up to 4 players simultaneously
- **Physics-based Gameplay** - Realistic ball physics with Matter.js
- **Fun Obstacles** - Water hazards, sand traps, windmills, bumpers, teleporters, and more!
- **Beautiful UI** - Modern, responsive design with smooth animations
- **Multiple Themes** - Grass, desert, ice, and space themed levels

## 🎮 How to Play

1. **Create or Join a Game** - Enter your name and create a room, or join with a friend's room code
2. **Wait for Players** - Share the room code with friends (up to 4 players)
3. **Start the Game** - Host clicks "Start Game" when everyone is ready
4. **Take Turns** - Click and drag to aim, release to shoot
5. **Complete All Holes** - Lowest total score wins!

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Game Engine**: Matter.js (2D physics)
- **Real-time**: Socket.io
- **Styling**: CSS-in-JS with custom animations

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd minigolf-online

# Install dependencies
npm install

# Start development server
npm run dev
```

The game will be available at `http://localhost:3000`

## 📦 Deployment

### Option 1: Railway, Render, or Fly.io (Recommended for WebSockets)

These platforms support long-running WebSocket connections:

**Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Render:**
1. Connect your GitHub repository to Render
2. Create a new "Web Service"
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`

**Fly.io:**
```bash
# Install flyctl and login
fly auth login
fly launch
fly deploy
```

### Option 2: Vercel + External WebSocket Server

Since Vercel serverless functions don't support persistent WebSocket connections, you'll need to:

1. **Deploy the frontend to Vercel:**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Deploy the WebSocket server separately** to Railway/Render/Fly.io

3. **Update the socket connection** in `lib/socket.ts`:
   ```typescript
   const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
   ```

4. **Set environment variable** in Vercel:
   - `NEXT_PUBLIC_SOCKET_URL`: Your WebSocket server URL

### Option 3: Self-hosted (VPS/Docker)

```bash
# Build the application
npm run build

# Start in production mode
npm start
```

**Docker:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🎯 Game Levels

| Hole | Name | Par | Features |
|------|------|-----|----------|
| 1 | First Swing | 2 | Straight shot introduction |
| 2 | Dogleg Right | 3 | L-shaped path |
| 3 | Splash Zone | 3 | Water hazard |
| 4 | Desert Storm | 3 | Sand traps |
| 5 | Pinball Wizard | 4 | Multiple bumpers |
| 6 | Dutch Treat | 3 | Rotating windmill |
| 7 | Portal Golf | 2 | Teleporters |
| 8 | Rhythm & Putt | 4 | Moving walls |
| 9 | Labyrinth | 5 | Complex maze |
| 10 | The Gauntlet | 5 | All obstacles combined |
| 11 | Frozen Fairway | 3 | Ice physics |
| 12 | Zero Gravity | 4 | Space theme with teleporters |

## 🎨 Customization

### Adding New Levels

Edit `lib/levels.ts` to add new levels:

```typescript
{
  id: 13,
  name: "Your Level Name",
  par: 3,
  ball: { x: 100, y: 300 },
  hole: { x: 700, y: 300 },
  obstacles: [
    { type: 'wall', x: 400, y: 50, width: 760, height: 20 },
    // Add more obstacles...
  ],
  theme: 'grass' // 'grass' | 'desert' | 'ice' | 'space'
}
```

### Available Obstacle Types

- `wall` - Static rectangular obstacle
- `water` - Resets ball to last valid position
- `sand` - Slows down the ball
- `bumper` - Bouncy circular obstacle
- `windmill` - Rotating obstacle
- `moving-wall` - Vertically moving wall
- `teleporter` - Teleports ball to linked teleporter

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for learning or your own games!

## 🙏 Acknowledgments

- Inspired by [Plato's Mini Golf](https://platoapp.com/)
- Physics powered by [Matter.js](https://brm.io/matter-js/)
- Built with [Next.js](https://nextjs.org/)
