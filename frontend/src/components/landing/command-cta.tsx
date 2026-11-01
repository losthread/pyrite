import Link from "next/link"
import { ArrowRight, ArrowUpRight } from "lucide-react"

export function CommandCta() {
  return (
    <section id="soc" className="border-b border-ink">
      <div className="grid lg:grid-cols-12">
        <div className="relative overflow-hidden border-b border-ink bg-signal px-4 py-12 text-signal-ink sm:px-6 sm:py-16 lg:col-span-8 lg:border-r lg:border-b-0 lg:px-8 lg:py-20">
          <div className="hatch pointer-events-none absolute inset-0 opacity-50" />
          <div className="relative">
            <div className="mb-7 flex items-center gap-3">
              <span className="h-px w-10 bg-ink" />
              <p className="micro font-semibold">[ 04 / Operator command ]</p>
            </div>
            <h2 className="display-tight max-w-[13ch] text-[clamp(2.9rem,5.8vw,6.6rem)]">
              Watch the trap from the control room.
            </h2>
            <p className="mt-7 max-w-[48ch] text-sm leading-relaxed sm:text-base">
              Live shadow worlds, mirrored shell traffic, syndicate lineage,
              and a 504 that ends the story on your terms.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="group flex h-12 items-center justify-between gap-10 bg-ink px-5 text-paper transition-colors hover:bg-paper hover:text-ink"
              >
                <span className="micro font-semibold">
                  Open SOC Command Center
                </span>
                <ArrowUpRight
                  className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  strokeWidth={1.5}
                />
              </Link>
              <Link
                href="/mechanism"
                className="group flex h-12 items-center justify-between gap-10 border border-ink px-5 transition-colors hover:bg-paper/50"
              >
                <span className="micro font-semibold">Review mechanism</span>
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={1.5}
                />
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-8 p-4 sm:p-6 lg:col-span-4 lg:p-8">
          <div>
            <p className="micro text-muted-ink">Deployment status</p>
            <dl className="mt-4 divide-y divide-ink/20 border-y border-ink">
              {[
                ["Polymorphic persona", "Morph-v2.0"],
                ["Wazuh engine", "Online / 7 rules"],
                ["WebSocket relay", "ws://:8000/ws/soc"],
                ["Breadcrumb seed", "Rotating / 50ms"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <dt className="micro-sm text-muted-ink">{label}</dt>
                  <dd className="font-mono text-[10px] font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="border border-ink p-3">
            <div className="flex items-center gap-2">
              <span className="size-1.5 animate-blink bg-signal" />
              <span className="micro-sm font-medium">Operator channel open</span>
            </div>
            <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted-ink">
              &gt; standby for stage 04 telemetry
              <br />
              &gt; quarantine action authorized
            </p>
          </div>

          <p className="micro-sm text-muted-ink">
            Mission clock / 00:18:42
            <br />
            Build / PYRITE-SOC-2.6.0 (ACTIVE)
          </p>
        </div>
      </div>
    </section>
  )
}
