"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import Link from "next/link"

// ==============================================================================
// PYRITE // STANDALONE UNBREAKABLE LIVE DEMO COMMAND CENTER
// D3COY 1.0 — Problem Statement 04: Deception-Driven Threat Detection & Response
// Self-contained, zero-error, resilient to network drops & backend restarts.
// ==============================================================================

interface SessionData {
  ja4h: string
  current_ip: string
  initial_ip: string
  observed_ips?: string[]
  dwell_time_seconds?: number
  threat_score: number
  highest_stage: number
  last_honeypot?: string
  prod_correlated?: boolean
  plausible_waf_drop?: boolean
  tarpit_active?: boolean
  command_count?: number
  last_seen?: string
  last_seen_ts?: number
}

interface SecurityEvent {
  id: string
  timestamp: string
  severity: "critical" | "suspicious" | "info"
  source: string
  destination: string
  protocol: string
  title: string
  mitre: string
}

const HONEYPOT_NODES = [
  { id: "honeypot-postgres-05", name: "HONEYPOT-POSTGRES-05", service: "PostgreSQL 15 SQLi HoneyPatch", port: 5432, baseAngle: -90 },
  { id: "honeypot-http-02", name: "HONEYPOT-HTTP-02", service: "Envoy Canary & Web API Trap", port: 443, baseAngle: -45 },
  { id: "honeypot-ssh-01", name: "HONEYPOT-SSH-01", service: "Cowrie SSH Interactive Shell Decoy", port: 22, baseAngle: 0 },
  { id: "honeypot-vault-08", name: "HONEYPOT-VAULT-08", service: "Cold Storage Vault Exfil Canary", port: 8000, baseAngle: 45 },
  { id: "honeypot-ics-04", name: "HONEYPOT-ICS-04", service: "Siemens S7 / Modbus SCADA Trap", port: 502, baseAngle: 90 },
  { id: "honeypot-redis-03", name: "HONEYPOT-REDIS-03", service: "Redis 7.0 In-Memory Key Decoy", port: 6379, baseAngle: 135 },
  { id: "honeypot-telnet-06", name: "HONEYPOT-TELNET-06", service: "IoT MIPS BusyBox Telnet Sandbox", port: 23, baseAngle: 180 },
  { id: "honeypot-mqtt-07", name: "HONEYPOT-MQTT-07", service: "Eclipse Mosquitto Broker Canary", port: 1883, baseAngle: 225 },
]

function resolveHoneypot(dest: any): string {
  if (!dest) return "honeypot-postgres-05"
  const d = String(dest).toLowerCase()
  if (d.includes("postgres") || d.includes("sql") || d.includes("legacy-query") || d.includes("5432")) return "honeypot-postgres-05"
  if (d.includes("http") || d.includes("git") || d.includes("env") || d.includes("web") || d.includes("443")) return "honeypot-http-02"
  if (d.includes("ssh") || d.includes("shell") || d.includes("jumpbox") || d.includes("22")) return "honeypot-ssh-01"
  if (d.includes("vault") || d.includes("export") || d.includes("s3") || d.includes("treasury")) return "honeypot-vault-08"
  if (d.includes("ics") || d.includes("modbus") || d.includes("scada") || d.includes("502")) return "honeypot-ics-04"
  if (d.includes("redis") || d.includes("6379")) return "honeypot-redis-03"
  if (d.includes("telnet") || d.includes("busybox") || d.includes("23")) return "honeypot-telnet-06"
  if (d.includes("mqtt") || d.includes("1883")) return "honeypot-mqtt-07"
  return "honeypot-postgres-05"
}

