import type { NamedValue, TimePoint } from "@/lib/dashboard/types"
import { formatNumber } from "@/lib/dashboard/format"

const ACCENT = "#FF493D"
const INK = "#ECE8DF"

export function VolumeChart({
  data,
  height = 190,
}: {
  data: TimePoint[]
  height?: number
}) {
  if (!data.length) return <ChartEmpty height={height} />

  const width = 640
  const pad = { top: 12, right: 8, bottom: 22, left: 34 }
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom
  const max = niceMax(Math.max(1, ...data.map((point) => point.value)))
  const step = data.length > 1 ? plotW / (data.length - 1) : plotW
  const points = data.map((point, index) => ({
    x: pad.left + index * step,
    y: pad.top + plotH - (point.value / max) * plotH,
    point,
  }))
  const line = points
    .map((item, index) => `${index === 0 ? "M" : "L"}${item.x} ${item.y}`)
    .join(" ")
  const area = `${line} L ${pad.left + plotW} ${pad.top + plotH} L ${pad.left} ${
    pad.top + plotH
  } Z`
  const ticks = [0, 0.25, 0.5, 0.75, 1]
  const xStep = Math.max(1, Math.ceil(data.length / 6))

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label="Attack volume over time"
      >
        {ticks.map((tick) => {
          const y = pad.top + plotH - tick * plotH
          return (
            <g key={tick}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
                stroke="rgba(236,232,223,0.1)"
                strokeWidth={1}
              />
              <text
                x={pad.left - 6}
                y={y + 3}
                textAnchor="end"
                fill="rgba(236,232,223,0.42)"
                fontSize={8}
                fontFamily="var(--font-mono)"
              >
                {Math.round(max * tick)}
              </text>
            </g>
          )
        })}
        <path d={area} fill="rgba(255,73,61,0.09)" />
        <path
          d={line}
          fill="none"
          stroke={ACCENT}
          strokeWidth={1.6}
          vectorEffect="non-scaling-stroke"
        />
        {points.map((item, index) =>
          index % xStep === 0 ? (
            <g key={item.point.label}>
              <circle
                cx={item.x}
                cy={item.y}
                r={3}
                fill="#0A0A09"
                stroke={ACCENT}
                strokeWidth={1.2}
              >
                <title>{`${item.point.label} · ${formatNumber(item.point.value)} attacks`}</title>
              </circle>
              <text
                x={item.x}
                y={height - 4}
                textAnchor="middle"
                fill="rgba(236,232,223,0.38)"
                fontSize={8}
                fontFamily="var(--font-mono)"
              >
                {item.point.label}
              </text>
            </g>
          ) : null
        )}
      </svg>
    </div>
  )
}

export function SeverityRing({ data }: { data: NamedValue[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const size = 152
  const cx = size / 2
  const cy = size / 2
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const colors = [ACCENT, "rgba(255,73,61,0.42)", "rgba(236,232,223,0.24)"]
  const segments = data.map((item, index) => {
    const length = total ? (item.value / total) * circumference : 0
    const offset = data
      .slice(0, index)
      .reduce(
        (sum, entry) =>
          sum + (total ? (entry.value / total) * circumference : 0),
        0
      )
    return { item, index, length, offset }
  })

  return (
    <div className="flex items-center gap-4 p-3">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="size-[122px] shrink-0"
        role="img"
        aria-label="Severity distribution"
      >
        {segments.map(({ item, index, length, offset }) => (
          <circle
            key={item.label}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={colors[index % colors.length]}
            strokeWidth={8}
            strokeDasharray={`${Math.max(0, length - 2)} ${circumference}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        ))}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fill={INK}
          fontSize={23}
          fontFamily="var(--font-display)"
          letterSpacing="-0.04em"
        >
          {formatNumber(total)}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fill="rgba(236,232,223,0.42)"
          fontSize={7.5}
          fontFamily="var(--font-mono)"
          letterSpacing="0.08em"
        >
          ALERTS
        </text>
      </svg>
      <ul className="min-w-0 flex-1 space-y-2">
        {data.map((item, index) => (
          <li
            key={item.label}
            className="flex items-center justify-between gap-3 border-b border-ink/10 pb-1.5 last:border-b-0 last:pb-0"
          >
            <span className="flex items-center gap-2 text-[10.5px] text-muted-ink">
              <span
                className="size-1.5"
                style={{ background: colors[index % colors.length] }}
              />
              {item.label}
            </span>
            <span className="font-mono text-[10px] tabular-nums">
              {item.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function BarList({
  data,
  unit = "",
  highlightFirst = false,
}: {
  data: NamedValue[]
  unit?: string
  highlightFirst?: boolean
}) {
  if (!data.length) return <ChartEmpty height={120} />

  const max = Math.max(1, ...data.map((item) => item.value))

  return (
    <ul className="space-y-3 p-3">
      {data.map((item, index) => (
        <li key={item.label}>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <span className="truncate text-[10.5px]">{item.label}</span>
            <span className="shrink-0 font-mono text-[9px] text-muted-ink tabular-nums">
              {formatNumber(item.value)}
              {unit}
            </span>
          </div>
          <div className="h-1 w-full bg-ink/10">
            <div
              className="h-full"
              style={{
                width: `${Math.max(3, (item.value / max) * 100)}%`,
                background:
                  highlightFirst && index === 0 ? ACCENT : "rgba(236,232,223,0.5)",
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function SessionBars({ data }: { data: TimePoint[] }) {
  if (!data.length) return <ChartEmpty height={170} />

  const width = 500
  const height = 170
  const pad = { top: 10, right: 4, bottom: 20, left: 24 }
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom
  const max = niceMax(Math.max(1, ...data.map((point) => point.value)))
  const gap = 8
  const barWidth = Math.max(5, (plotW - gap * (data.length - 1)) / data.length)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label="Captured sessions over time"
    >
      {[0, 0.5, 1].map((tick) => {
        const y = pad.top + plotH - tick * plotH
        return (
          <g key={tick}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y}
              y2={y}
              stroke="rgba(236,232,223,0.1)"
            />
            <text
              x={pad.left - 5}
              y={y + 3}
              textAnchor="end"
              fill="rgba(236,232,223,0.38)"
              fontSize={8}
              fontFamily="var(--font-mono)"
            >
              {Math.round(max * tick)}
            </text>
          </g>
        )
      })}
      {data.map((point, index) => {
        const barHeight = (point.value / max) * plotH
        const x = pad.left + index * (barWidth + gap)
        return (
          <g key={point.label}>
            <rect
              x={x}
              y={pad.top + plotH - barHeight}
              width={barWidth}
              height={barHeight}
              fill={point.value > 0 ? "rgba(236,232,223,0.55)" : "rgba(236,232,223,0.08)"}
            >
              <title>{`${point.label} · ${point.value} captured sessions`}</title>
            </rect>
            <text
              x={x + barWidth / 2}
              y={height - 5}
              textAnchor="middle"
              fill="rgba(236,232,223,0.38)"
              fontSize={7.5}
              fontFamily="var(--font-mono)"
            >
              {point.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function ChartEmpty({ height }: { height: number }) {
  return (
    <div
      className="flex items-center justify-center border border-dashed border-ink/15 p-4"
      style={{ minHeight: height }}
    >
      <p className="font-mono text-[9px] tracking-[0.1em] text-muted-ink uppercase">
        No telemetry in this window
      </p>
    </div>
  )
}

function niceMax(value: number) {
  const power = 10 ** Math.floor(Math.log10(value))
  const normalized = value / power
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * power
}
