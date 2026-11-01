# VYUH // PROGRESS STATE — Mentor Critique Implementation

Checklist of the 5 upgrade modules. Atomic checkpoints: commit after each module.

Legend: `[ ]` PENDING · `[~]` IN_PROGRESS · `[x]` COMPLETED

## Module 1 — Demo-Safe OWASP Hardening
- [x] Mount auth / incidents / dashboard routers in `backend/app/main.py`
- [x] Add `SecurityHeadersMiddleware` + explicit CORS (no wildcard+credentials)
- [x] Auth `/ws/soc` with JWT query token; demo-safe fallback (DEMO_MODE=true)
- [x] Strict HMAC crumb verification (reject invalid + expired) in `stages/routes.py`
- [x] Gate `X-Client-Fingerprint` behind `VYUH_ALLOW_SIM_OVERRIDE`
- [x] Ephemeral high-entropy `VYUH_CRUMB_SECRET` fallback in `crumb_crypto.py`
- [x] JWT TTL 7d -> 60m; NIST password policy in `models/auth.py`
- [x] Add `backend/.env.example`
- Files: main.py, core/crumb_crypto.py, core/ja4h.py, core/auth.py, models/auth.py, stages/routes.py, .env.example
- Next Immediate Action: Module 2 (Wazuh round-trip)

## Module 2 — Real Wazuh Round-Trip Pipeline (10.46.34.107:9200)
- [x] Add `backend/app/core/wazuh_client.py` (forward + query + 1.5s fallback)
- [x] Wire round-trip into `wazuh_bridge.py` + `stages/routes.py` emit path
- [x] `wazuh_verified` / `wazuh_node` / `wazuh_fallback` surfaced to /ws/soc
- Files: core/wazuh_client.py, core/wazuh_bridge.py, stages/routes.py
- Next Immediate Action: Module 3 (LLM kernel + rule 100599)

## Module 3 — DeepSeek LLM Kernel + Zero-Day Rule 100599
- [x] Add `backend/app/stages/generative_shell.py` (DeepSeek + deterministic fallback)
- [x] Zero-day eval: intent_summary, dynamic ATT&CK/D3FEND/Engage, risk_delta
- [x] Wire novel commands through `virtual_shell.py` + virtual FS persistence
- [x] Add Wazuh Rule 100599 mapping in `wazuh_bridge.py` + stage-3 emit
- Files: stages/generative_shell.py, stages/virtual_shell.py, core/wazuh_bridge.py, stages/routes.py
- Next Immediate Action: Module 4 (anti-docker cloak + noise + Endlessh)

## Module 4 — Anti-Docker Cloaking, Living Noise, Endlessh Tarpit
- [x] Anti-container probes (dockerenv, cgroup, df/mount, sched, DMI, dmidecode)
- [x] Remove `docker` group from `id`; spoof ping/traceroute C2 IOC
- [x] Living corporate noise: dynamic ps/w/who/netstat/auth.log + Envoy jitter
- [x] `ENGAGE_ENDLESSH_TARPIT` 1 byte / 10s action in `intelligence.py`
- Files: stages/virtual_shell.py, core/intelligence.py, main.py (jitter header)
- Next Immediate Action: Module 5 (CLI verification suite)

## Module 5 — CLI Verification & Resume Script (attack_sim.py)
- [x] Add Option [8] Mentor Critique Verification Suite (LLM + anti-docker + round-trip)
- [x] Shift topology rotation to Option [9]; update prompt/dispatch
- [x] Expose `wazuhNode` on `/api/status`
- Files: attacker-cli/attack_sim.py, backend/app/stages/routes.py
- Next Immediate Action: Module 6 (Global Pyrite Rebrand & Next.js cleanup)

