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
- [ ] PENDING

## Module 4 — Anti-Docker Cloaking, Living Noise, Endlessh Tarpit
- [ ] PENDING

## Module 5 — CLI Verification & Resume Script (attack_sim.py)
- [ ] PENDING
