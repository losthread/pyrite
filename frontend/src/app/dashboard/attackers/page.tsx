"use client"

import * as React from "react"
import { ArrowUpDown, Search, X, ShieldAlert } from "lucide-react"

import { DemoControls } from "@/components/dashboard/demo-controls"
import {
  Panel,
  SeverityDot,
  StatusPill,
} from "@/components/dashboard/primitives"
import { useDashboardTelemetry } from "@/hooks/useDashboardTelemetry"
import type { Attacker, Severity } from "@/lib/dashboard/types"
import {
  formatDate,
  formatRelative,
  formatTime,
} from "@/lib/dashboard/format"
import { cn } from "@/lib/utils"

type SortKey = "attempts" | "lastSeen" | "ip"

export default function AttackersPage() {
  const { mode, connection, snapshot } = useDashboardTelemetry()
  const [query, setQuery] = React.useState("")
  const [severity, setSeverity] = React.useState<Severity | "all">("all")
  const [sort, setSort] = React.useState<SortKey>("attempts")
  const [selectedId, setSelectedId] = React.useState<string | null>(
    snapshot.attackers[0]?.id ?? null
  )

  const connected = mode === "demo" || connection === "connected"
  const filtered = snapshot.attackers
    .filter((attacker) => {
      if (severity !== "all" && attacker.severity !== severity) return false
      if (!query.trim()) return true
      const search = query.toLowerCase()
      return (
        attacker.ip.toLowerCase().includes(search) ||
        attacker.ja4h?.toLowerCase().includes(search) ||
        attacker.honeypots.some((honeypot) =>
          honeypot.toLowerCase().includes(search)
        )
      )
    })
    .sort((a, b) => {
      if (sort === "ip") return a.ip.localeCompare(b.ip)
      if (sort === "lastSeen") {
        return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
      }
      return b.attempts - a.attempts
    })

  const selected = snapshot.attackers.find((item) => item.id === selectedId)
  const relatedEvents = selected
    ? snapshot.events.filter((event) => event.sourceIp === selected.ip)
    : []

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3">
      <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-[9px] tracking-[0.14em] text-muted-ink uppercase">
              PYRITE // Attackers
            </p>
            <StatusPill tone={mode === "demo" ? "critical" : connected ? "live" : "critical"}>
              {mode === "demo" ? "Simulated attackers" : connected ? "Live attackers" : "Disconnected"}
            </StatusPill>
          </div>
          <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.03em]">
            Attackers
          </h1>
          <p className="mt-1 max-w-[70ch] text-[12px] leading-relaxed text-muted-ink">
            Observed source identities ranked by interaction volume. Select a row
            to inspect targeted honeypots and related events.
          </p>
        </div>
        <DemoControls compact />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative flex h-8 min-w-[190px] flex-1 items-center sm:max-w-[300px]">
          <span className="sr-only">Search attackers</span>
          <Search
            className="pointer-events-none absolute left-2 size-3 text-muted-ink"
            strokeWidth={1.5}
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search IP, JA4H, or honeypot"
            className="h-full w-full border border-ink/15 bg-paper pl-7 pr-2 font-mono text-[9px] outline-none placeholder:text-muted-ink/60 focus:border-ink/40"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-1.5 grid size-5 place-items-center text-muted-ink hover:text-ink"
              aria-label="Clear search"
            >
              <X className="size-3" strokeWidth={1.5} />
            </button>
          ) : null}
        </label>

        <div className="flex h-8 items-center border border-ink/15">
          {(["all", "critical", "suspicious"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSeverity(option)}
              className={cn(
                "h-full border-r border-ink/15 px-2.5 font-mono text-[9px] tracking-[0.08em] uppercase transition-colors last:border-r-0",
                severity === option
                  ? "bg-ink text-paper"
                  : "text-muted-ink hover:text-ink"
              )}
            >
              {option === "all" ? "All" : option}
            </button>
          ))}
        </div>

        <span className="ml-auto font-mono text-[9px] tracking-[0.08em] text-muted-ink uppercase">
          {filtered.length} visible / {snapshot.attackers.length} tracked
        </span>
      </div>

      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel
          title="Observed attackers"
          subtitle="Sorted by last observation"
          bodyClassName="overflow-x-auto"
        >
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-ink/15">
                <SortHeader
                  label="IP address"
                  active={sort === "ip"}
                  onClick={() => setSort("ip")}
                />
                <th className="px-2.5 py-2 font-mono text-[9px] font-normal tracking-[0.1em] text-muted-ink uppercase">
                  First seen
                </th>
                <SortHeader
                  label="Last seen"
                  active={sort === "lastSeen"}
                  onClick={() => setSort("lastSeen")}
                />
                <SortHeader
                  label="Attempts"
                  active={sort === "attempts"}
                  onClick={() => setSort("attempts")}
                  align="right"
                />
                <th className="px-2.5 py-2 font-mono text-[9px] font-normal tracking-[0.1em] text-muted-ink uppercase">
                  Targeted honeypots
                </th>
                <th className="px-2.5 py-2 font-mono text-[9px] font-normal tracking-[0.1em] text-muted-ink uppercase">
                  Protocols
                </th>
                <th className="px-2.5 py-2 font-mono text-[9px] font-normal tracking-[0.1em] text-muted-ink uppercase">
                  Severity
                </th>
                <th className="px-2.5 py-2 font-mono text-[9px] font-normal tracking-[0.1em] text-muted-ink uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((attacker) => (
                <tr
                  key={attacker.id}
                  tabIndex={0}
                  onClick={() => setSelectedId(attacker.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      setSelectedId(attacker.id)
                    }
                  }}
                  aria-selected={selectedId === attacker.id}
                  className={cn(
                    "cursor-pointer border-b border-ink/10 last:border-b-0 transition-colors hover:bg-surface/60 focus-visible:bg-surface/60",
                    selectedId === attacker.id && "bg-surface"
                  )}
                >
                  <td className="px-2.5 py-2.5 font-mono text-[10px]">
                    {attacker.ip}
                  </td>
                  <td className="px-2.5 py-2.5 font-mono text-[9px] text-muted-ink">
                    {formatDate(attacker.firstSeen)}
                  </td>
                  <td className="px-2.5 py-2.5 font-mono text-[9px] text-muted-ink">
                    {formatRelative(attacker.lastSeen)}
                  </td>
                  <td className="px-2.5 py-2.5 text-right font-mono text-[10px] tabular-nums">
                    {attacker.attempts.toLocaleString()}
                  </td>
                  <td className="max-w-[180px] truncate px-2.5 py-2.5 font-mono text-[9px]">
                    {attacker.honeypots.join(", ")}
                  </td>
                  <td className="px-2.5 py-2.5 font-mono text-[9px] text-muted-ink">
                    {attacker.protocols.join(", ")}
                  </td>
                  <td className="px-2.5 py-2.5">
                    <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.06em] uppercase">
                      <SeverityDot severity={attacker.severity} />
                      {attacker.severity}
                    </span>
                  </td>
                  <td className="px-2.5 py-2.5 font-mono text-[9px] tracking-[0.06em] text-muted-ink uppercase">
                    {attacker.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filtered.length ? (
            <div className="p-5">
              <p className="text-[12px]">No attackers match the filter.</p>
              <p className="mt-1 text-[11px] text-muted-ink">
                Clear the search or switch back to all severities.
              </p>
            </div>
          ) : null}
        </Panel>

        <Panel
          title="Attacker detail"
          subtitle={selected ? selected.ip : "No selection"}
          actions={
            selected ? (
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="font-mono text-[9px] tracking-[0.08em] text-muted-ink uppercase hover:text-ink"
              >
                Clear
              </button>
            ) : null
          }
        >
          {selected ? (
            <AttackerDetail attacker={selected} relatedEvents={relatedEvents} />
          ) : (
            <div className="p-4 text-[11px] leading-relaxed text-muted-ink">
              Select an attacker row to inspect their activity.
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}

function SortHeader({
  label,
  active,
  onClick,
  align = "left",
}: {
  label: string
  active: boolean
  onClick: () => void
  align?: "left" | "right"
}) {
  return (
    <th
      className={cn(
        "px-2.5 py-2 font-mono text-[9px] font-normal tracking-[0.1em] uppercase",
        align === "right" && "text-right"
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 transition-colors",
          active ? "text-ink" : "text-muted-ink hover:text-ink"
        )}
      >
        {label}
        <ArrowUpDown className="size-2.5" strokeWidth={1.5} />
      </button>
    </th>
  )
}

function AttackerDetail({
  attacker,
  relatedEvents,
}: {
  attacker: Attacker
  relatedEvents: ReturnType<typeof useDashboardTelemetry>["snapshot"]["events"]
}) {
  return (
    <div className="p-3">
      <div className="flex items-center justify-between border-b border-ink/10 pb-3">
        <div>
          <p className="font-mono text-[9px] text-muted-ink">{attacker.ja4h}</p>
          <p className="mt-1 text-[12px]">{attacker.status}</p>
        </div>
        <SeverityDot severity={attacker.severity} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3">
        {[
          ["Attempts", attacker.attempts.toLocaleString()],
          ["Last seen", formatRelative(attacker.lastSeen)],
          ["First seen", formatDate(attacker.firstSeen)],
          ["Protocols", attacker.protocols.join(", ")],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="font-mono text-[9px] tracking-[0.08em] text-muted-ink uppercase">
              {label}
            </dt>
            <dd className="mt-1 font-mono text-[10px]">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 border-t border-ink/10 pt-3">
        <p className="font-mono text-[9px] tracking-[0.08em] text-muted-ink uppercase">
          Targeted honeypots
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {attacker.honeypots.map((honeypot) => (
            <span
              key={honeypot}
              className="border border-ink/15 px-1.5 py-0.5 font-mono text-[9px] text-muted-ink"
            >
              {honeypot}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t border-ink/10 pt-3">
        <p className="font-mono text-[9px] tracking-[0.08em] text-muted-ink uppercase">
          Recent activity
        </p>
        <ul className="mt-2 space-y-2">
          {relatedEvents.slice(0, 4).map((event) => (
            <li key={event.id} className="flex gap-2">
              <SeverityDot severity={event.severity} className="mt-1" />
              <div className="min-w-0">
                <p className="text-[10.5px] leading-snug">{event.description}</p>
                <p className="mt-0.5 font-mono text-[9px] text-muted-ink">
                  {formatTime(event.timestamp)} UTC · {event.honeypot}
                </p>
              </div>
            </li>
          ))}
          {!relatedEvents.length ? (
            <li className="text-[10.5px] text-muted-ink">
              No decoded events in the current window.
            </li>
          ) : null}
        </ul>
      </div>

      <div className="mt-4 border-t border-ink/10 pt-3">
        <button
          onClick={handleQuarantine}
          disabled={attacker.status === "contained" || containedSuccess}
          className="w-full flex items-center justify-center gap-1.5 border border-red-500/60 bg-red-950/40 text-red-400 px-3 py-2 font-mono text-[10px] font-bold uppercase hover:bg-red-900/60 transition-colors disabled:opacity-50"
        >
          <ShieldAlert className="size-3.5 text-red-500" />
          <span>{attacker.status === "contained" || containedSuccess ? "Contained (504 WAF Exit Active)" : "Quarantine Attacker (504 WAF Exit)"}</span>
        </button>
      </div>
    </div>
  )
}
