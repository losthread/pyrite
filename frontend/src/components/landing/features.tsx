import { Plus } from "lucide-react"

import { landingFeatures } from "@/config/labyrinthConfig"
import { FeatureVisual } from "@/components/landing/feature-visuals"

export function Features() {
  return (
    <section id="mechanism" className="relative border-b border-ink">
      <div className="grid lg:grid-cols-12">
        <div className="flex min-h-9 items-center justify-between border-b border-ink px-4 sm:px-6 lg:col-span-12">
          <span className="micro-sm flex items-center gap-2">
            <span className="size-1.5 bg-signal" />
            [ 01 / Mechanism ]
          </span>
          <span className="micro-sm text-muted-ink">
            Four systems, one false floor
          </span>
        </div>

        <div className="border-b border-ink px-4 py-10 sm:px-6 sm:py-14 lg:col-span-8 lg:border-r lg:border-b-0 lg:px-8 lg:py-16">
          <p className="micro mb-5 text-signal">Designed to be underestimated</p>
          <h2 className="display-tight max-w-[12ch] text-[clamp(2.8rem,5.6vw,6.2rem)]">
            A trap that rewards bad judgment.
          </h2>
        </div>

        <div className="flex flex-col justify-between gap-8 p-4 sm:p-6 lg:col-span-4 lg:p-8">
          <p className="max-w-[36ch] text-sm leading-relaxed text-muted-ink">
            VYUHA does not block the attacker at the door. It gives them a
            believable next step, then prices every step in time, exposure, and
            attribution.
          </p>
          <div className="border-t border-ink pt-4">
            <div className="flex items-end justify-between gap-3">
              <span className="micro-sm text-muted-ink">Mean attacker dwell</span>
              <span className="font-display text-3xl leading-none">+412%</span>
            </div>
            <div className="mt-2 h-1 w-full bg-surface">
              <div className="h-full w-[82%] bg-signal" />
            </div>
            <p className="micro-sm mt-2 text-muted-ink">
              vs. conventional static honeypot
            </p>
          </div>
        </div>
      </div>

      <div className="grid border-t border-ink lg:grid-cols-2">
        {landingFeatures.map((feature) => (
          <article
            key={feature.index}
            className="group relative border-b border-ink p-4 sm:p-6 lg:odd:border-r lg:[&:nth-last-child(-n+2)]:border-b-0 lg:p-8"
          >
            <div className="mb-8 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid size-7 place-items-center border border-ink font-mono text-[10px] font-medium transition-colors group-hover:bg-signal group-hover:text-signal-ink">
                  {feature.index}
                </span>
                <p className="micro font-medium">{feature.eyebrow}</p>
              </div>
              <Plus
                className="size-4 shrink-0 text-muted-ink transition-transform duration-300 group-hover:rotate-90 group-hover:text-ink"
                strokeWidth={1.5}
              />
            </div>

            <div className="grid gap-8 xl:grid-cols-[1fr_0.82fr] xl:items-start">
              <div>
                <h3 className="max-w-[18ch] font-display text-[clamp(1.7rem,2.8vw,2.8rem)] leading-[0.95] tracking-[-0.04em] uppercase">
                  {feature.title}
                </h3>
                <p className="mt-4 max-w-[48ch] text-sm leading-relaxed text-muted-ink">
                  {feature.body}
                </p>
                <div className="mt-7 flex items-end gap-4 border-t border-ink pt-4">
                  <span className="font-display text-[clamp(2rem,3.4vw,3.4rem)] leading-none tracking-[-0.05em]">
                    {feature.stat}
                  </span>
                  <span className="micro-sm mb-1 text-muted-ink">
                    {feature.statLabel}
                  </span>
                </div>
              </div>
              <div className="min-w-0">
                <FeatureVisual type={feature.visual} />
              </div>
            </div>

            <span className="absolute right-0 bottom-0 h-0 w-0 border-r-[16px] border-b-[16px] border-r-transparent border-b-signal opacity-0 transition-opacity group-hover:opacity-100" />
          </article>
        ))}
      </div>
    </section>
  )
}
