"use client"

import * as React from "react"

import { DemoControls } from "@/components/dashboard/demo-controls"
import {
  BarList,
  SessionBars,
  SeverityRing,
  VolumeChart,
} from "@/components/dashboard/charts"
import { Panel, StatusPill } from "@/components/dashboard/primitives"
import { useDashboardTelemetry } from "@/hooks/usePyriteTelemetry"
import { cn } from "@/lib/utils"

type Range = "1h" | "24h" | "7d"

const ranges: Array<{ id: Range; label: string }> = [
  { id: "1h", label: "Last hour" },
  { id: "24h", label: "Last 24h" },
  { id: "7d", label: "Last 7 days" },
]

const seriesKey: Record<Range, "1H" | "24H" | "7D"> = {
  "1h": "1H",
  "24h": "24H",
  "7d": "7D",
}

export default function AnalyticsPage() {
  const { mode, connection, snapshot } = useDashboardTelemetry()
  const [range, setRange] = React.useState<Range>("24h")
  const connected = mode === "demo" || connection === "connected"

  const series = snapshot.analytics.series?.[seriesKey[range]] ?? []
  const volume =
    series.length > 0
      ? series.map((point) => ({ label: point.time, value: point.attacks }))
      : snapshot.analytics.volume

  const total = volume.reduce((sum, item) => sum + item.value, 0)
  const peak = Math.max(0, ...volume.map((item) => item.value))

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3">
      <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-[9px] tracking-[0.14em] text-muted-ink uppercase">
              PYRITE // Tri-MITRE
            </p>
            <StatusPill tone={mode === "demo" ? "critical" : connected ? "live" : "critical"}>
              {mode === "demo" ? "Simulated analytics" : connected ? "Live analytics" : "Disconnected"}
            </StatusPill>
          </div>
          <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.03em]">
            Analytics
          </h1>
          <p className="mt-1 max-w-[72ch] text-[12px] leading-relaxed text-muted-ink">
            Attack volume, severity mix, targeted decoys, and protocol
            distribution for the selected window.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-8 items-center border border-ink/15">
            {ranges.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRange(item.id)}
                className={cn(
                  "h-full border-r border-ink/15 px-2.5 font-mono text-[9px] tracking-[0.08em] uppercase transition-colors last:border-r-0",
                  range === item.id
                    ? "bg-ink text-paper"
                    : "text-muted-ink hover:text-ink"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <DemoControls compact />
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.7fr)]">
        <Panel
          title="Attack volume over time"
          subtitle={`${total.toLocaleString()} attacks / peak ${peak}`}
        >
          <div className="p-3">
            <VolumeChart data={volume} height={216} />
          </div>
        </Panel>

        <Panel
          title="Severity distribution"
          subtitle="Decoded alerts in buffer"
        >
          <SeverityRing data={snapshot.analytics.severity} />
        </Panel>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Panel
          title="Most targeted honeypots"
          subtitle="Interactions in selected window"
        >
          <BarList data={snapshot.analytics.targetedHoneypots} highlightFirst />
        </Panel>

        <Panel
          title="Protocols observed"
          subtitle="Alert event count"
        >
          <BarList data={snapshot.analytics.protocols} />
        </Panel>

        <Panel
          title="Active sessions"
          subtitle="Unique attackers per 5-minute slice"
          className="md:col-span-2 xl:col-span-1"
        >
          <div className="p-3">
            <SessionBars data={snapshot.analytics.sessions} />
          </div>
        </Panel>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border border-ink/15 px-3 py-2 font-mono text-[9px] tracking-[0.08em] text-muted-ink uppercase">
        <span>
          {mode === "demo"
            ? "Demo analytics use the deterministic presentation dataset."
            : "Live analytics are derived from the backend snapshot only."}
        </span>
        <span>
          {snapshot.events.length} decoded events / {snapshot.honeypots.length} honeypots
        </span>
      </div>
    </div>
  )
}
