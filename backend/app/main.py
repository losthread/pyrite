"""
VYUH (CHAKRAVYUH) // FastAPI Server Entrypoint
Port 8000 — FastAPI + SQLite + Wazuh Segregation + WebSockets (/ws/soc)
D3COY 1.0 — Problem Statement 04: Deception-Driven Threat Detection & Response
"""

import json
import os
import random
import time
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import uvicorn

from app.stages.routes import router as trap_router
from app.routes.auth import router as auth_router
from app.routes.incidents import router as incidents_router
from app.routes.dashboard import router as dashboard_router
from app.core.intelligence import init_sqlite_db, ws_manager
from app.core.shadow_world import get_active_topology
from app.core.auth import decode_jwt_token

load_dotenv()

# Demo-safe defaults. In a real deployment set DEMO_MODE=false and provide JWTs.
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() in {"1", "true", "yes"}
FRONTEND_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://localhost:5174",
]
_extra_origin = os.getenv("FRONTEND_URL")
if _extra_origin:
    FRONTEND_ORIGINS.append(_extra_origin)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Inject security headers and a believable Envoy upstream-service-time.

    The X-Envoy-Upstream-Service-Time value is a gaussian jitter used both as a
    security header and as Chameleon latency masking so trap responses do not
    look unnaturally instant to fingerprinting tooling.
    """

    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault(
            "Content-Security-Policy",
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws: wss:;",
        )
        jitter = int(min(115, max(28, random.gauss(70, 22))))
        response.headers.setdefault(
            "X-Envoy-Upstream-Service-Time", str(jitter)
        )
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize SQLite database
    init_sqlite_db()
    topology = get_active_topology()

    print(f"""
================================================================================
          PYRITE // AUTONOMOUS ACTIVE DECEPTION GRID                    
      Problem Statement 04: Deception-Driven Threat Detection & Response       
===============================================================================
  * Server Status:       ONLINE (FastAPI & WebSockets on port 8000)            
  * Demo Mode:           {DEMO_MODE}                                          
  * Active Topology:     {topology["seed_id"]}
  * East-West Watchlist: 185.220.101.4 (Correlated with real-prod-db-01)       
  * Detection Layer:     Wazuh Rules 100500-100506 + 100599 (Levels 5 to 15)   
  * Single-Line Log:     /backend/logs/vyuh_deception.json                     
  * SQLite Database:     /backend/data/vyuh_soc.db                             
  * WebSocket SOC Hub:   /ws/soc                                               
================================================================================
""")
    yield


app = FastAPI(
    title="PYRITE Autonomous Deception Engine",
    description="Ephemeral, Polymorphic 4-Stage Honeypot & Wazuh Segregation Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# Explicit CORS — no wildcard with credentials.
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Debug-Token", "X-Vault-Key", "X-Client-Fingerprint"],
)

app.add_middleware(SecurityHeadersMiddleware)

# Standard health endpoints
@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "pyrite-soc-engine", "version": "1.0.0"}

# Mount trap stages, auth, incidents and dashboard routers.
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(incidents_router, tags=["incidents"])
app.include_router(dashboard_router, tags=["dashboard"])
app.include_router(trap_router)


# ==============================================================================
# Native WebSocket SOC Endpoint (/ws/soc)
# ==============================================================================
@app.websocket("/ws/soc")
async def soc_websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")

    # Validate JWTs when provided. In demo mode or with demo-analyst-bypass,
    # dashboard connects seamlessly so the live demo never blocks on 4001/403.
    if token and token != "demo-analyst-bypass":
        user_id = decode_jwt_token(token)
        if user_id is None and not DEMO_MODE:
            await websocket.close(code=4001, reason="UNAUTHORIZED")
            return
    elif not DEMO_MODE and not token:
        await websocket.close(code=4001, reason="UNAUTHORIZED")
        return

    await ws_manager.connect(websocket)
    try:
        while True:
            text_data = await websocket.receive_text()
            try:
                payload = json.loads(text_data)
                # Handle soc_action commands from analyst dashboard
                await ws_manager.handle_soc_action(payload)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        print(f"[!] [SOC WS EXCEPTION] {e}")
        ws_manager.disconnect(websocket)


# ==============================================================================
# Dynamic Reconnaissance Scanner 404 Honeytrap Catch-All
# ==============================================================================
@app.exception_handler(404)
async def custom_404_honeypot_handler(request: Request, exc):
    path = request.url.path
    if path.startswith("/_next") or path == "/favicon.ico":
        return JSONResponse(status_code=404, content={"detail": "Not Found"})

    from app.core.ja4h import extract_client_identity
    from app.core.shadow_world import get_or_create_shadow_world, update_threat_score, get_active_topology
    from app.stages.routes import emit_telemetry_event

    client = extract_client_identity(request)
    ja4h, ip = client["ja4h"], client["ip"]
    sw = get_or_create_shadow_world(ja4h, ip)
    session = sw["session"]
    session["highest_stage"] = max(session["highest_stage"], 1)
    update_threat_score(ja4h, 10)

    p = path.lower()
    if any(k in p for k in ["sql", "db", "pg", "query"]):
        target_hp = "honeypot-postgres-05"
    elif any(k in p for k in ["ssh", "shell", "exec"]):
        target_hp = "honeypot-ssh-01"
    elif "redis" in p:
        target_hp = "honeypot-redis-03"
    elif any(k in p for k in ["modbus", "plc", "s7", "ics"]):
        target_hp = "honeypot-ics-04"
    elif "telnet" in p:
        target_hp = "honeypot-telnet-06"
    elif "mqtt" in p:
        target_hp = "honeypot-mqtt-07"
    elif any(k in p for k in ["vault", "s3", "key"]):
        target_hp = "honeypot-vault-08"
    else:
        target_hp = "honeypot-http-02"
    session["last_honeypot"] = target_hp

    await emit_telemetry_event(
        stage=1,
        ip=ip,
        ja4h=ja4h,
        ip_changed=sw["ip_changed"],
        token_shared=False,
        topology_mutated=False,
        prod_correlated=sw["prod_correlated"],
        title=f"Adversary Reconnaissance Scan: {path}",
        endpoint=target_hp,
        raw_payload=f"{request.method} {path}",
        crumb_minted=None,
        crumb_used=None,
        threat_score=session["threat_score"],
        dwell_time_seconds=int(time.time() - session["created_at"]),
        polymorphic_seed=get_active_topology()["seed_id"]
    )
    return JSONResponse(
        status_code=404,
        content={"error": "Not Found", "message": f"Resource {path} not found on origin server.", "code": "RESOURCE_404"}
    )

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
