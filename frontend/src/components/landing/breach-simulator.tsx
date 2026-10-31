"use client"

import { useEffect, useState } from "react"
import { ArrowRight, Play, RotateCcw, Terminal } from "lucide-react"

import { labyrinthStages } from "@/config/labyrinthConfig"
import { cn } from "@/lib/utils"

const greedByStage = [24, 46, 71, 88]
const dwellByStage = ["00:42", "04:18", "11:07", "18:42"]

export function BreachSimulator() {
  const [activeStage, setActiveStage] = useState(1)
  const [run, setRun] = useState(0)
  const [running, setRunning] = useState(true)

  useEffect(() => {
    if (!running) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const timer = window.setInterval(() => {
      setActiveStage((current) =>
        current >= labyrinthStages.length - 1 ? 0 : current + 1
      )
    }, 2800)

    return () => window.clearInterval(timer)
  }, [running, run])

  const stage = labyrinthStages[activeStage]
  const progress = ((activeStage + 1) / labyrinthStages.length) * 100
  const crumbs = activeStage + 1
  const greed = greedByStage[activeStage]

  const triggerDemo = () => {
    setActiveStage(0)
    setRun((value) => value + 1)
    setRunning(true)
  }

  return (
    <div id="demo" className="relative flex h-full min-h-[600px] flex-col bg-paper">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-ink px-4">
        <div className="flex items-center gap-2">
          <span className="size-2 animate-blink bg-signal" />
          <span className="micro font-semibold">Live labyrinth / SIM-01</span>
        </div>
        <span className="micro-sm text-muted-ink">JA4H: 9C41::A3F2</span>
      </div>

      <div className="flex flex-col gap-2 border-b border-ink bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="micro-sm text-muted-ink">Attacker progress</p>
          <p className="mt-1 truncate font-mono text-sm font-medium">
            Stage {stage.index} / {labyrinthStages.length} &mdash; {stage.label}
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 sm:block sm:shrink-0 sm:text-right">
          <p className="micro-sm text-muted-ink">Session</p>
          <p className="mt-0.5 font-mono text-sm sm:mt-1">S-17 / ACTIVE</p>
        </div>
      </div>

      <div
        className="h-1.5 w-full bg-surface"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label="Attacker progress through the labyrinth"
      >
        <div
          className="h-full bg-signal transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid shrink-0 grid-cols-4 border-b border-ink">
        {labyrinthStages.map((item, index) => {
          const passed = index < activeStage
          const active = index === activeStage

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveStage(index)
                setRunning(false)
              }}
              className={cn(
                "group relative min-h-[76px] border-r border-ink p-2 text-left transition-colors last:border-r-0 sm:p-3",
                active ? "bg-signal text-signal-ink" : "hover:bg-surface"
              )}
              aria-pressed={active}
              aria-label={`Inspect ${item.label} simulation stage`}
            >
              <span className="micro-sm block opacity-60">
                0{item.index}
              </span>
              <span className="mt-2 block font-mono text-[10px] leading-tight font-medium uppercase sm:text-[11px]">
                {item.shortLabel}
              </span>
              <span
                className={cn(
                  "absolute top-2 right-2 size-1.5",
                  active
                    ? "bg-ink"
                    : passed
                      ? "bg-ink/50"
                      : "border border-ink/30"
                )}
              />
            </button>
          )
        })}
      </div>

      <div className="flex flex-1 flex-col gap-0 p-4 sm:p-5">
        <div className="grid grid-cols-2 border border-ink">
          <Metric
            label="Crumbs harvested"
            value={`${crumbs} / ${labyrinthStages.length}`}
            meta="HMAC CHAIN"
          />
          <Metric
            label="Greed score"
            value={`${greed}`}
            meta="OF 100"
            accent
          />
          <Metric label="Dwell inverted" value={dwellByStage[activeStage]} meta="WASTED" />
          <Metric label="Session state" value="ISOLATED" meta="SHADOW WORLD" />
        </div>

        <div className="mt-4 border border-ink bg-surface/70">
          <div className="flex items-center justify-between border-b border-ink px-3 py-2">
            <span className="micro-sm flex items-center gap-2 font-medium">
              <Terminal className="size-3" strokeWidth={1.5} />
              Stage telemetry
            </span>
            <span className="micro-sm text-muted-ink">
              {stage.method} {stage.endpoint}
            </span>
          </div>
          <div
            className="scanlines relative min-h-[116px] overflow-hidden p-3 font-mono text-[11px] leading-[1.75]"
            aria-live="polite"
          >
            {stage.log.map((line, index) => (
              <p key={`${stage.id}-${line}`} className="flex gap-2">
                <span className="shrink-0 text-signal">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 break-all">{line}</span>
              </p>
            ))}
            <p className="mt-1 flex items-center gap-2 text-muted-ink">
              <span className="text-signal">$</span>
              <span className="inline-block h-3 w-1.5 animate-blink bg-signal" />
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 border border-ink bg-paper p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="micro-sm text-muted-ink">Current crumb</span>
            <span className="bg-ink px-2 py-1 font-mono text-[10px] font-medium tracking-[0.02em] normal-case text-paper">
              {stage.crumb.token}
            </span>
          </div>
          <div className="flex items-center gap-2 border-t border-ink/20 pt-2">
            <ArrowRight className="size-3 shrink-0 text-signal" strokeWidth={2} />
            <p className="font-mono text-[10px] leading-snug text-muted-ink">
              {stage.telemetry}
            </p>
          </div>
        </div>

        <div className="mt-auto flex items-center gap-2 pt-4">
          <button
            type="button"
            onClick={triggerDemo}
            className="group flex h-11 flex-1 items-center justify-between border border-ink bg-ink px-3 text-paper transition-colors hover:bg-signal hover:text-signal-ink"
          >
            <span className="micro font-semibold">Trigger demo breach</span>
            <Play className="size-3.5 fill-current" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveStage(1)
              setRunning(true)
            }}
            className="grid size-11 shrink-0 place-items-center border border-ink transition-colors hover:bg-surface"
            aria-label="Restart automatic simulation"
            title="Restart automatic simulation"
          >
            <RotateCcw className="size-3.5" strokeWidth={1.5} />
          </button>
        </div>
        <p className="micro-sm mt-2 text-muted-ink">
          {running ? "Auto-cycle armed @ 2.8s / click any node to inspect" : "Manual inspection mode / demo armed"}
        </p>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  meta,
  accent = false,
}: {
  label: string
  value: string
  meta: string
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        "min-h-[82px] border-b border-ink p-3 odd:border-r",
        accent && "bg-signal"
      )}
    >
      <p className="micro-sm text-muted-ink">{label}</p>
      <p className="mt-2 font-display text-[1.55rem] leading-none tracking-[-0.04em]">
        {value}
      </p>
      <p className="micro-sm mt-2 text-muted-ink">{meta}</p>
    </div>
  )
}
