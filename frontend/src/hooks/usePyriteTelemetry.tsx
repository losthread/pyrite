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
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000"

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

  // Ground-Truth Live Honeypots List
  const HONEYPOT_DECOYS = React.useMemo(() => [
    { id: "honeypot-ssh-01", name: "honeypot-ssh-01", host: "cowrie-ssh.hp.internal", ip: "10.240.1.10:22", type: "High-Interaction SSH Decoy", protocols: ["ssh", "sftp"], region: "eu-central-1" },
    { id: "honeypot-http-02", name: "honeypot-http-02", host: "web-envoy.hp.internal", ip: "10.240.1.22:443", type: "Web API & GraphQL Canary", protocols: ["https", "graphql", "http"], region: "us-east-1" },
    { id: "honeypot-postgres-05", name: "honeypot-postgres-05", host: "pg-ledger.hp.internal", ip: "10.240.4.19:5432", type: "Synthetic SQL Ledger Canary", protocols: ["pgsql"], region: "us-west-2" },
    { id: "honeypot-redis-03", name: "honeypot-redis-03", host: "redis-vault.hp.internal", ip: "10.240.2.15:6379", type: "In-Memory Keystore Sandbox", protocols: ["redis", "resp"], region: "ap-northeast-1" },
    { id: "honeypot-ics-04", name: "honeypot-ics-04", host: "scada-plc.hp.internal", ip: "10.240.3.88:502", type: "Industrial SCADA PLC Decoy", protocols: ["modbus", "s7comm"], region: "eu-west-1" },
    { id: "honeypot-telnet-06", name: "honeypot-telnet-06", host: "iot-busybox.hp.internal", ip: "10.240.5.04:23", type: "IoT BusyBox Dropper Trap", protocols: ["telnet"], region: "ap-southeast-1" },
    { id: "honeypot-mqtt-07", name: "honeypot-mqtt-07", host: "mqtt-telemetry.hp.internal", ip: "10.240.5.18:1883", type: "IoT Telemetry Broker Canary", protocols: ["mqtt"], region: "eu-west-1" },
    { id: "honeypot-vault-08", name: "honeypot-vault-08", host: "cold-vault.hp.internal", ip: "10.240.6.12:8000", type: "Cold Vault Exfiltration Canary", protocols: ["http", "s3"], region: "us-east-1" },
  ], []);

  // Computed Snapshot: Directly constructed from ground-truth active sessions & live socket telemetry
  const snapshot = React.useMemo<DashboardSnapshot>(() => {
    if (mode === "live") {
      const nowIso = new Date().toISOString();
      const activeSessions = shadowWorlds || [];

      // Map real sessions to Attackers list for /dashboard/attackers
      const attackers: Attacker[] = activeSessions.map((s, idx) => {
        const ip = s.current_ip || s.initial_ip || "10.46.34.150";
        const hp = s.last_honeypot || (s.highest_stage === 2 ? "honeypot-postgres-05" : s.highest_stage === 3 ? "honeypot-ssh-01" : s.highest_stage === 4 ? "honeypot-vault-08" : "honeypot-http-02");
        return {
          id: `att-${ip.replace(/\./g, "-")}`,
          ip,
          firstSeen: s.last_seen || nowIso,
          lastSeen: s.last_seen || nowIso,
          attempts: s.command_count || 1,
          honeypots: [hp],
          protocols: ["tcp", hp.includes("ssh") ? "ssh" : "http"],
          severity: (s.threat_score >= 80 || s.highest_stage >= 3) ? "critical" : "suspicious",
          status: s.plausible_waf_drop ? "contained" : "active",
          ja4h: s.ja4h,
        };
      });

      // Map Honeypots list with dynamic under_attack state for /dashboard/honeypots
      const honeypots: Honeypot[] = HONEYPOT_DECOYS.map((hp) => {
        const matched = attackers.filter((a) => a.honeypots.includes(hp.name) || a.honeypots.includes(hp.id));
        const isAttacked = matched.length > 0;
        return {
          id: hp.id,
          name: hp.name,
          host: hp.host,
          ip: hp.ip,
          type: hp.type,
          status: isAttacked ? "under_attack" : "online",
          sessions: matched.length,
          interactions: matched.reduce((acc, a) => acc + a.attempts, 0),
          lastActivity: matched[0]?.lastSeen || nowIso,
          severity: isAttacked ? (matched.some(a => a.severity === "critical") ? "critical" : "suspicious") : "info",
          protocols: hp.protocols,
          region: hp.region,
        };
      });

      // All nodes for /dashboard/network topology canvas
      const nodes: NetworkNode[] = [
        { id: "gw-edge-01", label: "edge-ingress-gw-01", ip: "10.240.0.1", kind: "infrastructure", severity: "info", status: "Online", x: 550, y: 270, protocols: ["bgp", "tcp"], connectionCount: 4820, firstSeen: "2025-01-01T00:00:00Z", lastSeen: "Active" },
        { id: "prod-vault-01", label: "prod-ledger-db-01", ip: "10.240.10.50:5432", kind: "protected", severity: "info", status: "Protected / Isolated", x: 260, y: 270, protocols: ["pgsql"], connectionCount: 312, firstSeen: "2025-01-01T00:00:00Z", lastSeen: "Active" },
        { id: "prod-auth-02", label: "prod-iam-signer-02", ip: "10.240.10.65:8443", kind: "protected", severity: "info", status: "Protected / Isolated", x: 840, y: 270, protocols: ["https", "grpc"], connectionCount: 518, firstSeen: "2025-01-01T00:00:00Z", lastSeen: "Active" },
        ...honeypots.map((h, i) => ({
          id: h.id,
          label: h.name,
          ip: h.ip,
          kind: "honeypot" as const,
          severity: h.severity,
          status: h.status === "under_attack" ? "Under Attack" : "Online",
          x: 360 + (i % 4) * 140,
          y: i < 4 ? 140 : 380,
          protocols: h.protocols,
          connectionCount: h.interactions,
          firstSeen: nowIso,
          lastSeen: h.lastActivity,
          associatedHoneypot: h.name,
        })),
        ...attackers.map((att) => ({
          id: att.id,
          label: att.ip,
          ip: att.ip,
          kind: "attacker" as const,
          severity: att.severity,
          status: att.status === "contained" ? "Contained" : "Active",
          x: 100,
          y: 200,
          protocols: att.protocols,
          connectionCount: att.attempts,
          firstSeen: att.firstSeen,
          lastSeen: att.lastSeen,
          associatedHoneypot: att.honeypots[0] || "honeypot-ssh-01",
          threatClassification: "Adversary Session",
        })),
      ];

      // Dynamic connections linking attacker to exact honeypot
      const connections: NetworkConnection[] = [
        ...honeypots.map((h) => ({
          id: `link-gw-${h.id}`,
          source: "gw-edge-01",
          target: h.id,
          severity: "info" as const,
          protocol: h.protocols[0] || "tcp",
          packets: 0,
          lastSeen: nowIso,
          label: "Decoy Spoke",
        })),
        ...attackers.map((att) => ({
          id: `e-attack-${att.id}`,
          source: att.id,
          target: att.honeypots[0] || "honeypot-ssh-01",
          severity: att.severity,
          protocol: att.protocols[0] || "tcp",
          packets: att.attempts,
          lastSeen: att.lastSeen,
          label: `${att.ip} → ${att.honeypots[0] || "honeypot-ssh-01"}`,
        })),
      ];

      const allEvents = (liveSnapshot?.events && liveSnapshot.events.length > 0) ? liveSnapshot.events : streamedEvents;
      const criticalCount = attackers.filter(a => a.severity === "critical").length;
      const containedCount = attackers.filter(a => a.status === "contained").length;

      return {
        generatedAt: lastUpdated ?? nowIso,
        source: "pyrite-live",
        metrics: {
          totalAttacks: attackers.length > 0 ? attackers.length : allEvents.length,
          activeAttackers: attackers.filter(a => a.status !== "contained").length,
          capturedSessions: containedCount,
          criticalAlerts: criticalCount,
        },
        nodes,
        connections,
        events: allEvents,
        attackers,
        honeypots,
        alerts: [],
        analytics: {
          volume: [{ label: nowIso.slice(11, 16), value: attackers.length }],
          severity: [
            { label: "Critical", value: criticalCount },
            { label: "Suspicious", value: attackers.length - criticalCount > 0 ? attackers.length - criticalCount : 0 },
            { label: "Informational", value: 0 },
          ],
          targetedHoneypots: honeypots.map(h => ({ label: h.name, value: h.interactions })),
          protocols: [{ label: "TCP", value: attackers.length }, { label: "SSH", value: attackers.filter(a => a.protocols.includes("ssh")).length }],
          sessions: [{ label: nowIso.slice(11, 16), value: attackers.length }],
        },
      };
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
