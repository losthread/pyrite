"use client"

import * as React from "react"
import { Server } from "lucide-react"

import { DemoControls } from "@/components/dashboard/demo-controls"
import {
  Panel,
  SeverityDot,
  StatusPill,
} from "@/components/dashboard/primitives"
import { useDashboardTelemetry } from "@/hooks/useDashboardTelemetry"
import type { Honeypot, HoneypotStatus } from "@/lib/dashboard/types"
import {
  formatNumber,
  formatRelative,
  formatTime,
} from "@/lib/dashboard/format"
import { cn } from "@/lib/utils"

const statusLabel: Record<HoneypotStatus, string> = {
  online: "Online",
  offline: "Offline",
  degraded: "Degraded",
  under_attack: "Under attack",
  capturing: "Capturing",
}

export default function HoneypotsPage() {
  const { mode, connection, snapshot } = useDashboardTelemetry()
  const [selectedId, setSelectedId] = React.useState<string | null>(
    snapshot.honeypots[0]?.id ?? null
  )
  const selected = snapshot.honeypots.find((item) => item.id === selectedId)
  const connected = mode === "demo" || connection === "connected"

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3">
      <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-[9px] tracking-[0.14em] text-muted-ink uppercase">
              PYRITE // Decoy Fleet
            </p>
            <StatusPill tone={mode === "demo" ? "critical" : connected ? "live" : "critical"}>
              {mode === "demo" ? "Demo fleet" : connected ? "Live fleet" : "Disconnected"}
            </StatusPill>
          </div>
          <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.03em]">
            Honeypots
          </h1>
          <p className="mt-1 max-w-[70ch] text-[12px] leading-relaxed text-muted-ink">
            Decoy systems currently accepting traffic. Select a honeypot to
            inspect its session history and associated attackers.
          </p>
        </div>
        <DemoControls compact />
      </div>

      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid content-start gap-3 sm:grid-cols-2">
          {snapshot.honeypots.map((honeypot) => (
            <HoneypotCard
              key={honeypot.id}
              honeypot={honeypot}
              selected={selectedId === honeypot.id}
              onSelect={() => setSelectedId(honeypot.id)}
            />
          ))}
          {!snapshot.honeypots.length ? (
            <Panel
              title="No honeypots"
              subtitle="Waiting on backend"
              className="sm:col-span-2"
            >
              <div className="p-4 text-[11px] leading-relaxed text-muted-ink">
                No decoy systems are present in the current snapshot. Connect to
                a live backend or switch to demo mode.
              </div>
            </Panel>
          ) : null}
        </div>

        <Panel
          title="Honeypot detail"
          subtitle={selected ? selected.name : "No selection"}
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
            <HoneypotDetail honeypot={selected} />
          ) : (
            <div className="p-4 text-[11px] leading-relaxed text-muted-ink">
              Select a honeypot to inspect activity.
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}

function HoneypotCard({
  honeypot,
  selected,
  onSelect,
}: {
  honeypot: Honeypot
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group flex min-h-[164px] flex-col justify-between border p-3.5 text-left transition-colors",
        selected
          ? "border-signal/70 bg-surface"
          : "border-ink/15 bg-surface/25 hover:bg-surface/50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Server className="size-4 text-muted-ink" strokeWidth={1.4} />
          <div>
            <h2 className="text-[12.5px] font-medium">{honeypot.name}</h2>
            <p className="mt-0.5 font-mono text-[9px] text-muted-ink">
              {honeypot.ip}
            </p>
          </div>
        </div>
        <SeverityDot severity={honeypot.severity} />
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[9px] tracking-[0.08em] text-muted-ink uppercase">
            {statusLabel[honeypot.status]}
          </p>
          <p className="mt-1 font-display text-[1.45rem] leading-none">
            {honeypot.sessions}
            <span className="ml-1 font-mono text-[9px] tracking-normal text-muted-ink">
              sessions
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[9px] tracking-[0.08em] text-muted-ink uppercase">
            {honeypot.type}
          </p>
          <p className="mt-1 font-mono text-[9px] text-muted-ink">
            {formatNumber(honeypot.interactions)} interactions
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-2 font-mono text-[9px] text-muted-ink">
        <span>{honeypot.protocols.join(", ")}</span>
        <span>{formatRelative(honeypot.lastActivity)}</span>
      </div>
    </button>
  )
}

function HoneypotDetail({ honeypot }: { honeypot: Honeypot }) {
  const { snapshot } = useDashboardTelemetry()
  const events = snapshot.events.filter(
    (event) => event.destination === honeypot.name
  )
  const attackers = snapshot.attackers.filter((attacker) =>
    attacker.honeypots.includes(honeypot.name)
  )

  return (
    <div className="p-3">
      <div className="flex items-center justify-between border-b border-ink/10 pb-3">
        <div>
          <p className="font-mono text-[9px] text-muted-ink">{honeypot.host}</p>
          <p className="mt-1 text-[12px]">{statusLabel[honeypot.status]}</p>
        </div>
        <SeverityDot severity={honeypot.severity} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3">
        {[
          ["Type", honeypot.type],
          ["Sessions", String(honeypot.sessions)],
          ["Interactions", formatNumber(honeypot.interactions)],
          ["Last activity", formatRelative(honeypot.lastActivity)],
          ["Protocols", honeypot.protocols.join(", ")],
          ["Address", honeypot.ip],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="font-mono text-[9px] tracking-[0.08em] text-muted-ink uppercase">
              {label}
            </dt>
            <dd className="mt-1 truncate font-mono text-[10px]">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 border-t border-ink/10 pt-3">
        <p className="font-mono text-[9px] tracking-[0.08em] text-muted-ink uppercase">
          Associated attackers
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {attackers.map((attacker) => (
            <span
              key={attacker.id}
              className="border border-ink/15 px-1.5 py-0.5 font-mono text-[9px] text-muted-ink"
            >
              {attacker.ip}
            </span>
          ))}
          {!attackers.length ? (
            <span className="text-[10.5px] text-muted-ink">None observed.</span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 border-t border-ink/10 pt-3">
        <p className="font-mono text-[9px] tracking-[0.08em] text-muted-ink uppercase">
          Recent activity
        </p>
        <ul className="mt-2 space-y-2">
          {events.slice(0, 4).map((event) => (
            <li key={event.id} className="flex gap-2">
              <SeverityDot severity={event.severity} className="mt-1" />
              <div className="min-w-0">
                <p className="text-[10.5px] leading-snug">{event.description}</p>
                <p className="mt-0.5 font-mono text-[9px] text-muted-ink">
                  {formatTime(event.timestamp)} UTC · {event.sourceIp}
                </p>
              </div>
            </li>
          ))}
          {!events.length ? (
            <li className="text-[10.5px] text-muted-ink">
              No decoded events in the current window.
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  )
}
