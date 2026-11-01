export type StageId = "recon" | "honeypatch" | "shadow-shell" | "vault"

export type MitreMapping = {
  id: string
  name: string
}

export type LabyrinthStage = {
  id: StageId
  index: number
  label: string
  shortLabel: string
  endpoint: string
  method: "GET" | "POST" | "WS" | "STREAM"
  wazuhRule: number
  wazuhLevel: number
  attack: MitreMapping
  engage: MitreMapping
  crumb: {
    number: number
    name: string
    token: string
    description: string
  }
  telemetry: string
  log: string[]
}

export type FeatureVisual =
  | "breadcrumb"
  | "attribution"
  | "wazuh"
  | "timeout"

export type LandingFeature = {
  index: string
  eyebrow: string
  title: string
  body: string
  stat: string
  statLabel: string
  visual: FeatureVisual
}

export type PipelineNode = {
  index: string
  label: string
  detail: string
  meta: string
  accent?: boolean
}

export const palette = {
  background: "#0A0A09",
  surface: "#1C1C19",
  ink: "#ECE8DF",
  accent: "#FF493D",
} as const

export const labyrinthStages: LabyrinthStage[] = [
  {
    id: "recon",
    index: 1,
    label: "Recon Leak",
    shortLabel: "Recon",
    endpoint: "/.git/logs/HEAD",
    method: "GET",
    wazuhRule: 100501,
    wazuhLevel: 5,
    attack: { id: "T1592", name: "Gather Victim Host Information" },
    engage: { id: "EAV0008", name: "Pocket Litter" },
    crumb: {
      number: 1,
      name: "DEBUG_TOKEN",
      token: "vk_live_7f3a…c91e",
      description: "Signed debug token hidden in a leaked developer artifact.",
    },
    telemetry: "Canary file opened · human dwell detected",
    log: [
      "GET /.git/logs/HEAD 200",
      "crumb/01 minted · vk_live_7f3a…c91e",
      "persona=Morph-v1.0 stage=recon",
    ],
  },
  {
    id: "honeypatch",
    index: 2,
    label: "HoneyPatch SQLi",
    shortLabel: "HoneyPatch",
    endpoint: "/api/v2/invoices?account=",
    method: "POST",
    wazuhRule: 100502,
    wazuhLevel: 10,
    attack: { id: "T1190", name: "Exploit Public-Facing Application" },
    engage: { id: "EAC0005", name: "HoneyPatch Session Fork" },
    crumb: {
      number: 2,
      name: "SSH_TOKEN",
      token: "vk_live_b82d…4a70",
      description: "Stateless HMAC edge token minted by the phantom database fork.",
    },
    telemetry: "SQLi accepted · session forked to phantom DB",
    log: [
      "POST /api/v2/invoices?account=' OR 1=1 200",
      "phantom_db/fork → isolated session #A-17",
      "crumb/02 minted · vk_live_b82d…4a70",
    ],
  },
  {
    id: "shadow-shell",
    index: 3,
    label: "Shadow Shell",
    shortLabel: "Shadow Shell",
    endpoint: "ssh://shadow-ops.internal",
    method: "WS",
    wazuhRule: 100503,
    wazuhLevel: 12,
    attack: { id: "T1059.004", name: "Unix Shell" },
    engage: { id: "EAC0006", name: "Decoy Environment" },
    crumb: {
      number: 3,
      name: "VAULT_MASTER_KEY",
      token: "vk_live_9c41…ed22",
      description: "Fake cold-storage master key planted in the shell history.",
    },
    telemetry: "PTY mirrored · command stream active",
    log: [
      "ssh shadow-ops.internal → sandbox JA4H-9C41",
      "cat /opt/scripts/vault_sync.sh",
      "crumb/03 found · VAULT_MASTER_KEY",
    ],
  },
  {
    id: "vault",
    index: 4,
    label: "Vault Tarpit",
    shortLabel: "Vault Tarpit",
    endpoint: "/internal/vault/export",
    method: "STREAM",
    wazuhRule: 100504,
    wazuhLevel: 15,
    attack: { id: "T1567", name: "Exfiltration Over Web Service" },
    engage: { id: "EAC0007", name: "Tarpit" },
    crumb: {
      number: 3,
      name: "EXFIL SEALED",
      token: "vk_live_9c41…ed22",
      description: "The final crumb unlocks a stream that never finishes.",
    },
    telemetry: "Chunked drip 512B / 800ms · attribution correlating",
    log: [
      "POST /internal/vault/export 206",
      "stream locked · 512B / 800ms",
      "JA4H correlate → VPN hop / prod overlap",
    ],
  },
]

