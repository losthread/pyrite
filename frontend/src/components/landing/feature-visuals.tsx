import {
  ArrowDown,
  ArrowRight,
  Clock3,
  Fingerprint,
  LockKeyhole,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react"

import {
  labyrinthStages,
  wazuhRules,
  type FeatureVisual,
} from "@/config/labyrinthConfig"

export function FeatureVisual({ type }: { type: FeatureVisual }) {
  switch (type) {
    case "breadcrumb":
      return <BreadcrumbVisual />
    case "attribution":
      return <AttributionVisual />
    case "wazuh":
      return <WazuhVisual />
    case "timeout":
      return <TimeoutVisual />
  }
}

function VisualHeader({
  label,
  right,
}: {
  label: string
  right: string
}) {
  return (
    <div className="flex items-center justify-between border-b border-ink bg-surface px-3 py-2">
      <span className="micro-sm font-medium">{label}</span>
      <span className="micro-sm text-muted-ink">{right}</span>
    </div>
  )
}

function BreadcrumbVisual() {
  const chain = labyrinthStages.slice(0, 3)

  return (
    <div className="border border-ink bg-paper">
      <VisualHeader label="Token chain / HMAC-256" right="1 → 2 → 3" />
      <div className="divide-y divide-ink/20">
        {chain.map((stage, index) => (
          <div
            key={stage.id}
            className="grid grid-cols-[34px_1fr_auto] items-center gap-3 px-3 py-3"
          >
            <span className="grid size-7 place-items-center border border-ink bg-paper font-mono text-[9px]">
              0{index + 1}
            </span>
            <div className="min-w-0">
              <p className="micro-sm text-muted-ink">
                Crumb {stage.crumb.number} / {stage.crumb.name}
              </p>
              <p className="mt-1 truncate font-mono text-[11px] font-medium">
                {stage.crumb.token}
              </p>
            </div>
            <span className="micro-sm bg-ink px-1.5 py-1 text-paper">
              Valid
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-ink bg-signal px-3 py-2 text-signal-ink">
        <LockKeyhole className="size-3" strokeWidth={1.5} />
        <span className="micro-sm font-medium">
          Depth gate: 3 crumbs required
        </span>
      </div>
    </div>
  )
}

function AttributionVisual() {
  return (
    <div className="border border-ink bg-paper">
      <VisualHeader label="JA4H correlation" right="STATELESS" />
      <div className="grid grid-cols-[1fr_auto_1fr] border-b border-ink">
        <div className="border-r border-ink p-3">
          <p className="micro-sm text-muted-ink">Origin</p>
          <p className="mt-2 font-mono text-[11px] font-medium">
            185.220.101.4
          </p>
          <p className="mt-1 font-mono text-[9px] text-muted-ink">
            9c41::a3f2
          </p>
        </div>
        <div className="grid w-12 place-items-center bg-surface">
          <ArrowRight className="size-4 text-signal" strokeWidth={1.5} />
        </div>
        <div className="p-3">
          <p className="micro-sm text-muted-ink">Current</p>
          <p className="mt-2 font-mono text-[11px] font-medium">
            45.155.204.88
          </p>
          <p className="mt-1 font-mono text-[9px] text-muted-ink">
            9c41::a3f2
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 px-3 py-3">
        <Fingerprint className="size-6 shrink-0 text-signal" strokeWidth={1.2} />
        <div>
          <p className="micro-sm font-medium">Fingerprint match / 100%</p>
          <p className="micro-sm mt-1 text-muted-ink">
            Same machine. New VPN exit.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 border-t border-ink">
        <div className="border-r border-ink p-3">
          <p className="micro-sm text-muted-ink">IP hops</p>
          <p className="mt-1 font-display text-2xl leading-none">02</p>
        </div>
        <div className="bg-signal p-3 text-signal-ink">
          <p className="micro-sm">Verdict</p>
          <p className="mt-1 font-mono text-[10px] leading-tight font-medium uppercase">
            Syndicate
            <br />
            collusion
          </p>
        </div>
      </div>
    </div>
  )
}

function WazuhVisual() {
  return (
    <div className="border border-ink bg-paper">
      <VisualHeader label="Wazuh rule segregation" right="100500–100506" />
      <div className="hidden grid-cols-[52px_30px_1fr_52px_58px] border-b border-ink bg-surface/60 px-3 py-2 sm:grid">
        <span className="micro-sm text-muted-ink">Rule</span>
        <span className="micro-sm text-muted-ink">Lvl</span>
        <span className="micro-sm text-muted-ink">Signal</span>
        <span className="micro-sm text-muted-ink">Attack</span>
        <span className="micro-sm text-muted-ink">Engage</span>
      </div>
      <div className="divide-y divide-ink/15">
        {wazuhRules.map((rule) => (
          <div
            key={rule.rule}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-3 py-2.5 sm:grid-cols-[52px_30px_1fr_52px_58px]"
          >
            <span className="font-mono text-[9px] text-muted-ink sm:text-[10px]">
              {rule.rule}
            </span>
            <span
              className={
                rule.level >= 15
                  ? "bg-signal px-1.5 py-0.5 font-mono text-[9px] font-semibold text-signal-ink"
                  : "font-mono text-[10px] font-medium"
              }
            >
              {String(rule.level).padStart(2, "0")}
            </span>
            <span className="truncate font-mono text-[9px] sm:text-[10px]">
              {rule.label}
            </span>
            <span className="hidden font-mono text-[9px] sm:block">
              {rule.attack}
            </span>
            <span className="hidden font-mono text-[9px] sm:block">
              {rule.engage}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-ink bg-surface px-3 py-2">
        <span className="micro-sm flex items-center gap-2">
          <ShieldAlert className="size-3" strokeWidth={1.5} />
          Critical exfil
        </span>
        <span className="micro-sm">Level 15 / 03 events</span>
      </div>
    </div>
  )
}

function TimeoutVisual() {
  return (
    <div className="border border-ink bg-paper">
      <div className="flex items-center justify-between border-b border-ink bg-surface px-3 py-2">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 border border-ink" />
          <span className="size-1.5 border border-ink" />
          <span className="size-1.5 border border-ink" />
        </span>
        <span className="font-mono text-[9px] text-muted-ink">
          cloudfront.net / edge
        </span>
      </div>
      <div className="relative overflow-hidden p-4 sm:p-5">
        <div className="dot-field pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="micro-sm text-muted-ink">Request ID: 9f2a-71c</p>
            <p className="mt-2 font-display text-[clamp(3.2rem,6vw,5.2rem)] leading-[0.8] tracking-[-0.06em] text-signal">
              504
            </p>
            <p className="mt-2 font-mono text-xs font-medium uppercase">
              Gateway Timeout
            </p>
          </div>
          <Clock3 className="size-8 text-muted-ink" strokeWidth={1} />
        </div>
        <div className="relative mt-6 border-t border-ink pt-3">
          <p className="font-mono text-[10px] leading-relaxed text-muted-ink">
            The request could not be completed because the origin server did
            not respond in time.
          </p>
          <p className="micro-sm mt-3 flex items-center gap-2">
            <TriangleAlert className="size-3 text-signal" strokeWidth={1.5} />
            AWS WAF / Cloudflare edge
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 border-t border-ink">
        <div className="border-r border-ink px-3 py-3">
          <p className="micro-sm text-muted-ink">Morph window</p>
          <p className="mt-1 font-mono text-sm font-medium">050ms</p>
        </div>
        <div className="flex items-center justify-between gap-2 px-3 py-3">
          <div>
            <p className="micro-sm text-muted-ink">Seed</p>
            <p className="mt-1 font-mono text-[10px] font-medium">
              v1.0 → v2.0
            </p>
          </div>
          <ArrowDown className="size-3 text-signal" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  )
}
