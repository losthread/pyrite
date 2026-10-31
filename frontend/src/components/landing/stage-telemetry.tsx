import Link from "next/link"
import { ArrowRight, CircleDot, ShieldAlert } from "lucide-react"

import { labyrinthStages } from "@/config/labyrinthConfig"
import { cn } from "@/lib/utils"

export function StageTelemetry() {
  return (
    <section id="telemetry" className="border-b border-ink">
      <div className="grid border-b border-ink lg:grid-cols-12">
        <div className="flex min-h-9 items-center justify-between border-b border-ink px-4 sm:px-6 lg:col-span-12">
          <span className="micro-sm flex items-center gap-2">
            <span className="size-1.5 bg-signal" />
            [ 02 / Labyrinth telemetry ]
          </span>
          <span className="micro-sm text-muted-ink">
            Edge events / normalized
          </span>
        </div>

        <div className="border-b border-ink px-4 py-10 sm:px-6 sm:py-14 lg:col-span-8 lg:border-r lg:border-b-0 lg:px-8 lg:py-16">
          <p className="micro mb-5 text-signal">The route is the intelligence</p>
          <h2 className="display-tight max-w-[13ch] text-[clamp(2.8rem,5.6vw,6.2rem)]">
            Four rooms. No exit sign.
          </h2>
        </div>

        <div className="flex flex-col justify-between gap-8 p-4 sm:p-6 lg:col-span-4 lg:p-8">
          <p className="max-w-[34ch] text-sm leading-relaxed text-muted-ink">
            Every stop mints a token, maps a technique, and writes a Wazuh
            event. The exit is engineered to look like someone else&apos;s
            outage.
          </p>
          <Link
            href="/dashboard"
            className="group flex items-center justify-between border-t border-ink pt-4"
          >
            <span className="micro-sm font-medium">Inspect live graph</span>
            <span className="grid size-7 place-items-center border border-ink transition-colors group-hover:bg-signal">
              <ArrowRight className="size-3 group-hover:text-signal-ink" strokeWidth={1.5} />
            </span>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4">
        {labyrinthStages.map((stage, index) => (
          <article
            key={stage.id}
            className="group relative flex flex-col border-b border-ink p-4 transition-colors hover:bg-surface/50 sm:p-5 md:[&:nth-child(odd)]:border-r xl:border-r xl:border-b-0 xl:last:border-r-0"
          >
            <div className="flex items-center justify-between border-b border-ink pb-2">
              <span className="micro-sm flex items-center gap-2">
                <CircleDot
                  className={cn(
                    "size-3",
                    index === 3 ? "text-signal" : "text-ink"
                  )}
                  strokeWidth={1.5}
                />
                Stage / 0{stage.index}
              </span>
              <span
                className={cn(
                  "font-mono text-[9px] font-medium uppercase",
                  stage.wazuhLevel >= 15
                    ? "bg-signal px-1.5 py-0.5 text-signal-ink"
                    : "text-muted-ink"
                )}
              >
                Lvl {stage.wazuhLevel}
              </span>
            </div>

            <div className="mt-6">
              <span className="font-display text-[clamp(3rem,5vw,4.8rem)] leading-[0.75] tracking-[-0.06em] text-ink/20 transition-colors group-hover:text-signal/30">
                0{stage.index}
              </span>
              <h3 className="mt-5 font-display text-xl leading-none tracking-[-0.03em] uppercase">
                {stage.label}
              </h3>
              <p className="mt-2 truncate font-mono text-[9px] text-muted-ink">
                {stage.endpoint}
              </p>
            </div>

            <dl className="mt-6 space-y-2 border-t border-ink/20 pt-3">
              <div>
                <dt className="micro-sm text-muted-ink">Crumb</dt>
                <dd className="mt-0.5 truncate font-mono text-[10px] font-medium">
                  {stage.crumb.token}
                </dd>
              </div>
              <div className="grid grid-cols-[48px_1fr] gap-2">
                <dt className="micro-sm text-muted-ink">Attack</dt>
                <dd className="truncate font-mono text-[9px]">
                  {stage.attack.id} / {stage.attack.name}
                </dd>
              </div>
              <div className="grid grid-cols-[48px_1fr] gap-2">
                <dt className="micro-sm text-muted-ink">Engage</dt>
                <dd className="truncate font-mono text-[9px]">
                  {stage.engage.id} / {stage.engage.name}
                </dd>
              </div>
            </dl>

            <div className="mt-auto flex items-center justify-between gap-2 border-t border-ink pt-3">
              <span className="micro-sm text-muted-ink">
                Rule {stage.wazuhRule}
              </span>
              <span className="micro-sm text-signal">
                {index === labyrinthStages.length - 1 ? "504 exit" : "Passed"}
              </span>
            </div>

            {index < labyrinthStages.length - 1 ? (
              <span
                aria-hidden="true"
                className="absolute top-1/2 -right-2 z-10 hidden size-4 place-items-center border border-ink bg-paper font-mono text-[8px] xl:grid"
              >
                →
              </span>
            ) : null}
          </article>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-3 border-b border-ink bg-signal p-4 text-signal-ink sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:border-r lg:border-b-0">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
            <div>
              <p className="micro font-semibold">
                Rule 100505 / Syndicate token sharing
              </p>
              <p className="mt-1 font-mono text-[10px] leading-relaxed">
                Honeytoken minted for JA4H 9c41::a3f2 replayed from a different
                machine. Correlation graph updated.
              </p>
            </div>
          </div>
          <span className="micro-sm shrink-0 border border-ink px-2 py-1 font-medium">
            Critical / 15
          </span>
        </div>
        <div className="flex items-center gap-6 px-4 py-4 sm:px-6">
          <div>
            <p className="micro-sm text-muted-ink">Noise filtered</p>
            <p className="mt-1 font-display text-2xl leading-none">2,140</p>
          </div>
          <div className="h-8 w-px bg-ink" />
          <div>
            <p className="micro-sm text-muted-ink">Human sessions</p>
            <p className="mt-1 font-display text-2xl leading-none">04</p>
          </div>
        </div>
      </div>
    </section>
  )
}