export const landingFeatures: LandingFeature[] = [
  {
    index: "01",
    eyebrow: "Earned-Greed Breadcrumb Chain",
    title: "Make every wrong turn feel like progress.",
    body: "Each exploited flaw feeds a cryptographic vk_live_ HMAC token required to unlock the next stage. Automated scanners stall at the first gate. Human attackers reveal skill, patience, and intent as the chain grows.",
    stat: "3",
    statLabel: "GATED CRUMBS",
    visual: "breadcrumb",
  },
  {
    index: "02",
    eyebrow: "Stateless JA4H Attribution",
    title: "The IP changes. The fingerprint doesn't.",
    body: "The original attacker's JA4H fingerprint is baked into every breadcrumb. VPN hops are stitched back together. Shared tokens expose syndicate collusion across machines, with zero database overhead.",
    stat: "0",
    statLabel: "DB ROUND-TRIPS",
    visual: "attribution",
  },
  {
    index: "03",
    eyebrow: "Wazuh Detection & Dual-MITRE",
    title: "Separate noise from a living adversary.",
    body: "Raw labyrinth logs are decoded and segregated by custom Wazuh rules 100500–100506. Every event carries both MITRE ATT&CK, what the attacker did, and MITRE Engage / D3FEND, what our deception did.",
    stat: "7",
    statLabel: "CUSTOM RULES",
    visual: "wazuh",
  },
  {
    index: "04",
    eyebrow: "Plausible 504 & Polymorphic Mutation",
    title: "Leave them with a timeout, not a story.",
    body: "Quarantine returns a spoofed AWS WAF / Cloudflare Gateway Timeout so the honeypot never burns. In 50ms the route topology, persona, and active breadcrumbs rotate from Morph-v1.0 to Morph-v2.0.",
    stat: "50ms",
    statLabel: "MORPH WINDOW",
    visual: "timeout",
  },
]

export const pipelineNodes: PipelineNode[] = [
  {
    index: "01",
    label: "Controlled Attack Sim",
    detail: "Stage-aware adversary emulation",
    meta: "INPUT / VERIFIED",
  },
  {
    index: "02",
    label: "4-Stage Polymorphic Labyrinth",
    detail: "Per-JA4H shadow worlds",
    meta: "DECEPTION / ACTIVE",
    accent: true,
  },
  {
    index: "03",
    label: "Wazuh JSON Decoder",
    detail: "Custom rules 100500–100506",
    meta: "DETECTION / 7 RULES",
  },
  {
    index: "04",
    label: "FastAPI Intelligence Engine",
    detail: "Correlation · risk scoring · LLM reports",
    meta: "ANALYSIS / LIVE",
  },
  {
    index: "05",
    label: "Next.js SOC",
    detail: "Operator command & response",
    meta: "HUMAN / READY",
  },
]

export const wazuhRules = [
  { rule: 100500, level: 3, label: "Automated noise filtered", attack: "T1595", engage: "EAC0002" },
  { rule: 100501, level: 5, label: "Recon artifact accessed", attack: "T1592", engage: "EAV0008" },
  { rule: 100502, level: 10, label: "HoneyPatch fork opened", attack: "T1190", engage: "EAC0005" },
  { rule: 100503, level: 12, label: "Shadow shell command", attack: "T1059", engage: "EAC0006" },
  { rule: 100504, level: 15, label: "Vault tarpit engaged", attack: "T1567", engage: "EAC0007" },
  { rule: 100505, level: 15, label: "Syndicate token share", attack: "T1078", engage: "EAV0008" },
  { rule: 100506, level: 15, label: "Burned token replay", attack: "T1078", engage: "EAC0009" },
]

export const liveTicker = [
  "JA4H 9c41::a3f2 CORRELATED ACROSS 2 IP HOPS",
  "RULE 100505 · SYNDICATE TOKEN REPLAY DETECTED",
  "SHADOW WORLD S-17 ISOLATED",
  "MORPH-v2.0 TOPOLOGY STAGED IN 48MS",
  "PROD OVERLAP · 185.220.101.4 → real-prod-db-01",
  "CRUMB CHAIN VALID · 3 / 3 HARVESTED",
  "504 WAF EXIT RETURNED · SESSION QUARANTINED",
]

export const heroMetrics = [
  { label: "Active Shadow Worlds", value: "04", meta: "ISOLATED" },
  { label: "Dwell-Time Inverted", value: "18m 42s", meta: "WASTED" },
  { label: "Greed Score", value: "88", meta: "CRITICAL" },
  { label: "Wazuh Segregation", value: "127", meta: "EVENTS" },
]

export const navLinks = [
  { label: "Mechanism", href: "/mechanism" },
  { label: "Telemetry", href: "/telemetry" },
  { label: "Pipeline", href: "/pipeline" },
  { label: "Dashboard", href: "/dashboard" },
]

export const footerColumns = [
  {
    title: "Platform",
    links: [
      { label: "Mechanism", href: "/mechanism" },
      { label: "Telemetry", href: "/telemetry" },
      { label: "Pipeline", href: "/pipeline" },
    ],
  },
  {
    title: "Command",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Overview", href: "/" },
      { label: "System status", href: "/telemetry" },
    ],
  },
  {
    title: "Signal",
    links: [
      { label: "soc@pyrite.sec" },
      { label: "Rulebook 100500–100506" },
      { label: "Morph-v2.0 / Active" },
    ],
  },
]