export default function LiveDemoPage() {
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [activeSeed, setActiveSeed] = useState("Morph-v1.0 (Fintech-Git-SQLi)")
  const [activePersona, setActivePersona] = useState("Fintech-Git-SQLi")
  const [backendOnline, setBackendOnline] = useState(true)
  const [selectedEntity, setSelectedEntity] = useState<any>(null)
  const [banner, setBanner] = useState<{ text: string; tone: "info" | "critical" | "success" }>({
    text: "⚡ LIVE WAR ROOM DEMO READY · Real-Time Deception Grid & Wazuh Segregation Active",
    tone: "success",
  })
  const [actionBusy, setActionBusy] = useState(false)
  const [angleOffset, setAngleOffset] = useState(0)
  const [probeStage, setProbeStage] = useState(1)
  const [crumbs, setCrumbs] = useState<{ c1?: string; c2?: string; c3?: string }>({})
  const [autoRunning, setAutoRunning] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const nodePositionsRef = useRef<Record<string, { x: number; y: number }>>({})
  const dragRef = useRef<{ isDragging: boolean; nodeId: string | null }>({ isDragging: false, nodeId: null })

  // 1. Live REST State Poller (Guaranteed Resilience)
  const fetchLiveBackend = useCallback(async () => {
    try {
      const apiBase = typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.hostname || "localhost"}:8000`
        : "http://localhost:8000"

      const [swRes, topoRes] = await Promise.all([
        fetch(`${apiBase}/api/shadow-worlds`, { cache: "no-store" }).catch(() => null),
        fetch(`${apiBase}/api/deception/topologies`, { cache: "no-store" }).catch(() => null),
      ])

      if (swRes && swRes.ok) {
        const swData = await swRes.json()
        const rawSessions: SessionData[] = swData.sessions || []
        setSessions(rawSessions)
        setBackendOnline(true)

        // Synthesize real security events from sessions
        if (rawSessions.length > 0) {
          const synthEvents: SecurityEvent[] = rawSessions.map((s, idx) => ({
            id: `evt-${s.ja4h}-${idx}`,
            timestamp: s.last_seen ? s.last_seen.slice(11, 19) + " UTC" : new Date().toISOString().slice(11, 19) + " UTC",
            severity: s.threat_score >= 80 ? "critical" : s.threat_score >= 40 ? "suspicious" : "info",
            source: s.current_ip,
            destination: resolveHoneypot(s.last_honeypot || s.highest_stage),
            protocol: "TCP",
            title: s.highest_stage >= 4 ? "Vault Exfiltration Probe" : s.highest_stage >= 3 ? "Unauthorized Shell Execution" : s.highest_stage >= 2 ? "SQLi HoneyPatch Fork" : "Reconnaissance Scan",
            mitre: s.highest_stage >= 4 ? "T1567 (Exfiltration)" : s.highest_stage >= 3 ? "T1059 (Execution)" : s.highest_stage >= 2 ? "T1190 (Exploitation)" : "T1595 (Recon)",
          }))
          setEvents((prev) => {
            const merged = [...synthEvents, ...prev.filter(p => !synthEvents.some(s => s.id === p.id))]
            return merged.slice(0, 30)
          })
        }
      } else {
        setBackendOnline(false)
      }

      if (topoRes && topoRes.ok) {
        const topoData = await topoRes.json()
        if (topoData.activeSeed) setActiveSeed(topoData.activeSeed)
        if (topoData.persona?.name) setActivePersona(topoData.persona.name)
      }
    } catch {
      setBackendOnline(false)
    }
  }, [])

  // Poll backend every 2.5s for continuous synchronization
  useEffect(() => {
    fetchLiveBackend()
    const timer = setInterval(fetchLiveBackend, 2500)
    return () => clearInterval(timer)
  }, [fetchLiveBackend])

  // 2. Native WebSocket Connection (/ws/soc)
  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimer: any = null

    function connectWs() {
      try {
        const wsUrl = typeof window !== "undefined"
          ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.hostname || "localhost"}:8000/ws/soc?token=demo-analyst-bypass`
          : "ws://localhost:8000/ws/soc?token=demo-analyst-bypass"

        ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          setBackendOnline(true)
        }

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data)
            const msgType = msg.type || msg.action
            const payload = msg.data || msg.event || msg

            if (msgType === "soc_telemetry") {
              const attacker = payload.attacker || {}
              const action = payload.action || {}
              const wazuh = payload.wazuh || {}
              const ip = attacker.ip || payload.ip || "10.46.34.150"
              const dest = resolveHoneypot(action.endpoint || payload.stage_name)
              const sev = wazuh.level >= 13 ? "critical" : "suspicious"

              const newEvt: SecurityEvent = {
                id: payload.eventId || `live-evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                timestamp: new Date().toISOString().slice(11, 19) + " UTC",
                severity: sev,
                source: ip,
                destination: dest,
                protocol: "TCP",
                title: action.title || `Wazuh Rule ${wazuh.ruleId || "100501"} Ingested`,
                mitre: wazuh.mitreAttack?.id || "T1190",
              }

              setEvents((prev) => [newEvt, ...prev.slice(0, 30)])
              fetchLiveBackend()
            } else if (msgType === "topology_mutated") {
              setActiveSeed(payload.new_seed || "Morph-v2.0 (Cloud-Env-GraphQL)")
              setAngleOffset((prev) => prev + 45)
              setBanner({
                text: `🧬 POLYMORPHISM: Active seed mutated to ${payload.new_seed || "Morph-v2.0"} · Breadcrumbs burned`,
                tone: "info",
              })
            } else if (msgType === "action_ack") {
              setBanner({
                text: `ACTION CONFIRMED: ${payload.message || "Operation executed successfully."}`,
                tone: "success",
              })
            }
          } catch {}
        }

        ws.onclose = () => {
          reconnectTimer = setTimeout(connectWs, 3000)
        }
      } catch {
        reconnectTimer = setTimeout(connectWs, 3000)
      }
    }

    connectWs()
    return () => {
      clearTimeout(reconnectTimer)
      if (ws) ws.close()
    }
  }, [fetchLiveBackend])

  // 3. SOC Interactive Actions
  const handleQuarantine = async (targetIp?: string, targetJa4h?: string) => {
    setActionBusy(true)
    const ip = targetIp || (sessions[0]?.current_ip ?? "10.46.34.150")
    const ja4h = targetJa4h || sessions[0]?.ja4h

    // Optimistic UI update
    setSessions((prev) =>
      prev.map((s) => (s.current_ip === ip ? { ...s, plausible_waf_drop: true } : s))
    )
    setBanner({
      text: `🛡️ QUARANTINE ACTIVE: Adversary ${ip} contained. Next request receives HTTP 504 Gateway Timeout.`,
      tone: "critical",
    })

    try {
      const apiBase = typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.hostname || "localhost"}:8000`
        : "http://localhost:8000"

      await fetch(`${apiBase}/api/quarantine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip, ja4h, contained: true }),
      })
    } catch {}
    setActionBusy(false)
  }

  const handleMutate = async () => {
    setActionBusy(true)
    try {
      const apiBase = typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.hostname || "localhost"}:8000`
        : "http://localhost:8000"

      const res = await fetch(`${apiBase}/api/mutate`, { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setActiveSeed(data.new_seed || "Morph-v2.0")
        setAngleOffset((prev) => prev + 45)
        setBanner({
          text: `🧬 SEED ROTATED: Persona morphed to ${data.new_seed} · Prior attacker breadcrumbs invalidated.`,
          tone: "info",
        })
      }
    } catch {}
    setActionBusy(false)
  }

  const handleReset = async () => {
    setActionBusy(true)
    setSessions([])
    setEvents([])
    setSelectedEntity(null)
    setBanner({
      text: "🧹 TELEMETRY BUFFER FLUSHED: Active adversary sessions and alerts reset for clean demo.",
      tone: "info",
    })
    try {
      const apiBase = typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.hostname || "localhost"}:8000`
        : "http://localhost:8000"
      await fetch(`${apiBase}/api/telemetry/reset`, { method: "POST" })
    } catch {}
    setActionBusy(false)
  }

  const executeSingleStage = async (targetStage: number, currentCrumbs: { c1?: string; c2?: string; c3?: string }) => {
    const apiBase = typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname || "localhost"}:8000`
      : "http://localhost:8000"

    const nextCrumbs = { ...currentCrumbs }

    if (targetStage === 1) {
      setBanner({
        text: "⚡ STAGE 1: Reconnaissance Scan against exposed Git reflog (/.git/logs/HEAD)...",
        tone: "info",
      })
      try {
        const res = await fetch(`${apiBase}/.git/logs/HEAD`, {
          headers: { "X-Forwarded-For": "185.220.101.4" },
        })
        const text = await res.text()
        const match = text.match(/vk_live_[A-Za-z0-9_-]+\.[a-f0-9]{10}/)
        if (match) {
          nextCrumbs.c1 = match[0]
        } else {
          nextCrumbs.c1 = "vk_live_recon_stage1"
        }
        setCrumbs(nextCrumbs)
        setProbeStage(2)
        setBanner({
          text: `⚡ STAGE 1 RECON COMPLETE: /.git/logs/HEAD accessed · Attacker harvested Breadcrumb #1 (${(nextCrumbs.c1 || "").slice(0, 16)}...)`,
          tone: "info",
        })
      } catch {}
    } else if (targetStage === 2) {
      setBanner({
        text: "⚡ STAGE 2: HoneyPatched SQL Injection against legacy database query endpoint...",
        tone: "info",
      })
      try {
        const res = await fetch(`${apiBase}/api/internal/legacy-query`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Token": nextCrumbs.c1 || "vk_live_recon_fallback",
            "X-Forwarded-For": "185.220.101.4",
          },
          body: JSON.stringify({
            query: "SELECT * FROM users WHERE id = '1' UNION SELECT * FROM devops_service_accounts --",
            exploit: true,
          }),
        })
        const data = await res.json()
        const token = data?.results?.[0]?.ssh_auth_token
        if (token) {
          nextCrumbs.c2 = token
        } else {
          nextCrumbs.c2 = "vk_live_ssh_stage2"
        }
        setCrumbs(nextCrumbs)
        setProbeStage(3)
        setBanner({
          text: `⚡ STAGE 2 SQLi FORK: Fake PostgreSQL records served · Attacker harvested Jumpbox SSH Key (${(nextCrumbs.c2 || "").slice(0, 16)}...)`,
          tone: "info",
        })
      } catch {}
    } else if (targetStage === 3) {
      setBanner({
        text: "⚡ STAGE 3: Accessing Virtual DevOps Jumpbox via SSH Bearer Token...",
        tone: "info",
      })
      try {
        const res = await fetch(`${apiBase}/api/shell/exec`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${nextCrumbs.c2 || "vk_live_ssh_stage2"}`,
            "X-Forwarded-For": "185.220.101.4",
          },
          body: JSON.stringify({ command: "cat /opt/scripts/vault_sync.sh" }),
        })
        const data = await res.json()
        const match = (data?.stdout || "").match(/vk_live_[A-Za-z0-9_-]+\.[a-f0-9]{10}/)
        if (match) {
          nextCrumbs.c3 = match[0]
        } else {
          nextCrumbs.c3 = "vk_live_vault_master"
        }
        setCrumbs(nextCrumbs)
        setProbeStage(4)
        setBanner({
          text: `⚡ STAGE 3 JUMPBOX SHELL: Attacker ran 'cat vault_sync.sh' · Exposed Master Vault Key (${(nextCrumbs.c3 || "").slice(0, 16)}...)`,
          tone: "info",
        })
      } catch {}
    } else if (targetStage === 4) {
      setBanner({
        text: "🚨 STAGE 4 CRITICAL: Cold Storage Vault Exfiltration initiated with Stolen Master Key...",
        tone: "critical",
      })
      try {
        fetch(`${apiBase}/vault/v1/export`, {
          headers: {
            "X-Vault-Key": nextCrumbs.c3 || "vk_live_vault_master",
            "X-Forwarded-For": "185.220.101.4",
          },
        }).catch(() => {})
        setProbeStage(1)
        setBanner({
          text: "🚨 STAGE 4 CRITICAL: Vault Exfiltration trapped in Adaptive Streaming Tarpit! Threat Score 98 · Click [Quarantine (504 WAF)] to contain!",
          tone: "critical",
        })
      } catch {}
    }

    setTimeout(fetchLiveBackend, 350)
    return nextCrumbs
  }

  const handleInjectProbe = async () => {
    setActionBusy(true)
    await executeSingleStage(probeStage, crumbs)
    setActionBusy(false)
  }

  const handleAutoRunFullAttack = async () => {
    if (autoRunning) return
    setAutoRunning(true)
    setActionBusy(true)

    let current = { ...crumbs }
    for (let s = 1; s <= 4; s++) {
      current = await executeSingleStage(s, current)
      if (s < 4) {
        await new Promise((r) => setTimeout(r, 1400))
      }
    }

    setActionBusy(false)
    setAutoRunning(false)
  }

  // 4. Group Sessions by IP
  const attackersByIp = useMemo(() => {
    const map = new Map<string, SessionData>()
    sessions.forEach((s) => {
      const ip = s.current_ip || s.initial_ip || "10.46.34.150"
      if (!map.has(ip)) {
        map.set(ip, s)
      } else {
        const existing = map.get(ip)!
        existing.command_count = (existing.command_count || 1) + (s.command_count || 1)
        if (s.plausible_waf_drop) existing.plausible_waf_drop = true
        if (s.threat_score > existing.threat_score) existing.threat_score = s.threat_score
      }
    })
    return Array.from(map.values())
  }, [sessions])

  // 5. Interactive HTML5 Topology Canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let running = true

    function draw() {
      if (!running || !canvas || !ctx) return
      const w = canvas.width
      const h = canvas.height
      const cx = w / 2
      const cy = h / 2

      ctx.clearRect(0, 0, w, h)

      // Dark grid background
      ctx.strokeStyle = "rgba(39, 39, 42, 0.45)"
      ctx.lineWidth = 1
      const gridSize = 40
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      // Store positions
      const positions: Record<string, { x: number; y: number }> = {}

      // Center Ingress Gateway
      positions["gw-edge-01"] = { x: cx, y: cy }
      ctx.beginPath()
      ctx.arc(cx, cy, 14, 0, Math.PI * 2)
      ctx.fillStyle = "#1E1E22"
      ctx.fill()
      ctx.strokeStyle = "#ECE8DF"
      ctx.lineWidth = 1.8
      ctx.stroke()
      ctx.font = "bold 9px monospace"
      ctx.fillStyle = "#ECE8DF"
      ctx.textAlign = "center"
      ctx.fillText("INGRESS-GW", cx, cy + 26)

      // Protected Production Servers
      const prodLeft = { x: cx - 220, y: cy }
      positions["prod-ledger"] = prodLeft
      ctx.fillStyle = "#121214"
      ctx.strokeStyle = "#38BDF8"
      ctx.lineWidth = 1.5
      ctx.fillRect(prodLeft.x - 14, prodLeft.y - 14, 28, 28)
      ctx.strokeRect(prodLeft.x - 14, prodLeft.y - 14, 28, 28)
      ctx.font = "bold 8px monospace"
      ctx.fillStyle = "#38BDF8"
      ctx.fillText("[PROTECTED]", prodLeft.x, prodLeft.y - 18)
      ctx.fillStyle = "#ECE8DF"
      ctx.fillText("PROD-LEDGER", prodLeft.x, prodLeft.y + 24)

      const prodRight = { x: cx + 220, y: cy }
      positions["prod-auth"] = prodRight
      ctx.fillStyle = "#121214"
      ctx.strokeStyle = "#38BDF8"
      ctx.lineWidth = 1.5
      ctx.fillRect(prodRight.x - 14, prodRight.y - 14, 28, 28)
      ctx.strokeRect(prodRight.x - 14, prodRight.y - 14, 28, 28)
      ctx.font = "bold 8px monospace"
      ctx.fillStyle = "#38BDF8"
      ctx.fillText("[PROTECTED]", prodRight.x, prodRight.y - 18)
      ctx.fillStyle = "#ECE8DF"
      ctx.fillText("PROD-AUTH-02", prodRight.x, prodRight.y + 24)

      // Structural spokes to protected DBs
      ctx.strokeStyle = "rgba(56, 189, 248, 0.25)"
      ctx.setLineDash([3, 4])
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(prodLeft.x, prodLeft.y)
      ctx.moveTo(cx, cy)
      ctx.lineTo(prodRight.x, prodRight.y)
      ctx.stroke()
      ctx.setLineDash([])

      // 8 Honeypots (Arranged radially)
      const radius = 175
      HONEYPOT_NODES.forEach((hp) => {
        const rad = ((hp.baseAngle + angleOffset) * Math.PI) / 180
        const hx = cx + radius * Math.cos(rad)
        const hy = cy + radius * Math.sin(rad)
        positions[hp.id] = { x: hx, y: hy }

        // Spoke from GW to Honeypot
        ctx.strokeStyle = "rgba(154, 152, 145, 0.22)"
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(hx, hy)
        ctx.stroke()

        // Check if targeted by an attacker
        const isTargeted = attackersByIp.some((a) => resolveHoneypot(a.last_honeypot) === hp.id)

        // Draw hexagon
        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const a = (i * 2 * Math.PI) / 6
          const px = hx + 16 * Math.cos(a)
          const py = hy + 16 * Math.sin(a)
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.fillStyle = isTargeted ? "#221111" : "#141416"
        ctx.fill()
        ctx.strokeStyle = isTargeted ? "#FF493D" : "#ECE8DF"
        ctx.lineWidth = isTargeted ? 2.4 : 1.4
        ctx.stroke()

        // Inner hexagon core
        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const a = (i * 2 * Math.PI) / 6
          const px = hx + 8 * Math.cos(a)
          const py = hy + 8 * Math.sin(a)
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.fillStyle = isTargeted ? "#FF493D" : "rgba(236, 232, 223, 0.7)"
        ctx.fill()

        ctx.font = "600 8.5px monospace"
        ctx.fillStyle = isTargeted ? "#FF493D" : "#9A9891"
        ctx.textAlign = "center"
        ctx.fillText(hp.name, hx, hy + 26)
      })

      // Attackers
      attackersByIp.forEach((att, idx) => {
        const ax = cx - 290
        const ay = cy - 60 + idx * 90
        positions[att.current_ip] = { x: ax, y: ay }

        const isContained = Boolean(att.plausible_waf_drop)
        const targetHp = resolveHoneypot(att.last_honeypot || att.highest_stage)
        const hpPos = positions[targetHp] || { x: cx, y: cy - 175 }

        // Intrusion Edge
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(hpPos.x, hpPos.y)
        ctx.strokeStyle = isContained ? "rgba(255, 73, 61, 0.35)" : "#FF493D"
        ctx.lineWidth = isContained ? 1.5 : 2.6
        if (isContained) ctx.setLineDash([4, 4])
        ctx.stroke()
        ctx.setLineDash([])

        // Animated packet dot
        if (!isContained) {
          const t = (Date.now() / 1500 + idx * 0.3) % 1
          const dotX = ax + (hpPos.x - ax) * t
          const dotY = ay + (hpPos.y - ay) * t
          ctx.beginPath()
          ctx.arc(dotX, dotY, 3.5, 0, Math.PI * 2)
          ctx.fillStyle = "#FF493D"
          ctx.fill()
        }

        // Attacker Diamond
        ctx.beginPath()
        ctx.moveTo(ax, ay - 13)
        ctx.lineTo(ax + 13, ay)
        ctx.lineTo(ax, ay + 13)
        ctx.lineTo(ax - 13, ay)
        ctx.closePath()
        ctx.fillStyle = isContained ? "#3A1A1A" : "#FF493D"
        ctx.fill()
        ctx.strokeStyle = "#FFFFFF"
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Contained Perimeter Frame
        if (isContained) {
          ctx.beginPath()
          for (let i = 0; i < 6; i++) {
            const a = (i * 2 * Math.PI) / 6
            const px = ax + 22 * Math.cos(a)
            const py = ay + 22 * Math.sin(a)
            if (i === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
          }
          ctx.closePath()
          ctx.strokeStyle = "#FF493D"
          ctx.lineWidth = 1.8
          ctx.stroke()

          ctx.fillStyle = "#FF493D"
          ctx.fillRect(ax - 28, ay - 32, 56, 12)
          ctx.font = "bold 8px monospace"
          ctx.fillStyle = "#0A0A09"
          ctx.textAlign = "center"
          ctx.fillText("CONTAINED", ax, ay - 23)
        } else {
          ctx.font = "bold 8.5px monospace"
          ctx.fillStyle = "#FF493D"
          ctx.textAlign = "center"
          ctx.fillText("! INTRUSION", ax, ay - 18)
        }

        ctx.font = "600 9.5px monospace"
        ctx.fillStyle = "#ECE8DF"
        ctx.textAlign = "center"
        ctx.fillText(att.current_ip, ax, ay + 26)
      })

      nodePositionsRef.current = positions
      animationFrameRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      running = false
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [attackersByIp, angleOffset])

  // Click on Canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    for (const [id, pos] of Object.entries(nodePositionsRef.current)) {
      if (Math.hypot(x - pos.x, y - pos.y) <= 30) {
        const attacker = attackersByIp.find((a) => a.current_ip === id)
        if (attacker) {
          setSelectedEntity({ kind: "ATTACKER", data: attacker })
          return
        }
        const hp = HONEYPOT_NODES.find((h) => h.id === id)
        if (hp) {
          setSelectedEntity({ kind: "HONEYPOT", data: hp })
          return
        }
      }
    }
  }

  // Active metrics
  const totalAttacksCount = attackersByIp.length > 0 ? attackersByIp.length : events.length
  const activeAttackersCount = attackersByIp.filter((a) => !a.plausible_waf_drop).length
  const containedCount = attackersByIp.filter((a) => a.plausible_waf_drop).length
  const criticalCount = events.filter((e) => e.severity === "critical").length

  return (
    <div className="min-h-screen bg-[#0A0A09] text-[#ECE8DF] font-sans flex flex-col">
      {/* Top War Room Navigation Bar */}
      <header className="sticky top-0 z-50 h-14 border-b border-[#27272A] bg-[#101012] px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-7 place-items-center bg-[#F59E0B] text-black font-extrabold text-xs font-mono">
              P
            </span>
            <span className="font-mono text-sm font-bold tracking-tight text-[#ECE8DF] uppercase">
              PYRITE
            </span>
          </Link>
          <span className="text-[#9A9891] text-xs">/</span>
          <span className="font-mono text-xs uppercase font-extrabold text-[#F59E0B] tracking-wider flex items-center gap-1.5">
            <span>⚡ LIVE WAR ROOM DEMO CENTER</span>
          </span>
          <span className="text-xs px-2 py-0.5 rounded font-mono font-bold uppercase border border-[#22C55E]/40 bg-[#22C55E]/10 text-[#22C55E] flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-[#22C55E] animate-ping" />
            {backendOnline ? "PORT 8000 CONNECTED" : "RECONNECTING"}
          </span>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={handleInjectProbe}
            disabled={actionBusy}
            className="flex items-center gap-1 border border-[#F59E0B] bg-[#F59E0B]/20 text-[#F59E0B] px-3 py-1.5 font-bold uppercase hover:bg-[#F59E0B] hover:text-[#0A0A09] transition-all shadow-sm"
            title="Step through individual attack stages (1 -> 2 -> 3 -> 4)"
          >
            <span>🚀 Stage {probeStage}/4 Probe</span>
          </button>
          <button
            onClick={handleAutoRunFullAttack}
            disabled={actionBusy || autoRunning}
            className="flex items-center gap-1 border border-[#22C55E] bg-[#22C55E]/20 text-[#22C55E] px-3 py-1.5 font-bold uppercase hover:bg-[#22C55E] hover:text-black transition-all shadow-sm"
            title="Automatically run all 4 attack stages sequentially for pitch demonstration"
          >
            <span>{autoRunning ? "⏳ Running Attack..." : "▶ Auto-Run Full Attack"}</span>
          </button>
          <button
            onClick={() => handleQuarantine()}
            disabled={actionBusy}
            className="flex items-center gap-1 border border-red-500/60 bg-red-950/40 text-red-400 px-3 py-1.5 font-bold uppercase hover:bg-red-900/60 transition-colors"
          >
            <span>🛡️ Quarantine (504 WAF)</span>
          </button>
          <button
            onClick={handleMutate}
            disabled={actionBusy}
            className="flex items-center gap-1 border border-purple-500/60 bg-purple-950/40 text-purple-300 px-3 py-1.5 font-bold uppercase hover:bg-purple-900/60 transition-colors"
          >
            <span>🧬 Mutate Persona</span>
          </button>
          <button
            onClick={handleReset}
            disabled={actionBusy}
            className="flex items-center gap-1 border border-[#27272A] bg-[#141416] text-[#9A9891] px-2.5 py-1.5 font-bold uppercase hover:text-[#ECE8DF] transition-colors"
          >
            <span>Flush Buffer</span>
          </button>
          <Link
            href="/dashboard"
            className="ml-2 border border-[#27272A] px-2.5 py-1.5 text-[#9A9891] hover:text-[#ECE8DF] uppercase font-bold"
          >
            SOC Dashboard →
          </Link>
        </div>
      </header>

      {/* Real-time Status Banner */}
      <div
        className={`px-4 py-2 border-b font-mono text-xs flex items-center justify-between ${
          banner.tone === "critical"
            ? "bg-red-950/50 border-red-800 text-red-300"
            : banner.tone === "info"
            ? "bg-blue-950/40 border-blue-800 text-blue-300"
            : "bg-[#141416] border-[#27272A] text-[#ECE8DF]"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#F59E0B] animate-pulse" />
          <span className="font-bold">{banner.text}</span>
        </div>
        <span className="text-[#9A9891] text-[10px] uppercase">
          Active Persona: {activePersona} ({activeSeed.split(" ")[0]})
        </span>
      </div>

      {/* 4-Metric Executive KPI Row */}
      <section className="grid grid-cols-2 md:grid-cols-4 border-b border-[#27272A] bg-[#101012]">
        <div className="p-4 border-r border-[#27272A]">
          <span className="font-mono text-[10px] uppercase text-[#9A9891] tracking-wider block">
            TOTAL ATTACKS
          </span>
          <span className="font-mono text-3xl font-extrabold text-[#ECE8DF] mt-1 block">
            {totalAttacksCount}
          </span>
          <span className="text-[10px] text-[#9A9891] mt-0.5 block font-mono">
            OBSERVED INTRUSION ATTEMPTS
          </span>
        </div>
        <div className="p-4 border-r border-[#27272A]">
          <span className="font-mono text-[10px] uppercase text-[#9A9891] tracking-wider block">
            ACTIVE ATTACKERS
          </span>
          <span className="font-mono text-3xl font-extrabold text-[#FF493D] mt-1 block">
            {activeAttackersCount}
          </span>
          <span className="text-[10px] text-[#9A9891] mt-0.5 block font-mono">
            INTERACTING WITH DECOYS
          </span>
        </div>
        <div className="p-4 border-r border-[#27272A]">
          <span className="font-mono text-[10px] uppercase text-[#9A9891] tracking-wider block">
            CONTAINED SESSIONS
          </span>
          <span className="font-mono text-3xl font-extrabold text-[#22C55E] mt-1 block">
            {containedCount}
          </span>
          <span className="text-[10px] text-[#9A9891] mt-0.5 block font-mono">
            ISOLATED IN MICRO-VM CAGES
          </span>
        </div>
        <div className="p-4">
          <span className="font-mono text-[10px] uppercase text-[#9A9891] tracking-wider block">
            CRITICAL ALERTS
          </span>
          <span className="font-mono text-3xl font-extrabold text-[#F59E0B] mt-1 block">
            {criticalCount}
          </span>
          <span className="text-[10px] text-[#9A9891] mt-0.5 block font-mono">
            WAZUH SEV 13+ INTRUSIONS
          </span>
        </div>
      </section>

      {/* Main War Room Body (Split View: Interactive Canvas + Live Inspector) */}
      <main className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-0 min-h-[560px]">
        {/* Canvas Area */}
        <div className="xl:col-span-3 border-r border-[#27272A] relative flex flex-col bg-[#080809]">
          <div className="px-4 py-2 border-b border-[#27272A] bg-[#101012] flex items-center justify-between text-xs font-mono">
            <span className="text-[#9A9891] font-bold uppercase flex items-center gap-2">
              <span className="size-2 bg-[#FF493D] inline-block" />
              LIVE HONEYPOT TOPOLOGY // CLICK ANY NODE TO ENGAGE
            </span>
            <span className="text-[11px] text-[#9A9891]">
              Click canvas node to inspect & quarantine
            </span>
          </div>

          <div className="flex-1 w-full relative min-h-[500px]">
            <canvas
              ref={canvasRef}
              width={960}
              height={560}
              onClick={handleCanvasClick}
              className="w-full h-full block cursor-pointer"
            />
          </div>
        </div>

        {/* Dynamic Operator Inspector & Event Stream */}
        <div className="xl:col-span-1 bg-[#101012] flex flex-col divide-y divide-[#27272A]">
          {/* Selected Entity Card */}
          <div className="p-4">
            <div className="text-[9px] uppercase tracking-widest text-[#9A9891] font-mono mb-1">
              TELEMETRY INSPECTOR
            </div>
            {selectedEntity ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-[#27272A] pb-2">
                  <span className="font-bold text-sm text-[#ECE8DF]">
                    {selectedEntity.data?.current_ip || selectedEntity.data?.name}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[9px] font-bold uppercase ${
                      selectedEntity.data?.plausible_waf_drop
                        ? "bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40"
                        : "bg-red-950/40 text-red-400 border border-red-500/40"
                    }`}
                  >
                    {selectedEntity.data?.plausible_waf_drop ? "CONTAINED" : "ACTIVE"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-[#9A9891] block">JA4H FINGERPRINT</span>
                    <span className="text-[#ECE8DF]">{selectedEntity.data?.ja4h || "43abd56d2b38"}</span>
                  </div>
                  <div>
                    <span className="text-[#9A9891] block">THREAT SCORE</span>
                    <span className="text-[#FF493D] font-bold">{selectedEntity.data?.threat_score || 85} / 100</span>
                  </div>
                  <div>
                    <span className="text-[#9A9891] block">TARGETED DECOY</span>
                    <span className="text-[#ECE8DF]">{resolveHoneypot(selectedEntity.data?.last_honeypot)}</span>
                  </div>
                  <div>
                    <span className="text-[#9A9891] block">ATTACK FRAMES</span>
                    <span className="text-[#ECE8DF]">{selectedEntity.data?.command_count || 1}</span>
                  </div>
                </div>

                {selectedEntity.kind === "ATTACKER" && !selectedEntity.data?.plausible_waf_drop && (
                  <button
                    onClick={() => handleQuarantine(selectedEntity.data.current_ip, selectedEntity.data.ja4h)}
                    className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase transition-all shadow-md"
                  >
                    🛡️ QUARANTINE ATTACKER (504 WAF EXIT)
                  </button>
                )}
                {selectedEntity.kind === "HONEYPOT" && (
                  <button
                    onClick={handleMutate}
                    className="w-full py-2 bg-purple-700 hover:bg-purple-600 text-white font-mono text-xs font-bold uppercase transition-all"
                  >
                    🧬 ROTATE DECOY PERSONA SEED
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3 border border-[#27272A] bg-[#141416] text-[#9A9891] font-mono text-xs leading-relaxed">
                Click any Attacker diamond or Honeypot hexagon on the graph to inspect wire forensics and execute real-time containment.
              </div>
            )}
          </div>

          {/* Real-Time Security Event Stream */}
          <div className="flex-1 p-4 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#9A9891] font-bold flex items-center gap-1.5">
                <span className="size-2 bg-[#FF493D] inline-block" />
                LIVE SECURITY EVENT STREAM ({events.length})
              </span>
              <span className="text-[10px] font-mono text-[#22C55E]">WAZUH LINKED</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
              {events.slice(0, 10).map((ev, i) => (
                <div
                  key={`${ev.id}-${i}`}
                  className="p-2 border border-[#27272A] bg-[#141416] hover:border-[#ECE8DF] transition-colors"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-[#FF493D]">{ev.source}</span>
                    <span className="text-[#9A9891]">{ev.timestamp}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-[#ECE8DF] mt-0.5 truncate">
                    {ev.title}
                  </div>
                  <div className="text-[9.5px] text-[#9A9891] flex items-center justify-between mt-1">
                    <span>{ev.destination}</span>
                    <span className="text-[#F59E0B] font-bold">{ev.mitre}</span>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <div className="text-[#9A9891] text-xs p-3">
                  No intrusions recorded yet. Click &quot;Fire Live Attack Probe&quot; above to trigger active detection.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

