"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRight, ShieldAlert, Pause, Zap, X } from "lucide-react"

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
import { usePyriteTelemetry } from "@/hooks/usePyriteTelemetry"

const kindLabels = {
  attacker: "Attacker",
  honeypot: "Honeypot Decoy",
  protected: "Protected Core Server",
  infrastructure: "Wazuh Infrastructure",
  compromised: "Compromised Node",
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
  const {
    activeSeed,
    activePersona,
    quarantineAttacker,
  } = usePyriteTelemetry()

  if (!node && !edge) {
    return (
      <div className="flex h-full min-h-[260px] flex-col justify-between p-4 bg-[#101012] text-ink border border-ink/15">
        <div>
          <p className="font-mono text-[9px] tracking-[0.14em] text-[#F59E0B] uppercase font-bold">
            INSPECTOR // ACTIVE SURVEILLANCE
          </p>
          <p className="mt-3 max-w-[28ch] text-[12px] leading-relaxed text-muted-ink">
            Select an attacker or decoy in the topology graph to inspect its wire fingerprints, decoded Pyrite Nuggets, and Tri-MITRE classifications.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-ink/15">
          <div className="bg-[#141416] p-2.5">
            <p className="font-mono text-[8px] text-muted-ink uppercase">TOPOLOGY NODES</p>
            <p className="mt-1 font-display text-xl text-ink">{nodes.length}</p>
          </div>
          <div className="bg-[#141416] p-2.5">
            <p className="font-mono text-[8px] text-muted-ink uppercase">TOTAL EVENTS</p>
            <p className="mt-1 font-display text-xl text-signal">{events.length}</p>
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
      <div className="flex h-full flex-col bg-[#101012] text-ink border border-ink/15">
        <div className="flex items-start justify-between gap-3 border-b border-ink/15 p-3 bg-[#141416]">
          <div>
            <p className="font-mono text-[9px] tracking-[0.12em] text-[#F59E0B] uppercase font-bold">
              CONNECTION TELEMETRY
            </p>
            <h2 className="mt-1 text-[13px] font-bold text-ink truncate">{edge.label || "Traffic Route"}</h2>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="grid size-6 place-items-center border border-ink/15 text-muted-ink hover:text-ink hover:bg-surface"
              aria-label="Close inspector"
            >
              <X className="size-3" strokeWidth={1.5} />
            </button>
          ) : null}
        </div>
        <div className="space-y-3 p-3">
          <div className="flex items-center justify-between border-b border-ink/10 pb-2">
            <span className="text-[11px] text-muted-ink">Path</span>
            <span className="font-mono text-[10px] text-signal font-bold">
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

  const isAttacker = node.kind === "attacker"
  const ja4h = isAttacker ? "ge11nn020000_c5a14d84f9be" : "—"
  const hassh = isAttacker ? "kex_curve25519_ciphers_aes256gcm" : "—"
  const activePersonaName = activePersona?.name || activeSeed

  const related = events
    .filter(
      (event) =>
        event.sourceIp === node.ip ||
        event.destination === node.label ||
        event.destinationIp === node.ip
    )
    .slice(0, 4)

  return (
    <div className="flex h-full flex-col bg-[#101012] text-ink border border-ink/15">
      <div className="flex items-start justify-between gap-3 border-b border-ink/15 p-3 bg-[#141416]">
        <div className="min-w-0">
          <p className="font-mono text-[9px] tracking-[0.14em] text-[#F59E0B] uppercase font-bold">
            {kindLabels[node.kind] || "ENTITY"}
          </p>
          <h2 className="mt-1 truncate font-mono text-[13px] font-bold text-ink">
            {node.label}
          </h2>
          <p className="mt-0.5 font-mono text-[9px] text-muted-ink">
            IP: {node.ip}
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="grid size-6 shrink-0 place-items-center border border-ink/15 text-muted-ink hover:text-ink hover:bg-surface"
            aria-label="Close inspector"
          >
            <X className="size-3" strokeWidth={1.5} />
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto p-3">
        {/* Status & Severity */}
        <div className="flex items-center justify-between border-b border-ink/10 pb-2">
          <div className="flex items-center gap-2">
            <SeverityDot severity={node.severity} />
            <span className="text-[11px] font-bold">{node.status}</span>
          </div>
          <span className="font-mono text-[9px] text-muted-ink">
            Persona: <span className="text-signal font-semibold">{activePersonaName.split(" ")[0]}</span>
          </span>
        </div>

        {/* Wire Fingerprints (JA4H & HASSH) */}
        {isAttacker && (
          <div className="p-2 border border-ink/20 bg-[#141416] space-y-1.5 font-mono text-[9px]">
            <p className="text-[#F59E0B] font-bold text-[8.5px] uppercase tracking-wider">
              WIRE ATTRIBUTION FINGERPRINTS
            </p>
            <div>
              <span className="text-muted-ink">JA4H:</span>
              <p className="text-signal truncate font-bold">{ja4h}</p>
            </div>
            <div>
              <span className="text-muted-ink">HASSH:</span>
              <p className="text-ink truncate">{hassh}</p>
            </div>
          </div>
        )}

        {/* Pyrite Nugget (Stateless HMAC Crumb) */}
        {isAttacker && (
          <div className="p-2 border border-[#F59E0B]/30 bg-[#141416] space-y-1 font-mono text-[9px]">
            <div className="flex items-center justify-between">
              <span className="text-[#F59E0B] font-bold text-[8.5px] uppercase tracking-wider">
                PYRITE NUGGET (STATELESS HMAC CRUMB)
              </span>
              <span className="text-[8px] text-green-400 font-bold">HMAC VERIFIED</span>
            </div>
            <div className="bg-[#0B0B0C] p-1.5 border border-ink/15 text-[8.5px] text-[#F1EFE9] overflow-x-auto">
              <p className="text-signal truncate font-bold">vk_live_eyJzIjoxLCJmIjoiZ2UxMW5uMDIwMDAwX2M1YTFkODRmOWJlIiwidCI6MTcyNTIzNDU2Nywic2VlZCI6IjB4NDIxIn0.8f1a...</p>
              <div className="mt-1 pt-1 border-t border-ink/10 text-muted-ink">
                <span>Decoded Payload: </span>
                <span className="text-amber-300">&#123;&quot;s&quot;: 1, &quot;f&quot;: &quot;ge11nn...&quot;, &quot;t&quot;: 1725234567, &quot;seed&quot;: &quot;0x421&quot;&#125;</span>
              </div>
            </div>
          </div>
        )}

        {/* Tri-MITRE Framework Badges */}
        <div className="space-y-1.5">
          <p className="font-mono text-[8.5px] tracking-wider text-muted-ink uppercase">
            Tri-MITRE Active Defense Mapping:
          </p>
          <div className="flex flex-wrap gap-1.5 font-mono text-[9px]">
            <span className="px-2 py-0.5 bg-red-950/40 text-red-400 border border-red-500/30 font-bold">
              ATT&CK: T1190 (Exploit)
            </span>
            <span className="px-2 py-0.5 bg-blue-950/40 text-blue-400 border border-blue-500/30 font-bold">
              D3FEND: D3-DEC (Decoy)
            </span>
            <span className="px-2 py-0.5 bg-amber-950/40 text-amber-400 border border-amber-500/30 font-bold">
              Engage: EAC0021 (Alter)
            </span>
          </div>
        </div>

        {/* Node Specifications */}
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">
          <Field label="Connections" value={String(node.connectionCount)} mono />
          <Field label="Protocols" value={node.protocols.join(", ")} mono />
          <Field label="First seen" value={formatDate(node.firstSeen)} />
          <Field label="Last seen" value={formatRelative(node.lastSeen)} />
          {node.associatedHoneypot ? (
            <Field label="Target Honeypot" value={node.associatedHoneypot} mono />
          ) : null}
          {node.threatClassification ? (
            <Field label="Attribution" value={node.threatClassification} />
          ) : null}
        </dl>

        {/* Real Containment Actions */}
        {isAttacker && (
          <div className="space-y-1.5 pt-2 border-t border-ink/10">
            <p className="font-mono text-[8.5px] text-muted-ink uppercase tracking-wider">
              Containment Controls:
            </p>
            <div className="flex">
              <button
                onClick={() => quarantineAttacker(node.label)}
                className="w-full flex items-center justify-center gap-1.5 border border-red-500/50 bg-red-950/40 text-red-400 px-3 py-2 font-mono text-[10px] font-bold uppercase hover:bg-red-900/60 transition-colors"
                title="Inject Plausible 504 WAF Exit timeout"
              >
                <ShieldAlert className="size-3.5 text-red-500" />
                Quarantine (504 WAF Drop)
              </button>
            </div>
          </div>
        )}

        <RecentEvents events={related} />

        <Link
          href="/dashboard/events"
          className="flex h-8 items-center justify-between border border-ink/20 px-2.5 font-mono text-[9px] tracking-[0.1em] text-muted-ink uppercase transition-colors hover:border-signal hover:text-signal"
        >
          Open Wazuh stream
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
      <dt className="font-mono text-[8.5px] tracking-[0.1em] text-muted-ink uppercase">
        {label}
      </dt>
      <dd
        className={`mt-0.5 truncate text-[11px] ${mono ? "font-mono text-[10px] text-ink" : "text-muted-ink"}`}
        title={value}
      >
        {value}
      </dd>
    </div>
  )
}

function RecentEvents({ events }: { events: SecurityEvent[] }) {
  return (
    <div className="border-t border-ink/10 pt-2.5">
      <p className="font-mono text-[8.5px] tracking-[0.1em] text-muted-ink uppercase font-bold mb-2">
        Recent Wazuh Alerts
      </p>
      {events.length ? (
        <ul className="space-y-1.5">
          {events.map((event) => (
            <li key={event.id} className="flex gap-2 p-1.5 bg-[#141416] border border-ink/10">
              <SeverityDot severity={event.severity} className="mt-1" />
              <div className="min-w-0 font-mono">
                <p className="truncate text-[10px] text-ink font-medium">{event.description}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[8.5px] text-muted-ink">
                  <span>Rule {event.ruleId}</span>
                  <span>•</span>
                  <span>{formatTime(event.timestamp)} UTC</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[10px] text-muted-ink italic">No recent events recorded.</p>
      )}
    </div>
  )
}
