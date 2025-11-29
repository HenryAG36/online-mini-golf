import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mini Golf',
  description: 'Play mini golf with friends - up to 4 players',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
