export type Severity = "critical" | "suspicious" | "info"

export type ConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"

export type DashboardMode = "demo" | "live"

export type NodeKind =
  | "attacker"
  | "honeypot"
  | "protected"
  | "infrastructure"
  | "compromised"

export type HoneypotStatus =
  | "online"
  | "offline"
  | "degraded"
  | "under_attack"
  | "capturing"

export interface NamedValue {
  label: string
  value: number
  color?: string
}

export interface TimePoint {
  label: string
  value: number
}

export interface DashboardAlert {
  id?: string
  title: string
  detail: string
  severity: Severity
  sourceIp?: string
  ruleId?: string | number
  timestamp?: string
}

export interface NetworkNode {
  id: string
  label: string
  ip: string
  kind: NodeKind
  severity: Severity
  status: string
  x: number
  y: number
  protocols: string[]
  connectionCount: number
  firstSeen: string
  lastSeen: string
  associatedHoneypot?: string
  threatClassification?: string
}

export interface NetworkConnection {
  id: string
  source: string
  target: string
  severity: Severity
  protocol: string
  packets: number
  lastSeen: string
  label?: string
}

export interface SecurityEvent {
  id: string
  timestamp: string
  severity: Severity
  sourceIp: string
  destination: string
  destinationIp: string
  protocol: string
  eventType: string
  description: string
  ruleId: string
  ruleLevel: number
  mitreId: string
  mitreTactic: string
  mitreTechnique: string
  honeypot: string
  sessionId?: string
  username?: string
  raw?: any
}

export interface Attacker {
  id: string
  ip: string
  firstSeen: string
  lastSeen: string
  attempts: number
  honeypots: string[]
  protocols: string[]
  severity: Severity
  status: string
  ja4h?: string
  country?: string
  asn?: string
}

export interface Honeypot {
  id: string
  name: string
  host: string
  ip: string
  type: string
  status: HoneypotStatus
  sessions: number
  interactions: number
  lastActivity: string
  severity: Severity
  protocols: string[]
  uptime?: string
}

export interface DashboardMetrics {
  totalAttacks: number
  activeAttackers: number
  capturedSessions: number
  criticalAlerts: number
}

export interface DashboardAnalytics {
  volume: TimePoint[]
  severity: NamedValue[]
  targetedHoneypots: NamedValue[]
  protocols: NamedValue[]
  sessions: TimePoint[]
}

export interface DashboardSnapshot {
  generatedAt: string
  source?: string
  metrics: DashboardMetrics
  nodes: NetworkNode[]
  connections: NetworkConnection[]
  events: SecurityEvent[]
  attackers: Attacker[]
  honeypots: Honeypot[]
  alerts: DashboardAlert[]
  analytics: DashboardAnalytics
}
