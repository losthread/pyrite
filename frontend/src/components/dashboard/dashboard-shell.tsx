"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChartNoAxesCombined,
  ChevronLeft,
  Crosshair,
  LayoutDashboard,
  Menu,
  Network,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Server,
  ShieldAlert,
  Flame,
  Zap,
  X,
} from "lucide-react"

import { usePyriteTelemetry } from "@/hooks/usePyriteTelemetry"
import { RedTeamAttackConsole } from "@/components/dashboard/redteam-attack-console"
import { cn } from "@/lib/utils"

const navigation = [
  {
    group: "Operations & Red Team",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      {
        label: "Live Attack Console (Red Team)",
        href: "#red-team",
        icon: Zap,
        isAction: true,
      },
      { label: "Topology & Shadow Worlds", href: "/dashboard/network", icon: Network },
      { label: "Wazuh SIEM Stream", href: "/dashboard/events", icon: Radio },
      { label: "Tri-MITRE Matrix", href: "/dashboard/analytics", icon: ChartNoAxesCombined },
    ],
  },
  {
    group: "Entities & Attributions",
    items: [
      { label: "Attackers", href: "/dashboard/attackers", icon: Crosshair },
      { label: "Honeypots", href: "/dashboard/honeypots", icon: Server },
    ],
  },
]

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/network": "Topology & Shadow Worlds",
  "/dashboard/attackers": "Attacker Fingerprints (JA4H / HASSH)",
  "/dashboard/events": "Wazuh SIEM Telemetry Stream",
  "/dashboard/honeypots": "Polymorphic Decoy Fleet",
  "/dashboard/analytics": "Tri-MITRE Matrix & Analytics",
}

function formatClock(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date)
}

