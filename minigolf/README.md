# ⛳ Minigolf - Online Multiplayer

A fun, physics-based minigolf game that supports up to 4 players online! Built with Next.js, Matter.js for physics, and Pusher for real-time multiplayer.

![Minigolf Game](https://img.shields.io/badge/Game-Minigolf-green?style=for-the-badge)
![Players](https://img.shields.io/badge/Players-1--4-blue?style=for-the-badge)
![Levels](https://img.shields.io/badge/Levels-10-orange?style=for-the-badge)

## 🎮 Features

- **Multiplayer Support**: Play with up to 4 friends online
- **10 Unique Levels**: Each with different themes and challenges
- **Physics-Based Gameplay**: Realistic ball physics with Matter.js
- **Interactive Obstacles**:
  - 🌊 Water hazards (ball reset + penalty)
  - 🏖️ Sand traps (slow down your ball)
  - 🎯 Bumpers (bounce your ball)
  - 🌀 Teleporters (instant transport)
  - 💨 Windmills (timing challenge)
- **Beautiful Themes**: Classic, Beach, Castle, Space, Jungle, and Candy
- **Real-time Scoreboard**: Track everyone's progress
- **Mobile Friendly**: Touch controls for mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- (Optional) Pusher account for multiplayer

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd minigolf
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (optional, for multiplayer):
```bash
cp .env.example .env.local
# Edit .env.local with your Pusher credentials
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🌐 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/minigolf)

### Environment Variables for Vercel

Add these environment variables in your Vercel project settings:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_PUSHER_KEY` | Your Pusher app key |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Pusher cluster (e.g., `mt1`) |
| `PUSHER_APP_ID` | Pusher app ID |
| `PUSHER_SECRET` | Pusher secret key |

### Setting up Pusher (Free)

1. Go to [pusher.com](https://pusher.com) and create a free account
2. Create a new Channels app
3. Copy the credentials to your environment variables
4. That's it! Your game now supports real-time multiplayer

## 🎯 How to Play

1. **Create a Game**: Click "Create New Game" on the home page
2. **Share the Code**: Send the room code to your friends
3. **Wait in Lobby**: All players click "Ready" when joined
4. **Start Playing**: Host clicks "Start Game"
5. **Aim & Shoot**: Click and drag on the ball to aim and set power
6. **Complete All Holes**: Lowest total score wins!

### Controls

- **Desktop**: Click and drag from the ball to aim
- **Mobile**: Touch and drag from the ball to aim
- Pull back further for more power
- Release to shoot

## 🏗️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Physics**: [Matter.js](https://brm.io/matter-js/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Real-time**: [Pusher](https://pusher.com/)
- **Language**: TypeScript

## 📁 Project Structure

```
minigolf/
├── src/
│   ├── app/
│   │   ├── api/game/       # API routes for game state
│   │   ├── game/[roomId]/  # Game room page
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/
│   │   ├── GameCanvas.tsx  # Main game renderer
│   │   ├── GameResults.tsx # End game screen
│   │   ├── HoleComplete.tsx# Between holes modal
│   │   ├── Lobby.tsx       # Pre-game lobby
│   │   └── Scoreboard.tsx  # Score display
│   ├── lib/
│   │   ├── confetti.ts     # Celebration effects
│   │   ├── gameEngine.ts   # Physics & game logic
│   │   ├── gameState.ts    # State management
│   │   ├── levels.ts       # Level definitions
│   │   └── pusher.ts       # Real-time client
│   └── types/
│       └── game.ts         # TypeScript types
├── public/
├── .env.example
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 🎨 Level Themes

1. **The Warm-Up** (Classic) - Simple straight shot
2. **Dog Leg** (Classic) - L-shaped course
3. **Beach Day** (Beach) - Sand traps and water
4. **Pinball Wizard** (Candy) - Bumper madness
5. **Windmill Classic** (Classic) - Timing challenge
6. **Lost in the Garden** (Jungle) - Maze navigation
7. **Portal Paradise** (Space) - Teleporter fun
8. **Castle Siege** (Castle) - Complex castle layout
9. **The Gauntlet** (Candy) - All obstacles combined
10. **Championship** (Space) - Ultimate challenge

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest new features
- Submit pull requests
- Create new levels

## 📝 License

MIT License - feel free to use this project for learning or your own games!

## 🙏 Acknowledgments

- Inspired by Plato's minigolf game
- Built with love for casual multiplayer gaming
- Physics powered by the amazing Matter.js library

---

Made with ⛳ for fun multiplayer gaming!
