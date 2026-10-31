"use client"

import * as React from "react"
import {
  Expand,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react"

import type {
  NetworkConnection,
  NetworkNode,
  NodeKind,
  Severity,
} from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

const VIEW_W = 1000
const VIEW_H = 600

function subscribeReducedMotion(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)")
  media.addEventListener("change", callback)
  return () => media.removeEventListener("change", callback)
}

function useReducedMotion() {
  return React.useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  )
}

function edgePath(source: NetworkNode, target: NetworkNode, id: string) {
  const dx = target.x - source.x
  const dy = target.y - source.y
  const length = Math.hypot(dx, dy) || 1
  const hash = id.split("").reduce((total, char) => total + char.charCodeAt(0), 0)
  const offset = ((hash % 5) - 2) * 8
  const cx = (source.x + target.x) / 2 - (dy / length) * offset
  const cy = (source.y + target.y) / 2 + (dx / length) * offset
  return `M ${source.x} ${source.y} Q ${cx} ${cy} ${target.x} ${target.y}`
}

function edgeColor(severity: Severity) {
  if (severity === "critical") return "#FF493D"
  if (severity === "suspicious") return "rgba(255,73,61,0.55)"
  return "rgba(236,232,223,0.24)"
}

function nodeColor(node: NetworkNode) {
  if (node.kind === "attacker") return "#FF493D"
  if (node.kind === "compromised") return "#FF493D"
  if (node.kind === "honeypot") return "#ECE8DF"
  if (node.kind === "protected") return "rgba(236,232,223,0.85)"
  return "rgba(236,232,223,0.42)"
}

function NodeGlyph({
  node,
  selected,
  dimmed,
}: {
  node: NetworkNode
  selected: boolean
  dimmed: boolean
}) {
  const color = nodeColor(node)
  const opacity = dimmed ? 0.18 : 1

  return (
    <g opacity={opacity}>
      {selected ? (
        <circle
          cx={node.x}
          cy={node.y}
          r={22}
          fill="none"
          stroke="#FF493D"
          strokeWidth={1}
          strokeDasharray="2 3"
        />
      ) : null}

      {node.kind === "attacker" ? (
        <>
          <circle cx={node.x} cy={node.y} r={11} fill={color} />
          <circle cx={node.x} cy={node.y} r={11} fill="none" stroke="#0A0A09" strokeOpacity={0.25} />
          <path
            d={`M ${node.x - 3} ${node.y - 3} L ${node.x + 3} ${node.y + 3} M ${node.x + 3} ${node.y - 3} L ${node.x - 3} ${node.y + 3}`}
            stroke="#0A0A09"
            strokeWidth={1.5}
          />
        </>
      ) : null}

      {node.kind === "honeypot" ? (
        <>
          <rect
            x={node.x - 9}
            y={node.y - 9}
            width={18}
            height={18}
            fill="#0A0A09"
            stroke={color}
            strokeWidth={1.5}
            transform={`rotate(45 ${node.x} ${node.y})`}
          />
          <rect
            x={node.x - 3}
            y={node.y - 3}
            width={6}
            height={6}
            fill="#FF493D"
          />
        </>
      ) : null}

      {node.kind === "protected" ? (
        <>
          <rect
            x={node.x - 8}
            y={node.y - 8}
            width={16}
            height={16}
            fill="#0A0A09"
            stroke={color}
            strokeWidth={1.5}
          />
          <path
            d={`M ${node.x - 4} ${node.y} L ${node.x - 1} ${node.y + 3} L ${node.x + 4} ${node.y - 3}`}
            stroke={color}
            strokeWidth={1.2}
          />
        </>
      ) : null}

      {node.kind === "infrastructure" ? (
        <>
          <circle
            cx={node.x}
            cy={node.y}
            r={8}
            fill="#0A0A09"
            stroke={color}
            strokeWidth={1.2}
          />
          <circle cx={node.x} cy={node.y} r={2.5} fill={color} />
        </>
      ) : null}

      {node.kind === "compromised" ? (
        <>
          <circle
            cx={node.x}
            cy={node.y}
            r={13}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeDasharray="2 2"
          />
          <circle cx={node.x} cy={node.y} r={8} fill={color} />
          <path
            d={`M ${node.x} ${node.y - 4} L ${node.x} ${node.y + 1}`}
            stroke="#0A0A09"
            strokeWidth={1.8}
          />
          <circle cx={node.x} cy={node.y + 4} r={1} fill="#0A0A09" />
        </>
      ) : null}

      <text
        x={node.x}
        y={node.y + 26}
        textAnchor="middle"
        fill={selected ? "#ECE8DF" : "rgba(236,232,223,0.72)"}
        fontSize={node.kind === "attacker" ? 10 : 9.5}
        fontFamily="var(--font-mono)"
        letterSpacing="0.02em"
      >
        {node.label}
      </text>
      {selected ? (
        <text
          x={node.x}
          y={node.y + 38}
          textAnchor="middle"
          fill="rgba(236,232,223,0.45)"
          fontSize={8}
          fontFamily="var(--font-mono)"
        >
          {node.status}
        </text>
      ) : null}
    </g>
  )
}

