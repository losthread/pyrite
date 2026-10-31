import Link from "next/link"
import { ArrowUpRight, X } from "lucide-react"

import type {
  NetworkConnection,
  NetworkNode,
  SecurityEvent,
} from "@/lib/dashboard/types"
import {
  formatDate,
  formatNumber,
  formatRelative,
  formatTime,
} from "@/lib/dashboard/format"
import { SeverityDot } from "@/components/dashboard/primitives"

const kindLabels = {
  attacker: "Attacker",
  honeypot: "Honeypot",
  protected: "Protected server",
  infrastructure: "Infrastructure",
  compromised: "Compromised",
} as const

export function InspectorPanel({
  node,
  edge,
  nodes,
  events,
  onClose,
}: {
  node?: NetworkNode | null
  edge?: NetworkConnection | null
  nodes: NetworkNode[]
  events: SecurityEvent[]
  onClose?: () => void
}) {
  if (!node && !edge) {
    return (
      <div className="flex h-full min-h-[260px] flex-col justify-between p-4">
        <div>
          <p className="font-mono text-[9px] tracking-[0.12em] text-muted-ink uppercase">
            Inspector / idle
          </p>
          <p className="mt-3 max-w-[28ch] text-[12px] leading-relaxed text-muted-ink">
            Select a node or connection in the topology to inspect its identity,
            traffic, and related events.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-ink/15">
          <div className="bg-paper p-2.5">
            <p className="font-mono text-[9px] text-muted-ink uppercase">Nodes</p>
            <p className="mt-1 font-display text-xl">{nodes.length}</p>
          </div>
          <div className="bg-paper p-2.5">
            <p className="font-mono text-[9px] text-muted-ink uppercase">Events</p>
            <p className="mt-1 font-display text-xl">{events.length}</p>
          </div>
        </div>
      </div>
    )
  }

  if (edge) {
    const source = nodes.find((item) => item.id === edge.source)
    const target = nodes.find((item) => item.id === edge.target)
    const related = events.filter(
      (event) =>
        event.sourceIp === source?.ip ||
        event.destination === target?.label ||
        event.destinationIp === target?.ip
    )

    return (
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-ink/15 p-3">
          <div>
            <p className="font-mono text-[9px] tracking-[0.12em] text-muted-ink uppercase">
              Connection inspector
            </p>
            <h2 className="mt-1 text-[13px] font-medium">{edge.label}</h2>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="grid size-6 place-items-center border border-ink/15 text-muted-ink hover:text-ink"
              aria-label="Close inspector"
            >
              <X className="size-3" strokeWidth={1.5} />
            </button>
          ) : null}
        </div>
        <div className="space-y-3 p-3">
          <div className="flex items-center justify-between border-b border-ink/10 pb-2">
            <span className="text-[11px] text-muted-ink">Path</span>
            <span className="font-mono text-[10px]">
              {source?.label ?? "?"} → {target?.label ?? "?"}
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-3">
            <Field label="Protocol" value={edge.protocol} mono />
            <Field label="Packets" value={formatNumber(edge.packets)} mono />
            <Field label="Severity" value={edge.severity} mono />
            <Field label="Last seen" value={formatRelative(edge.lastSeen)} />
          </dl>
          <RecentEvents events={related.slice(0, 3)} />
        </div>
      </div>
    )
  }

  if (!node) return null

  const related = events
    .filter(
      (event) =>
        event.sourceIp === node.ip ||
        event.destination === node.label ||
        event.destinationIp === node.ip
    )
    .slice(0, 4)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-ink/15 p-3">
        <div className="min-w-0">
          <p className="font-mono text-[9px] tracking-[0.12em] text-muted-ink uppercase">
            {kindLabels[node.kind]}
          </p>
          <h2 className="mt-1 truncate font-mono text-[13px] font-medium">
            {node.label}
          </h2>
          <p className="mt-0.5 font-mono text-[9px] text-muted-ink">
            {node.ip}
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="grid size-6 shrink-0 place-items-center border border-ink/15 text-muted-ink hover:text-ink"
            aria-label="Close inspector"
          >
            <X className="size-3" strokeWidth={1.5} />
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        <div className="flex items-center gap-2">
          <SeverityDot severity={node.severity} />
          <span className="text-[11px]">{node.status}</span>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-3">
          <Field label="Connections" value={String(node.connectionCount)} mono />
          <Field label="Protocols" value={node.protocols.join(", ")} mono />
          <Field label="First seen" value={formatDate(node.firstSeen)} />
          <Field label="Last seen" value={formatRelative(node.lastSeen)} />
          {node.associatedHoneypot ? (
            <Field label="Honeypot" value={node.associatedHoneypot} mono />
          ) : null}
          {node.threatClassification ? (
            <Field label="Class" value={node.threatClassification} />
          ) : null}
        </dl>

        <RecentEvents events={related} />

        <Link
          href="/dashboard/events"
          className="flex h-8 items-center justify-between border border-ink/15 px-2.5 font-mono text-[9px] tracking-[0.1em] text-muted-ink uppercase transition-colors hover:border-ink/40 hover:text-ink"
        >
          Open event stream
          <ArrowUpRight className="size-3" strokeWidth={1.5} />
        </Link>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[9px] tracking-[0.1em] text-muted-ink uppercase">
        {label}
      </dt>
      <dd
        className={`mt-1 truncate text-[11px] ${mono ? "font-mono text-[10px]" : ""}`}
        title={value}
      >
        {value}
      </dd>
    </div>
  )
}

function RecentEvents({ events }: { events: SecurityEvent[] }) {
  return (
    <div className="border-t border-ink/10 pt-3">
      <p className="font-mono text-[9px] tracking-[0.1em] text-muted-ink uppercase">
        Recent related events
      </p>
      {events.length ? (
        <ul className="mt-2 space-y-2">
          {events.map((event) => (
            <li key={event.id} className="flex gap-2">
              <SeverityDot severity={event.severity} className="mt-1" />
              <div className="min-w-0">
                <p className="truncate text-[10.5px]">{event.description}</p>
                <p className="mt-0.5 font-mono text-[9px] text-muted-ink">
                  {formatTime(event.timestamp)} UTC · Rule {event.ruleId}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[10.5px] text-muted-ink">
          No recent events for this entity.
        </p>
      )}
    </div>
  )
}
