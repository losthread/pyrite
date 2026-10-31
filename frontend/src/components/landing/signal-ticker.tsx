import { RadioTower } from "lucide-react"

import { liveTicker } from "@/config/labyrinthConfig"

export function SignalTicker() {
  const items = [...liveTicker, ...liveTicker]

  return (
    <div
      id="status"
      className="relative flex h-10 items-center overflow-hidden border-b border-ink bg-signal text-signal-ink"
    >
      <div className="z-10 flex h-full shrink-0 items-center gap-2 border-r border-ink bg-signal px-3 sm:px-5">
        <RadioTower className="size-3.5" strokeWidth={1.5} />
        <span className="micro-sm font-semibold whitespace-nowrap">
          Live signal
        </span>
      </div>
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <div className="animate-ticker flex w-max items-center">
          {items.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="flex shrink-0 items-center gap-3 px-4"
            >
              <span className="size-1.5 bg-signal-ink" />
              <span className="micro-sm font-medium whitespace-nowrap">
                {item}
              </span>
              <span className="micro-sm ml-2 opacity-40">{"///"}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="micro-sm z-10 hidden h-full shrink-0 items-center border-l border-ink bg-signal px-4 sm:flex">
        Dwell / 18m 42s
      </div>
    </div>
  )
}
