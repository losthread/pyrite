/**
 * AETHER-LABYRINTH // Server Entrypoint
 * Port 4000 — Express + Socket.io Active Deception Core Engine
 */

import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { createTrapRouter } from './stages/trapRoutes.js';
import {
  getActiveTopology,
  mutateTopology,
  engageTarpitSpeed,
  quarantineAttacker,
  getShadowWorld,
  getAllShadowWorlds,
  prodAuthLogs
} from './core/shadowWorld.js';
import { mintCrumb } from './core/crumbCrypto.js';

const PORT = process.env.PORT || 4000;

const app = express();
const server = http.createServer(app);

// Enable permissive CORS for dashboard integrations
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Mount Deception Labyrinth routes
const trapRouter = createTrapRouter(io);
app.use(trapRouter);

// -----------------------------------------------------------------------------
// Socket.io Active Deception SOC Bridge
// -----------------------------------------------------------------------------
io.on('connection', (socket) => {
  console.log(`[⚡ SOC BRIDGE] Dashboard Analyst Connected: ${socket.id}`);

  // Send current topology and initial state
  const activeTopology = getActiveTopology();
  socket.emit('system_init', {
    activeSeed: activeTopology.seedId,
    persona: activeTopology.persona,
    sessions: getAllShadowWorlds(),
    prodAuthLogs
  });

  // Handle active deception interventions from SOC analysts
  socket.on('soc_action', (payload) => {
    const { action, ja4h, stage } = payload || {};
    console.log(`[🎯 SOC ACTION] Received: ${action} | Target JA4H: ${ja4h || 'ALL'}`);

    switch (action) {
      case 'ENGAGE_TARPIT': {
        const targetJa4h = ja4h || getAllShadowWorlds()[0]?.ja4h;
        if (targetJa4h) {
          engageTarpitSpeed(targetJa4h, 128, 2000);
          socket.emit('action_ack', {
            action: 'ENGAGE_TARPIT',
            targetJa4h,
            status: 'SUCCESS',
            message: 'Adaptive Tarpit throttled down to 128B / 2000ms (~0.06 KB/s).'
          });
        }
        break;
      }

      case 'PLAUSIBLE_WAF_DROP': {
        const targetJa4h = ja4h || getAllShadowWorlds()[0]?.ja4h;
        if (targetJa4h) {
          quarantineAttacker(targetJa4h, true);
          socket.emit('action_ack', {
            action: 'PLAUSIBLE_WAF_DROP',
            targetJa4h,
            status: 'SUCCESS',
            message: 'Attacker quarantined via Plausible Failure Exit (HTTP 504 Gateway Timeout).'
          });
        }
        break;
      }

      case 'MUTATE_TOPOLOGY': {
        const mutation = mutateTopology();
        io.emit('topology_mutated', mutation);
        // Also emit a high-priority telemetry alert
        io.emit('soc_telemetry', {
          eventId: `evt_${Date.now()}_sys`,
          timestamp: new Date().toTimeString().split(' ')[0] + '.' + String(Date.now() % 1000).padStart(3, '0'),
          stage: 0,
          attacker: {
            ip: 'SYSTEM_INTERNAL',
            ja4h: '0000000000000000',
            ipChanged: false,
            tokenShared: false,
            topologyMutated: true,
            prodCorrelated: false
          },
          action: {
            title: `Polymorphic Topology Rotated to ${mutation.newSeed}`,
            endpoint: '/system/mutate',
            rawPayload: `Previous: ${mutation.previousSeed} -> New: ${mutation.newSeed}`,
            crumbMinted: null,
            crumbUsed: null
          },
          mitre: {
            attack: { id: 'M1049', name: 'Antivirus/Antimalware / Deception Controls' },
            engage: { id: 'EAC0021', name: 'Dynamically Alter Environment' }
          },
          metrics: {
            threatScore: 0,
            dwellTimeSeconds: 0,
            polymorphicSeed: mutation.newSeed
          }
        });
        break;
      }

      case 'SIMULATE_STAGE': {
        // Trigger synthetic demo events directly from the UI
        const simJa4h = ja4h || '9f8e2b1c4a7d0031';
        const simIp = '185.220.101.4';
        const simStage = Number(stage) || 1;
        const currentSeed = getActiveTopology().seedId;

        if (simStage === 1) {
          const crumb1 = mintCrumb(1, simJa4h, currentSeed);
          io.emit('soc_telemetry', {
            eventId: `evt_${Date.now()}_${simJa4h.slice(0, 4)}`,
            timestamp: new Date().toTimeString().split(' ')[0] + '.' + String(Date.now() % 1000).padStart(3, '0'),
            stage: 1,
            attacker: {
              ip: simIp,
              ja4h: simJa4h,
              ipChanged: false,
              tokenShared: false,
              topologyMutated: false,
              prodCorrelated: true
            },
            action: {
              title: 'Stage 1 Recon Probe Leaked Breadcrumb',
              endpoint: '/.git/logs/HEAD',
              rawPayload: 'GET /.git/logs/HEAD [Recon scanner probe]',
              crumbMinted: crumb1,
              crumbUsed: null
            },
            mitre: {
              attack: { id: 'T1592', name: 'Gather Victim Host Information' },
              engage: { id: 'EAC0001', name: 'Lure Attacker with Leaked Context' }
            },
            metrics: {
              threatScore: 35,
              dwellTimeSeconds: 12,
              polymorphicSeed: currentSeed
            }
          });
        } else if (simStage === 2) {
          const crumb2 = mintCrumb(2, simJa4h, currentSeed);
          io.emit('soc_telemetry', {
            eventId: `evt_${Date.now()}_${simJa4h.slice(0, 4)}`,
            timestamp: new Date().toTimeString().split(' ')[0] + '.' + String(Date.now() % 1000).padStart(3, '0'),
            stage: 2,
            attacker: {
              ip: simIp,
              ja4h: simJa4h,
              ipChanged: false,
              tokenShared: false,
              topologyMutated: false,
              prodCorrelated: true
            },
            action: {
              title: 'Stage 2 HoneyPatch Session Fork Triggered',
              endpoint: '/api/internal/legacy-query',
              rawPayload: "SELECT * FROM users WHERE id = '1' UNION SELECT * FROM devops_service_accounts --",
              crumbMinted: crumb2,
              crumbUsed: 'vk_live_demo_crumb1'
            },
            mitre: {
              attack: { id: 'T1190', name: 'Exploit Public-Facing Application' },
              engage: { id: 'EAC0005', name: 'HoneyPatch Session Fork' }
            },
            metrics: {
              threatScore: 65,
              dwellTimeSeconds: 48,
              polymorphicSeed: currentSeed
            }
          });
        } else if (simStage === 3) {
          const crumb3 = mintCrumb(3, simJa4h, currentSeed);
          io.emit('terminal_stream', {
            ja4h: simJa4h,
            command: 'cat /opt/scripts/vault_sync.sh',
            stdout: `#!/bin/bash\nexport VAULT_MASTER_KEY="${crumb3}"\ncurl -s -H "X-Vault-Key: $VAULT_MASTER_KEY" http://localhost:4000/vault/v1/export\n`,
            stderr: '',
            exitCode: 0,
            cwd: '/home/deployer',
            timestamp: new Date().toISOString()
          });
          io.emit('soc_telemetry', {
            eventId: `evt_${Date.now()}_${simJa4h.slice(0, 4)}`,
            timestamp: new Date().toTimeString().split(' ')[0] + '.' + String(Date.now() % 1000).padStart(3, '0'),
            stage: 3,
            attacker: {
              ip: simIp,
              ja4h: simJa4h,
              ipChanged: false,
              tokenShared: false,
              topologyMutated: false,
              prodCorrelated: true
            },
            action: {
              title: 'Shadow Shell Exec: cat /opt/scripts/vault_sync.sh',
              endpoint: '/api/shell/exec',
              rawPayload: 'cat /opt/scripts/vault_sync.sh',
              crumbMinted: crumb3,
              crumbUsed: 'vk_live_demo_crumb2'
            },
            mitre: {
              attack: { id: 'T1059.004', name: 'Command and Scripting Interpreter: Unix Shell' },
              engage: { id: 'EAC0012', name: 'Synthetic Environment Confinement' }
            },
            metrics: {
              threatScore: 85,
              dwellTimeSeconds: 84,
              polymorphicSeed: currentSeed
            }
          });
        } else if (simStage === 4) {
          io.emit('soc_telemetry', {
            eventId: `evt_${Date.now()}_${simJa4h.slice(0, 4)}`,
            timestamp: new Date().toTimeString().split(' ')[0] + '.' + String(Date.now() % 1000).padStart(3, '0'),
            stage: 4,
            attacker: {
              ip: simIp,
              ja4h: simJa4h,
              ipChanged: false,
              tokenShared: false,
              topologyMutated: false,
              prodCorrelated: true
            },
            action: {
              title: 'CRITICAL: Cold-Storage Vault Exfiltration In Progress (Tarpit Engaged)',
              endpoint: '/vault/v1/export',
              rawPayload: 'GET /vault/v1/export [Stolen Master Key]',
              crumbMinted: null,
              crumbUsed: 'vk_live_demo_crumb3'
            },
            mitre: {
              attack: { id: 'T1041', name: 'Exfiltration Over C2 Channel' },
              engage: { id: 'EAC0018', name: 'Tarpit Rate-Limiting Containment' }
            },
            metrics: {
              threatScore: 98,
              dwellTimeSeconds: 125,
              polymorphicSeed: currentSeed
            }
          });
          io.emit('tarpit_progress', {
            ja4h: simJa4h,
            bytesSent: 2048,
            chunkSize: 512,
            speed: '0.64 KB/s',
            dwellTimeSeconds: 125,
            status: 'TARPIT_ENGAGED'
          });
        }
        break;
      }

      default:
        console.warn(`[⚠️ SOC ACTION] Unknown action received: ${action}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[⚡ SOC BRIDGE] Analyst Disconnected: ${socket.id}`);
  });
});

// Start Server on Port 4000
server.listen(PORT, () => {
  const topology = getActiveTopology();
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║              AETHER-LABYRINTH // ACTIVE DECEPTION SOC ENGINE                 ║
║      Problem Statement 04: Deception-Driven Threat Detection & Response      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  • Server Status:       ONLINE (HTTP & WebSocket listening on port ${PORT})      ║
║  • Active Topology:     ${topology.seedId.padEnd(49)}║
║  • East-West Watchlist: 185.220.101.4 (Correlated with real-prod-db-01)      ║
║  • Stage 1 Endpoint:    ${topology.persona.stage1Endpoint.padEnd(49)}║
║  • Stage 2 Endpoint:    ${topology.persona.stage2Endpoint.padEnd(49)}║
║  • Stage 3 Shell Host:  ${`${topology.persona.stage3Hostname} (${topology.persona.stage3Host})`.padEnd(49)}║
║  • Stage 4 Tarpit:      ${topology.persona.stage4Endpoint.padEnd(49)}║
║  • In-Memory Store:     Zero External DB Dependencies (Fast Map Cache)       ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
});
