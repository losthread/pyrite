"use client"

import * as React from "react"
import { Crosshair, MousePointer2 } from "lucide-react"

import { DemoControls } from "@/components/dashboard/demo-controls"
import { InspectorPanel } from "@/components/dashboard/inspector-panel"
import { NetworkGraph } from "@/components/dashboard/network-graph"
import { Panel, StatusPill } from "@/components/dashboard/primitives"
import { useDashboardTelemetry } from "@/hooks/useDashboardTelemetry"

export default function NetworkIntelligencePage() {
  const { mode, connection, paused, snapshot, activeEdgeId } =
    useDashboardTelemetry()
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(
    "attacker-02"
  )
  const [selectedEdgeId, setSelectedEdgeId] = React.useState<string | null>(
    null
  )

  const selectedNode =
    snapshot.nodes.find((node) => node.id === selectedNodeId) ?? null
  const selectedEdge =
    snapshot.connections.find((edge) => edge.id === selectedEdgeId) ?? null
  const connected = mode === "demo" || connection === "connected"

  return (
    <div className="mx-auto flex h-full w-full max-w-[1500px] flex-col gap-3">
      <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-[9px] tracking-[0.14em] text-muted-ink uppercase">
              Vyuha // Honeytrap
            </p>
            <StatusPill tone={mode === "demo" ? "critical" : connected ? "live" : "critical"}>
              {mode === "demo" ? "Demo topology" : connected ? "Live topology" : "Disconnected"}
            </StatusPill>
          </div>
          <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.03em]">
            Network intelligence
          </h1>
          <p className="mt-1 max-w-[72ch] text-[12px] leading-relaxed text-muted-ink">
            Explore attacker paths, decoy systems, and protected infrastructure.
            Pan, zoom, filter, and select a node or connection to inspect it.
          </p>
        </div>
        <DemoControls />
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel
          title="Network topology"
          subtitle={`${snapshot.nodes.length} nodes / ${snapshot.connections.length} connections`}
          actions={
            <div className="hidden items-center gap-3 font-mono text-[9px] tracking-[0.08em] text-muted-ink uppercase sm:flex">
              <span className="flex items-center gap-1">
                <MousePointer2 className="size-3" strokeWidth={1.5} />
                Select
              </span>
              <span className="flex items-center gap-1">
                <Crosshair className="size-3" strokeWidth={1.5} />
                Drag to pan
              </span>
              <span
                className={`size-1.5 ${paused ? "bg-muted-ink" : "animate-blink bg-signal"}`}
              />
              {paused ? "Held" : "Live"}
            </div>
          }
          className="min-h-[520px]"
          bodyClassName="flex"
        >
          <NetworkGraph
            nodes={snapshot.nodes}
            connections={snapshot.connections}
            selectedNodeId={selectedNodeId}
            selectedEdgeId={selectedEdgeId}
            activeEdgeId={activeEdgeId}
            paused={paused}
            className="w-full flex-1"
            onSelectNode={(id) => {
              setSelectedNodeId(id)
              setSelectedEdgeId(null)
            }}
            onSelectEdge={(id) => {
              setSelectedEdgeId(id)
              setSelectedNodeId(null)
            }}
          />
        </Panel>

        <Panel
          title="Inspector"
          subtitle={selectedNode ? "Node" : selectedEdge ? "Connection" : "Idle"}
          actions={
            selectedNode || selectedEdge ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedNodeId(null)
                  setSelectedEdgeId(null)
                }}
                className="font-mono text-[9px] tracking-[0.08em] text-muted-ink uppercase transition-colors hover:text-ink"
              >
                Clear
              </button>
            ) : null
          }
          className="min-h-[520px]"
        >
          <InspectorPanel
            node={selectedNode}
            edge={selectedEdge}
            nodes={snapshot.nodes}
            events={snapshot.events}
          />
        </Panel>
      </div>
    </div>
  )
}
