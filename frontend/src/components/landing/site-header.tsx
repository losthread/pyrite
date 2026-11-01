import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { navLinks } from "@/config/labyrinthConfig"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink bg-paper/95 backdrop-blur-none">
      <div className="flex h-6 items-center justify-between overflow-hidden border-b border-[#27272A] bg-[#101012] px-3 text-[#9A9891] sm:px-5">
        <span className="font-mono text-[9px] leading-none font-semibold tracking-[0.13em] uppercase sm:text-[10px] text-[#22C55E] flex items-center">
          <span className="mr-2 inline-block size-1.5 rounded-full bg-[#22C55E] animate-pulse" />
          Active Deception Grid Online
        </span>
        <span className="hidden items-center gap-5 font-mono text-[10px] leading-none tracking-[0.13em] uppercase sm:flex text-muted-ink">
          <span>AUX / SOC-01</span>
          <span>MORPH-v2.0</span>
          <span>REV 2.6</span>
        </span>
      </div>

      <div className="grid h-12 grid-cols-[1fr_auto] md:h-[58px] md:grid-cols-[minmax(176px,0.8fr)_2.5fr_auto]">
        <Link
          href="/"
          className="group flex items-center gap-2.5 border-r border-ink px-3 sm:px-5"
          aria-label="PYRITE home"
        >
          <span className="grid size-7 place-items-center bg-signal text-[12px] font-mono font-bold text-black border border-signal">
            P
          </span>
          <span className="leading-none">
            <span className="block font-display text-[1.4rem] tracking-[-0.04em] uppercase text-ink">
              PYRITE
            </span>
            <span className="mt-1 block font-mono text-[8px] tracking-[0.14em] text-muted-ink uppercase">
              AUTONOMOUS DECEPTION GRID
            </span>
          </span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-stretch border-r border-ink md:flex"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group flex flex-1 items-center justify-center border-r border-ink/20 px-3 transition-colors last:border-r-0 hover:bg-surface"
            >
              <span className="font-mono text-[12px] font-medium tracking-[0.12em] text-muted-ink uppercase transition-colors group-hover:text-ink lg:text-[13px]">
                {link.label}
              </span>
            </a>
          ))}
        </nav>

        <div className="flex items-stretch">
          <div className="hidden items-center gap-2 border-r border-ink px-4 lg:flex">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping bg-signal opacity-60" />
              <span className="relative inline-flex size-2 bg-signal" />
            </span>
            <span className="font-mono text-[10px] tracking-[0.12em] text-muted-ink uppercase">
              Wazuh / Linked
            </span>
          </div>
          <Link
            href="/live-demo"
            className="flex items-center gap-1.5 border-r border-ink bg-[#F59E0B]/20 text-[#F59E0B] px-3 font-mono text-[11px] font-extrabold uppercase hover:bg-[#F59E0B] hover:text-[#0A0A09] transition-all shadow-[0_0_12px_rgba(245,158,11,0.35)] animate-pulse"
            title="Open Standalone Zero-Error Live War Room Demo Center"
          >
            <span>⚡ LIVE WAR ROOM DEMO</span>
          </Link>
          <Link
            href="/dashboard"
            className="group flex min-w-[146px] items-center justify-between gap-4 bg-ink px-4 text-paper transition-colors hover:bg-signal hover:text-signal-ink sm:min-w-[176px] sm:px-5"
          >
            <span className="font-mono text-[12px] font-semibold tracking-[0.12em] uppercase sm:text-[13px]">
              Launch SOC
            </span>
            <ArrowUpRight
              className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              strokeWidth={1.5}
            />
          </Link>
        </div>
      </div>
    </header>
  )
}
