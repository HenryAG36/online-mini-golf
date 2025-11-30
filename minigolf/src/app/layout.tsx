import type { Metadata, Viewport } from "next";
import { Poppins, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://minigolf.vercel.app'),
  title: "MiniGolf - Play Online with Friends",
  description: "A fun multiplayer minigolf game with 10 unique holes. Play with up to 4 friends online!",
  keywords: ["minigolf", "golf", "multiplayer", "game", "online", "friends"],
  authors: [{ name: "MiniGolf" }],
  openGraph: {
    title: "MiniGolf - Play Online with Friends",
    description: "A fun multiplayer minigolf game with 10 unique holes. Play with up to 4 friends online!",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MiniGolf - Play Online with Friends",
    description: "A fun multiplayer minigolf game with 10 unique holes. Play with up to 4 friends online!",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#065f46",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${playfair.variable} ${jetbrains.variable}`}>
      <body className="antialiased min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