function Mark() {
  return (
    <div className="grid size-7 place-items-center bg-signal text-black font-extrabold text-[12px] font-mono border border-signal">
      P
    </div>
  )
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const {
    mode,
    connection,
    statusLabel,
    paused,
    snapshot,
    setMode,
    togglePause,
    refresh,
    quarantineAttacker,
    engageEndlesshTarpit,
    burnAndMutateTopology,
  } = usePyriteTelemetry()

  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [attackConsoleOpen, setAttackConsoleOpen] = React.useState(false)
  const [clock, setClock] = React.useState("12:00:00")
  const [containmentFeedback, setContainmentFeedback] = React.useState<string | null>(null)

  React.useEffect(() => {
    const update = () => setClock(formatClock(new Date()))
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [])

  const criticalEvents = snapshot.events.filter(
    (event) => event.severity === "critical"
  ).length

  const handleQuarantine = async () => {
    await quarantineAttacker()
    setContainmentFeedback("QUARANTINE_504_SENT")
    setTimeout(() => setContainmentFeedback(null), 3000)
  }

  const handleEndlessh = async () => {
    await engageEndlesshTarpit()
    setContainmentFeedback("ENDLESSH_ENGAGED")
    setTimeout(() => setContainmentFeedback(null), 3000)
  }

  const handleMutate = async () => {
    await burnAndMutateTopology()
    setContainmentFeedback("TOPOLOGY_MUTATED")
    setTimeout(() => setContainmentFeedback(null), 3000)
  }

  return (
    <div className="flex min-h-svh bg-[#0B0B0C] text-[#F1EFE9]">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/80 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      {/* SINGLE UNIFIED HIGH-DENSITY NAVIGATION RAIL */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-[#27272A] bg-[#101012] transition-[width,transform] duration-200 md:sticky md:top-0 md:h-svh md:translate-x-0",
          collapsed ? "w-[68px]" : "w-[240px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Dashboard navigation"
      >
        <div className="flex h-[54px] items-center justify-between border-b border-[#27272A] px-3">
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-2.5"
            aria-label="PYRITE dashboard"
          >
            <Mark />
            {!collapsed ? (
              <span className="min-w-0">
                <span className="block font-display text-[1.15rem] leading-none tracking-[-0.03em] uppercase font-bold text-[#F1EFE9]">
                  PYRITE
                </span>
                <span className="mt-1 block font-mono text-[8px] tracking-[0.16em] text-[#F59E0B] uppercase font-semibold">
                  AUTONOMOUS DECEPTION GRID
                </span>
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="grid size-7 place-items-center text-muted-ink md:hidden"
            aria-label="Close navigation"
          >
            <X className="size-4" strokeWidth={1.5} />
          </button>
        </div>

        {!collapsed ? (
          <div className="border-b border-[#27272A] px-3 py-2 bg-[#141416]/50">
            <p className="font-mono text-[8px] tracking-[0.16em] text-[#9A9891] uppercase">
              ACTIVE MATRIX
            </p>
            <p className="mt-0.5 font-mono text-[11px] font-bold text-[#22C55E] truncate">
              SOC-01 // PRODUCTION
            </p>
          </div>
        ) : null}

        <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Main">
          {navigation.map((group) => (
            <div key={group.group} className="mb-4 last:mb-0">
              {!collapsed ? (
                <p className="mb-2 px-2 font-mono text-[8px] tracking-[0.16em] text-[#9A9891] uppercase">
                  {group.group}
                </p>
              ) : null}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isAttack = Boolean(item.isAction)
                  const active =
                    !isAttack &&
                    (pathname === item.href ||
                      (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`)))
                  const count = item.href === "/dashboard/events" ? criticalEvents : null

                  if (isAttack) {
                    return (
                      <li key={item.label}>
                        <button
                          type="button"
                          onClick={() => {
                            setAttackConsoleOpen(true)
                            setMobileOpen(false)
                          }}
                          className={cn(
                            "group relative flex w-full h-9 items-center gap-2.5 px-2.5 text-[12px] font-medium transition-colors border border-signal/40 bg-signal/10 text-signal hover:bg-signal hover:text-black font-mono",
                            collapsed && "justify-center px-0"
                          )}
                          title="Open Live Red-Team Attack Console"
                        >
                          <Icon className="size-4 shrink-0 text-signal group-hover:text-black" strokeWidth={2} />
                          {!collapsed ? (
                            <span className="truncate font-bold tracking-tight uppercase">
                              {item.label}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    )
                  }

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "group relative flex h-9 items-center gap-2.5 px-2.5 text-[12px] font-medium transition-colors",
                          active
                            ? "bg-[#18181B] text-[#F1EFE9] font-bold"
                            : "text-[#9A9891] hover:bg-[#141416] hover:text-[#F1EFE9]"
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        {active ? (
                          <span className="absolute inset-y-1.5 left-0 w-1 bg-signal" />
                        ) : null}
                        <Icon
                          className={cn(
                            "size-4 shrink-0",
                            active ? "text-signal" : "text-[#9A9891] group-hover:text-[#F1EFE9]"
                          )}
                          strokeWidth={1.5}
                        />
                        {!collapsed ? (
                          <>
                            <span className="truncate">{item.label}</span>
                            {count && count > 0 ? (
                              <span className="ml-auto font-mono text-[9px] font-bold text-signal px-1.5 py-0.2 bg-signal/15 border border-signal/30">
                                {count}
                              </span>
                            ) : null}
                          </>
                        ) : null}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* BOTTOM QUICK ACTIONS & COLLAPSE */}
        <div className="border-t border-[#27272A] p-2 space-y-1 bg-[#101012]">
          <Link
            href="/"
            className={cn(
              "flex h-8 items-center gap-2 px-2 text-[11px] font-mono text-[#9A9891] hover:text-[#F1EFE9] uppercase transition-colors",
              collapsed && "justify-center"
            )}
            title="Exit to Landing Overview"
          >
            <ChevronLeft className="size-3.5 text-signal" />
            {!collapsed && <span>Exit to Overview</span>}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex h-8 w-full items-center gap-2 px-2 text-[11px] font-mono text-[#9A9891] hover:text-[#F1EFE9] uppercase transition-colors border-t border-[#27272A]/40",
              collapsed && "justify-center"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={cn("size-3.5 transition-transform", collapsed && "rotate-180")}
            />
            {!collapsed ? <span>Collapse Rail</span> : null}
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* TOP STATUS BAR & REAL SOC CONTAINMENT BUTTONS */}
        <header className="sticky top-0 z-30 flex h-[54px] shrink-0 items-center justify-between border-b border-[#27272A] bg-[#101012]/95 px-3 backdrop-blur sm:px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="grid size-8 place-items-center border border-[#27272A] text-muted-ink md:hidden"
              aria-label="Open navigation"
            >
              <Menu className="size-4" strokeWidth={1.5} />
            </button>

            <div className="flex items-center gap-2 font-mono">
              <span className="text-[10px] tracking-wider uppercase font-bold text-[#F1EFE9]">
                {pageTitles[pathname] ?? "Overview"}
              </span>
              <span className="text-muted-ink text-xs">/</span>
              {/* LIVE BACKEND STATUS PILL */}
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase border",
                  connection === "connected" && mode === "live"
                    ? "border-[#22C55E]/40 bg-[#22C55E]/10 text-[#22C55E]"
                    : "border-signal/40 bg-signal/10 text-signal"
                )}
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    connection === "connected" && mode === "live"
                      ? "bg-[#22C55E] animate-ping"
                      : "bg-signal"
                  )}
                />
                <span>{statusLabel}</span>
              </div>
            </div>
          </div>

          {/* REAL SOC CONTAINMENT ACTIONS */}
          <div className="flex items-center gap-2">
            {/* RED-TEAM CONSOLE DRAWER TRIGGER */}
            <button
              onClick={() => setAttackConsoleOpen(true)}
              className="flex items-center gap-1.5 bg-signal text-black px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider hover:brightness-110 shadow-lg shadow-signal/20 transition-all"
            >
              <Zap className="size-3.5 fill-current" />
              <span>⚔️ Live Attack Console</span>
            </button>

            {/* QUARANTINE 504 WAF EXIT BUTTON */}
            <button
              onClick={handleQuarantine}
              className="hidden lg:flex items-center gap-1.5 border border-red-500/60 bg-red-950/40 text-red-400 px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase hover:bg-red-900/60 transition-colors"
              title="Send Plausible 504 WAF Exit timeout to attacker"
            >
              <ShieldAlert className="size-3 text-red-500" />
              <span>504 WAF Exit</span>
            </button>

            {/* ENGAGE ENDLESSH TARPIT */}
            <button
              onClick={handleEndlessh}
              className="hidden xl:flex items-center gap-1.5 border border-[#F59E0B]/60 bg-[#F59E0B]/10 text-[#F59E0B] px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase hover:bg-[#F59E0B]/20 transition-colors"
              title="Engage 1 byte / 10s Endlessh infinite slow-drip tarpit"
            >
              <Pause className="size-3 fill-current" />
              <span>Endlessh Tarpit</span>
            </button>

            {/* BURN & MUTATE TOPOLOGY */}
            <button
              onClick={handleMutate}
              className="hidden sm:flex items-center gap-1.5 border border-purple-500/60 bg-purple-950/40 text-purple-300 px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase hover:bg-purple-900/60 transition-colors"
              title="Burn breadcrumbs & mutate polymorphic seed"
            >
              <Flame className="size-3 text-purple-400" />
              <span>Mutate Seed</span>
            </button>

            {/* MODE SWITCHER (DEMO vs LIVE) */}
            <div className="flex h-7 items-center border border-[#27272A] bg-[#141416]">
              <button
                type="button"
                onClick={() => setMode("demo")}
                className={cn(
                  "h-full px-2 font-mono text-[9px] tracking-[0.1em] uppercase transition-colors",
                  mode === "demo" ? "bg-signal text-black font-bold" : "text-[#9A9891] hover:text-[#F1EFE9]"
                )}
              >
                Demo
              </button>
              <button
                type="button"
                onClick={() => setMode("live")}
                className={cn(
                  "h-full border-l border-[#27272A] px-2 font-mono text-[9px] tracking-[0.1em] uppercase transition-colors",
                  mode === "live" ? "bg-[#22C55E] text-black font-bold" : "text-[#9A9891] hover:text-[#F1EFE9]"
                )}
              >
                Live
              </button>
            </div>

            <span className="hidden font-mono text-[10px] tabular-nums text-[#9A9891] sm:inline pl-1">
              {clock} UTC
            </span>
          </div>
        </header>

        {/* FEEDBACK TOAST */}
        {containmentFeedback && (
          <div className="bg-signal text-black px-4 py-1.5 font-mono text-[11px] font-bold text-center uppercase tracking-wider animate-bounce">
            ⚡ SOC COMMAND DISPATCHED: {containmentFeedback}
          </div>
        )}

        {/* MAIN BODY VIEWPORT */}
        <main className="min-w-0 flex-1 p-3 sm:p-4 lg:p-5">
          {children}
        </main>
      </div>

      {/* SLIDE-OVER RED-TEAM ATTACK CONSOLE */}
      <RedTeamAttackConsole
        isOpen={attackConsoleOpen}
        onClose={() => setAttackConsoleOpen(false)}
      />
    </div>
  )
}
