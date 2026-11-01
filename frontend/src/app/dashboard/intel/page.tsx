"use client"

import * as React from "react"
import {
  BrainCircuit,
  CircleDot,
  FileText,
  GitBranch,
  ShieldAlert,
  Terminal,
} from "lucide-react"

import {
  Panel,
  SectionHeading,
  StatusPill,
} from "@/components/dashboard/primitives"
import { useDashboardTelemetry } from "@/hooks/useDashboardTelemetry"
import { cn } from "@/lib/utils"

type Tab = "containment" | "lineage" | "report"

export default function IntelligencePage() {
  const {
    mode,
    connection,
    snapshot,
    terminalLines,
    tarpitProgress,
    sendSocAction,
  } = useDashboardTelemetry()
  const [tab, setTab] = React.useState<Tab>("containment")
  const [reportFingerprint, setReportFingerprint] = React.useState("")
  const [report, setReport] = React.useState<Record<string, unknown> | null>(null)
  const [reportError, setReportError] = React.useState<string | null>(null)
  const [clusters, setClusters] = React.useState<unknown[] | null>(null)
  const connected = mode === "demo" || connection === "connected"

  const firstFingerprint = snapshot.sessionState?.[0]?.http_fingerprint ?? ""

  React.useEffect(() => {
    if (tab !== "lineage") return
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/similar-sessions`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data) => setClusters(data.clusters ?? []))
      .catch(() => setClusters([]))
  }, [tab])

  const actions = [
    {
      action: "ENGAGE_TARPIT",
      label: "Engage adaptive tarpit",
      icon: CircleDot,
      detail: "Throttle the Stage 4 stream to 128B / 2s.",
    },
    {
      action: "ENGAGE_ENDLESSH_TARPIT",
      label: "Engage Endlessh tarpit",
      icon: Terminal,
      detail: "1 byte / 10s infinite slow-drip containment.",
    },
    {
      action: "PLAUSIBLE_WAF_DROP",
      label: "Quarantine (504 WAF exit)",
      icon: ShieldAlert,
      detail: "End the session with a spoofed AWS WAF 504 timeout.",
    },
    {
      action: "MUTATE_TOPOLOGY",
      label: "Burn & mutate topology",
      icon: GitBranch,
      detail: "Rotate the polymorphic persona and invalidate breadcrumbs.",
    },
  ]

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-mono text-[9px] tracking-[0.14em] text-muted-ink uppercase">
          Vyuha // Honeytrap
        </p>
        <StatusPill tone={mode === "demo" ? "critical" : connected ? "live" : "critical"}>
          {mode === "demo" ? "Demo mode" : connected ? "Live" : "Disconnected"}
        </StatusPill>
      </div>

      <SectionHeading
        title="Intelligence & response"
        detail="Active containment, attribution lineage, and incident reporting."
      />

      <div className="flex h-9 items-center border-b border-ink/15">
        {(
          [
            ["containment", "Containment"],
            ["lineage", "Lineage"],
            ["report", "Report"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "h-full border-b-2 px-4 font-mono text-[9px] tracking-[0.1em] uppercase transition-colors",
              tab === id
                ? "border-signal text-ink"
                : "border-transparent text-muted-ink hover:text-ink"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "containment" ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel title="Active containment" subtitle="Sent over /ws/soc">
            <div className="grid gap-2 p-3 sm:grid-cols-2">
              {actions.map(({ action, label, icon: Icon, detail }) => (
                <button
                  key={action}
                  type="button"
                  disabled={mode !== "live"}
                  onClick={() => sendSocAction(action, firstFingerprint ? { ja4h: firstFingerprint } : undefined)}
                  className="flex flex-col items-start gap-2 border border-ink/15 p-3 text-left transition-colors hover:border-ink/40 disabled:opacity-50"
                >
                  <Icon className="size-4 text-signal" strokeWidth={1.5} />
                  <span className="text-[12px] font-medium">{label}</span>
                  <span className="font-mono text-[8px] leading-relaxed text-muted-ink uppercase">
                    {detail}
                  </span>
                </button>
              ))}
            </div>
            {mode !== "live" ? (
              <p className="border-t border-ink/10 p-3 font-mono text-[8px] tracking-[0.08em] text-muted-ink uppercase">
                Actions are enabled in live mode only.
              </p>
            ) : null}
          </Panel>

          <Panel title="Shadow shell mirror" subtitle="Live /ws/soc terminal stream">
            <div className="max-h-[420px] overflow-y-auto p-3 font-mono text-[10px] leading-relaxed">
              {terminalLines.length ? (
                terminalLines.map((line, index) => (
                  <div key={index} className="mb-3 border-b border-ink/10 pb-2">
                    <p className="text-signal">
                      {line.ja4h.slice(0, 8)}@{line.cwd} $ {line.command}
                    </p>
                    {line.stdout ? (
                      <pre className="mt-1 whitespace-pre-wrap text-muted-ink">{line.stdout}</pre>
                    ) : null}
                    {line.stderr ? (
                      <pre className="mt-1 whitespace-pre-wrap text-signal">{line.stderr}</pre>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-muted-ink">
                  Waiting for shell commands… run Stage 3 to see the mirror.
                </p>
              )}
            </div>
          </Panel>

          <Panel title="Stage 4 tarpit monitor" subtitle="Live /ws/soc progress" className="lg:col-span-2">
            <div className="p-3">
              {tarpitProgress ? (
                <div className="grid gap-2 sm:grid-cols-4">
                  {[
                    ["Bytes sent", String(tarpitProgress.bytesSent)],
                    ["Drip", `${tarpitProgress.chunkSize}B`],
                    ["Speed", tarpitProgress.speed],
                    ["Dwell", `${tarpitProgress.dwellTimeSeconds}s`],
                  ].map(([label, value]) => (
                    <div key={label} className="border border-ink/10 p-2">
                      <p className="font-mono text-[8px] tracking-[0.08em] text-muted-ink uppercase">{label}</p>
                      <p className="mt-1 font-display text-lg">{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-mono text-[9px] text-muted-ink">
                  No exfiltration stream active. Trigger Stage 4 to monitor the tarpit.
                </p>
              )}
            </div>
          </Panel>
        </div>
      ) : null}

      {tab === "lineage" ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel title="Active sessions" subtitle="Per-fingerprint shadow worlds">
            <div className="divide-y divide-ink/10">
              {snapshot.sessionState?.length ? (
                snapshot.sessionState.map((sess) => (
                  <div key={sess.http_fingerprint} className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[10px]">{sess.http_fingerprint}</span>
                      <span className="font-mono text-[9px] text-signal">stage {sess.highest_stage}</span>
                    </div>
                    <p className="mt-1 font-mono text-[9px] text-muted-ink">
                      {sess.current_ip} · ips: {sess.observed_ips.join(", ")}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[8px] uppercase">
                      <span className={cn("border px-1.5 py-0.5", sess.tarpit_active ? "border-signal text-signal" : "border-ink/15 text-muted-ink")}>tarpit</span>
                      <span className={cn("border px-1.5 py-0.5", sess.quarantined ? "border-signal text-signal" : "border-ink/15 text-muted-ink")}>quarantined</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-3 text-[11px] text-muted-ink">No active shadow worlds.</p>
              )}
            </div>
          </Panel>

          <Panel title="Similar sessions" subtitle="/api/similar-sessions">
            <div className="divide-y divide-ink/10">
              {clusters?.length ? (
                clusters.map((cluster, index) => {
                  const c = cluster as Record<string, unknown>
                  return (
                    <div key={index} className="p-3">
                      <p className="text-[12px] font-medium">{String(c.title ?? "")}</p>
                      <p className="mt-1 font-mono text-[9px] text-muted-ink">{String(c.description ?? "")}</p>
                      <span className="mt-2 inline-block border border-signal/40 px-1.5 py-0.5 font-mono text-[8px] uppercase text-signal">
                        {String(c.risk ?? "")}
                      </span>
                    </div>
                  )
                })
              ) : (
                <p className="p-3 text-[11px] text-muted-ink">No cross-IP or syndicate clusters detected.</p>
              )}
            </div>
          </Panel>
        </div>
      ) : null}

      {tab === "report" ? (
        <Panel title="AI incident report" subtitle="POST /api/intel/report/{fingerprint}">
          <div className="space-y-3 p-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={reportFingerprint}
                onChange={(event) => setReportFingerprint(event.target.value)}
                placeholder={firstFingerprint || "http_fingerprint"}
                className="h-9 flex-1 border border-ink/15 bg-paper px-3 font-mono text-[10px] outline-none focus:border-ink/40"
              />
              <button
                type="button"
                onClick={async () => {
                  setReportError(null)
                  setReport(null)
                  const fp = reportFingerprint || firstFingerprint
                  if (!fp) return
                  try {
                    const res = await fetch(
                      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/intel/report/${encodeURIComponent(fp)}`,
                      { method: "POST" }
                    )
                    if (!res.ok) throw new Error(String(res.status))
                    setReport(await res.json())
                  } catch (error) {
                    setReportError((error as Error).message)
                  }
                }}
                className="flex h-9 items-center gap-2 border border-ink px-3 font-mono text-[9px] tracking-[0.1em] uppercase transition-colors hover:bg-surface"
              >
                <FileText className="size-3" strokeWidth={1.5} />
                Generate
              </button>
            </div>

            {reportError ? (
              <p className="font-mono text-[10px] text-signal">Report request failed: {reportError}</p>
            ) : null}

            {report ? (
              <div className="space-y-3">
                {[
                  ["Threat", String(report.threat_severity ?? "")],
                  ["Score", String(report.threat_score ?? "")],
                  ["Primary IP", String(report.primary_ip ?? "")],
                  ["Dwell", `${String(report.dwell_time_seconds ?? "")}s`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b border-ink/10 pb-2">
                    <span className="font-mono text-[8px] tracking-[0.08em] text-muted-ink uppercase">{label}</span>
                    <span className="font-mono text-[10px]">{value}</span>
                  </div>
                ))}
                <p className="text-[11px] leading-relaxed text-muted-ink">
                  {String(report.executive_summary ?? "")}
                </p>
                <div>
                  <p className="mb-2 font-mono text-[8px] tracking-[0.08em] text-muted-ink uppercase">Stages compromised</p>
                  <ul className="list-disc pl-5 text-[11px] text-muted-ink">
                    {(report.stages_compromised as string[] | undefined)?.map((stage) => (
                      <li key={stage}>{stage}</li>
                    ))}
                  </ul>
                </div>
                <pre className="max-h-[260px] overflow-auto border border-ink/15 p-2 font-mono text-[9px] text-muted-ink">
                  {JSON.stringify(report, null, 2)}
                </pre>
              </div>
            ) : null}
          </div>
        </Panel>
      ) : null}
    </div>
  )
}
