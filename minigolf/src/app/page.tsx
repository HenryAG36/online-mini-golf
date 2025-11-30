'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const createGame = async () => {
    setIsCreating(true);
    const roomId = uuidv4().slice(0, 8).toUpperCase();
    
    try {
      await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-room', roomId }),
      });
      
      router.push(`/game/${roomId}`);
    } catch (error) {
      console.error('Failed to create game:', error);
      setIsCreating(false);
    }
  };

  const joinGame = () => {
    if (joinCode.trim()) {
      router.push(`/game/${joinCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-6xl opacity-20 animate-float">⛳</div>
        <div className="absolute top-40 right-20 text-5xl opacity-20 animate-float" style={{ animationDelay: '0.5s' }}>🏌️</div>
        <div className="absolute bottom-40 left-20 text-4xl opacity-20 animate-float" style={{ animationDelay: '1s' }}>🎯</div>
        <div className="absolute bottom-20 right-10 text-5xl opacity-20 animate-float" style={{ animationDelay: '1.5s' }}>🏆</div>
        
        {/* Golf ball trail */}
        <svg className="absolute inset-0 w-full h-full opacity-10">
          <path
            d="M-100,300 Q200,100 400,400 T800,200"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeDasharray="10,10"
          />
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 max-w-lg w-full shadow-2xl border border-white/20">
          {/* Logo & Title */}
          <div className="text-center mb-10">
            <div className="relative inline-block">
              <div className="text-8xl mb-4 animate-bounce-slow">⛳</div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-lg animate-ping"></div>
            </div>
            <h1 className="text-5xl font-display text-white mb-3 drop-shadow-lg">
              Minigolf
            </h1>
            <p className="text-white/70 text-lg">
              Play with up to 4 players online!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 mb-8">
            <button
              onClick={createGame}
              disabled={isCreating}
              className="w-full py-5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold text-xl rounded-2xl transition-all transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isCreating ? (
                <>
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  🎮 Create New Game
                </>
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-white/50">or join existing</span>
              </div>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter room code..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && joinGame()}
                maxLength={8}
                className="flex-1 px-4 py-4 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-lg font-mono tracking-widest text-center uppercase"
              />
              <button
                onClick={joinGame}
                disabled={!joinCode.trim()}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg disabled:cursor-not-allowed"
              >
                Join
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-3xl mb-2">👥</div>
              <p className="text-white/80 text-sm font-medium">Up to 4 Players</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-3xl mb-2">🎯</div>
              <p className="text-white/80 text-sm font-medium">10 Fun Levels</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-3xl mb-2">🌀</div>
              <p className="text-white/80 text-sm font-medium">Teleporters</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-3xl mb-2">💨</div>
              <p className="text-white/80 text-sm font-medium">Windmills</p>
            </div>
          </div>

          {/* How to Play */}
          <div className="mt-8 pt-6 border-t border-white/20">
            <h2 className="text-white/80 font-semibold mb-3 text-center">How to Play</h2>
            <ul className="text-white/60 text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">1.</span>
                Create a game and share the room code with friends
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">2.</span>
                Click and drag on the ball to aim and set power
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">3.</span>
                Complete all 10 holes with the fewest strokes to win!
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 left-0 right-0 text-center text-white/40 text-sm">
        Made with ❤️ for fun multiplayer gaming
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
