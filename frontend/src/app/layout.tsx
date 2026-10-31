import type { Metadata, Viewport } from "next"

import "./globals.css"

export const metadata: Metadata = {
  title: "VYUHA (Chakravyuha) — Easy to Breach. Impossible to Escape.",
  description:
    "An ephemeral, self-mutating 4-stage deception labyrinth that weaponizes attacker greed, tracks cross-IP syndicate collusion via stateless HMAC breadcrumbs, and segregates threats through Wazuh SIEM rules.",
  keywords: [
    "active deception",
    "honeypot",
    "Wazuh",
    "MITRE Engage",
    "cybersecurity",
    "VYUHA",
    "Chakravyuha",
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
