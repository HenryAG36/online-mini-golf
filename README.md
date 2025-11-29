# 🏌️ Mini Golf

A beautiful, minimalist multiplayer mini golf game. Play with up to 4 friends!

![Mini Golf Game](https://img.shields.io/badge/Players-1--4-green) ![Holes](https://img.shields.io/badge/Holes-18-blue) ![Made with](https://img.shields.io/badge/Made%20with-Next.js-black)

## ✨ Features

- **18 Creative Holes** - From simple putts to challenging obstacle courses
- **Multiplayer** - Play with up to 4 players
- **Creative Obstacles**:
  - 🌀 Spinning Windmills
  - 💫 Teleporters
  - 🔴 Bouncy Bumpers
  - 💨 Sand Traps
  - 💧 Water Hazards
  - 🚧 Moving Walls
- **Minimalist Design** - Clean, modern UI
- **Mobile Friendly** - Works on any device

## 🚀 Deploy on Vercel

The easiest way to deploy is using Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/online-mini-golf)

### Environment Variables (Optional)

For online multiplayer support, add these environment variables in Vercel:

1. Create a free account at [Pusher](https://pusher.com/)
2. Create a new Channels app
3. Add these environment variables:

```
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
```

**Note:** The game works perfectly in local/hot-seat multiplayer mode without Pusher. Multiple players can take turns on the same device!

## 🎮 How to Play

1. **Create or Join** - Create a new game or join with a room code
2. **Aim** - Click/tap and drag from the ball
3. **Shoot** - Release to hit the ball
4. **Score** - Get the ball in the hole in as few strokes as possible!

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to play!

## 🏗️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules
- **Real-time**: Pusher (optional)
- **Deployment**: Vercel

## 📝 License

MIT License - feel free to use this for your own projects!

---

Made with ❤️ for mini golf enthusiasts
