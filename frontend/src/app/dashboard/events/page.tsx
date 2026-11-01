"use client"

import * as React from "react"
import { Search, X } from "lucide-react"

import { DemoControls } from "@/components/dashboard/demo-controls"
import { EventDetailPanel } from "@/components/dashboard/event-detail-panel"
import { EventTable } from "@/components/dashboard/event-table"
import {
  Panel,
  StatusPill,
} from "@/components/dashboard/primitives"
import { useDashboardTelemetry } from "@/hooks/useDashboardTelemetry"
import type { Severity } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

export default function LiveEventsPage() {
  const { mode, connection, paused, snapshot } = useDashboardTelemetry()
  const [query, setQuery] = React.useState("")
  const [severity, setSeverity] = React.useState<Severity | "all">("all")
  const [type, setType] = React.useState("all")
  const [honeypot, setHoneypot] = React.useState("all")
  const [selectedId, setSelectedId] = React.useState<string | null>(
    snapshot.events[0]?.id ?? null
  )

  const types = Array.from(
    new Set(snapshot.events.map((event) => event.eventType))
  ).sort()
  const honeypots = Array.from(
    new Set(snapshot.events.map((event) => event.destination))
  ).sort()

  const filtered = snapshot.events.filter((event) => {
    if (severity !== "all" && event.severity !== severity) return false
    if (type !== "all" && event.eventType !== type) return false
    if (honeypot !== "all" && event.destination !== honeypot) return false
    if (!query.trim()) return true
    const search = query.toLowerCase()
    return (
      event.sourceIp.toLowerCase().includes(search) ||
      event.destination.toLowerCase().includes(search) ||
      event.description.toLowerCase().includes(search) ||
      event.ruleId.includes(search) ||
      event.eventType.toLowerCase().includes(search)
    )
  })

  const selected = snapshot.events.find((event) => event.id === selectedId)
  const connected = mode === "demo" || connection === "connected"

  return (
    <div className="mx-auto flex w-full max-w-[1460px] flex-col gap-3">
      <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-[9px] tracking-[0.14em] text-muted-ink uppercase">
              PYRITE // Wazuh SIEM
            </p>
            <StatusPill tone={mode === "demo" ? "critical" : connected ? "live" : "critical"}>
              {mode === "demo" ? "Demo stream" : connected ? "Live stream" : "Disconnected"}
            </StatusPill>
            <StatusPill tone={paused ? "muted" : "live"}>
              {paused ? "Held" : "Receiving"}
            </StatusPill>
          </div>
          <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.03em]">
            Live events
          </h1>
          <p className="mt-1 max-w-[72ch] text-[12px] leading-relaxed text-muted-ink">
            Decoded Wazuh alerts from every honeypot, ordered newest first.
            Filter, search, and open a row for the full payload.
          </p>
        </div>
        <DemoControls compact />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative flex h-8 min-w-[190px] flex-1 items-center sm:max-w-[300px]">
          <span className="sr-only">Search events</span>
          <Search
            className="pointer-events-none absolute left-2 size-3 text-muted-ink"
            strokeWidth={1.5}
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search IP, rule, or description"
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
          {(["all", "critical", "suspicious", "info"] as const).map(
            (option) => (
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
            )
          )}
        </div>

        <select
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="h-8 border border-ink/15 bg-paper px-2 font-mono text-[9px] tracking-[0.06em] text-muted-ink uppercase outline-none focus:border-ink/40"
          aria-label="Filter event type"
        >
          <option value="all">All event types</option>
          {types.map((eventType) => (
            <option key={eventType} value={eventType}>
              {eventType}
            </option>
          ))}
        </select>

        <select
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
          className="h-8 border border-ink/15 bg-paper px-2 font-mono text-[9px] tracking-[0.06em] text-muted-ink uppercase outline-none focus:border-ink/40"
          aria-label="Filter honeypot"
        >
          <option value="all">All honeypots</option>
          {honeypots.map((destination) => (
            <option key={destination} value={destination}>
              {destination}
            </option>
          ))}
        </select>

        <span className="ml-auto font-mono text-[9px] tracking-[0.08em] text-muted-ink uppercase">
          {filtered.length} visible / {snapshot.events.length} buffered
        </span>
      </div>

      <div className="grid min-w-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Panel
          title="Event stream"
          subtitle="Wazuh alert buffer / newest first"
          bodyClassName="min-h-[460px]"
        >
          <EventTable
            events={filtered}
            selectedId={selected?.id}
            onSelect={setSelectedId}
          />
        </Panel>

        <Panel title="Event detail" subtitle={selected ? `Rule ${selected.ruleId}` : "No event selected"}>
          {selected ? (
            <EventDetailPanel
              event={selected}
              onClose={() => setSelectedId(null)}
            />
          ) : (
            <div className="p-4 text-[11px] leading-relaxed text-muted-ink">
              Select an event to inspect its source, destination, rule, MITRE
              technique, and raw Wazuh payload.
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
