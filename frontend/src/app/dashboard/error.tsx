"use client"

import { RotateCcw } from "lucide-react"

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto flex min-h-[60svh] max-w-[620px] flex-col justify-center gap-4">
      <p className="font-mono text-[9px] tracking-[0.14em] text-signal uppercase">
        Dashboard / connection error
      </p>
      <h1 className="text-[26px] font-semibold tracking-[-0.03em]">
        The telemetry surface failed to load.
      </h1>
      <p className="text-[12px] leading-relaxed text-muted-ink">
        The dashboard shell is intact, but this view could not be rendered.
        Retry the surface. If the problem persists, switch to demo mode or check
        the backend connection.
      </p>
      <button
        type="button"
        onClick={reset}
        className="flex h-9 w-fit items-center gap-2 border border-ink/20 px-3 font-mono text-[9px] tracking-[0.1em] uppercase transition-colors hover:border-ink/45"
      >
        <RotateCcw className="size-3" strokeWidth={1.5} />
        Retry surface
      </button>
    </div>
  )
}
