import Link from "next/link"
import { ArrowRight, ArrowUpRight } from "lucide-react"

import HalftoneWordmarkFooter from "@/components/ui/halftone-wordmark-footer"
import { PyriteCrystalCanvas } from "@/components/landing/pyrite-crystal-canvas"
import { palette } from "@/config/labyrinthConfig"

export function WordmarkMasthead() {
  return (
    <section
      aria-label="Pyrite"
      className="relative border-b border-ink bg-paper"
    >
      <div className="grid lg:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.75fr)]">
        <div className="relative flex flex-col border-b border-ink lg:border-r lg:border-b-0">
          <div className="flex items-center justify-between border-b border-ink px-3 py-2 sm:px-5">
            <span className="micro-sm flex items-center gap-2 font-medium">
              <span className="size-1.5 bg-signal" />
              PYRITE // FOOL'S GOLD DECEPTION GRID (FeS₂)
            </span>
            <span className="micro-sm text-muted-ink">Morph-v2.0</span>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden min-h-[300px]">
            {/* 3D Interactive Pyrite Crystal Labyrinth Canvas */}
            <div className="absolute inset-0 z-0 opacity-45 hover:opacity-100 transition-opacity">
              <PyriteCrystalCanvas className="w-full h-full" />
            </div>

            {/* Giant Dot-Matrix Wordmark */}
            <div className="relative z-10 w-full pointer-events-none">
              <HalftoneWordmarkFooter
                as="div"
                chrome={false}
                wordmark="pyrite"
                preset="paper"
                palette={{
                  background: "transparent",
                  ink: palette.ink,
                  warm: palette.accent,
                }}
                fit="contain"
                dotGap={6.5}
                radius={150}
                grain={0.5}
                fontWeight={400}
                fontFamily='"Archivo Black", "Arial Black", Impact, sans-serif'
                monoFamily='"IBM Plex Mono", "SFMono-Regular", ui-monospace, monospace'
                height="clamp(200px, 24vw, 360px)"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-ink px-3 py-2 sm:px-5">
            <span className="micro-sm text-muted-ink">
              Autonomous adversary labyrinth
            </span>
            <span className="micro-sm text-muted-ink">FeS₂ // Rev 2.6</span>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-10 p-5 sm:p-7 lg:p-8 xl:p-10">
          <div>
            <div className="mb-7 flex items-center gap-3">
              <span className="h-px w-8 bg-signal" />
              <span className="micro font-medium">PYRITE // FOOL'S GOLD ENGINE 001</span>
            </div>

            <h1 className="display-tight max-w-[12ch] text-[clamp(2.4rem,3.8vw,4.6rem)]">
              Glitters like gold.
              <span className="mt-1 block text-signal">
                Traps like iron.
              </span>
            </h1>

            <p className="mt-6 max-w-[38ch] text-sm leading-relaxed text-muted-ink sm:text-[0.95rem]">
              An ephemeral, self-mutating 4-stage deception labyrinth that
              weaponizes attacker greed and tracks syndicate collusion through
              stateless Pyrite Nuggets (HMAC crumbs).
            </p>
          </div>

          <div>
            <div className="flex flex-col gap-2.5">
              <Link
                href="/dashboard"
                className="group flex h-11 items-center justify-between border border-ink bg-ink px-4 text-paper transition-colors hover:bg-signal hover:text-signal-ink"
              >
                <span className="micro font-semibold">Launch SOC Dashboard</span>
                <ArrowUpRight
                  className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  strokeWidth={1.5}
                />
              </Link>
              <Link
                href="/mechanism"
                className="group flex h-11 items-center justify-between border border-ink px-4 transition-colors hover:bg-surface"
              >
                <span className="micro font-semibold">Explore mechanism</span>
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={1.5}
                />
              </Link>
            </div>

            <dl className="mt-7 grid grid-cols-3 border-t border-ink pt-4">
              {[
                ["04", "Stages"],
                ["03", "Nuggets"],
                ["01", "Exit"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="border-r border-ink/20 px-2 first:pl-0 last:border-r-0"
                >
                  <dt className="micro-sm text-muted-ink">{label}</dt>
                  <dd className="mt-1 font-display text-2xl leading-none">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}
