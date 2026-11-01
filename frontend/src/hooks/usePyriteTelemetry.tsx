"use client"

import * as React from "react"
import { demoSnapshot, demoStreamEvents, emptySnapshot } from "@/lib/dashboard/data"
import type {
  ConnectionState,
  DashboardMode,
  DashboardSnapshot,
  SecurityEvent,
  NetworkNode,
  NetworkConnection,
  Attacker,
} from "@/lib/dashboard/types"

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8003"

const WS_BASE = API_BASE.replace(/^http/, "ws") + "/ws/soc?token=demo-analyst-bypass"

export interface PyriteTelemetryValue {
  mode: DashboardMode
  connection: ConnectionState
  statusLabel: string
  paused: boolean
  lastUpdated: string | null
  snapshot: DashboardSnapshot
  activeEdgeId: string | null
  redTeamOpen: boolean
  activePersona: any
  activeSeed: string
  shadowWorlds: any[]
  topologies: any[]
  setMode: (mode: DashboardMode) => void
  setRedTeamOpen: (open: boolean) => void
  togglePause: () => void
  triggerAttack: () => void
  triggerCapture: () => void
  resetDemo: () => void
  refresh: () => void
  // Real SOC Containment Actions
  quarantineAttacker: (ja4h?: string) => Promise<void>
  engageEndlesshTarpit: (ja4h?: string) => Promise<void>
  burnAndMutateTopology: () => Promise<void>
  sendSocketAction: (action: string, payload?: Record<string, any>) => void
}

const PyriteTelemetryContext = React.createContext<PyriteTelemetryValue | null>(null)

