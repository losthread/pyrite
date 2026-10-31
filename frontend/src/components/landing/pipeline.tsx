import { ArrowDown, ArrowRight, Radio } from "lucide-react"

import { pipelineNodes } from "@/config/labyrinthConfig"
import { cn } from "@/lib/utils"

export function Pipeline() {
  return (
    <section id="pipeline" className="border-b border-ink">
      <div className="grid border-b border-ink lg:grid-cols-12">
        <div className="flex min-h-9 items-center justify-between border-b border-ink px-4 sm:px-6 lg:col-span-12">
          <span className="micro-sm flex items-center gap-2">
            <span className="size-1.5 bg-signal" />
            [ 03 / System pipeline ]
          </span>
          <span className="micro-sm text-muted-ink">
            Raw signal → operator action
          </span>
        </div>

        <div className="border-b border-ink px-4 py-10 sm:px-6 sm:py-14 lg:col-span-8 lg:border-r lg:border-b-0 lg:px-8 lg:py-16">
          <p className="micro mb-5 text-signal">Closed-loop intelligence</p>
          <h2 className="display-tight max-w-[13ch] text-[clamp(2.8rem,5.6vw,6.2rem)]">
            From first click to closed loop.
          </h2>
        </div>

        <div className="flex flex-col justify-between gap-8 p-4 sm:p-6 lg:col-span-4 lg:p-8">
          <p className="max-w-[34ch] text-sm leading-relaxed text-muted-ink">
            Deception, detection, and response run as one system. Wazuh
            normalizes the labyrinth. FastAPI correlates the human behind it.
            The SOC gets a decision, not another alert.
          </p>
          <div className="flex items-center justify-between border-t border-ink pt-4">
            <span className="micro-sm flex items-center gap-2">
              <Radio className="size-3 text-signal" strokeWidth={1.5} />
              Control plane
            </span>
            <span className="micro-sm bg-ink px-2 py-1 text-paper">
              Live / 24ms
            </span>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div className="dot-field pointer-events-none absolute inset-0 opacity-25" />
        <div className="relative flex flex-col gap-0 p-4 sm:p-6 lg:flex-row lg:items-stretch lg:gap-0 lg:p-8">
          {pipelineNodes.map((node, index) => (
            <div
              key={node.index}
              className="contents lg:flex lg:min-w-0 lg:flex-1 lg:items-stretch"
            >
              <div
                className={cn(
                  "group relative flex min-h-[168px] flex-1 flex-col justify-between border border-ink p-4 transition-colors hover:bg-surface/70 lg:min-w-0",
                  node.accent ? "bg-surface" : "bg-paper"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="micro-sm text-muted-ink">
                    NODE / {node.index}
                  </span>
                  <span
                    className={cn(
                      "size-2 border border-ink",
                      node.accent && "border-signal bg-signal"
                    )}
                  />
                </div>
                <div className="mt-8">
                  <h3 className="max-w-[16ch] font-display text-[clamp(1.2rem,1.45vw,1.55rem)] leading-[0.98] tracking-[-0.03em] uppercase">
                    {node.label}
                  </h3>
                  <p className="mt-3 font-mono text-[10px] leading-relaxed text-muted-ink">
                    {node.detail}
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-ink/20 pt-2">
                  <span className="micro-sm text-muted-ink">{node.meta}</span>
                  <span className="micro-sm text-signal">0{index + 1}</span>
                </div>
              </div>

              {index < pipelineNodes.length - 1 ? (
                <div className="grid h-9 shrink-0 place-items-center border-x border-ink/0 lg:h-auto lg:w-10">
                  <ArrowDown
                    className="size-4 text-signal lg:hidden"
                    strokeWidth={1.5}
                  />
                  <ArrowRight
                    className="hidden size-4 text-signal lg:block"
                    strokeWidth={1.5}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="relative grid grid-cols-2 border-t border-ink sm:grid-cols-4">
          {[
            ["Ingest", "JSON decoder / rule match"],
            ["Enrich", "JA4H / crumb / prod overlap"],
            ["Score", "Depth + canary + intent"],
            ["Respond", "Tarpit / quarantine / morph"],
          ].map(([label, detail], index) => (
            <div
              key={label}
              className="border-r border-b border-ink p-3 last:border-r-0 sm:border-b-0"
            >
              <span className="micro-sm text-muted-ink">
                0{index + 1} / {label}
              </span>
              <p className="micro-sm mt-2 text-ink">{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