## Module 6 — Global Rebrand to "PYRITE" (FeS₂) & Next.js Issues Cleanup
- [x] Rebrand UI titles, headers, badges, metadata, logos to PYRITE (FeS₂ // FOOL'S GOLD DECEPTION GRID)
- [x] Landing page dot-matrix hero typography updated to "pyrite" + tagline "GLITTERS LIKE GOLD. TRAPS LIKE IRON."
- [x] Present tokens as "Pyrite Nuggets (Stateless HMAC Crumbs)"
- [x] Fix Next.js hydration mismatches (mounted guards on dates/random)
- [x] Collapse redundant dual-sidebar in /dashboard into single high-density left navigation rail
- Files: frontend/src/app/layout.tsx, dashboard/layout.tsx, honeytrap-dashboard.tsx, dashboard-shell.tsx, inspector-panel.tsx
- Next Immediate Action: Module 7 (Live WebSocket Wiring)

## Module 7 — Live Backend (FastAPI + Wazuh) WebSocket Wiring
- [x] Update usePyriteTelemetry.tsx hook with live WebSocket ws://localhost:8000/ws/soc?token=demo-analyst-bypass
- [x] Ensure backend accepts demo-analyst-bypass and DEMO_MODE fallback
- [x] Connect live status pill: ● LIVE BACKEND CONNECTED (10.46.34.107:9200 WAZUH LINKED)
- [x] Map real JA4H, HASSH, vk_live_ nugget JSON, polymorphic persona, and Tri-MITRE badges
- [x] Wire SOC containment buttons: Quarantine 504 WAF Exit, Endlessh Tarpit, Burn & Mutate Topology
- Files: hooks/usePyriteTelemetry.tsx, components/dashboard/dashboard-shell.tsx, components/dashboard/inspector-panel.tsx, backend/app/main.py
- Next Immediate Action: Module 8 (Red-Team Attack Console)

## Module 8 — Real-Time Red-Team Attack Console in Frontend
- [x] Build interactive Red-Team Attack Panel inside /dashboard with real fetch() execution
- [x] Stage 1: Recon Probe (GET /.git/logs/HEAD) + live base64 HMAC token decoder
- [x] Stage 2: DARPA HoneyPatch SQLi Injector (POST /api/internal/legacy-query)
- [x] Stage 3: Interactive Generative Linux Terminal (POST /api/shell/exec) with Wazuh 100599 zero-day eval
- [x] Stage 4: Live Tarpit Exfiltration Streamer (GET /vault/v1/export) with ReadableStream byte counter
- [x] 1-Click Red-Team Adversary Toggles: VPN IP Hop, Syndicate Collusion, Anti-Docker & Cage Test
- Files: components/dashboard/redteam-attack-console.tsx, components/dashboard/dashboard-shell.tsx
- Next Immediate Action: Module 9 (Landing Page Elevation with 3D Canvas, GSAP ScrollTrigger & Media)

## Module 9 — Landing Page Elevation (3D WebGL Canvas, GSAP ScrollTrigger & Media)
- [x] 3D Interactive Pyrite Crystal / Labyrinth Canvas with parallax & gold-to-crimson hover shift
- [x] GSAP ScrollTrigger pinned storytelling 4-stage journey
- [x] Interactive Token Anatomy Media Card (xray breakdown of Pyrite Nugget)
- [x] Live embedded mini-terminal preview on landing page
- Files: components/landing/pyrite-crystal-canvas.tsx, components/landing/pinned-scroll-journey.tsx, components/landing/token-anatomy-card.tsx, components/landing/landing-mini-terminal.tsx, components/landing/wordmark-masthead.tsx, app/page.tsx
- All 9 Modules fully integrated, verified, and passing!

## Module 10 — Hero Restoration, FeS₂ Scrub & Pure Real-Data Telemetry Baseline
- [x] Hero section restored: Ditched Three.js canvas in hero wordmark; restored original high-contrast fuzzy dot-matrix "pyrite" halftone typography.
- [x] Test clutter eliminated: Removed redundant `SignalTicker` and duplicated `BreachSimulator` test bars.
- [x] FeS₂ scrubbed globally: Replaced all chemical formula mentions (`FeS₂`, `FeS2`, `Fe` mark) with cybersecurity standard branding (`P` monogram, `AUTONOMOUS DECEPTION GRID`).
- [x] Dummy data eradicated (5.8k mock counter purged):
  - Initial `totalAttacksCount` reset from `5873` to `0`.
  - Removed fake background interval adding `+4` attacks every 4.5s.
  - `INITIAL_ATTACKERS` and `INITIAL_EVENTS` dummy lists removed from initial state (now initialized to `[]`).
  - `INITIAL_HONEYPOTS` interactions reset from fake numbers (1482, 3290, etc.) to 0 baseline.
  - `ANALYTICS_SERIES` and `demoSnapshot` purged of fabricated counts.
  - Real data pipeline connected: WebSocket and REST endpoints dynamically populate real sessions from FastAPI SQLite/Wazuh and real attacks executed from Red Team console / CLI simulator.
- Files: frontend/src/components/dashboard/honeytrap-dashboard.tsx, frontend/src/lib/dashboard/data.ts, backend/app/routes/dashboard.py, frontend/src/components/landing/wordmark-masthead.tsx, frontend/src/components/landing/site-footer.tsx, frontend/src/components/landing/command-cta.tsx, frontend/src/components/dashboard/redteam-attack-console.tsx, backend/app/stages/routes.py, attacker-cli/attack_sim.py

