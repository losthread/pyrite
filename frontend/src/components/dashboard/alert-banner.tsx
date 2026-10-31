import { TriangleAlert } from "lucide-react"

import type { DashboardAlert } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

export function AlertBanner({
  alerts,
  simulated,
}: {
  alerts: DashboardAlert[]
  simulated: boolean
}) {
  const alert = alerts[0]
  if (!alert) return null

  return (
    <div
      className={cn(
        "flex flex-col gap-2 border px-3 py-2 sm:flex-row sm:items-center sm:justify-between",
        alert.severity === "critical"
          ? "border-signal/40 bg-signal/10"
          : "border-ink/15 bg-surface/40"
      )}
      role="status"
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <TriangleAlert
          className={cn(
            "mt-0.5 size-3.5 shrink-0",
            alert.severity === "critical" ? "text-signal" : "text-muted-ink"
          )}
          strokeWidth={1.5}
        />
        <div className="min-w-0">
          <p className="text-[11.5px] font-medium">
            {alert.title}
            {simulated ? (
              <span className="ml-2 font-mono text-[9px] tracking-[0.08em] text-signal uppercase">
                Simulated
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted-ink sm:truncate">
            {alert.detail}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 pl-6 font-mono text-[9px] tracking-[0.08em] text-muted-ink uppercase sm:pl-0">
        {alert.sourceIp ? <span>{alert.sourceIp}</span> : null}
        {alert.ruleId ? <span>Rule {alert.ruleId}</span> : null}
      </div>
    </div>
  )
}
