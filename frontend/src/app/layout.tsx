import type { Metadata, Viewport } from "next"
import { Archivo_Black, IBM_Plex_Mono, Inter_Tight } from "next/font/google"

import "./globals.css"
import { cn } from "@/lib/utils"

const display = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
})

const sans = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const mono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

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
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        sans.variable,
        mono.variable,
        display.variable
      )}
    >
      <body>{children}</body>
    </html>
  )
}
