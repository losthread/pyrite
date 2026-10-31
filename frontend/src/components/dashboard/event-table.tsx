import type { SecurityEvent } from "@/lib/dashboard/types"
import { formatTime } from "@/lib/dashboard/format"
import { SeverityDot } from "@/components/dashboard/primitives"
import { cn } from "@/lib/utils"

export function EventTable({
  events,
  selectedId,
  onSelect,
  limit,
  showSource = true,
}: {
  events: SecurityEvent[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  limit?: number
  showSource?: boolean
}) {
  const rows = typeof limit === "number" ? events.slice(0, limit) : events

  if (!rows.length) {
    return (
      <div className="flex min-h-[148px] flex-col items-start justify-center gap-1 p-4">
        <p className="text-[12px]">No events match the current filter.</p>
        <p className="text-[11px] text-muted-ink">
          Waiting for the next validated event in this window.
        </p>
      </div>
    )
  }

  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full min-w-[700px] border-collapse text-left">
        <thead>
          <tr className="border-b border-ink/15">
            <th className="w-[74px] px-2.5 py-2 font-mono text-[9px] font-normal tracking-[0.1em] text-muted-ink uppercase">
              Time
            </th>
            <th className="w-[36px] px-2 py-2 font-mono text-[9px] font-normal tracking-[0.1em] text-muted-ink uppercase">
              Sev
            </th>
            {showSource ? (
              <th className="w-[130px] px-2.5 py-2 font-mono text-[9px] font-normal tracking-[0.1em] text-muted-ink uppercase">
                Source
              </th>
            ) : null}
            <th className="w-[130px] px-2.5 py-2 font-mono text-[9px] font-normal tracking-[0.1em] text-muted-ink uppercase">
              Destination
            </th>
            <th className="w-[74px] px-2.5 py-2 font-mono text-[9px] font-normal tracking-[0.1em] text-muted-ink uppercase">
              Rule
            </th>
            <th className="px-2.5 py-2 font-mono text-[9px] font-normal tracking-[0.1em] text-muted-ink uppercase">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((event) => {
            const interactive = Boolean(onSelect)
            return (
              <tr
                key={event.id}
                tabIndex={interactive ? 0 : undefined}
                onClick={() => onSelect?.(event.id)}
                onKeyDown={(keyboardEvent) => {
                  if (
                    interactive &&
                    (keyboardEvent.key === "Enter" ||
                      keyboardEvent.key === " ")
                  ) {
                    keyboardEvent.preventDefault()
                    onSelect?.(event.id)
                  }
                }}
                aria-selected={selectedId === event.id}
                className={cn(
                  "border-b border-ink/10 last:border-b-0",
                  interactive &&
                    "cursor-pointer transition-colors hover:bg-surface/70 focus-visible:bg-surface/70",
                  selectedId === event.id && "bg-surface"
                )}
              >
                <td className="px-2.5 py-2 font-mono text-[9px] text-muted-ink tabular-nums">
                  {formatTime(event.timestamp)}
                </td>
                <td className="px-2 py-2">
                  <SeverityDot severity={event.severity} />
                  <span className="sr-only">{event.severity}</span>
                </td>
                {showSource ? (
                  <td className="px-2.5 py-2 font-mono text-[9.5px]">
                    {event.sourceIp}
                  </td>
                ) : null}
                <td className="px-2.5 py-2 font-mono text-[9.5px]">
                  {event.destination}
                </td>
                <td className="px-2.5 py-2 font-mono text-[9px] tabular-nums">
                  {event.ruleId}
                  <span className="ml-1 text-muted-ink">
                    /{event.ruleLevel}
                  </span>
                </td>
                <td className="max-w-[420px] truncate px-2.5 py-2 text-[11px]">
                  {event.description}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
