"use client"

import * as React from "react"
import {
  Crosshair,
  Terminal,
  ShieldAlert,
  Zap,
  Globe,
  Users,
  Copy,
  Check,
  Play,
  RotateCcw,
  X,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  AlertTriangle,
  Lock,
  Unlock,
} from "lucide-react"
import { usePyriteTelemetry } from "@/hooks/usePyriteTelemetry"
import { cn } from "@/lib/utils"

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000"

export function RedTeamAttackConsole({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { refresh, activeSeed, activePersona } = usePyriteTelemetry()

  // Attacker configuration
  const [attackerIp, setAttackerIp] = React.useState("185.220.101.4")
  const [fingerprintOverride, setFingerprintOverride] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<"chain" | "terminal" | "adversaries">("chain")

  // Harvested Pyrite Nuggets (Crumbs)
  const [crumb1, setCrumb1] = React.useState<string>("")
  const [crumb1Decoded, setCrumb1Decoded] = React.useState<any>(null)
  const [crumb2, setCrumb2] = React.useState<string>("")
  const [crumb3, setCrumb3] = React.useState<string>("")

  // Stage 1 State
  const [stage1Loading, setStage1Loading] = React.useState(false)
  const [stage1Raw, setStage1Raw] = React.useState<string>("")

  // Stage 2 State
  const [stage2Query, setStage2Query] = React.useState(
    "SELECT * FROM users WHERE id = '1' UNION SELECT username, ssh_auth_token FROM devops_service_accounts --"
  )
  const [stage2Loading, setStage2Loading] = React.useState(false)
  const [stage2Output, setStage2Output] = React.useState<any>(null)

  // Stage 3 Shell State
  const [terminalHistory, setTerminalHistory] = React.useState<
    Array<{ cmd: string; stdout: string; stderr?: string; zeroDay?: any }>
  >([
    {
      cmd: "whoami",
      stdout: "deployer\n",
    },
    {
      cmd: "hostname",
      stdout: "devops-jumpbox-01\n",
    },
  ])
  const [currentCmd, setCurrentCmd] = React.useState("")
  const [terminalLoading, setTerminalLoading] = React.useState(false)

  // Stage 4 Tarpit State
  const [tarpitStreaming, setTarpitStreaming] = React.useState(false)
  const [tarpitBytes, setTarpitBytes] = React.useState(0)
  const [tarpitChunks, setTarpitChunks] = React.useState(0)
  const [tarpitSpeed, setTarpitSpeed] = React.useState(0)
  const [tarpitElapsed, setTarpitElapsed] = React.useState(0)
  const [wafDropHit, setWafDropHit] = React.useState(false)
  const tarpitAbortRef = React.useRef<AbortController | null>(null)

  // Copy helper
  const [copiedToken, setCopiedToken] = React.useState<string | null>(null)
  const copyToClipboard = (token: string, name: string) => {
    navigator.clipboard.writeText(token)
    setCopiedToken(name)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  // Base request headers
  const getHeaders = (extra: Record<string, string> = {}) => {
    const headers: Record<string, string> = {
      "User-Agent": "curl/7.88.1 (x86_64-pc-linux-gnu) libcurl/7.88.1 OpenSSL/3.0.8",
      "Accept": "application/json, text/plain, */*",
      "X-Forwarded-For": attackerIp,
      ...extra,
    }
    if (fingerprintOverride) {
      headers["X-Client-Fingerprint"] = fingerprintOverride
    }
    return headers
  }

  // Helper to decode Pyrite Nugget (Stateless HMAC crumb)
  const decodePyriteNugget = (rawToken: string) => {
    try {
      const parts = rawToken.replace("vk_live_", "").split(".")
      if (parts[0]) {
        let b64 = parts[0].replace(/-/g, "+").replace(/_/g, "/")
        while (b64.length % 4) b64 += "="
        const decoded = JSON.parse(atob(b64))
        return { ...decoded, hmacSignature: parts[1] }
      }
    } catch (e) {
      console.warn("Nugget decode failed:", e)
    }
    return null
  }

  // STAGE 1: Recon Probe
  const handleStage1Recon = async () => {
    setStage1Loading(true)
    setStage1Raw("")
    const endpoint = activePersona?.stage1_endpoint || "/.git/logs/HEAD"
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: getHeaders(),
      })
      const text = await res.text()
      setStage1Raw(text)

      const match = text.match(/vk_live_[A-Za-z0-9_-]+\.[a-f0-9]{10}/)
      if (match) {
        const token = match[0]
        setCrumb1(token)
        const parsed = decodePyriteNugget(token)
        setCrumb1Decoded(parsed)
      }
      refresh()
    } catch (err: any) {
      setStage1Raw(`Error: ${err.message}`)
    } finally {
      setStage1Loading(false)
    }
  }

  // STAGE 2: HoneyPatch SQLi Injector
  const handleStage2SQLi = async () => {
    setStage2Loading(true)
    setStage2Output(null)
    const endpoint = activePersona?.stage2_endpoint || "/api/internal/legacy-query"
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: getHeaders({
          "Content-Type": "application/json",
          "X-Debug-Token": crumb1 || "vk_live_fallback",
        }),
        body: JSON.stringify({
          query: stage2Query,
          exploit: true,
        }),
      })
      const data = await res.json()
      setStage2Output(data)

      const dumpedToken = data?.results?.[0]?.ssh_auth_token
      if (dumpedToken) {
        setCrumb2(dumpedToken)
      }
      refresh()
    } catch (err: any) {
      setStage2Output({ error: err.message })
    } finally {
      setStage2Loading(false)
    }
  }

  // STAGE 3: Shadow Shell Exec
  const handleExecCommand = async (e?: React.FormEvent, directCmd?: string) => {
    if (e) e.preventDefault()
    const cmd = directCmd || currentCmd
    if (!cmd.trim()) return

    setTerminalLoading(true)
    if (!directCmd) setCurrentCmd("")

    try {
      const res = await fetch(`${API_BASE}/api/shell/exec`, {
        method: "POST",
        headers: getHeaders({
          "Content-Type": "application/json",
          "Authorization": `Bearer ${crumb2 || crumb1 || "vk_live_fallback"}`,
        }),
        body: JSON.stringify({ command: cmd }),
      })
      const data = await res.json()

      const newEntry = {
        cmd,
        stdout: data.stdout || "",
        stderr: data.stderr || "",
        zeroDay: data.zero_day_eval,
      }
      setTerminalHistory((prev) => [...prev, newEntry])

      // Auto-extract Crumb #3 if found in stdout
      const match = (data.stdout || "").match(/vk_live_[A-Za-z0-9_-]+\.[a-f0-9]{10}/)
      if (match && !crumb3) {
        setCrumb3(match[0])
      }
      refresh()
    } catch (err: any) {
      setTerminalHistory((prev) => [
        ...prev,
        { cmd, stdout: "", stderr: `Execution failed: ${err.message}` },
      ])
    } finally {
      setTerminalLoading(false)
    }
  }

  // STAGE 4: Live Chunked Tarpit Exfiltration
  const handleStartTarpitStream = async () => {
    if (tarpitStreaming) {
      tarpitAbortRef.current?.abort()
      setTarpitStreaming(false)
      return
    }

    setTarpitStreaming(true)
    setTarpitBytes(0)
    setTarpitChunks(0)
    setWafDropHit(false)

    const controller = new AbortController()
    tarpitAbortRef.current = controller
    const startTime = Date.now()
    const endpoint = activePersona?.stage4_endpoint || "/vault/v1/export"

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: getHeaders({
          "X-Vault-Key": crumb3 || crumb2 || "vk_live_fallback",
        }),
        signal: controller.signal,
      })

      if (res.status === 504) {
        setWafDropHit(true)
        setTarpitStreaming(false)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) return

      let totalReceived = 0
      let chunksCount = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        totalReceived += value.length
        chunksCount += 1
        const elapsed = Math.max(0.1, (Date.now() - startTime) / 1000)

        setTarpitBytes(totalReceived)
        setTarpitChunks(chunksCount)
        setTarpitElapsed(elapsed)
        setTarpitSpeed(totalReceived / elapsed / 1024)

        const textChunk = new TextDecoder().decode(value)
        if (textChunk.includes("AWS WAF ERROR 504") || textChunk.includes("504 Gateway Timeout")) {
          setWafDropHit(true)
          break
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Tarpit stream failed:", err)
      }
    } finally {
      setTarpitStreaming(false)
      refresh()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[580px] flex-col border-l border-ink/20 bg-[#0E0F12] text-ink shadow-2xl transition-all duration-300">
      {/* Drawer Header */}
      <div className="flex h-14 items-center justify-between border-b border-ink/15 px-4 bg-[#141519]">
        <div className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center bg-signal text-black font-bold">
            ⚔️
          </span>
          <div>
            <h2 className="text-xs font-bold tracking-wider uppercase text-ink">
              LIVE RED-TEAM ATTACK CONSOLE
            </h2>
            <p className="font-mono text-[9px] tracking-widest text-[#F59E0B] uppercase">
              PYRITE // FeS₂ Adversary Harness
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-mono text-[9px] text-[#22C55E] uppercase border border-[#22C55E]/30 bg-[#22C55E]/10 px-2 py-0.5">
            <span className="size-1.5 rounded-full bg-[#22C55E] animate-ping" />
            DIRECT HTTP (8000)
          </span>
          <button
            onClick={onClose}
            className="grid size-7 place-items-center border border-ink/20 text-muted-ink hover:text-ink hover:bg-surface"
            aria-label="Close attack console"
          >
            <X className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Attacker Context Bar */}
      <div className="grid grid-cols-2 gap-2 border-b border-ink/15 bg-[#121316] p-3 font-mono text-[10px]">
        <div>
          <span className="text-muted-ink">ATTACKER IP:</span>
          <span className="ml-1.5 font-bold text-signal">{attackerIp}</span>
        </div>
        <div>
          <span className="text-muted-ink">JA4H FINGERPRINT:</span>
          <span className="ml-1.5 text-muted-ink">
            {fingerprintOverride || "Default (Curl 7.88.1)"}
          </span>
        </div>
        <div className="col-span-2">
          <span className="text-muted-ink">ACTIVE TOPOLOGY:</span>
          <span className="ml-1.5 font-bold text-[#F59E0B]">{activeSeed}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-ink/15 bg-[#141519] font-mono text-[10px] uppercase">
        <button
          onClick={() => setActiveTab("chain")}
          className={cn(
            "flex-1 py-2.5 text-center font-medium transition-colors border-r border-ink/15",
            activeTab === "chain"
              ? "bg-[#0E0F12] text-signal font-bold border-b-2 border-b-signal"
              : "text-muted-ink hover:text-ink"
          )}
        >
          4-Stage Chain
        </button>
        <button
          onClick={() => setActiveTab("terminal")}
          className={cn(
            "flex-1 py-2.5 text-center font-medium transition-colors border-r border-ink/15",
            activeTab === "terminal"
              ? "bg-[#0E0F12] text-signal font-bold border-b-2 border-b-signal"
              : "text-muted-ink hover:text-ink"
          )}
        >
          Interactive Shell
        </button>
        <button
          onClick={() => setActiveTab("adversaries")}
          className={cn(
            "flex-1 py-2.5 text-center font-medium transition-colors",
            activeTab === "adversaries"
              ? "bg-[#0E0F12] text-signal font-bold border-b-2 border-b-signal"
              : "text-muted-ink hover:text-ink"
          )}
        >
          Syndicate & Toggles
        </button>
      </div>

      {/* Main Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "chain" && (
          <div className="space-y-4">
            {/* STAGE 1: RECON */}
            <div className="border border-ink/20 bg-[#141519] p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] bg-ink/10 text-[#F59E0B] border border-[#F59E0B]/30 px-1.5 py-0.5 font-bold">
                    STAGE 01
                  </span>
                  <h3 className="text-xs font-bold uppercase">Git / Env Leak Scan</h3>
                </div>
                <button
                  onClick={handleStage1Recon}
                  disabled={stage1Loading}
                  className="flex items-center gap-1.5 bg-signal text-black px-2.5 py-1 text-[10px] font-bold font-mono uppercase hover:brightness-110 disabled:opacity-50"
                >
                  <Play className="size-3 fill-current" />
                  {stage1Loading ? "Scanning..." : "Execute GET Probe"}
                </button>
              </div>

              <div className="font-mono text-[10px] text-muted-ink space-y-1">
                <p>Target: GET {activePersona?.stage1_endpoint || "/.git/logs/HEAD"}</p>
                {crumb1 && (
                  <div className="p-2 border border-[#22C55E]/30 bg-[#22C55E]/10 text-ink space-y-1 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#22C55E] font-bold flex items-center gap-1">
                        <Check className="size-3" /> Pyrite Nugget #1 Harvested:
                      </span>
                      <button
                        onClick={() => copyToClipboard(crumb1, "c1")}
                        className="text-[9px] text-muted-ink hover:text-ink flex items-center gap-1"
                      >
                        <Copy className="size-2.5" />
                        {copiedToken === "c1" ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="truncate text-signal font-mono text-[9px]">{crumb1}</p>
                    {crumb1Decoded && (
                      <div className="pt-1.5 border-t border-ink/10 text-[9px] space-y-0.5 text-muted-ink">
                        <span className="text-[#F59E0B] font-bold">Decoded Nugget JSON:</span>
                        <pre className="text-[8.5px] text-ink overflow-x-auto">
                          {JSON.stringify(crumb1Decoded, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* STAGE 2: HONEYPATCH SQLI */}
            <div className="border border-ink/20 bg-[#141519] p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] bg-ink/10 text-signal border border-signal/30 px-1.5 py-0.5 font-bold">
                    STAGE 02
                  </span>
                  <h3 className="text-xs font-bold uppercase">HoneyPatch SQLi Session Fork</h3>
                </div>
                <button
                  onClick={handleStage2SQLi}
                  disabled={stage2Loading}
                  className="flex items-center gap-1.5 bg-signal text-black px-2.5 py-1 text-[10px] font-bold font-mono uppercase hover:brightness-110 disabled:opacity-50"
                >
                  <Play className="size-3 fill-current" />
                  {stage2Loading ? "Injecting..." : "Inject Payload"}
                </button>
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[9px] text-muted-ink uppercase block">
                  SQL Payload (HoneyPatch Intercept):
                </label>
                <textarea
                  value={stage2Query}
                  onChange={(e) => setStage2Query(e.target.value)}
                  rows={2}
                  className="w-full bg-[#0E0F12] border border-ink/20 p-2 font-mono text-[10px] text-ink resize-none focus:outline-none focus:border-signal"
                />
              </div>

              {crumb2 && (
                <div className="p-2 border border-[#22C55E]/30 bg-[#22C55E]/10 text-ink space-y-1 font-mono text-[9px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#22C55E] font-bold flex items-center gap-1">
                      <Check className="size-3" /> DevOps SSH Nugget #2 Harvested:
                    </span>
                    <button
                      onClick={() => copyToClipboard(crumb2, "c2")}
                      className="text-[9px] text-muted-ink hover:text-ink flex items-center gap-1"
                    >
                      <Copy className="size-2.5" />
                      {copiedToken === "c2" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="truncate text-signal">{crumb2}</p>
                </div>
              )}
            </div>

            {/* STAGE 3: SHADOW SHELL QUICK LAUNCH */}
            <div className="border border-ink/20 bg-[#141519] p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] bg-ink/10 text-[#3B82F6] border border-[#3B82F6]/30 px-1.5 py-0.5 font-bold">
                    STAGE 03
                  </span>
                  <h3 className="text-xs font-bold uppercase">DevOps Jumpbox Shadow Shell</h3>
                </div>
                <button
                  onClick={() => setActiveTab("terminal")}
                  className="text-signal hover:underline font-mono text-[10px] uppercase flex items-center gap-1"
                >
                  Open Full Terminal <ArrowRight className="size-3" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  "whoami",
                  "id",
                  "cat .bash_history",
                  "cat /opt/scripts/vault_sync.sh",
                  "cat /proc/1/cgroup",
                  "ls /.dockerenv",
                ].map((c) => (
                  <button
                    key={c}
                    onClick={() => handleExecCommand(undefined, c)}
                    disabled={terminalLoading}
                    className="border border-ink/20 bg-[#0E0F12] px-2 py-1 font-mono text-[9px] text-muted-ink hover:text-ink hover:border-signal"
                  >
                    $ {c}
                  </button>
                ))}
              </div>

              {crumb3 && (
                <div className="p-2 border border-[#22C55E]/30 bg-[#22C55E]/10 text-ink space-y-1 font-mono text-[9px]">
                  <span className="text-[#22C55E] font-bold flex items-center gap-1">
                    <Check className="size-3" /> Cold Vault Master Key (Nugget #3) Discovered:
                  </span>
                  <p className="truncate text-signal">{crumb3}</p>
                </div>
              )}
            </div>

            {/* STAGE 4: LIVE TARPIT EXFILTRATION */}
            <div className="border border-ink/20 bg-[#141519] p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] bg-ink/10 text-[#EF4444] border border-[#EF4444]/30 px-1.5 py-0.5 font-bold">
                    STAGE 04
                  </span>
                  <h3 className="text-xs font-bold uppercase">Cold Vault Streaming Tarpit</h3>
                </div>
                <button
                  onClick={handleStartTarpitStream}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold font-mono uppercase transition-colors",
                    tarpitStreaming
                      ? "bg-red-600 text-white animate-pulse"
                      : "bg-[#F59E0B] text-black hover:brightness-110"
                  )}
                >
                  <Zap className="size-3 fill-current" />
                  {tarpitStreaming ? "Halt Exfiltration" : "Trigger Vault Exfil"}
                </button>
              </div>

              <div className="font-mono text-[10px] space-y-2">
                <div className="grid grid-cols-3 gap-2 p-2 bg-[#0E0F12] border border-ink/10 text-center">
                  <div>
                    <span className="text-muted-ink text-[8px] block">BYTES RECEIVED</span>
                    <span className="text-xs font-bold text-signal">{tarpitBytes} B</span>
                  </div>
                  <div>
                    <span className="text-muted-ink text-[8px] block">CHUNKS</span>
                    <span className="text-xs font-bold text-ink">{tarpitChunks}</span>
                  </div>
                  <div>
                    <span className="text-muted-ink text-[8px] block">THROTTLED SPEED</span>
                    <span className="text-xs font-bold text-[#F59E0B]">
                      {tarpitSpeed.toFixed(2)} KB/s
                    </span>
                  </div>
                </div>

                {wafDropHit && (
                  <div className="p-2 border border-red-500/50 bg-red-950/40 text-red-400 font-bold text-[10px] flex items-center gap-2">
                    <ShieldAlert className="size-4 shrink-0 text-red-500" />
                    PLAUSIBLE WAF DROP DETECTED: HTTP 504 Gateway Timeout! Attacker locked out.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "terminal" && (
          <div className="h-[460px] flex flex-col border border-ink/20 bg-[#0A0A0C] font-mono text-[11px]">
            {/* Terminal Top Bar */}
            <div className="flex items-center justify-between border-b border-ink/15 bg-[#141519] px-3 py-1.5 text-muted-ink text-[9px]">
              <span>deployer@devops-jumpbox-01: ~</span>
              <span>Wazuh Rule 100504 / 100599</span>
            </div>

            {/* Scrollable Output */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono">
              {terminalHistory.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center gap-1.5 text-signal">
                    <span className="text-muted-ink">deployer@jumpbox:~$</span>
                    <span className="font-bold">{item.cmd}</span>
                  </div>
                  {item.stdout && (
                    <pre className="text-ink text-[10px] leading-relaxed whitespace-pre-wrap pl-2 border-l border-ink/20">
                      {item.stdout}
                    </pre>
                  )}
                  {item.stderr && (
                    <pre className="text-red-400 text-[10px] leading-relaxed whitespace-pre-wrap pl-2 border-l border-red-500/30">
                      {item.stderr}
                    </pre>
                  )}
                  {item.zeroDay && (
                    <div className="p-1.5 border border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[9px] text-[#F59E0B] space-y-0.5">
                      <div className="font-bold flex items-center gap-1">
                        <Zap className="size-3" /> ZERO-DAY EVALUATION (Rule 100599):
                      </div>
                      <p className="text-ink">{item.zeroDay.intent_summary}</p>
                      <div className="flex gap-2 text-[8px] text-muted-ink pt-1">
                        <span>ATT&CK: {item.zeroDay.dynamic_mitre_attack}</span>
                        <span>D3FEND: {item.zeroDay.dynamic_mitre_d3fend}</span>
                        <span>Engage: {item.zeroDay.dynamic_mitre_engage}</span>
                        <span className="text-red-400">Risk: +{item.zeroDay.risk_delta}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Terminal Input Bar */}
            <form onSubmit={handleExecCommand} className="flex border-t border-ink/15 bg-[#121316]">
              <span className="px-3 py-2 text-signal font-bold">$</span>
              <input
                type="text"
                value={currentCmd}
                onChange={(e) => setCurrentCmd(e.target.value)}
                placeholder="Type Linux command (e.g. cat /proc/1/cgroup, ls /.dockerenv)..."
                className="flex-1 bg-transparent py-2 text-ink text-[11px] font-mono focus:outline-none"
              />
              <button
                type="submit"
                disabled={terminalLoading}
                className="px-4 bg-signal text-black font-bold font-mono text-[10px] uppercase hover:brightness-110 disabled:opacity-50"
              >
                {terminalLoading ? "..." : "Send"}
              </button>
            </form>
          </div>
        )}

        {activeTab === "adversaries" && (
          <div className="space-y-4">
            {/* TOGGLE 1: SPOOF VPN HOP */}
            <div className="border border-ink/20 bg-[#141519] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="size-4 text-[#3B82F6]" />
                  <h3 className="text-xs font-bold uppercase">Spoof VPN IP Hop (Mullvad Exit)</h3>
                </div>
                <button
                  onClick={() => {
                    const newIp = attackerIp === "185.220.101.4" ? "194.26.29.112" : "185.220.101.4"
                    setAttackerIp(newIp)
                    fetch(`${API_BASE}/api/stage1`, { headers: { "X-Forwarded-For": newIp } })
                    refresh()
                  }}
                  className="border border-[#3B82F6]/40 bg-[#3B82F6]/10 text-[#3B82F6] px-2.5 py-1 text-[10px] font-mono font-bold uppercase hover:bg-[#3B82F6] hover:text-black"
                >
                  Rotate Attacker IP
                </button>
              </div>
              <p className="font-mono text-[9px] text-muted-ink">
                Simulates changing IP addresses from Tor exit ({attackerIp}) while preserving client JA4H fingerprint. Tests cross-IP threat attribution.
              </p>
            </div>

            {/* TOGGLE 2: TELEGRAM SYNDICATE COLLUSION */}
            <div className="border border-ink/20 bg-[#141519] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-signal" />
                  <h3 className="text-xs font-bold uppercase">Syndicate Key Collusion (Actor B)</h3>
                </div>
                <button
                  onClick={async () => {
                    const token = crumb2 || crumb1 || "vk_live_demo_crumb"
                    setFingerprintOverride("syndicate_actor_bravo_9921")
                    await fetch(`${API_BASE}/api/shell/exec`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                        "X-Client-Fingerprint": "syndicate_actor_bravo_9921",
                        "X-Forwarded-For": "45.154.255.88",
                      },
                      body: JSON.stringify({ command: "whoami" }),
                    })
                    refresh()
                  }}
                  className="border border-signal/40 bg-signal/10 text-signal px-2.5 py-1 text-[10px] font-mono font-bold uppercase hover:bg-signal hover:text-black"
                >
                  Simulate Collusion Replay
                </button>
              </div>
              <p className="font-mono text-[9px] text-muted-ink">
                Passes stolen Pyrite Nugget to Actor B with a distinct client JA4H fingerprint. Triggers Wazuh Rule 100506 (Token handover detected).
              </p>
            </div>

            {/* TOGGLE 3: ANTI-DOCKER CAGE TEST */}
            <div className="border border-ink/20 bg-[#141519] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="size-4 text-[#F59E0B]" />
                  <h3 className="text-xs font-bold uppercase">Anti-Docker & Cage Test Probe</h3>
                </div>
                <button
                  onClick={() => {
                    handleExecCommand(undefined, "cat /proc/1/cgroup && ls /.dockerenv && dmesg | grep -i kvm")
                    setActiveTab("terminal")
                  }}
                  className="border border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#F59E0B] px-2.5 py-1 text-[10px] font-mono font-bold uppercase hover:bg-[#F59E0B] hover:text-black"
                >
                  Run Cage Probe
                </button>
              </div>
              <p className="font-mono text-[9px] text-muted-ink">
                Executes multi-step anti-container checks (`cgroup`, `.dockerenv`, `dmidecode`) proving bare-metal bare-metal deception cloaking.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
