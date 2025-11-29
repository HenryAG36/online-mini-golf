import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mini Golf Online - Multiplayer Golf Game',
  description: 'Play mini golf with friends! Up to 4 players, fun levels, and exciting obstacles. Free online multiplayer minigolf game.',
  keywords: 'minigolf, mini golf, multiplayer, online game, golf game, party game',
  openGraph: {
    title: 'Mini Golf Online',
    description: 'Play mini golf with friends online!',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-golf-pattern">
        {children}
      </body>
    </html>
  );
}
