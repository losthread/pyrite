"use client"

import * as React from "react"

import {
  demoSnapshot,
  demoStreamEvents,
  emptySnapshot,
} from "@/lib/dashboard/data"
import type {
  ConnectionState,
  DashboardMode,
  DashboardSnapshot,
  SecurityEvent,
  TarpitProgress,
  TerminalLine,
} from "@/lib/dashboard/types"

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000"
const WS_URL = API_BASE.replace(/^http/, "ws") + "/ws/soc"

interface DashboardTelemetryValue {
  mode: DashboardMode
  connection: ConnectionState
  paused: boolean
  lastUpdated: string | null
  snapshot: DashboardSnapshot
  activeEdgeId: string | null
  terminalLines: TerminalLine[]
  tarpitProgress: TarpitProgress | null
  sendSocAction: (action: string, payload?: Record<string, unknown>) => void
  setMode: (mode: DashboardMode) => void
  togglePause: () => void
  triggerAttack: () => void
  triggerCapture: () => void
  resetDemo: () => void
  refresh: () => void
}

const DashboardTelemetryContext =
  React.createContext<DashboardTelemetryValue | null>(null)

const edgeByDestination: Record<string, string> = {
  "cowrie-ssh": "e-01",
  "graphql-decoy": "e-03",
  "web-decoy": "e-06",
  "vault-decoy": "e-14",
  "wazuh-manager": "e-11",
}

function makeStreamEvent(
  template: (typeof demoStreamEvents)[number],
  index: number
): SecurityEvent {
  const timestamp = new Date().toISOString()
  return {
    ...template,
    id: `demo-${Date.now()}-${index}`,
    timestamp,
  }
}

function toIso(timestamp: string | undefined): string {
  if (!timestamp) return new Date().toISOString()
  if (timestamp.includes("T")) return timestamp
  const today = new Date().toISOString().slice(0, 10)
  return `${today}T${timestamp}Z`
}

const stageDestinations: Record<number, string> = {
  1: "edge-gw-01",
  2: "cowrie-ssh",
  3: "shadow-shell",
  4: "vault-decoy",
}

function mapWsEvent(data: Record<string, unknown>): SecurityEvent {
  const stage = Number(data.stage ?? 0)
  const wazuh = (data.wazuh ?? {}) as Record<string, unknown>
  const mitre = (data.mitre ?? {}) as Record<string, unknown>
  const attack = (mitre.attack ?? {}) as Record<string, unknown>
  const engage = (mitre.engage ?? {}) as Record<string, unknown>
  const attacker = (data.attacker ?? {}) as Record<string, unknown>
  const action = (data.action ?? {}) as Record<string, unknown>
  const level = Number(wazuh.level ?? 3)
  const severity =
    level >= 13 ? "critical" : level >= 8 ? "suspicious" : "info"
  const destination = stageDestinations[stage] ?? "honeypot"

  return {
    id: String(data.eventId ?? `ws-${Date.now()}`),
    timestamp: toIso(data.timestamp as string | undefined),
    severity,
    sourceIp: String(attacker.ip ?? ""),
    destination,
    destinationIp: "",
    protocol: stage === 3 ? "ssh" : "http",
    eventType: "telemetry",
    description: String(action.title ?? "honeypot telemetry"),
    ruleId: String(wazuh.ruleId ?? 100500),
    ruleLevel: level,
    mitreId: String(attack.id ?? "—"),
    mitreTactic: String(attack.name ?? "—"),
    mitreTechnique: String(attack.id ?? "—"),
    mitreAttack: { id: String(attack.id ?? "—"), name: String(attack.name ?? "—") },
    mitreEngage: { id: String(engage.id ?? "—"), name: String(engage.name ?? "—") },
    honeypot: destination,
    sessionId: (attacker.sessionId as string) ?? null,
    username: (action.username as string) ?? null,
  }
}

