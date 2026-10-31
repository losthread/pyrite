import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, LockKeyhole } from "lucide-react"

import { SubpageShell } from "@/components/landing/subpage-shell"

export const metadata: Metadata = {
  title: "Dashboard — VYUHA",
  description: "The VYUHA SOC command center is currently in build.",
}

const modules = [
  ["Shadow worlds", "Isolated attacker sandboxes"],
  ["Breadcrumb graph", "Four-stage attack topology"],
  ["Shadow shell", "Live command mirror"],
  ["Active response", "Tarpit / quarantine / morph"],
]

export default function DashboardPage() {
  return (
    <SubpageShell>
      <section className="border-b border-ink">
        <div className="grid lg:grid-cols-12">
          <div className="border-b border-ink px-4 py-12 sm:px-6 sm:py-16 lg:col-span-8 lg:border-r lg:border-b-0 lg:px-8 lg:py-20">
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-10 bg-signal" />
              <p className="micro font-medium">[ Dashboard / In build ]</p>
            </div>
            <h1 className="display-tight max-w-[13ch] text-[clamp(3rem,6.5vw,7rem)]">
              Command center coming online.
            </h1>
            <p className="mt-7 max-w-[48ch] text-sm leading-relaxed text-muted-ink sm:text-base">
              The dashboard route is wired and reserved for the live SOC module.
              It will bring shadow worlds, the attack graph, terminal mirror,
              Wazuh feed, and active containment into one operator surface.
            </p>
            <Link
              href="/"
              className="group mt-8 inline-flex h-11 items-center gap-8 border border-ink px-4 transition-colors hover:bg-surface"
            >
              <ArrowLeft
                className="size-4 transition-transform group-hover:-translate-x-0.5"
                strokeWidth={1.5}
              />
              <span className="micro font-semibold">Return to overview</span>
            </Link>
          </div>

          <div className="flex flex-col justify-between gap-10 p-5 sm:p-7 lg:col-span-4 lg:p-8">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="micro-sm text-muted-ink">Module status</p>
                <p className="mt-2 font-mono text-sm font-medium">
                  QUEUED / NOT DEPLOYED
                </p>
              </div>
              <LockKeyhole className="size-5 text-signal" strokeWidth={1.5} />
            </div>
            <div className="border border-ink p-4">
              <p className="micro-sm text-muted-ink">Operational surface</p>
              <p className="mt-2 font-display text-2xl leading-none">
                04 modules
              </p>
              <div className="mt-4 h-1 w-full bg-surface">
                <div className="h-full w-1/4 bg-signal" />
              </div>
            </div>
            <p className="micro-sm text-muted-ink">
              Route reserved / /dashboard
              <br />
              Build / pending
            </p>
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4">
        {modules.map(([title, detail], index) => (
          <article
            key={title}
            className="border-b border-ink p-5 sm:p-6 lg:border-r lg:border-b-0 lg:last:border-r-0"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="micro-sm text-muted-ink">0{index + 1}</span>
              <ArrowUpRight className="size-4 text-signal" strokeWidth={1.5} />
            </div>
            <h2 className="mt-10 font-display text-xl leading-none tracking-[-0.03em] uppercase">
              {title}
            </h2>
            <p className="mt-3 font-mono text-[10px] leading-relaxed text-muted-ink">
              {detail}
            </p>
            <span className="mt-8 block border-t border-ink/20 pt-3 font-mono text-[9px] tracking-[0.1em] text-muted-ink uppercase">
              Awaiting connection
            </span>
          </article>
        ))}
      </section>
    </SubpageShell>
  )
}
