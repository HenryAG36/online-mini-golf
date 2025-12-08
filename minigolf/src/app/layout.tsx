import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Minigolf - Online Multiplayer',
  description: 'Play minigolf with friends online! Up to 4 players, 10 fun levels with windmills, teleporters, and more.',
  keywords: ['minigolf', 'multiplayer', 'online game', 'golf', 'casual game'],
  authors: [{ name: 'Minigolf Game' }],
  openGraph: {
    title: 'Minigolf - Online Multiplayer',
    description: 'Play minigolf with friends online!',
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
