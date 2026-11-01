import Link from "next/link"

import { footerColumns } from "@/config/labyrinthConfig"

export function SiteFooter() {
  return (
    <footer className="border-t border-ink bg-paper">
      <div className="grid lg:grid-cols-[1.3fr_2.7fr]">
        <div className="flex flex-col justify-between gap-8 border-b border-ink p-5 sm:p-6 lg:border-r lg:border-b-0">
          <Link href="/" className="group flex items-center gap-3">
            <span className="grid size-8 place-items-center bg-signal text-[12px] font-bold text-ink">
              Fe
            </span>
            <span>
              <span className="block font-display text-[1.5rem] leading-none tracking-[-0.04em] uppercase text-ink">
                PYRITE
              </span>
              <span className="mt-1 block font-mono text-[8px] tracking-[0.14em] text-muted-ink uppercase">
                FOOL'S GOLD DECEPTION GRID // FeS₂
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="size-1.5 animate-blink bg-signal" />
            <span className="micro-sm text-muted-ink">
              Grid online / SOC-01
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3">
          {footerColumns.map((column) => (
            <nav
              key={column.title}
              aria-label={column.title}
              className="border-b border-r border-ink p-4 last:border-r-0 sm:border-b-0 sm:p-5"
            >
              <h2 className="micro-sm mb-4 font-medium text-muted-ink">
                {column.title}
              </h2>
              <ul className="space-y-2.5">
                {column.links.map((link) => {
                  const href = "href" in link ? link.href : undefined

                  return (
                    <li key={link.label}>
                      {href ? (
                        <Link
                          href={href}
                          className="font-mono text-[10px] tracking-[0.08em] uppercase transition-colors hover:text-signal"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <span className="font-mono text-[10px] tracking-[0.08em] text-muted-ink uppercase">
                          {link.label}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink px-5 py-3">
        <span className="micro-sm text-muted-ink">
          © 2026 · PYRITE Deception Systems · FeS₂ // SOC-01
        </span>
        <div className="flex items-center gap-5">
          <span className="micro-sm hidden text-muted-ink sm:inline">
            Morph-v2.0 / Active
          </span>
          <a
            href="#top"
            className="micro-sm font-medium transition-colors hover:text-signal"
          >
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  )
}
