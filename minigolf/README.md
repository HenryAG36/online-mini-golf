# 🏌️ Mini Golf Online

A fun multiplayer minigolf game that supports up to 4 players! Built with Next.js and deployable on Vercel.

![Mini Golf](https://img.shields.io/badge/Players-1--4-green) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## ✨ Features

- 🎮 **9 Fun Levels** - From easy straight shots to challenging mazes with obstacles
- 👥 **Multiplayer** - Play with up to 4 players
- 🎯 **Intuitive Controls** - Click and drag to aim and shoot
- 🏆 **Scoreboard** - Track scores across all holes
- 🎨 **Beautiful Design** - Themed levels with smooth animations

## 🎮 How to Play

1. Enter your name and create a game or join with a room code
2. Share the room code with friends (up to 4 players)
3. When everyone is ready, the host starts the game
4. Click near your ball and drag to aim - release to shoot
5. Get the ball in the hole with the fewest strokes!

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play!

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/minigolf)

Or deploy manually:

```bash
npm install -g vercel
vercel
```

## 🌐 Multiplayer Setup

The game supports two multiplayer modes:

### Local Multiplayer (Default)
Works automatically using the browser's BroadcastChannel API. Perfect for:
- Testing on the same device
- Playing with friends on the same network

### Online Multiplayer (Optional)
For playing with friends remotely, set up [Pusher](https://pusher.com):

1. Create a free Pusher account
2. Create a new Channels app
3. Add environment variables to your Vercel project:

```env
PUSHER_APP_ID=your_app_id
PUSHER_SECRET=your_secret
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=us2
```

## 🗺️ Levels

| # | Name | Par | Theme | Obstacles |
|---|------|-----|-------|-----------|
| 1 | First Putt | 2 | Grass | None |
| 2 | Dogleg Right | 3 | Grass | None |
| 3 | Bumper Bonanza | 3 | Candy | Bouncy bumpers |
| 4 | Sandy Shores | 4 | Desert | Sand traps |
| 5 | Lake View | 3 | Grass | Water hazard |
| 6 | Spin City | 4 | Space | Spinners |
| 7 | Labyrinth | 5 | Grass | Maze walls |
| 8 | Portal Panic | 3 | Space | Teleporters |
| 9 | Grand Finale | 5 | Volcano | Everything! |

## 🎨 Obstacle Types

- **Bumpers** 🔴 - Bounce your ball with extra force
- **Sand Traps** 🏖️ - Slow down your ball
- **Water Hazards** 💧 - Resets ball to start (+1 stroke penalty)
- **Spinners** 🌀 - Add rotational force to nearby balls
- **Ramps** ⬆️ - Speed boost in a direction
- **Portals** 🟣 - Teleport to another location

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Fonts**: Fredoka One + Nunito
- **Real-time**: BroadcastChannel / Pusher
- **Deployment**: Vercel

## 📁 Project Structure

```
minigolf/
├── src/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── globals.css   # Global styles
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Main game page
│   ├── components/
│   │   ├── GameCanvas.tsx    # Game rendering
│   │   ├── Lobby.tsx         # Pre-game lobby
│   │   └── Scoreboard.tsx    # Score display
│   ├── lib/
│   │   ├── gameState.ts  # State management
│   │   ├── levels.ts     # Level definitions
│   │   ├── multiplayer.ts # Sync logic
│   │   └── physics.ts    # Ball physics
│   └── types/
│       └── game.ts       # TypeScript types
├── public/
├── package.json
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Add new levels
- Improve physics
- Add new obstacle types
- Enhance the UI

## 📄 License

MIT License - feel free to use this for your own projects!

---

Made with ⛳ and ❤️
