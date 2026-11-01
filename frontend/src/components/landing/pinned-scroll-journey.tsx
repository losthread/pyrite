"use client"

import * as React from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { GitBranch, Database, Terminal, ShieldAlert, CheckCircle2, ChevronRight, Lock, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const STAGES = [
  {
    num: "01",
    name: "Git Reconnaissance Leak",
    subtitle: "Route: GET /.git/logs/HEAD or /.env.staging",
    description:
      "When an automated scanner or external adversary probes sensitive endpoints, Pyrite does not return a generic 404. Instead, it emits plausible dangling commit logs laced with the first stateless HMAC Crumb.",
    tokenName: "Pyrite Nugget #1",
    tokenSample: "vk_live_eyJzIjoxLCJmIjoiNWU3ZTYy...4f1b",
    wazuhRule: "100501 (Recon Leak Ingestion)",
    mitre: {
      attack: "T1595 (Active Scanning)",
      defend: "D3-SP (Spoofed Response)",
      engage: "EAC0011 (Lure)",
    },
    codeSnippet: `GET /.git/logs/HEAD HTTP/1.1
Host: api.aether-fintech.internal
User-Agent: curl/7.88.1 (x86_64)

HTTP/1.1 200 OK
Content-Type: text/plain
X-Deception-Engine: Pyrite/Autonomous-Deception

000000 4a8b29c3 devops-admin <infra@aether-fintech.int> 1793496385 +0000
commit: fix(auth): rotate staging secret vk_live_eyJzIjoxLCJm...`,
  },
  {
    num: "02",
    name: "DARPA HoneyPatch Session Fork",
    subtitle: "Route: POST /api/internal/legacy-query",
    description:
      "The adversary exploits an apparent SQL injection vulnerability. Rather than dropping or patching, Pyrite forks the request into a high-entropy phantom SQLite database, giving the attacker an instant ego boost with synthetic credentials.",
    tokenName: "Pyrite Nugget #2",
    tokenSample: "vk_live_eyJzIjoyLCJmIjoiZWM3Nz...05be",
    wazuhRule: "100502 (HoneyPatch SQLi Fork)",
    mitre: {
      attack: "T1190 (Exploit Public-Facing App)",
      defend: "D3-DEC (Decoy Environment)",
      engage: "EAC0021 (Alter Reality)",
    },
    codeSnippet: `POST /api/internal/legacy-query HTTP/1.1
X-Debug-Token: vk_live_eyJzIjox...
Content-Type: application/json

{"query": "SELECT * FROM users WHERE id = '1' UNION SELECT username, ssh_auth_token FROM devops_service_accounts--"}

HTTP/1.1 200 OK
{"records": [{"user": "deployer", "auth_token": "vk_live_eyJzIjoyLCJmIjoiZWM3NzA4...05be"}]}`,
  },
  {
    num: "03",
    name: "Beelzebub LLM Shadow World",
    subtitle: "Route: POST /api/shell/exec",
    description:
      "The attacker attempts SSH or remote bash commands. Pyrite routes the session to a container-cloaked virtual shell powered by an LLM kernel with real-time Zero-Day intent classification (Wazuh Rule 100599). Anti-docker probes reveal spoofed bare-metal hardware.",
    tokenName: "Pyrite Nugget #3",
    tokenSample: "vk_live_eyJzIjozLCJmIjoiZjYwZj...d475",
    wazuhRule: "100599 (Zero-Day Tri-MITRE Eval)",
    mitre: {
      attack: "T1059.004 (Unix Shell)",
      defend: "D3-EAL (Execution Analysis)",
      engage: "EAC0026 (Expose Behavior)",
    },
    codeSnippet: `deployer@devops-jumpbox-01:~$ cat /proc/1/cgroup
0::/system.slice/systemd.service
deployer@devops-jumpbox-01:~$ ls -la /.dockerenv
ls: cannot access '/.dockerenv': No such file or directory
deployer@devops-jumpbox-01:~$ cat ~/.bash_history
ssh-keygen -t ed25519 -C "vk_live_eyJzIjozLCJmIjoiZjYw..."`,
  },
  {
    num: "04",
    name: "Endlessh Tarpit & 504 WAF Exit",
    subtitle: "Route: GET /vault/v1/export",
    description:
      "As the adversary attempts to exfiltrate database archives or encryption keys, Pyrite engages a slow-drip tarpit (1 byte per 10s or 512B / 800ms) to tie up attacker threads. When the analyst triggers containment, Pyrite delivers a flawless HTTP 504 AWS WAF Gateway Timeout.",
    tokenName: "Plausible WAF Termination",
    tokenSample: "HTTP 504 Gateway Timeout (AWS WAF)",
    wazuhRule: "100505 (Adaptive Tarpit Engaged)",
    mitre: {
      attack: "T1041 (Exfiltration Over C2)",
      defend: "D3-TRP (Network Tarpit)",
      engage: "EAC0040 (Quarantine Session)",
    },
    codeSnippet: `GET /vault/v1/export HTTP/1.1
X-Vault-Key: vk_live_eyJzIjoz...

[TARPIT STREAM ACTIVE: 512 bytes / 800ms]
Chunk 01: [512 bytes received] ...
Chunk 02: [512 bytes received] ...
[SOC OPERATOR ENGAGED: PLAUSIBLE_WAF_DROP]
HTTP/1.1 504 Gateway Timeout
X-AWS-WAF-Action: BLOCK_RATE_EXCEEDED`,
  },
]

export function PinnedScrollJourney() {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [activeStep, setActiveStep] = React.useState(0)

  React.useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return

    const el = containerRef.current
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "+=2400",
        pin: true,
        scrub: 0.6,
        onUpdate: (self: { progress: number }) => {
          const step = Math.min(3, Math.floor(self.progress * 4))
          setActiveStep(step)
        },
      })
    }, el)

    return () => ctx.revert()
  }, [])

  const current = STAGES[activeStep]

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-[#08090C] text-[#F1EFE9] border-t border-b border-[#27272A] flex flex-col justify-between p-4 sm:p-8 lg:p-12 overflow-hidden"
    >
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272A] pb-4 shrink-0">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#F59E0B] font-bold">
            PYRITE // AUTONOMOUS DECEPTION MECHANISM
          </span>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-[#F1EFE9] tracking-tight">
            The 4-Stage Adversary Labyrinth
          </h2>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-[#9A9891]">STAGE:</span>
          <span className="px-2.5 py-1 bg-[#141416] border border-[#27272A] text-signal font-bold">
            {current.num} / 04
          </span>
        </div>
      </div>

      {/* Main Grid: Left Stage Navigator & Info / Right Live Code & Token Inspector */}
      <div className="grid lg:grid-cols-12 gap-6 my-auto py-6 items-center">
        {/* Left Column: Progress Step List & Description */}
        <div className="lg:col-span-5 space-y-6">
          {/* Step Selector Pills */}
          <div className="grid grid-cols-4 gap-2">
            {STAGES.map((s, idx) => {
              const isActive = activeStep === idx
              const isPast = activeStep > idx
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className={cn(
                    "p-2 text-left border transition-all font-mono",
                    isActive
                      ? "border-signal bg-signal/10 text-[#F1EFE9]"
                      : isPast
                        ? "border-[#27272A] bg-[#101012] text-muted-ink"
                        : "border-[#27272A]/50 bg-black/40 text-muted-ink/50"
                  )}
                >
                  <div className="text-[10px] font-bold text-signal">{s.num}</div>
                  <div className="text-[9px] truncate">{s.name.split(" ")[0]}</div>
                </button>
              )
            })}
          </div>

          {/* Current Stage Card */}
          <div className="border border-[#27272A] bg-[#101012] p-5 space-y-4">
            <div className="space-y-1">
              <span className="font-mono text-[9px] text-[#F59E0B] tracking-wider uppercase font-bold">
                {current.subtitle}
              </span>
              <h3 className="text-xl font-bold font-display text-[#F1EFE9]">
                {current.num}. {current.name}
              </h3>
            </div>

            <p className="text-[13px] leading-relaxed text-[#9A9891]">
              {current.description}
            </p>

            {/* Tri-MITRE Badges */}
            <div className="space-y-1.5 pt-2 border-t border-[#27272A]">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-ink block">
                Tri-MITRE Active Defense Classification:
              </span>
              <div className="flex flex-wrap gap-1.5 font-mono text-[9.5px]">
                <span className="px-2 py-0.5 bg-red-950/40 text-red-400 border border-red-500/30 font-bold">
                  ATT&CK: {current.mitre.attack}
                </span>
                <span className="px-2 py-0.5 bg-blue-950/40 text-blue-400 border border-blue-500/30 font-bold">
                  D3FEND: {current.mitre.defend}
                </span>
                <span className="px-2 py-0.5 bg-amber-950/40 text-amber-400 border border-amber-500/30 font-bold">
                  Engage: {current.mitre.engage}
                </span>
              </div>
            </div>

            {/* Token Badge */}
            <div className="flex items-center justify-between p-2.5 bg-[#0B0B0C] border border-[#27272A] font-mono text-[10px]">
              <span className="text-[#9A9891]">HARVESTED ARTIFACT:</span>
              <span className="font-bold text-[#F59E0B]">{current.tokenName}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Code Inspection & Wire Packet Stream */}
        <div className="lg:col-span-7">
          <div className="border border-[#27272A] bg-[#0B0B0C] shadow-2xl overflow-hidden font-mono text-xs">
            {/* Window title bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#141416] border-b border-[#27272A]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
                <span className="text-[10px] text-muted-ink ml-2">
                  live_deception_wire // stage_{current.num}.raw
                </span>
              </div>
              <span className="text-[9px] text-green-400 font-bold">
                WAZUH RULE: {current.wazuhRule}
              </span>
            </div>

            {/* Code Body */}
            <pre className="p-4 sm:p-5 overflow-x-auto text-[11px] sm:text-[12px] leading-relaxed text-[#F1EFE9] bg-[#080809]">
              <code>{current.codeSnippet}</code>
            </pre>

            {/* Bottom Status bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#101012] border-t border-[#27272A] text-[10px] text-muted-ink">
              <span>STATELESS HMAC BINDING: JA4H + SEED</span>
              <span className="text-[#F59E0B] font-bold">PYRITE NUGGET VERIFIED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Scroll Guide */}
      <div className="flex items-center justify-between border-t border-[#27272A] pt-3 shrink-0 font-mono text-[10px] text-[#9A9891]">
        <span>SCROLL TO TRAVERSE THE LABYRINTH</span>
        <span>GLITTERS LIKE GOLD · TRAPS LIKE IRON</span>
      </div>
    </div>
  )
}
