import { X } from "lucide-react"

import type { SecurityEvent } from "@/lib/dashboard/types"
import { formatDate, formatTime } from "@/lib/dashboard/format"
import { SeverityLabel } from "@/components/dashboard/primitives"

export function EventDetailPanel({
  event,
  onClose,
}: {
  event: SecurityEvent
  onClose?: () => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-ink/15 p-3">
        <div>
          <p className="font-mono text-[9px] tracking-[0.1em] text-muted-ink uppercase">
            Event / {event.id}
          </p>
          <h2 className="mt-1 text-[13px] font-medium">{event.description}</h2>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="grid size-6 shrink-0 place-items-center border border-ink/15 text-muted-ink hover:text-ink"
            aria-label="Close event detail"
          >
            <X className="size-3" strokeWidth={1.5} />
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        <div className="flex items-center justify-between">
          <SeverityLabel severity={event.severity} />
          <span className="font-mono text-[9px] text-muted-ink">
            Rule {event.ruleId} / Level {event.ruleLevel}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-3">
          <Field label="Timestamp" value={`${formatDate(event.timestamp)} ${formatTime(event.timestamp)} UTC`} />
          <Field label="Protocol" value={event.protocol} mono />
          <Field label="Source" value={event.sourceIp} mono />
          <Field label="Destination" value={event.destination} mono />
          <Field label="Honeypot" value={event.honeypot} mono />
          <Field label="Event type" value={event.eventType} mono />
          <Field label="MITRE ATT&CK" value={`${event.mitreId} / ${event.mitreTechnique}`} />
          <Field label="Tactic" value={event.mitreTactic} />
          {event.username ? (
            <Field label="Username" value={event.username} mono />
          ) : null}
          {event.sessionId ? (
            <Field label="Session" value={event.sessionId} mono />
          ) : null}
        </dl>

        {event.raw ? (
          <div>
            <p className="font-mono text-[9px] tracking-[0.1em] text-muted-ink uppercase">
              Wazuh payload
            </p>
            <pre className="mt-2 max-h-[220px] overflow-auto border border-ink/15 bg-paper p-2 font-mono text-[9px] leading-relaxed text-muted-ink">
              {JSON.stringify(event.raw, null, 2)}
            </pre>
          </div>
        ) : null}
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
      <dd className={mono ? "mt-1 truncate font-mono text-[10px]" : "mt-1 text-[11px]"}>
        {value}
      </dd>
    </div>
  )
}
