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
  X,
} from "lucide-react"

import { useDashboardTelemetry } from "@/hooks/useDashboardTelemetry"
import { cn } from "@/lib/utils"

const navigation = [
  {
    group: "Monitor",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "Network", href: "/dashboard/network", icon: Network },
      { label: "Attackers", href: "/dashboard/attackers", icon: Crosshair },
      { label: "Live events", href: "/dashboard/events", icon: Radio },
      { label: "Honeypots", href: "/dashboard/honeypots", icon: Server },
    ],
  },
  {
    group: "Analyse",
    items: [
      {
        label: "Analytics",
        href: "/dashboard/analytics",
        icon: ChartNoAxesCombined,
      },
    ],
  },
]

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/network": "Network intelligence",
  "/dashboard/attackers": "Attackers",
  "/dashboard/events": "Live events",
  "/dashboard/honeypots": "Honeypots",
  "/dashboard/analytics": "Analytics",
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
    <svg
      viewBox="0 0 32 32"
      className="size-8"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M4 4h8l4 9 4-9h8l-8 18h-8L4 4Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M16 22v6" stroke="#FF493D" strokeWidth="2" />
      <circle cx="16" cy="28" r="1.5" fill="#FF493D" />
    </svg>
  )
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const {
    mode,
    connection,
    paused,
    snapshot,
    setMode,
    togglePause,
    refresh,
  } = useDashboardTelemetry()
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [clock, setClock] = React.useState("")

  React.useEffect(() => {
    const update = () => setClock(formatClock(new Date()))
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [])

  const criticalEvents = snapshot.events.filter(
    (event) => event.severity === "critical"
  ).length
  const modeLabel =
    mode === "demo"
      ? "Simulated stream"
      : connection === "connected"
        ? "Wazuh linked"
        : connection === "connecting"
          ? "Connecting"
          : connection === "reconnecting"
            ? "Reconnecting"
            : "Disconnected"

  return (
    <div className="flex min-h-svh bg-paper text-ink">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-paper/80 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-ink/15 bg-surface transition-[width,transform] duration-200 md:sticky md:top-0 md:h-svh md:translate-x-0",
          collapsed ? "w-[68px]" : "w-[228px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Dashboard navigation"
      >
        <div className="flex h-[52px] items-center justify-between border-b border-ink/15 px-3">
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-2.5"
            aria-label="Vyuha dashboard"
          >
            <Mark />
            {!collapsed ? (
              <span className="min-w-0">
                <span className="block font-display text-[1.1rem] leading-none tracking-[-0.04em] uppercase">
                  Vyuha
                </span>
                <span className="mt-1 block font-mono text-[9px] tracking-[0.16em] text-muted-ink uppercase">
                  Honeytrap network
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
          <div className="border-b border-ink/15 px-3 py-3">
            <p className="font-mono text-[9px] tracking-[0.16em] text-muted-ink uppercase">
              Workspace
            </p>
            <p className="mt-1 text-[12px]">SOC-01 / Production</p>
          </div>
        ) : null}

        <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Main">
          {navigation.map((group) => (
            <div key={group.group} className="mb-4 last:mb-0">
              {!collapsed ? (
                <p className="mb-2 px-2 font-mono text-[9px] tracking-[0.16em] text-muted-ink uppercase">
                  {group.group}
                </p>
              ) : null}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(`${item.href}/`))
                  const count =
                    item.href === "/dashboard/events" ? criticalEvents : null

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "group relative flex h-9 items-center gap-2.5 px-2.5 text-[12.5px] transition-colors",
                          active
                            ? "bg-paper/70 text-ink"
                            : "text-muted-ink hover:bg-paper/40 hover:text-ink"
                        )}
                        aria-current={active ? "page" : undefined}
                      >
                        {active ? (
                          <span className="absolute inset-y-1.5 left-0 w-0.5 bg-signal" />
                        ) : null}
                        <Icon
                          className={cn(
                            "size-4 shrink-0",
                            active ? "text-ink" : "text-muted-ink"
                          )}
                          strokeWidth={1.5}
                        />
                        {!collapsed ? (
                          <>
                            <span className="min-w-0 flex-1 truncate">
                              {item.label}
                            </span>
                            {count ? (
                              <span className="min-w-4 bg-signal px-1 py-0.5 text-center font-mono text-[9px] font-semibold text-signal-ink">
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

        <div className="border-t border-ink/15 p-2">
          {!collapsed ? (
            <div className="mb-2 border border-ink/15 p-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "size-1.5",
                    mode === "demo" || connection === "connected"
                      ? "bg-signal"
                      : "border border-muted-ink"
                  )}
                />
                <span className="font-mono text-[9px] tracking-[0.12em] text-muted-ink uppercase">
                  {modeLabel}
                </span>
              </div>
              <p className="mt-1.5 font-mono text-[9px] text-muted-ink">
                {mode === "demo" ? "DEMO / deterministic" : "LIVE / REST feed"}
              </p>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="hidden h-8 w-full items-center gap-2 px-2 text-muted-ink transition-colors hover:bg-paper/40 hover:text-ink md:flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={cn("size-4 transition-transform", collapsed && "rotate-180")}
              strokeWidth={1.5}
            />
            {!collapsed ? (
              <span className="font-mono text-[9px] tracking-[0.12em] uppercase">
                Collapse
              </span>
            ) : null}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[52px] shrink-0 items-center border-b border-ink/15 bg-paper/95">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid size-[52px] shrink-0 place-items-center border-r border-ink/15 text-muted-ink md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-4" strokeWidth={1.5} />
          </button>

          <div className="flex min-w-0 items-center gap-2 px-3 md:hidden">
            <span className="font-display text-[1.05rem] leading-none tracking-[-0.04em] uppercase">
              Vyuha
            </span>
            <span className="hidden font-mono text-[9px] tracking-[0.1em] text-muted-ink uppercase min-[380px]:inline">
              / {pageTitles[pathname] ?? "Overview"}
            </span>
          </div>

          <div className="hidden min-w-0 items-center gap-2 px-4 md:flex">
            <span className="font-mono text-[9px] tracking-[0.14em] text-muted-ink uppercase">
              Vyuha / Honeytrap
            </span>
            <span className="text-muted-ink">/</span>
            <span className="truncate font-mono text-[10px] font-medium tracking-[0.1em] uppercase">
              {pageTitles[pathname] ?? "Overview"}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1.5 px-2 sm:gap-2.5 sm:px-4">
            <div
              className="flex h-7 items-center border border-ink/20"
              aria-label="Telemetry source"
            >
              <button
                type="button"
                onClick={() => setMode("demo")}
                className={cn(
                  "h-full px-2 font-mono text-[9px] tracking-[0.1em] uppercase transition-colors",
                  mode === "demo"
                    ? "bg-ink text-paper"
                    : "text-muted-ink hover:text-ink"
                )}
              >
                Demo
              </button>
              <button
                type="button"
                onClick={() => setMode("live")}
                className={cn(
                  "h-full border-l border-ink/20 px-2 font-mono text-[9px] tracking-[0.1em] uppercase transition-colors",
                  mode === "live"
                    ? "bg-ink text-paper"
                    : "text-muted-ink hover:text-ink"
                )}
              >
                Live
              </button>
            </div>

            <span className="hidden items-center gap-1.5 lg:flex">
              <span
                className={cn(
                  "size-1.5",
                  mode === "demo"
                    ? "bg-signal"
                    : connection === "connected"
                      ? "bg-ink"
                      : "bg-signal"
                )}
              />
              <span className="font-mono text-[9px] tracking-[0.12em] text-muted-ink uppercase">
                {modeLabel}
              </span>
            </span>

            <span
              className="hidden font-mono text-[9px] tabular-nums text-muted-ink sm:inline"
              aria-label="Current UTC time"
            >
              {clock} UTC
            </span>

            {mode === "live" ? (
              <button
                type="button"
                onClick={refresh}
                className="grid size-7 place-items-center border border-ink/20 text-muted-ink transition-colors hover:text-ink"
                aria-label="Refresh live data"
                title="Refresh live data"
              >
                <RefreshCw className="size-3.5" strokeWidth={1.5} />
              </button>
            ) : null}

            <button
              type="button"
              onClick={togglePause}
              className="grid size-7 place-items-center border border-ink/20 text-muted-ink transition-colors hover:text-ink"
              aria-label={paused ? "Resume monitoring" : "Pause monitoring"}
              title={paused ? "Resume monitoring" : "Pause monitoring"}
            >
              {paused ? (
                <Play className="size-3.5 fill-current" strokeWidth={1.5} />
              ) : (
                <Pause className="size-3.5 fill-current" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-3 sm:p-4 lg:p-5">
          {mode === "live" && connection !== "connected" ? (
            <div className="mb-3 flex flex-col gap-2 border border-signal/40 bg-signal/10 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11.5px] font-medium">
                  {connection === "connecting" || connection === "reconnecting"
                    ? "Connecting to the Wazuh telemetry backend…"
                    : "Live telemetry disconnected"}
                </p>
                <p className="mt-0.5 text-[10.5px] text-muted-ink">
                  Live mode never substitutes demo events. The current view is
                  empty until the backend responds.
                </p>
              </div>
              <button
                type="button"
                onClick={refresh}
                className="flex h-8 w-fit items-center gap-1.5 border border-signal/50 px-2.5 font-mono text-[9px] tracking-[0.08em] text-signal uppercase transition-colors hover:bg-signal hover:text-signal-ink"
              >
                <RefreshCw className="size-3" strokeWidth={1.5} />
                Reconnect
              </button>
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  )
}
