# 🏌️ MiniGolf - Online Multiplayer

A fun online multiplayer minigolf game inspired by Plato. Play with up to 4 friends in real-time!

![MiniGolf](https://img.shields.io/badge/MiniGolf-Play%20Now-green)
![Players](https://img.shields.io/badge/Players-1--4-blue)
![Holes](https://img.shields.io/badge/Holes-10-orange)

## ✨ Features

- **10 Unique Holes** - Each with different challenges and obstacles
- **Up to 4 Players** - Play with friends online
- **Real-time Multiplayer** - See other players' shots live
- **Various Obstacles**:
  - 💧 Water hazards (resets ball to tee)
  - 🏖️ Sand traps (slow down the ball)
  - 🔴 Bouncers (spring the ball back)
  - 🌬️ Windmills (spinning obstacles)
- **Scoreboard** - Track scores with par/birdie/bogey indicators
- **Mobile Friendly** - Works on touch devices

## 🎮 How to Play

1. **Create or Join** - Enter your name and create a new game or join with a room code
2. **Share the Code** - Give the 6-character room code to friends
3. **Aim & Shoot** - Drag from your ball to aim, release to shoot
4. **Win** - Lowest total strokes wins!

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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/minigolf)

Or manually:

```bash
npm install -g vercel
vercel
```

## ⚙️ Configuration

### Environment Variables

For real-time multiplayer with instant updates, set up [Pusher Channels](https://pusher.com/channels) (free tier available):

```env
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=us2
PUSHER_APP_ID=your_pusher_app_id
PUSHER_SECRET=your_pusher_secret
```

**Note:** The game works without Pusher using polling as a fallback, but real-time updates will be slightly slower (~1 second delay).

### Setting up Pusher (Optional but Recommended)

1. Go to [pusher.com](https://pusher.com) and create a free account
2. Create a new Channels app
3. Copy the credentials to your environment variables
4. Deploy to Vercel with the environment variables set

## 🏗️ Project Structure

```
minigolf/
├── src/
│   ├── app/
│   │   ├── api/           # API routes for room management
│   │   ├── page.tsx       # Main game page
│   │   ├── layout.tsx     # Root layout
│   │   └── globals.css    # Global styles & animations
│   ├── components/
│   │   ├── GameCanvas.tsx # Main game rendering & physics
│   │   ├── Game.tsx       # Game wrapper & logic
│   │   ├── Lobby.tsx      # Waiting room
│   │   └── Scoreboard.tsx # Score display
│   └── lib/
│       ├── types.ts       # TypeScript types
│       ├── levels.ts      # 10 level definitions
│       ├── physics.ts     # Ball physics engine
│       ├── gameStore.ts   # Zustand state management
│       ├── pusher.ts      # Real-time communication
│       └── roomStorage.ts # Room data storage
├── vercel.json            # Vercel configuration
└── package.json
```

## 🎯 Levels

| Hole | Name | Par | Features |
|------|------|-----|----------|
| 1 | Beginner's Luck | 2 | Simple straight shot |
| 2 | The Dogleg | 3 | L-shaped obstacle |
| 3 | Sandy Shores | 3 | Sand traps |
| 4 | Water Hazard | 3 | Water obstacle with bridge |
| 5 | Bouncy Castle | 4 | Multiple bouncers |
| 6 | The Windmill | 4 | Spinning windmill |
| 7 | Serpentine | 5 | Winding path |
| 8 | Island Hopping | 4 | Water + bouncer combo |
| 9 | The Gauntlet | 5 | Narrow passages + windmills |
| 10 | Grand Finale | 6 | All obstacles combined |

## 🛠️ Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Pusher** - Real-time communication
- **Canvas API** - Game rendering

## 📱 Mobile Support

The game is fully playable on mobile devices:
- Touch to aim (drag from ball)
- Release to shoot
- Responsive UI

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Add new levels
- Improve physics
- Add new obstacle types
- Fix bugs

## 📄 License

MIT License - feel free to use this for your own projects!

---

Made with ⛳ and ❤️
