"use client"

import * as React from "react"
import { ShieldCheck, ShieldAlert, Lock, Key, Cpu, RefreshCw, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

function toBase64Url(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf-8").toString("base64url")
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export function TokenAnatomyCard() {
  const [selectedSegment, setSelectedSegment] = React.useState<"prefix" | "payload" | "hmac">("payload")
  const [activeStage, setActiveStage] = React.useState<1 | 2 | 3>(1)
  const [isTampered, setIsTampered] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const payloadData = React.useMemo(() => {
    const stageSeeds = {
      1: "Morph-v1.0 (Fintech-Git-SQLi)",
      2: "Morph-v2.0 (Healthcare-DICOM)",
      3: "Morph-v3.0 (Industrial-SCADA)",
    }
    return {
      s: activeStage,
      f: "5e7e66c99e9bb9b0", // Truncated sha256 of JA4H wire fingerprint
      t: 1793496385,
      seed: stageSeeds[activeStage],
    }
  }, [activeStage])

  const payloadB64 = React.useMemo(() => {
    return toBase64Url(JSON.stringify(payloadData))
  }, [payloadData])

  const hmacSig = React.useMemo(() => {
    // Deterministic preview HMAC for illustration
    return isTampered ? "deadbeef00" : "29c1a18a1f"
  }, [isTampered])

  const fullToken = `vk_live_${payloadB64}.${hmacSig}`

  const copyToken = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(fullToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <section className="border-b border-[#27272A] bg-[#0B0B0C] text-[#F1EFE9] p-5 sm:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#27272A] pb-4">
          <div>
            <span className="font-mono text-[10px] text-[#F59E0B] uppercase tracking-widest font-bold">
              CRYPTOGRAPHIC ARCHITECTURE // STATELESS HMAC CRUMBS
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#F1EFE9] tracking-tight mt-1">
              Pyrite Nugget Anatomy X-Ray
            </h2>
            <p className="text-xs sm:text-sm text-[#9A9891] max-w-[65ch] mt-1.5 leading-relaxed">
              Adversaries steal tokens from git logs and SQL dumps, believing they are real auth credentials.
              In reality, every nugget cryptographically seals the attacker&apos;s wire fingerprint (JA4H) and active topology seed without storing server-side state.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTampered(!isTampered)}
              className={cn(
                "px-3 py-1.5 border font-mono text-[10px] font-bold uppercase transition-colors flex items-center gap-1.5",
                isTampered
                  ? "border-red-500 bg-red-950/60 text-red-300"
                  : "border-[#27272A] bg-[#141416] text-[#9A9891] hover:text-[#F1EFE9]"
              )}
            >
              {isTampered ? <ShieldAlert size={12} className="text-red-400" /> : <ShieldCheck size={12} />}
              {isTampered ? "TAMPERED TOKEN" : "SIMULATE TAMPER"}
            </button>
          </div>
        </div>

        {/* Visual Token Ribbon */}
        <div className="space-y-2">
          <div className="flex items-center justify-between font-mono text-[11px] text-muted-ink">
            <span>CLICK A SEGMENT TO INSPECT ITS INTERNAL CRYPTOGRAPHIC BINDING:</span>
            <button
              onClick={copyToken}
              className="flex items-center gap-1 text-[#F59E0B] hover:text-white transition-colors"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "COPIED" : "COPY NUGGET"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 border border-[#27272A] bg-[#080809] font-mono text-xs overflow-hidden">
            {/* Prefix Segment */}
            <button
              type="button"
              onClick={() => setSelectedSegment("prefix")}
              className={cn(
                "md:col-span-2 p-3.5 text-left border-b md:border-b-0 md:border-r border-[#27272A] transition-colors relative",
                selectedSegment === "prefix"
                  ? "bg-signal/20 text-signal font-bold"
                  : "hover:bg-[#141416] text-muted-ink"
              )}
            >
              <div className="text-[9px] uppercase tracking-wider text-muted-ink">01. PREFIX</div>
              <div className="text-sm font-bold text-signal mt-1">vk_live_</div>
            </button>

            {/* Payload Segment */}
            <button
              type="button"
              onClick={() => setSelectedSegment("payload")}
              className={cn(
                "md:col-span-7 p-3.5 text-left border-b md:border-b-0 md:border-r border-[#27272A] transition-colors overflow-hidden",
                selectedSegment === "payload"
                  ? "bg-[#F59E0B]/20 text-[#F59E0B] font-bold"
                  : "hover:bg-[#141416] text-[#F1EFE9]"
              )}
            >
              <div className="text-[9px] uppercase tracking-wider text-muted-ink">02. URL-SAFE BASE64 PAYLOAD</div>
              <div className="text-sm truncate mt-1 text-[#F59E0B]">{payloadB64}</div>
            </button>

            {/* HMAC Signature Segment */}
            <button
              type="button"
              onClick={() => setSelectedSegment("hmac")}
              className={cn(
                "md:col-span-3 p-3.5 text-left transition-colors",
                selectedSegment === "hmac"
                  ? isTampered
                    ? "bg-red-950/60 text-red-400 font-bold"
                    : "bg-green-950/40 text-green-400 font-bold"
                  : "hover:bg-[#141416] text-muted-ink"
              )}
            >
              <div className="text-[9px] uppercase tracking-wider text-muted-ink">03. HMAC-SHA256 (10-HEX)</div>
              <div className={cn("text-sm font-bold mt-1", isTampered ? "text-red-400" : "text-green-400")}>
                .{hmacSig}
              </div>
            </button>
          </div>
        </div>

        {/* Detailed Breakdown Card */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Segment Deep-Dive */}
          <div className="lg:col-span-7 border border-[#27272A] bg-[#101012] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <div className="font-mono text-xs uppercase tracking-wider font-bold text-[#F1EFE9]">
                {selectedSegment === "prefix" && "Segment 1: Stateless Crumb Protocol Prefix"}
                {selectedSegment === "payload" && "Segment 2: Decoded HMAC Claims Payload"}
                {selectedSegment === "hmac" && "Segment 3: Cryptographic Integrity Signature"}
              </div>
              <span className="font-mono text-[9px] px-2 py-0.5 bg-[#141416] border border-[#27272A] text-[#F59E0B]">
                RFC 2104 / SHA-256
              </span>
            </div>

            {selectedSegment === "prefix" && (
              <div className="space-y-3 font-mono text-xs leading-relaxed text-[#9A9891]">
                <p>
                  <strong className="text-[#F1EFE9]">vk_live_</strong> stands for <em className="text-signal">Pyrite-Kernel Live Deception Token</em>.
                </p>
                <p>
                  When inbound HTTP headers (<code className="text-[#F1EFE9]">X-Debug-Token</code>, <code className="text-[#F1EFE9]">X-Vault-Key</code>, or <code className="text-[#F1EFE9]">Authorization</code>) start with this prefix, FastAPI routes immediately invoke the strict HMAC verification pipeline before processing any business logic.
                </p>
              </div>
            )}

            {selectedSegment === "payload" && (
              <div className="space-y-3">
                <p className="text-xs text-[#9A9891]">
                  Base64-decoded JSON claims embedded inside the token:
                </p>
                <div className="border border-[#27272A] bg-[#080809] p-4 font-mono text-xs text-[#F1EFE9]">
                  <pre className="text-amber-300">
                    {JSON.stringify(payloadData, null, 2)}
                  </pre>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-muted-ink">
                  <div><strong className="text-signal">s:</strong> Stage Sequence (1 to 4)</div>
                  <div><strong className="text-signal">f:</strong> Fingerprint Hash (Wire JA4H)</div>
                  <div><strong className="text-signal">t:</strong> Unix Timestamp (Epoch ms)</div>
                  <div><strong className="text-signal">seed:</strong> Active Decoy Topology</div>
                </div>
              </div>
            )}

            {selectedSegment === "hmac" && (
              <div className="space-y-3 font-mono text-xs text-[#9A9891] leading-relaxed">
                <p>
                  HMAC calculated via <code className="text-[#F1EFE9]">hmac.new(SECRET, b64_payload, sha256).hexdigest()[:10]</code>.
                </p>
                <div className={cn(
                  "p-3 border font-mono text-xs",
                  isTampered
                    ? "border-red-500/50 bg-red-950/40 text-red-300"
                    : "border-green-500/50 bg-green-950/40 text-green-300"
                )}>
                  {isTampered ? (
                    <div>
                      <strong className="block text-red-400">TAMPER DETECTED: INVALID_CRUMB_HMAC</strong>
                      <span>The server rejects this token with HTTP 403. Adversary cannot forge crumbs or modify stage/seed.</span>
                    </div>
                  ) : (
                    <div>
                      <strong className="block text-green-400">SIGNATURE VALID: VERIFIED_STATELESS_CRUMB</strong>
                      <span>The server successfully verifies authentic provenance without querying any centralized database!</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Stage Selector & Cross-IP Replay Demo */}
          <div className="lg:col-span-5 border border-[#27272A] bg-[#101012] p-5 space-y-4">
            <div className="font-mono text-xs uppercase tracking-wider font-bold text-[#F1EFE9] border-b border-[#27272A] pb-2">
              Interactive Nugget Generator
            </div>

            <div className="space-y-2">
              <label className="block font-mono text-[10px] text-muted-ink uppercase">
                Select Stage Progression:
              </label>
              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                {([1, 2, 3] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setActiveStage(s)}
                    className={cn(
                      "py-2 px-3 border text-center transition-colors font-bold",
                      activeStage === s
                        ? "border-[#F59E0B] bg-[#F59E0B]/15 text-[#F59E0B]"
                        : "border-[#27272A] bg-[#141416] text-[#9A9891] hover:text-[#F1EFE9]"
                    )}
                  >
                    Stage 0{s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#27272A] font-mono text-xs">
              <span className="text-[10px] text-muted-ink uppercase block">
                Syndicate Cross-Actor Replay Detection:
              </span>
              <p className="text-[11px] text-[#9A9891] leading-relaxed">
                If Actor A steals this token and shares it on Telegram with Actor B, Actor B&apos;s request arrives with a different TLS JA4H fingerprint.
                Pyrite instantly flags <strong>Rule 100506 (Syndicate Collusion)</strong> while allowing Actor B to proceed into an isolated phantom shadow world!
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