export function PyriteTelemetryProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [mode, setModeState] = React.useState<DashboardMode>("live")
  const [connection, setConnection] = React.useState<ConnectionState>("connecting")
  const [paused, setPaused] = React.useState(false)
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null)
  const [liveSnapshot, setLiveSnapshot] = React.useState<DashboardSnapshot | null>(null)
  const [activeEdgeId, setActiveEdgeId] = React.useState<string | null>(null)
  const [redTeamOpen, setRedTeamOpen] = React.useState(false)
  const [activePersona, setActivePersona] = React.useState<any>(null)
  const [activeSeed, setActiveSeed] = React.useState<string>("Morph-v1.0 (Fintech-Git-SQLi)")
  const [shadowWorlds, setShadowWorlds] = React.useState<any[]>([])
  const [topologies, setTopologies] = React.useState<any[]>([])

  // Simulated Demo State
  const [streamIndex, setStreamIndex] = React.useState(0)
  const [streamedEvents, setStreamedEvents] = React.useState<SecurityEvent[]>([])
  const [simulatedAttacks, setSimulatedAttacks] = React.useState(0)
  const [simulatedCaptures, setSimulatedCaptures] = React.useState(0)

  const socketRef = React.useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = React.useRef<any>(null)

  // 1. Fetch initial REST state from FastAPI
  const fetchLiveState = React.useCallback(async () => {
    try {
      const [snapRes, topoRes, swRes] = await Promise.all([
        fetch(`${API_BASE}/api/dashboard/snapshot`, { headers: { Accept: "application/json" } }),
        fetch(`${API_BASE}/api/deception/topologies`, { headers: { Accept: "application/json" } }).catch(() => null),
        fetch(`${API_BASE}/api/shadow-worlds`, { headers: { Accept: "application/json" } }).catch(() => null),
      ])

      if (snapRes.ok) {
        const snapData = (await snapRes.json()) as DashboardSnapshot
        setLiveSnapshot(snapData)
        setLastUpdated(snapData.generatedAt ?? new Date().toISOString())
      }

      if (topoRes && topoRes.ok) {
        const topoData = await topoRes.json()
        setTopologies(topoData.topologies || [])
        if (topoData.activeSeed) setActiveSeed(topoData.activeSeed)
        if (topoData.persona) setActivePersona(topoData.persona)
      }

      if (swRes && swRes.ok) {
        const swData = await swRes.json()
        setShadowWorlds(swData.sessions || [])
      }
    } catch (e) {
      console.warn("[PYRITE TELEMETRY] Initial fetch failed:", e)
    }
  }, [])

  // 2. Connect to Native WebSocket (/ws/soc)
  const connectWebSocket = React.useCallback(() => {
    if (socketRef.current) {
      try {
        socketRef.current.close()
      } catch {}
      socketRef.current = null
    }

    try {
      setConnection("connecting")
      const ws = new WebSocket(WS_BASE)
      socketRef.current = ws

      ws.onopen = () => {
        setConnection("connected")
        console.log("[PYRITE WS] Connected to SOC Hub")
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          const msgType = msg.type
          const msgData = msg.data || {}

          if (msgType === "system_init") {
            if (msgData.activeSeed) setActiveSeed(msgData.activeSeed)
            if (msgData.persona) setActivePersona(msgData.persona)
            if (msgData.sessions) setShadowWorlds(msgData.sessions)
          } else if (msgType === "soc_telemetry") {
            // New incoming telemetry from an attack stage
            const eventPayload = msgData.action || {}
            const attackerInfo = msgData.attacker || {}
            const wazuhRule = msgData.wazuh || {}
            const metrics = msgData.metrics || {}

            const newEvent: SecurityEvent = {
              id: msgData.eventId || `evt-${Date.now()}`,
              timestamp: new Date().toISOString(),
              severity: wazuhRule.level >= 13 ? "critical" : wazuhRule.level >= 8 ? "suspicious" : "info",
              sourceIp: attackerInfo.ip || "185.220.101.4",
              destination: eventPayload.endpoint || "honeypot",
              destinationIp: "10.0.4.21",
              protocol: "TCP",
              eventType: eventPayload.title || "active_deception_trap",
              description: wazuhRule.description || eventPayload.title || "Deception event recorded",
              ruleId: String(wazuhRule.ruleId || "100501"),
              ruleLevel: wazuhRule.level || 5,
              mitreId: wazuhRule.mitreAttack?.id || "T1595",
              mitreTactic: "Active Deception",
              mitreTechnique: wazuhRule.mitreAttack?.name || "Deception Controls",
              honeypot: eventPayload.endpoint || "cowrie-ssh",
              sessionId: attackerInfo.ja4h,
              raw: msgData,
            }

            setLiveSnapshot((prev) => {
              const base = prev ?? emptySnapshot
              return {
                ...base,
                metrics: {
                  ...base.metrics,
                  totalAttacks: (base.metrics.totalAttacks || 0) + 1,
                  criticalAlerts: newEvent.severity === "critical" ? (base.metrics.criticalAlerts || 0) + 1 : base.metrics.criticalAlerts,
                },
                events: [newEvent, ...base.events].slice(0, 50),
              }
            })
            setLastUpdated(new Date().toISOString())
          } else if (msgType === "topology_mutated") {
            if (msgData.new_seed) setActiveSeed(msgData.new_seed)
            if (msgData.persona) setActivePersona(msgData.persona)
          }
        } catch (err) {
          console.error("[PYRITE WS] Failed to parse message:", err)
        }
      }

      ws.onerror = (e) => {
        console.warn("[PYRITE WS] WebSocket error:", e)
      }

      ws.onclose = () => {
        setConnection("disconnected")
        console.log("[PYRITE WS] Disconnected. Reconnecting in 3s...")
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket()
        }, 3000)
      }
    } catch (e) {
      setConnection("disconnected")
    }
  }, [])

  React.useEffect(() => {
    fetchLiveState()
    connectWebSocket()

    return () => {
      clearTimeout(reconnectTimeoutRef.current)
      if (socketRef.current) {
        socketRef.current.close()
      }
    }
  }, [fetchLiveState, connectWebSocket])

  const sendSocketAction = React.useCallback((action: string, payload: Record<string, any> = {}) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action, ...payload }))
    }
  }, [])

  // 3. Real SOC Containment Actions
  const quarantineAttacker = React.useCallback(async (ja4h?: string) => {
    sendSocketAction("PLAUSIBLE_WAF_DROP", { ja4h })
    try {
      await fetch(`${API_BASE}/api/quarantine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ja4h }),
      })
    } catch {}
  }, [sendSocketAction])

  const engageEndlesshTarpit = React.useCallback(async (ja4h?: string) => {
    sendSocketAction("ENGAGE_ENDLESSH_TARPIT", { ja4h })
  }, [sendSocketAction])

  const burnAndMutateTopology = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/mutate`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        if (data.new_seed) setActiveSeed(data.new_seed)
        if (data.persona) setActivePersona(data.persona)
      }
    } catch {}
    sendSocketAction("MUTATE_TOPOLOGY")
  }, [sendSocketAction])

  // Computed Snapshot
  const snapshot = React.useMemo<DashboardSnapshot>(() => {
    if (mode === "live") {
      return liveSnapshot ?? emptySnapshot
    }

    const streamedCritical = streamedEvents.filter((e) => e.severity === "critical").length
    const volume = demoSnapshot.analytics.volume.map((point, index) => ({
      ...point,
      value: point.value + (index >= 22 ? Math.floor(streamedEvents.length * 1.4) + simulatedAttacks : 0),
    }))

    return {
      ...demoSnapshot,
      generatedAt: lastUpdated ?? demoSnapshot.generatedAt,
      metrics: {
        ...demoSnapshot.metrics,
        totalAttacks: demoSnapshot.metrics.totalAttacks + simulatedAttacks + streamedEvents.length * 3,
        capturedSessions: demoSnapshot.metrics.capturedSessions + simulatedCaptures,
        criticalAlerts: demoSnapshot.metrics.criticalAlerts + streamedCritical,
      },
      events: [...streamedEvents, ...demoSnapshot.events],
      analytics: {
        ...demoSnapshot.analytics,
        volume,
      },
    }
  }, [mode, liveSnapshot, lastUpdated, streamedEvents, simulatedAttacks, simulatedCaptures])

  const statusLabel = React.useMemo(() => {
    if (mode === "demo") return "SIMULATED TELEMETRY (DEMO)"
    if (connection === "connected") return "● LIVE BACKEND CONNECTED (10.46.34.107:9200 WAZUH LINKED)"
    if (connection === "connecting") return "○ CONNECTING TO FASTAPI SOC HUB..."
    if (connection === "reconnecting") return "○ RECONNECTING TO FASTAPI SOC HUB..."
    return "✕ LIVE BACKEND DISCONNECTED (OFFLINE)"
  }, [mode, connection])

  const value = React.useMemo<PyriteTelemetryValue>(() => ({
    mode,
    connection,
    statusLabel,
    paused,
    lastUpdated,
    snapshot,
    activeEdgeId,
    redTeamOpen,
    activePersona,
    activeSeed,
    shadowWorlds,
    topologies,
    setMode: (m) => setModeState(m),
    setRedTeamOpen,
    togglePause: () => setPaused((p) => !p),
    triggerAttack: () => {
      const template = demoStreamEvents[streamIndex % demoStreamEvents.length]
      const ev: SecurityEvent = {
        ...template,
        id: `demo-${Date.now()}-${streamIndex}`,
        timestamp: new Date().toISOString(),
      }
      setStreamIndex((i) => i + 1)
      setStreamedEvents((evs) => [ev, ...evs].slice(0, 24))
      setSimulatedAttacks((a) => a + 8)
    },
    triggerCapture: () => {
      setSimulatedCaptures((c) => c + 1)
      setSimulatedAttacks((a) => a + 2)
    },
    resetDemo: () => {
      setStreamedEvents([])
      setSimulatedAttacks(0)
      setSimulatedCaptures(0)
      setStreamIndex(0)
    },
    refresh: () => {
      fetchLiveState()
    },
    quarantineAttacker,
    engageEndlesshTarpit,
    burnAndMutateTopology,
    sendSocketAction,
  }), [
    mode,
    connection,
    statusLabel,
    paused,
    lastUpdated,
    snapshot,
    activeEdgeId,
    redTeamOpen,
    activePersona,
    activeSeed,
    shadowWorlds,
    topologies,
    streamIndex,
    quarantineAttacker,
    engageEndlesshTarpit,
    burnAndMutateTopology,
    sendSocketAction,
    fetchLiveState,
  ])

  return (
    <PyriteTelemetryContext.Provider value={value}>
      {children}
    </PyriteTelemetryContext.Provider>
  )
}

export function usePyriteTelemetry() {
  const context = React.useContext(PyriteTelemetryContext)
  if (!context) {
    throw new Error("usePyriteTelemetry must be used inside PyriteTelemetryProvider")
  }
  return context
}

// Re-export for compatibility with existing imports
export const useDashboardTelemetry = usePyriteTelemetry
export const DashboardProvider = PyriteTelemetryProvider
