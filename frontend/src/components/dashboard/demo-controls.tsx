"use client"

import Link from "next/link"
import {
  CircleDot,
  Expand,
  Pause,
  Play,
  RotateCcw,
  Zap,
} from "lucide-react"

import { useDashboardTelemetry } from "@/hooks/usePyriteTelemetry"
import { cn } from "@/lib/utils"

export function DemoControls({ compact = false }: { compact?: boolean }) {
  const {
    mode,
    paused,
    connection,
    togglePause,
    triggerAttack,
    triggerCapture,
    resetDemo,
    refresh,
  } = useDashboardTelemetry()

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={togglePause}
        className="flex h-8 items-center gap-1.5 border border-ink/20 px-2.5 font-mono text-[9px] tracking-[0.08em] text-muted-ink uppercase transition-colors hover:border-ink/45 hover:text-ink"
        aria-label={paused ? "Resume monitoring" : "Pause monitoring"}
      >
        {paused ? (
          <Play className="size-3 fill-current" strokeWidth={1.5} />
        ) : (
          <Pause className="size-3 fill-current" strokeWidth={1.5} />
        )}
        {paused ? "Resume" : "Pause"}
      </button>

      {mode === "demo" ? (
        <>
          <button
            type="button"
            onClick={triggerAttack}
            className="flex h-8 items-center gap-1.5 border border-signal bg-signal px-2.5 font-mono text-[9px] font-medium tracking-[0.08em] text-signal-ink uppercase transition-colors hover:bg-signal/90"
          >
            <Zap className="size-3" strokeWidth={1.8} />
            {compact ? "Attack" : "Trigger attack"}
          </button>
          <button
            type="button"
            onClick={triggerCapture}
            className="flex h-8 items-center gap-1.5 border border-ink/20 px-2.5 font-mono text-[9px] tracking-[0.08em] text-muted-ink uppercase transition-colors hover:border-ink/45 hover:text-ink"
          >
            <CircleDot className="size-3" strokeWidth={1.5} />
            {compact ? "Capture" : "Capture session"}
          </button>
          <button
            type="button"
            onClick={resetDemo}
            className="grid size-8 place-items-center border border-ink/20 text-muted-ink transition-colors hover:border-ink/45 hover:text-ink"
            aria-label="Reset demo data"
            title="Reset demo data"
          >
            <RotateCcw className="size-3" strokeWidth={1.5} />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={refresh}
          className={cn(
            "flex h-8 items-center gap-1.5 border border-ink/20 px-2.5 font-mono text-[9px] tracking-[0.08em] uppercase transition-colors hover:border-ink/45",
            connection === "connected"
              ? "text-muted-ink hover:text-ink"
              : "text-signal"
          )}
        >
          <CircleDot className="size-3" strokeWidth={1.5} />
          {connection === "connected" ? "Refresh live" : "Reconnect"}
        </button>
      )}

      <Link
        href="/dashboard/network"
        className="grid size-8 place-items-center border border-ink/20 text-muted-ink transition-colors hover:border-ink/45 hover:text-ink"
        aria-label="Open network graph"
        title="Open network graph"
      >
        <Expand className="size-3" strokeWidth={1.5} />
      </Link>
    </div>
  )
}