export function NetworkGraph({
  nodes,
  connections,
  selectedNodeId,
  selectedEdgeId,
  activeEdgeId,
  paused = false,
  onSelectNode,
  onSelectEdge,
  className,
  compact = false,
}: {
  nodes: NetworkNode[]
  connections: NetworkConnection[]
  selectedNodeId?: string | null
  selectedEdgeId?: string | null
  activeEdgeId?: string | null
  paused?: boolean
  onSelectNode: (id: string | null) => void
  onSelectEdge?: (id: string | null) => void
  className?: string
  compact?: boolean
}) {
  const reduced = useReducedMotion()
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = React.useState(1)
  const [pan, setPan] = React.useState({ x: 0, y: 0 })
  const [dragging, setDragging] = React.useState(false)
  const dragRef = React.useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const [query, setQuery] = React.useState("")
  const [kind, setKind] = React.useState<NodeKind | "all">("all")
  const [severity, setSeverity] = React.useState<Severity | "all">("all")
  const [trailsPaused, setTrailsPaused] = React.useState(false)
  const [fullscreen, setFullscreen] = React.useState(false)

  React.useEffect(() => {
    const handler = () =>
      setFullscreen(document.fullscreenElement === wrapperRef.current)
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  }, [])

  const nodeMap = React.useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes]
  )

  const search = query.trim().toLowerCase()
  const filteredNodes = React.useMemo(
    () =>
      nodes.filter((node) => {
        if (kind !== "all" && node.kind !== kind) return false
        if (severity !== "all" && node.severity !== severity) return false
        return true
      }),
    [nodes, kind, severity]
  )
  const filteredIds = React.useMemo(
    () => new Set(filteredNodes.map((node) => node.id)),
    [filteredNodes]
  )

  const searchMatches = React.useMemo(() => {
    if (!search) return new Set<string>()
    return new Set(
      nodes
        .filter(
          (node) =>
            node.label.toLowerCase().includes(search) ||
            node.ip.toLowerCase().includes(search)
        )
        .map((node) => node.id)
    )
  }, [nodes, search])

  const visibleConnections = connections.filter(
    (connection) =>
      filteredIds.has(connection.source) && filteredIds.has(connection.target)
  )

  const dimmed = (node: NetworkNode) =>
    Boolean(search) && !searchMatches.has(node.id) && node.id !== selectedNodeId

  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const onWheel = (event: React.WheelEvent) => {
    event.preventDefault()
    const next = Math.min(2.4, Math.max(0.65, zoom - event.deltaY * 0.0015))
    setZoom(next)
  }

  const startDrag = (event: React.PointerEvent) => {
    if (event.button !== 0) return
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      panX: pan.x,
      panY: pan.y,
    }
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const moveDrag = (event: React.PointerEvent) => {
    if (!dragging) return
    setPan({
      x: dragRef.current.panX + (event.clientX - dragRef.current.x),
      y: dragRef.current.panY + (event.clientY - dragRef.current.y),
    })
  }

  const endDrag = (event: React.PointerEvent) => {
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const toggleFullscreen = async () => {
    if (!wrapperRef.current) return
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else {
      await wrapperRef.current.requestFullscreen?.()
    }
  }

  const showTrails = !paused && !trailsPaused && !reduced

  return (
    <div className={cn("flex min-h-0 flex-col bg-paper", className)}>
      <div className="flex flex-wrap items-center gap-1.5 border-b border-ink/15 px-2 py-1.5">
        <label className="relative flex h-7 min-w-[142px] flex-1 items-center">
          <span className="sr-only">Search network nodes</span>
          <Search
            className="pointer-events-none absolute left-2 size-3 text-muted-ink"
            strokeWidth={1.5}
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search IP or hostname"
            className="h-full w-full border border-ink/15 bg-paper pl-7 pr-2 font-mono text-[9px] text-ink outline-none placeholder:text-muted-ink/70 focus:border-ink/40"
          />
        </label>

        <select
          value={kind}
          onChange={(event) =>
            setKind(event.target.value as NodeKind | "all")
          }
          className="h-7 border border-ink/15 bg-paper px-2 font-mono text-[9px] tracking-[0.05em] text-muted-ink uppercase outline-none focus:border-ink/40"
          aria-label="Filter node type"
        >
          <option value="all">All nodes</option>
          <option value="attacker">Attackers</option>
          <option value="honeypot">Honeypots</option>
          <option value="protected">Protected</option>
          <option value="infrastructure">Infrastructure</option>
          <option value="compromised">Compromised</option>
        </select>

        <select
          value={severity}
          onChange={(event) =>
            setSeverity(event.target.value as Severity | "all")
          }
          className="h-7 border border-ink/15 bg-paper px-2 font-mono text-[9px] tracking-[0.05em] text-muted-ink uppercase outline-none focus:border-ink/40"
          aria-label="Filter severity"
        >
          <option value="all">All severity</option>
          <option value="critical">Critical</option>
          <option value="suspicious">Suspicious</option>
          <option value="info">Info</option>
        </select>

        <button
          type="button"
          onClick={() => setTrailsPaused((value) => !value)}
          className="grid size-7 place-items-center border border-ink/15 text-muted-ink transition-colors hover:border-ink/40 hover:text-ink"
          aria-label={trailsPaused ? "Resume graph trails" : "Pause graph trails"}
          title={trailsPaused ? "Resume graph trails" : "Pause graph trails"}
        >
          {trailsPaused ? (
            <Play className="size-3 fill-current" strokeWidth={1.5} />
          ) : (
            <Pause className="size-3 fill-current" strokeWidth={1.5} />
          )}
        </button>
      </div>

      <div
        ref={wrapperRef}
        className={cn(
          "relative min-h-[300px] flex-1 overflow-hidden bg-paper",
          compact ? "h-[320px]" : "h-[560px]",
          fullscreen && "h-screen"
        )}
      >
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className={cn(
            "size-full touch-none select-none",
            dragging ? "cursor-grabbing" : "cursor-grab"
          )}
          role="img"
          aria-label="Live honeypot network topology"
          onWheel={onWheel}
        >
          <defs>
            <pattern
              id="graph-grid"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 32 0 L 0 0 0 32"
                fill="none"
                stroke="rgba(236,232,223,0.045)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect
            width={VIEW_W}
            height={VIEW_H}
            fill="url(#graph-grid)"
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          />

          <g
            transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}
            style={{
              transformOrigin: "center",
              transition: dragging ? "none" : "transform 160ms ease-out",
            }}
          >
            {visibleConnections.map((connection) => {
              const source = nodeMap.get(connection.source)
              const target = nodeMap.get(connection.target)
              if (!source || !target) return null
              const path = edgePath(source, target, connection.id)
              const color = edgeColor(connection.severity)
              const selected = selectedEdgeId === connection.id
              const active =
                activeEdgeId === connection.id ||
                (connection.severity === "critical" && showTrails)
              const particleDuration = 3.2 + (connection.packets % 5) * 0.35

              return (
                <g key={connection.id}>
                  <path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth={selected ? 2.2 : active ? 1.5 : 0.8}
                    strokeOpacity={active ? 0.95 : 0.65}
                  />
                  <path
                    d={path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={14}
                    className="cursor-pointer"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => onSelectEdge?.(connection.id)}
                  >
                    <title>{`${connection.label} · ${connection.protocol} · ${connection.packets.toLocaleString()} packets`}</title>
                  </path>
                  {showTrails && active ? (
                    <circle r={2.2} fill={color}>
                      <animateMotion
                        dur={`${particleDuration}s`}
                        repeatCount="indefinite"
                        path={path}
                      />
                    </circle>
                  ) : null}
                  {selected ? (
                    <circle r={2.4} fill={color}>
                      <animateMotion
                        dur={`${particleDuration}s`}
                        repeatCount="indefinite"
                        path={path}
                      />
                    </circle>
                  ) : null}
                </g>
              )
            })}

            {filteredNodes.map((node) => (
              <g
                key={node.id}
                className="cursor-pointer"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => onSelectNode(node.id)}
              >
                <title>
                  {`${node.label} · ${node.ip}\n${node.kind} · ${node.status}\n${node.protocols.join(", ")}\n${node.connectionCount} connections`}
                </title>
                <NodeGlyph
                  node={node}
                  selected={selectedNodeId === node.id}
                  dimmed={dimmed(node)}
                />
              </g>
            ))}
          </g>
        </svg>

        <div className="absolute right-2 bottom-2 flex items-center border border-ink/15 bg-paper">
          <button
            type="button"
            onClick={() => setZoom((value) => Math.max(0.65, value - 0.15))}
            className="grid size-7 place-items-center text-muted-ink transition-colors hover:text-ink"
            aria-label="Zoom out"
          >
            <Minus className="size-3" strokeWidth={1.5} />
          </button>
          <span className="w-9 text-center font-mono text-[9px] text-muted-ink tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((value) => Math.min(2.4, value + 0.15))}
            className="grid size-7 place-items-center text-muted-ink transition-colors hover:text-ink"
            aria-label="Zoom in"
          >
            <Plus className="size-3" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={resetView}
            className="grid size-7 place-items-center border-l border-ink/15 text-muted-ink transition-colors hover:text-ink"
            aria-label="Reset graph view"
          >
            <RotateCcw className="size-3" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="grid size-7 place-items-center border-l border-ink/15 text-muted-ink transition-colors hover:text-ink"
            aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            <Expand className="size-3" strokeWidth={1.5} />
          </button>
        </div>

        <div className="pointer-events-none absolute bottom-2 left-2 flex flex-wrap gap-x-3 gap-y-1 border border-ink/15 bg-paper/90 px-2 py-1.5">
          <LegendMark kind="attacker" label="Attacker" />
          <LegendMark kind="honeypot" label="Honeypot" />
          <LegendMark kind="protected" label="Protected" />
          <LegendMark kind="compromised" label="Compromised" />
        </div>

        <div className="pointer-events-none absolute top-2 left-2 flex items-center gap-1.5 bg-paper/80 px-1.5 py-1 font-mono text-[9px] tracking-[0.08em] text-muted-ink uppercase">
          <span
            className={cn(
              "size-1",
              paused ? "bg-muted-ink" : "animate-blink bg-signal"
            )}
          />
          {paused ? "MIRROR HELD" : "LIVE TRAFFIC"}
        </div>
      </div>
    </div>
  )
}

function LegendMark({ kind, label }: { kind: NodeKind; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[9px] text-muted-ink">
      {kind === "attacker" ? (
        <span className="size-1.5 rounded-full bg-signal" />
      ) : null}
      {kind === "honeypot" ? (
        <span className="size-1.5 rotate-45 border border-ink" />
      ) : null}
      {kind === "protected" ? (
        <span className="size-1.5 border border-ink" />
      ) : null}
      {kind === "compromised" ? (
        <span className="size-1.5 rounded-full border border-signal bg-signal/20" />
      ) : null}
      {label}
    </span>
  )
}
