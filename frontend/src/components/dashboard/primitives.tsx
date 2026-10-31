import * as React from "react"
import { ArrowUpRight } from "lucide-react"

import type { Severity } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col border border-ink/15 bg-surface/30",
        className
      )}
    >
      {title || actions ? (
        <header className="flex min-h-10 items-center justify-between gap-3 border-b border-ink/15 px-3 py-2">
          <div className="min-w-0">
            <h2 className="truncate text-[12px] font-medium">{title}</h2>
            {subtitle ? (
              <p className="truncate font-mono text-[9px] tracking-[0.08em] text-muted-ink uppercase">
                {subtitle}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
          ) : null}
        </header>
      ) : null}
      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  )
}

export function SeverityDot({
  severity,
  className,
}: {
  severity: Severity | string
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-block size-1.5 shrink-0",
        severity === "critical"
          ? "bg-signal"
          : severity === "suspicious"
            ? "bg-ink/60"
            : "bg-ink/25",
        className
      )}
      aria-hidden="true"
    />
  )
}

export function SeverityLabel({ severity }: { severity: Severity }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.08em] uppercase">
      <SeverityDot severity={severity} />
      {severity === "critical"
        ? "Critical"
        : severity === "suspicious"
          ? "Suspicious"
          : "Info"}
    </span>
  )
}

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode
  tone?: "neutral" | "critical" | "live" | "muted"
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 border px-2 font-mono text-[9px] font-medium tracking-[0.1em] uppercase",
        tone === "critical"
          ? "border-signal/50 bg-signal text-signal-ink"
          : tone === "live"
            ? "border-ink/20 text-ink"
            : tone === "muted"
              ? "border-ink/10 text-muted-ink"
              : "border-ink/20 text-muted-ink"
      )}
    >
      {children}
    </span>
  )
}

export function MetricStrip({
  items,
  className,
}: {
  items: Array<{
    label: string
    value: string
    context: string
    critical?: boolean
  }>
  className?: string
}) {
  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-px border border-ink/15 bg-ink/15 lg:grid-cols-4",
        className
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="flex min-h-[86px] flex-col justify-between bg-paper p-3 sm:p-3.5"
        >
          <dt className="text-[11px] text-muted-ink">{item.label}</dt>
          <dd
            className={cn(
              "mt-4 font-display text-[1.6rem] leading-none tracking-[-0.04em] tabular-nums sm:text-[1.8rem]",
              item.critical && "text-signal"
            )}
          >
            {item.value}
          </dd>
          <p className="mt-2 truncate font-mono text-[9px] tracking-[0.06em] text-muted-ink uppercase">
            {item.context}
          </p>
        </div>
      ))}
    </dl>
  )
}

export function SectionHeading({
  title,
  detail,
  action,
}: {
  title: string
  detail?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.03em]">{title}</h1>
        {detail ? (
          <p className="mt-1 text-[12px] text-muted-ink">{detail}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function ViewAllLink({ href, label = "View all" }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1 font-mono text-[9px] tracking-[0.1em] text-muted-ink uppercase transition-colors hover:text-ink"
    >
      {label}
      <ArrowUpRight className="size-3" strokeWidth={1.5} />
    </a>
  )
}

export function EmptyState({
  title,
  detail,
  action,
}: {
  title: string
  detail: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex min-h-[160px] flex-col items-start justify-center gap-2 p-5">
      <p className="text-[13px] font-medium">{title}</p>
      <p className="max-w-[46ch] text-[12px] leading-relaxed text-muted-ink">
        {detail}
      </p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
