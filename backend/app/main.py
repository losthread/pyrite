"""
VYUH (CHAKRAVYUH) // FastAPI Server Entrypoint
Port 8000 — FastAPI + SQLite + Wazuh Segregation + WebSockets (/ws/soc)
D3COY 1.0 — Problem Statement 04: Deception-Driven Threat Detection & Response
"""

import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.stages.routes import router as trap_router
from app.core.intelligence import init_sqlite_db, ws_manager
from app.core.shadow_world import get_active_topology


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize SQLite database
    init_sqlite_db()
    topology = get_active_topology()

    print(f"""
================================================================================
               VYUH (CHAKRAVYUH) // ACTIVE DECEPTION ENGINE                    
      Problem Statement 04: Deception-Driven Threat Detection & Response       
================================================================================
  * Server Status:       ONLINE (FastAPI & WebSockets on port 8000)            
  * Active Topology:     {topology["seed_id"]}
  * East-West Watchlist: 185.220.101.4 (Correlated with real-prod-db-01)       
  * Detection Layer:     Wazuh Rules 100500-100506 (Levels 5 to 15)            
  * Single-Line Log:     /backend/logs/vyuh_deception.json                     
  * SQLite Database:     /backend/data/vyuh_soc.db                             
  * WebSocket SOC Hub:   /ws/soc                                               
================================================================================
""")
    yield


app = FastAPI(
    title="VYUH (CHAKRAVYUH) Active Deception Engine",
    description="Ephemeral, Polymorphic 4-Stage Honeypot & Wazuh Segregation Platform",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend and external tools
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount trap stages and intelligence routes
app.include_router(trap_router)


# ==============================================================================
# Native WebSocket SOC Endpoint (/ws/soc)
# ==============================================================================
@app.websocket("/ws/soc")
async def soc_websocket_endpoint(websocket: WebSocket):
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


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)