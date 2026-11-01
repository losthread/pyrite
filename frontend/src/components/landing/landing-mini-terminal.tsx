"use client"

import * as React from "react"
import Link from "next/link"
import { Terminal, ShieldAlert, ArrowUpRight, Play, Check, CornerDownLeft, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000"

const PRESETS = [
  { label: "Anti-Docker Probe", cmd: "ls -la /.dockerenv" },
  { label: "CGroup Check", cmd: "cat /proc/1/cgroup" },
  { label: "Privileges (No Docker)", cmd: "id" },
  { label: "Kernel Version", cmd: "uname -a" },
  { label: "Steal Harvested Nugget", cmd: "cat /home/deployer/.bash_history" },
]

export function LandingMiniTerminal() {
  const [history, setHistory] = React.useState<
    Array<{ cmd: string; stdout: string; stderr?: string; zeroDay?: any }>
  >([
    {
      cmd: "cat /proc/1/cgroup",
      stdout: "0::/system.slice/systemd.service\n",
    },
    {
      cmd: "ls -la /.dockerenv",
      stdout: "",
      stderr: "ls: cannot access '/.dockerenv': No such file or directory\n",
    },
  ])
  const [inputCmd, setInputCmd] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const bottomRef = React.useRef<HTMLDivElement>(null)

  const executeCommand = async (commandToRun: string) => {
    const trimmed = commandToRun.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setInputCmd("")

    try {
      const res = await fetch(`${API_BASE}/api/shell/exec`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "curl/7.88.1 (x86_64-pc-linux-gnu)",
          "X-Forwarded-For": "185.220.101.4",
        },
        body: JSON.stringify({
          cmd: trimmed,
          session_id: "preview-visitor",
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setHistory((prev) => [
          ...prev,
          {
            cmd: trimmed,
            stdout: data.stdout || "",
            stderr: data.stderr || "",
            zeroDay: data.zero_day_eval,
          },
        ])
      } else {
        // Fallback realistic responses if backend not currently reachable
        simulateLocalResponse(trimmed)
      }
    } catch {
      simulateLocalResponse(trimmed)
    } finally {
      setLoading(false)
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 50)
    }
  }

  const simulateLocalResponse = (cmd: string) => {
    let out = ""
    let err = ""
    let zd: any = null

    if (cmd === "ls -la /.dockerenv") {
      err = "ls: cannot access '/.dockerenv': No such file or directory\n"
    } else if (cmd === "cat /proc/1/cgroup") {
      out = "0::/system.slice/systemd.service\n"
    } else if (cmd === "id") {
      out = "uid=1001(deployer) gid=1001(deployer) groups=1001(deployer),27(sudo)\n"
    } else if (cmd === "uname -a") {
      out = "Linux devops-jumpbox-01 6.5.0-35-generic #35~22.04.1-Ubuntu SMP PREEMPT_DYNAMIC x86_64\n"
    } else if (cmd.includes(".bash_history")) {
      out = "ssh-keygen -t ed25519 -C \"vk_live_eyJzIjozLCJmIjoiZjYwZjMzZDgwYjIyZGFjMiIsInQiOjE3OTM0OTYzOTYxMjgsInNlZWQiOiJNb3JwaC12MS4wIn0.d4755f6bff\"\n"
    } else {
      out = `[Pyrite Virtual Shell / Morph-v2.0]\nExecuted: ${cmd}\nExit code: 0\n`
      zd = {
        rule_id: 100599,
        intent: "Dynamic exploration probe inside generative honeypot cage",
        mitre_attack: "T1059.004",
      }
    }

    setHistory((prev) => [
      ...prev,
      { cmd, stdout: out, stderr: err, zeroDay: zd },
    ])
  }

  return (
    <section className="border-b border-[#27272A] bg-[#08090C] text-[#F1EFE9] p-5 sm:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#27272A] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#F59E0B] uppercase tracking-widest font-bold">
                STAGE 03 LIVE PREVIEW // DEEPSEEK BEELZEBUB KERNEL
              </span>
              <span className="px-1.5 py-0.5 bg-signal/20 border border-signal/40 text-signal font-mono text-[9px] font-bold">
                REAL BASH SHELL
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#F1EFE9] tracking-tight mt-1">
              Test Adversary Probes in Real Time
            </h2>
            <p className="text-xs sm:text-sm text-[#9A9891] max-w-[65ch] mt-1.5 leading-relaxed">
              Run anti-container detection tests. Pyrite strips all docker signatures (<code className="text-[#F1EFE9]">/.dockerenv</code>, <code className="text-[#F1EFE9]">cgroup</code>, and docker groups) to convince top-tier adversaries they have breached real bare-metal infrastructure.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="group flex h-10 items-center gap-2 border border-signal bg-signal px-4 text-black font-mono text-xs font-bold uppercase transition-colors hover:bg-white shrink-0"
          >
            <span>Launch SOC Dashboard</span>
            <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* 1-Click Preset Buttons */}
        <div className="space-y-1.5">
          <span className="font-mono text-[10px] text-muted-ink uppercase block">
            Click a preset adversary probe to fire instantly:
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.cmd}
                onClick={() => executeCommand(p.cmd)}
                disabled={loading}
                className="px-3 py-1.5 bg-[#141416] border border-[#27272A] hover:border-[#F59E0B] text-muted-ink hover:text-[#F1EFE9] font-mono text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Terminal size={11} className="text-[#F59E0B]" />
                <span>{p.label}</span>
                <code className="text-[10px] text-signal font-semibold ml-1">({p.cmd})</code>
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Terminal Window */}
        <div className="border border-[#27272A] bg-[#0B0B0C] shadow-2xl font-mono text-xs">
          {/* Title Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#141416] border-b border-[#27272A]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
              <span className="text-[10px] text-muted-ink ml-2">
                deployer@devops-jumpbox-01:~ (Ubuntu 22.04 LTS / DeepSeek-V3 LLM Shell)
              </span>
            </div>
            <span className="text-[9px] text-green-400 font-bold flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
              WAZUH RULE 100599 ZERO-DAY CLASSIFICATION LIVE
            </span>
          </div>

          {/* Terminal Output Body */}
          <div className="p-4 space-y-3 max-h-[340px] overflow-y-auto bg-[#080809]">
            {history.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center gap-2 text-muted-ink">
                  <span className="text-signal font-bold">deployer@devops-jumpbox-01:~$</span>
                  <span className="text-[#F1EFE9] font-bold">{item.cmd}</span>
                </div>
                {item.stdout && (
                  <pre className="text-stone-300 whitespace-pre-wrap pl-4 leading-relaxed">
                    {item.stdout}
                  </pre>
                )}
                {item.stderr && (
                  <pre className="text-red-400 whitespace-pre-wrap pl-4 leading-relaxed">
                    {item.stderr}
                  </pre>
                )}
                {item.zeroDay && (
                  <div className="ml-4 my-1.5 p-2 border border-red-500/30 bg-red-950/20 text-[10px] space-y-0.5">
                    <span className="text-red-400 font-bold block flex items-center gap-1">
                      <Sparkles size={11} className="text-[#F59E0B]" />
                      WAZUH RULE 100599 ZERO-DAY EVALUATION
                    </span>
                    <p className="text-stone-300">Intent: {item.zeroDay.intent}</p>
                    <span className="text-amber-300 font-semibold block">MITRE ATT&CK: {item.zeroDay.mitre_attack}</span>
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Command Prompt Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              executeCommand(inputCmd)
            }}
            className="flex items-center border-t border-[#27272A] bg-[#101012] px-4 py-2.5 gap-2"
          >
            <span className="text-signal font-bold shrink-0">deployer@devops-jumpbox-01:~$</span>
            <input
              type="text"
              value={inputCmd}
              onChange={(e) => setInputCmd(e.target.value)}
              placeholder="Type any Linux command (e.g. cat /etc/passwd, netstat -tlpn)..."
              disabled={loading}
              className="flex-1 bg-transparent text-[#F1EFE9] focus:outline-none font-mono text-xs placeholder:text-muted-ink/50"
            />
            <button
              type="submit"
              disabled={loading || !inputCmd.trim()}
              className="px-3 py-1 bg-signal text-black font-bold uppercase text-[10px] flex items-center gap-1 hover:bg-white transition-colors disabled:opacity-40"
            >
              <span>EXEC</span>
              <CornerDownLeft size={11} />
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
