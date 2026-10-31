# VYUH (CHAKRAVYUH) - UNIFIED DECEPTION & WAZUH PIPELINE

                     +-----------------------------------+
                     |     CONTROLLED ATTACK SIM CLI     |
                     |  4-Stage Exploit + Syndicate Test |
                     +-----------------+-----------------+
                                       |
                                       v
+----------------------------------------------------------------------+
|          DECEPTION LAYER (FastAPI 4-Stage Polymorphic Labyrinth)     |
|                                                                      |
|  [Stage 1: Recon Leak] ──(Crumb 1)──► [Stage 2: HoneyPatch SQLi]     |
|                                                       │ (Crumb 2)    |
|  [Stage 4: Vault Tarpit] ◄─(Crumb 3)─ [Stage 3: Cowrie-Style Shell]  |
|  (Chunked Drip + 504 WAF Exit)        (Per-Attacker Shadow World)    |
+--------------------------------------+-------------------------------+
                                       | Structured single-line JSON logs
                                       | (/backend/logs/vyuh_deception.json)
                                       v
+----------------------------------------------------------------------+
|                    DETECTION & SEGREGATION LAYER                     |
|                                Wazuh                                 |
|                                                                      |
|  JSON Decoding -> Custom Deception Rules (Rule IDs 100500 - 100506)  |
|       -> Segregates Noise (Lvl 5) vs Breach (Lvl 10-12)              |
|          vs Vault Exfil / Syndicate Collusion (Lvl 15 Critical)      |
|       -> Dual Mapping: MITRE ATT&CK (Red) + MITRE Engage (Blue)      |
+--------------------------------------+-------------------------------+
                                       | Alerts (Webhook + Dual-Mode Engine)
                                       v
+----------------------------------------------------------------------+
|                         INTELLIGENCE LAYER                           |
|                      FastAPI Backend + SQLite                        |
|                                                                      |
|  Wazuh Segregated Alerts + Live Labyrinth Telemetry                  |
|       -> Normalize -> Deduplicate -> Enrich                          |
|       -> Correlation Engine & Attack Chain Builder                   |
|            ├── Rule-Based Risk Scorer (0-100) + Dual MITRE           |
|            ├── Fingerprint Anomaly (JA4H + Stateless HMAC Crumbs)    |
|            ├── Honeytokens & Production Auth Log Overlap             |
|            └── LLM Executive Report & Remediation Generator          |
|       -> Persists to SQLite & Broadcasts via Native WebSockets       |
+--------------------------------------+-------------------------------+
                                       | REST + WebSocket (/ws/soc)
                                       v
+----------------------------------------------------------------------+
|                         PRESENTATION LAYER                           |
|                     Next.js SOC (Matte Dark #0B0F17)                 |
|                                                                      |
|  4-Node Labyrinth Graph | Live Shell Spy & Tarpit | Wazuh Rule Feed  |
|  Similar Sessions (Syndicate) | AI Reports | Mutate & 504 WAF Drop   |
+----------------------------------------------------------------------+