export function DashboardProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [mode, setModeState] = React.useState<DashboardMode>("demo")
  const [connection, setConnection] =
    React.useState<ConnectionState>("connected")
  const [paused, setPaused] = React.useState(false)
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(
    demoSnapshot.generatedAt
  )
  const [liveSnapshot, setLiveSnapshot] =
    React.useState<DashboardSnapshot | null>(null)
  const [streamIndex, setStreamIndex] = React.useState(0)
  const [streamedEvents, setStreamedEvents] = React.useState<SecurityEvent[]>([])
  const [simulatedAttacks, setSimulatedAttacks] = React.useState(0)
  const [simulatedCaptures, setSimulatedCaptures] = React.useState(0)
  const [activeEdgeId, setActiveEdgeId] = React.useState<string | null>(null)
  const [terminalLines, setTerminalLines] = React.useState<TerminalLine[]>([])
  const [tarpitProgress, setTarpitProgress] =
    React.useState<TarpitProgress | null>(null)
  const [wsEvents, setWsEvents] = React.useState<SecurityEvent[]>([])
  const socSocketRef = React.useRef<WebSocket | null>(null)
  const liveAbort = React.useRef<AbortController | null>(null)

  const loadLive = React.useCallback(async () => {
    if (mode !== "live") return

    liveAbort.current?.abort()
    const controller = new AbortController()
    liveAbort.current = controller

    setConnection((current) =>
      current === "connected" ? "reconnecting" : "connecting"
    )

    try {
      const response = await fetch(`${API_BASE}/api/dashboard/snapshot`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = (await response.json()) as DashboardSnapshot
      setLiveSnapshot(data)
      setConnection("connected")
      setLastUpdated(data.generatedAt ?? new Date().toISOString())
    } catch (error) {
      if ((error as Error).name === "AbortError") return
      setLiveSnapshot(null)
      setConnection("disconnected")
      setLastUpdated(null)
    }
  }, [mode])

  React.useEffect(() => {
    if (paused) return

    if (mode === "live") {
      const kickoff = window.setTimeout(() => void loadLive(), 0)
      const timer = window.setInterval(() => void loadLive(), 20_000)
      return () => {
        window.clearTimeout(kickoff)
        window.clearInterval(timer)
        liveAbort.current?.abort()
      }
    }

    const demoReady = window.setTimeout(() => setConnection("connected"), 0)
    return () => window.clearTimeout(demoReady)
  }, [mode, loadLive, paused])

  React.useEffect(() => {
    if (mode !== "live" || paused) {
      socSocketRef.current?.close()
      socSocketRef.current = null
      return
    }

    const socket = new WebSocket(WS_URL)
    socSocketRef.current = socket

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string)
        const type = msg.type as string
        const data = (msg.data ?? {}) as Record<string, unknown>
        if (type === "soc_telemetry") {
          const mapped = mapWsEvent(data)
          setWsEvents((prev) => [mapped, ...prev].slice(0, 100))
          setActiveEdgeId(
            mapped.destination === "vault-decoy"
              ? "e-14"
              : mapped.destination === "cowrie-ssh"
                ? "e-01"
                : null
          )
        } else if (type === "terminal_stream") {
          setTerminalLines((prev) =>
            [
              {
                ja4h: String(data.ja4h ?? ""),
                command: String(data.command ?? ""),
                stdout: String(data.stdout ?? ""),
                stderr: String(data.stderr ?? ""),
                exitCode: Number(data.exitCode ?? 0),
                cwd: String(data.cwd ?? ""),
                timestamp: String(data.timestamp ?? ""),
              },
              ...prev,
            ].slice(0, 120)
          )
        } else if (type === "tarpit_progress") {
          setTarpitProgress({
            ja4h: String(data.ja4h ?? ""),
            bytesSent: Number(data.bytesSent ?? 0),
            chunkSize: Number(data.chunkSize ?? 0),
            speed: String(data.speed ?? ""),
            dwellTimeSeconds: Number(data.dwellTimeSeconds ?? 0),
            status: String(data.status ?? ""),
          })
        }
      } catch {
        // ignore malformed socket frames
      }
    }

    socket.onclose = () => {
      if (socSocketRef.current === socket) socSocketRef.current = null
    }

    return () => {
      socket.close()
      if (socSocketRef.current === socket) socSocketRef.current = null
    }
  }, [mode, paused])

  React.useEffect(() => {
    if (mode !== "demo" || paused) return

    const timer = window.setInterval(() => {
      setStreamIndex((current) => {
        const template = demoStreamEvents[current % demoStreamEvents.length]
        const nextEvent = makeStreamEvent(template, current)
        setStreamedEvents((events) => [nextEvent, ...events].slice(0, 24))
        setActiveEdgeId(
          edgeByDestination[nextEvent.destination] ?? "e-01"
        )
        setLastUpdated(nextEvent.timestamp)
        setSimulatedAttacks((attacks) => attacks + 3)
        return current + 1
      })
    }, 4_200)

    return () => window.clearInterval(timer)
  }, [mode, paused])

  const setMode = React.useCallback((next: DashboardMode) => {
    setModeState(next)
    setPaused(false)
    setActiveEdgeId(null)
    if (next === "demo") {
      setConnection("connected")
      setLastUpdated(demoSnapshot.generatedAt)
    } else {
      setConnection("connecting")
    }
  }, [])

  const togglePause = React.useCallback(() => {
    setPaused((value) => !value)
  }, [])

  const sendSocAction = React.useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      const socket = socSocketRef.current
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ action, ...(payload ?? {}) }))
      }
    },
    []
  )

  const triggerAttack = React.useCallback(() => {
    if (mode !== "demo") return
    const template = demoStreamEvents[streamIndex % demoStreamEvents.length]
    const event = makeStreamEvent(template, streamIndex + 1_000)
    setStreamIndex((current) => current + 1)
    setStreamedEvents((events) => [event, ...events].slice(0, 24))
    setSimulatedAttacks((attacks) => attacks + 8)
    setActiveEdgeId(edgeByDestination[event.destination] ?? "e-01")
    setLastUpdated(event.timestamp)
  }, [mode, streamIndex])

  const triggerCapture = React.useCallback(() => {
    if (mode !== "demo") return
    setSimulatedCaptures((captures) => captures + 1)
    setSimulatedAttacks((attacks) => attacks + 2)
    setLastUpdated(new Date().toISOString())
    setActiveEdgeId("e-08")
  }, [mode])

  const resetDemo = React.useCallback(() => {
    setStreamedEvents([])
    setSimulatedAttacks(0)
    setSimulatedCaptures(0)
    setStreamIndex(0)
    setPaused(false)
    setActiveEdgeId(null)
    setLastUpdated(demoSnapshot.generatedAt)
    if (mode === "demo") setConnection("connected")
  }, [mode])

  const snapshot = React.useMemo<DashboardSnapshot>(() => {
    if (mode === "live") {
      const base = liveSnapshot ?? emptySnapshot
      if (!wsEvents.length) return base
      const wsIds = new Set(wsEvents.map((event) => event.id))
      const merged = [
        ...wsEvents,
        ...base.events.filter((event) => !wsIds.has(event.id)),
      ].slice(0, 300)
      return { ...base, events: merged }
    }

    const streamedCritical = streamedEvents.filter(
      (event) => event.severity === "critical"
    ).length

    const volume = demoSnapshot.analytics.volume.map((point, index) => ({
      ...point,
      value:
        point.value +
        (index >= 22
          ? Math.floor(streamedEvents.length * 1.4) + simulatedAttacks
          : 0),
    }))

    return {
      ...demoSnapshot,
      generatedAt: lastUpdated ?? demoSnapshot.generatedAt,
      metrics: {
        ...demoSnapshot.metrics,
        totalAttacks:
          demoSnapshot.metrics.totalAttacks +
          simulatedAttacks +
          streamedEvents.length * 3,
        capturedSessions:
          demoSnapshot.metrics.capturedSessions + simulatedCaptures,
        criticalAlerts:
          demoSnapshot.metrics.criticalAlerts + streamedCritical,
      },
      events: [...streamedEvents, ...demoSnapshot.events],
      analytics: {
        ...demoSnapshot.analytics,
        volume,
      },
    }
  }, [
    mode,
    liveSnapshot,
    lastUpdated,
    streamedEvents,
    simulatedAttacks,
    simulatedCaptures,
    wsEvents,
  ])

  const value = React.useMemo<DashboardTelemetryValue>(
    () => ({
      mode,
      connection,
      paused,
      lastUpdated,
      snapshot,
      activeEdgeId,
      terminalLines,
      tarpitProgress,
      sendSocAction,
      setMode,
      togglePause,
      triggerAttack,
      triggerCapture,
      resetDemo,
      refresh: () => {
        if (mode === "live") void loadLive()
      },
    }),
    [
      mode,
      connection,
      paused,
      lastUpdated,
      snapshot,
      activeEdgeId,
      terminalLines,
      tarpitProgress,
      sendSocAction,
      setMode,
      togglePause,
      triggerAttack,
      triggerCapture,
      resetDemo,
      loadLive,
    ]
  )

  return (
    <DashboardTelemetryContext.Provider value={value}>
      {children}
    </DashboardTelemetryContext.Provider>
  )
}

export function useDashboardTelemetry() {
  const context = React.useContext(DashboardTelemetryContext)
  if (!context) {
    throw new Error(
      "useDashboardTelemetry must be used inside DashboardProvider"
    )
  }
  return context
}
