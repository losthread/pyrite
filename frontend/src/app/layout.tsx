import type { Metadata, Viewport } from "next"

import "./globals.css"

export const metadata: Metadata = {
  title: "PYRITE — Glitters Like Gold. Traps Like Iron.",
  description:
    "PYRITE // Autonomous Deception & Cryptographic Adversary Labyrinth. An ephemeral, self-mutating 4-stage deception grid that weaponizes attacker greed and tracks cross-IP syndicate collusion via stateless Pyrite Nuggets (HMAC crumbs).",
  keywords: [
    "PYRITE",
    "active deception",
    "honeypot labyrinth",
    "Wazuh",
    "MITRE Engage",
    "cybersecurity",
    "adversary containment",
  ],
}

export const viewport: Viewport = {
  themeColor: "#0A0A09",
  colorScheme: "dark",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="antialiased">
      <body>{children}</body>
    </html>
  )
}
