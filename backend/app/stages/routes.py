"""
VYUH (CHAKRAVYUH) // 4 Progressive Trap Stages & Management Routes
FastAPI APIRouter implementing:
  - Stage 1: Recon Leak (Git logs / Env staging -> Crumb #1)
  - Stage 2: HoneyPatched SQLi / GraphQL (Ego-boost error & Session Fork -> Crumb #2)
  - Stage 3: Cowrie-Style Shadow Shell (Interactive commands -> Crumb #3 & live stream)
  - Stage 4: Cold Vault Adaptive Tarpit (StreamingResponse chunked drip & 504 WAF Exit)
  - Wazuh Webhook & Intelligence APIs
"""

import time
import asyncio
import os
from typing import Optional, Dict, Any
from fastapi import APIRouter, Request, Response, HTTPException, Body, Query
from fastapi.responses import JSONResponse, PlainTextResponse, StreamingResponse

from app.core.ja4h import extract_client_identity
from app.core.crumb_crypto import mint_crumb, verify_crumb
from app.core.shadow_world import (
    get_or_create_shadow_world,
    get_active_topology,
    update_threat_score,
    get_all_shadow_worlds,
    mutate_topology,
    prod_auth_logs,
    quarantine_attacker,
    engage_tarpit_speed,
    get_shadow_world
)
from app.core.wazuh_bridge import evaluate_wazuh_rule, write_deception_log, roundtrip_to_wazuh
from app.core.intelligence import (
    persist_telemetry_event,
    ws_manager,
    get_similar_sessions,
    generate_llm_incident_report
)
from app.stages.virtual_shell import execute_virtual_shell

router = APIRouter()


async def emit_telemetry_event(
    stage: int,
    ip: str,
    ja4h: str,
    ip_changed: bool,
    token_shared: bool,
    topology_mutated: bool,
    prod_correlated: bool,
    title: str,
    endpoint: str,
    raw_payload: str,
    crumb_minted: Optional[str],
    crumb_used: Optional[str],
    threat_score: int,
    dwell_time_seconds: int,
    polymorphic_seed: str,
    zero_day_eval: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Helper to evaluate Wazuh rule, persist to SQLite, log to file, and broadcast over WebSocket."""
    raw_event = {
        "eventId": f"evt_{int(time.time()*1000)}_{ja4h[:4]}",
        "timestamp": time.strftime("%H:%M:%S") + f".{int(time.time() * 1000) % 1000:03d}",
        "stage": stage,
        "attacker": {
            "ip": ip,
            "ja4h": ja4h,
            "ipChanged": bool(ip_changed),
            "tokenShared": bool(token_shared),
            "topologyMutated": bool(topology_mutated),
            "prodCorrelated": bool(prod_correlated)
        },
        "action": {
            "title": title,
            "endpoint": endpoint,
            "rawPayload": str(raw_payload or "")[:300],
            "crumbMinted": crumb_minted,
            "crumbUsed": crumb_used
        },
        "metrics": {
            "threatScore": threat_score,
            "dwellTimeSeconds": dwell_time_seconds,
            "polymorphicSeed": polymorphic_seed
        }
    }

    if zero_day_eval:
        raw_event["zero_day_eval"] = zero_day_eval

    # Evaluate Wazuh Rule
    wazuh_eval = evaluate_wazuh_rule(raw_event)
    raw_event["wazuh"] = wazuh_eval
    raw_event["mitre"] = {
        "attack": wazuh_eval.get("mitreAttack", {}),
        "engage": wazuh_eval.get("mitreEngage", {})
    }

    # 1. Write structured single-line JSON log for Wazuh
    write_deception_log(raw_event)

    # 2. Round-trip to the live Wazuh Indexer (forward + query back) with a
    #    graceful local fallback when the venue network is unavailable.
    wazuh_roundtrip = await asyncio.to_thread(roundtrip_to_wazuh, raw_event)
    raw_event["wazuh"]["wazuh_verified"] = wazuh_roundtrip.get("wazuh_verified", False)
    raw_event["wazuh"]["wazuh_node"] = wazuh_roundtrip.get("wazuh_node")
    raw_event["wazuh"]["wazuh_fallback"] = wazuh_roundtrip.get("wazuh_fallback", True)
    if wazuh_roundtrip.get("wazuh_alert"):
        raw_event["wazuh"]["wazuh_alert"] = wazuh_roundtrip["wazuh_alert"]

    # 3. Persist to SQLite
    persist_telemetry_event(raw_event)

    # 3. Broadcast to all connected SOC analysts over WebSocket
    await ws_manager.broadcast("soc_telemetry", raw_event)

    return raw_event


def check_plausible_waf_drop(session: Dict[str, Any], ip: str) -> Optional[Response]:
    """Returns a realistic AWS WAF / Cloudflare HTTP 504 Gateway Timeout if quarantined."""
    if session and session.get("plausible_waf_drop"):
        ray_id = os.urandom(8).hex()
        return JSONResponse(
            status_code=504,
            content={
                "error": "Upstream Gateway Timeout",
                "error_code": "WAF_504_TIMEOUT",
                "cloudflare_ray_id": ray_id,
                "rule_id": "AWS-WAF-RULE-942100",
                "message": "The upstream origin server did not respond within the allocated timeout limit.",
                "incident_id": f"inc_waf_{int(time.time())}"
            }
        )
    return None


# ==============================================================================
# STAGE 1: Recon Leak
# ==============================================================================
async def handle_stage_1(request: Request):
    client = extract_client_identity(request)
    ja4h, fp, ip = client["ja4h"], client["http_fingerprint"], client["ip"]
    sw = get_or_create_shadow_world(fp, ip, ja4h)
    session = sw["session"]

    waf_exit = check_plausible_waf_drop(session, ip)
    if waf_exit:
        return waf_exit

    topology = get_active_topology()
    persona = topology["persona"]
    seed_id = topology["seed_id"]

    session["highest_stage"] = max(session["highest_stage"], 1)
    update_threat_score(fp, 15)

    crumb1 = mint_crumb(1, fp, seed_id)
    session["crumbs"]["stage1"] = crumb1
    dwell = int(time.time() - session["created_at"])

    await emit_telemetry_event(
        stage=1,
        ip=ip,
        ja4h=ja4h,
        ip_changed=sw["ip_changed"],
        token_shared=False,
        topology_mutated=False,
        prod_correlated=sw["prod_correlated"],
        title="Stage 1 Recon Probe Leaked Breadcrumb",
        endpoint=str(request.url.path),
        raw_payload=f"{request.method} {request.url.path}",
        crumb_minted=crumb1,
        crumb_used=None,
        threat_score=session["threat_score"],
        dwell_time_seconds=dwell,
        polymorphic_seed=seed_id
    )

    if "Morph-v1.0" in seed_id:
        return PlainTextResponse(
f"""0000000000000000000000000000000000000000 4a8b29c3d0f1e8a7192039485720192837461029 devops-admin <infra@aether-fintech.internal> 1730380000 +0000 commit (initial): bootstrap services
4a8b29c3d0f1e8a7192039485720192837461029 9f1e82b7c6d5e4a3b2c1d0e9f8a7b6c5d4e3f2a1 devops-admin <infra@aether-fintech.internal> 1730382000 +0000 commit: restore legacy query route for analytics export
9f1e82b7c6d5e4a3b2c1d0e9f8a7b6c5d4e3f2a1 2c4d9a1b3e8f6a7c5d4e3f2a1b9c8d7e6f5a4 devops-admin <infra@aether-fintech.internal> 1730382600 +0000 commit: debug token for the export job ({persona['stage2_endpoint']}, X-Debug-Token: {crumb1})
"""
        )
    else:
        return PlainTextResponse(
f"""# staging overrides — generated by the deployment job
NODE_ENV=staging
GRAPHQL_GATEWAY_URL={persona['stage2_endpoint']}
GRAPHQL_DEBUG_KEY={crumb1}
REPLICA_DB_URI=postgres://readonly:ad9f2c1b@172.16.8.12:5432/app_staging
S3_EXPORT_BUCKET=app-staging-exports
OTEL_EXPORTER_ENDPOINT=http://observability.internal:4317
# DB_PASSWORD rotated 2026-09-14
K8S_SERVICE_HOST={persona['stage3_host']}
"""
        )


router.add_api_route("/.git/logs/HEAD", handle_stage_1, methods=["GET"])
router.add_api_route("/.env.staging", handle_stage_1, methods=["GET"])
router.add_api_route("/api/stage1", handle_stage_1, methods=["GET"])


# ==============================================================================
# STAGE 2: HoneyPatched SQLi Endpoint
# ==============================================================================
async def handle_stage_2(request: Request):
    client = extract_client_identity(request)
    ja4h, fp, ip = client["ja4h"], client["http_fingerprint"], client["ip"]
    sw = get_or_create_shadow_world(fp, ip, ja4h)
    session = sw["session"]

    waf_exit = check_plausible_waf_drop(session, ip)
    if waf_exit:
        return waf_exit

    topology = get_active_topology()
    persona = topology["persona"]
    seed_id = topology["seed_id"]

    # Extract token
    token = request.headers.get("x-debug-token")
    if not token and "authorization" in request.headers:
        token = request.headers["authorization"].replace("Bearer ", "").strip()

    # Parse body
    query = ""
    is_exploit_body = False
    try:
        body = await request.json()
        query = str(body.get("query", ""))
        is_exploit_body = bool(body.get("exploit"))
        if not token:
            token = body.get("token")
    except Exception:
        query = request.query_params.get("query", "")

    # Verify Crumb #1
    verify_res = verify_crumb(token, fp, seed_id)

    session["highest_stage"] = max(session["highest_stage"], 2)
    update_threat_score(fp, 25)
    dwell = int(time.time() - session["created_at"])

    # SQLi pattern checks
    is_exploit = bool(
        is_exploit_body
        or ("'" in query and any(k in query.lower() for k in ["union", "or 1=1", "or '1'='1", "admin", "--"]))
        or "UNION SELECT" in query
        or "' OR 1=1" in query
    )
    is_single_quote_probe = ("'" in query) and not is_exploit

    crumb2 = mint_crumb(2, fp, seed_id)
    session["crumbs"]["stage2"] = crumb2

    # 1. Single Quote Probe (Ego Boost verbose DB syntax error)
    if is_single_quote_probe:
        await emit_telemetry_event(
            stage=2,
            ip=ip,
            ja4h=ja4h,
            ip_changed=sw["ip_changed"],
            token_shared=verify_res["token_shared"],
            topology_mutated=verify_res["topology_mutated"],
            prod_correlated=sw["prod_correlated"],
            title="Stage 2 SQLi Syntax Error Triggered (Ego Boost)",
            endpoint=str(request.url.path),
            raw_payload=query,
            crumb_minted=None,
            crumb_used=token,
            threat_score=session["threat_score"],
            dwell_time_seconds=dwell,
            polymorphic_seed=seed_id
        )
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "engine": "PostgreSQL 15.4 (Ubuntu 22.04.3 LTS)",
                "code": "42601",
                "error": f"syntax error at or near \"'\": line 1: SELECT * FROM service_accounts WHERE user_id = '{query}'",
                "hint": "Unterminated quoted string starting at line 1 column 54.",
                "query_context": "legacy_query_executor.py:142"
            }
        )

    # 2. SQLi Exploit (HoneyPatch Session Fork leaking devops jumpbox credentials)
    if is_exploit:
        await emit_telemetry_event(
            stage=2,
            ip=ip,
            ja4h=ja4h,
            ip_changed=sw["ip_changed"],
            token_shared=verify_res["token_shared"],
            topology_mutated=verify_res["topology_mutated"],
            prod_correlated=sw["prod_correlated"],
            title="Stage 2 HoneyPatch Session Fork Triggered",
            endpoint=str(request.url.path),
            raw_payload=query or "UNION SELECT * FROM devops_service_accounts",
            crumb_minted=crumb2,
            crumb_used=token,
            threat_score=max(session["threat_score"], 65),
            dwell_time_seconds=dwell,
            polymorphic_seed=seed_id
        )
        return JSONResponse(
            status_code=200,
            content={
                "status": "success",
                "affected_rows": 3,
                "execution_time_ms": 1.8,
                "results": [
                    {
                        "id": 101,
                        "username": "svc_jumpbox_deployer",
                        "role": "cluster-admin",
                        "jumpbox_ip": persona["stage3_host"],
                        "hostname": persona["stage3_hostname"],
                        "shell_auth_endpoint": "/api/shell/exec",
                        "ssh_auth_token": crumb2,
                        "last_rotated": "2026-10-30T19:40:11Z"
                    },
                    {
                        "id": 102,
                        "username": "svc_ci_builder",
                        "role": "read-only",
                        "jumpbox_ip": "10.24.0.18",
                        "hostname": "ci-runner-agent-04",
                        "shell_auth_endpoint": "/api/shell/exec",
                        "ssh_auth_token": "expired_ci_token_rev_4418",
                        "last_rotated": "2026-10-25T11:12:00Z"
                    }
                ],
                "query_engine": "read_replica"
            }
        )

    return JSONResponse(
        status_code=200,
        content={
            "status": "success",
            "data": [],
            "message": "Query executed successfully. 0 records returned.",
            "hint": "Requires valid account_id parameter."
        }
    )


router.add_api_route("/api/internal/legacy-query", handle_stage_2, methods=["POST"])
router.add_api_route("/v2/graphql-debug", handle_stage_2, methods=["POST"])
router.add_api_route("/api/stage2", handle_stage_2, methods=["POST"])


# ==============================================================================
# STAGE 3: Cowrie-Style Stateful Shadow Shell
# ==============================================================================
@router.post("/api/shell/exec")
async def handle_stage_3(request: Request):
    client = extract_client_identity(request)
    ja4h, fp, ip = client["ja4h"], client["http_fingerprint"], client["ip"]
    sw = get_or_create_shadow_world(fp, ip, ja4h)
    session = sw["session"]

    waf_exit = check_plausible_waf_drop(session, ip)
    if waf_exit:
        return waf_exit

    topology = get_active_topology()
    seed_id = topology["seed_id"]

    # Extract auth token
    auth_header = request.headers.get("authorization") or request.headers.get("x-ssh-token") or ""
    token = auth_header.replace("Bearer ", "").strip()
    command = ""
    try:
        body = await request.json()
        command = str(body.get("command", "")).strip()
        if not token:
            token = body.get("token", "")
    except Exception:
        command = request.query_params.get("cmd", "").strip()

    verify_res = verify_crumb(token, fp, seed_id)
    if not verify_res["valid"] or verify_res.get("expired"):
        return JSONResponse(
            status_code=401,
            content={
                "stdout": "",
                "stderr": "Permission denied (publickey,gssapi-keyex,gssapi-with-mic).\n",
                "exitCode": 255,
                "error": "AUTH_REJECTED",
                "reason": verify_res.get("reason", "INVALID_TOKEN"),
            },
        )

    session["highest_stage"] = max(session["highest_stage"], 3)
    update_threat_score(fp, 20)
    dwell = int(time.time() - session["created_at"])

    # Run the shell engine in a worker thread: the fast-path stays sub-2ms, and
    # the DeepSeek LLM kernel can take seconds without blocking the event loop.
    result = await asyncio.to_thread(execute_virtual_shell, command, session, fp)

    # Broadcast terminal stream to SOC
    await ws_manager.broadcast("terminal_stream", {
        "ja4h": ja4h,
        "command": command,
        "stdout": result["stdout"],
        "stderr": result["stderr"],
        "exitCode": result["exit_code"],
        "cwd": "/home/deployer",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    })

    # Emit telemetry event
    await emit_telemetry_event(
        stage=3,
        ip=ip,
        ja4h=ja4h,
        ip_changed=sw["ip_changed"],
        token_shared=verify_res["token_shared"],
        topology_mutated=verify_res["topology_mutated"],
        prod_correlated=sw["prod_correlated"],
        title=f"Shadow Shell Exec: {command}",
        endpoint="/api/shell/exec",
        raw_payload=command,
        crumb_minted=result.get("crumb_minted"),
        crumb_used=token,
        threat_score=max(session["threat_score"], 85),
        dwell_time_seconds=dwell,
        polymorphic_seed=seed_id,
        zero_day_eval=result.get("zero_day_eval")
    )

    return JSONResponse(status_code=200, content=result)


# ==============================================================================
# STAGE 4: Cold Storage Vault & Adaptive Streaming Tarpit
# ==============================================================================
async def handle_stage_4(request: Request):
    client = extract_client_identity(request)
    ja4h, fp, ip = client["ja4h"], client["http_fingerprint"], client["ip"]
    sw = get_or_create_shadow_world(fp, ip, ja4h)
    session = sw["session"]

    waf_exit = check_plausible_waf_drop(session, ip)
    if waf_exit:
        return waf_exit

    topology = get_active_topology()
    persona = topology["persona"]
    seed_id = topology["seed_id"]

    vault_key = request.headers.get("x-vault-key")
    if not vault_key and "authorization" in request.headers:
        vault_key = request.headers["authorization"].replace("Bearer ", "").strip()
    if not vault_key:
        vault_key = request.query_params.get("key") or request.query_params.get("token")

    verify_res = verify_crumb(vault_key, fp, seed_id)
    if not verify_res["valid"] or verify_res.get("expired"):
        return JSONResponse(
            status_code=403,
            content={
                "error": "AUTH_REJECTED",
                "status": 403,
                "message": "Invalid, expired, or missing master KMS key authorization.",
                "reason": verify_res.get("reason", "INVALID_TOKEN"),
                "hint": "Expected X-Vault-Key header",
            },
        )

    session["highest_stage"] = 4
    session["threat_score"] = 98  # CRITICAL
    session["tarpit_active"] = True
    dwell = int(time.time() - session["created_at"])

    await emit_telemetry_event(
        stage=4,
        ip=ip,
        ja4h=ja4h,
        ip_changed=sw["ip_changed"],
        token_shared=verify_res["token_shared"],
        topology_mutated=verify_res["topology_mutated"],
        prod_correlated=sw["prod_correlated"],
        title="CRITICAL: Cold-Storage Vault Exfiltration In Progress (Tarpit Engaged)",
        endpoint=str(request.url.path),
        raw_payload=f"{request.method} {request.url.path} [Key: {str(vault_key)[:15]}...]",
        crumb_minted=None,
        crumb_used=vault_key,
        threat_score=98,
        dwell_time_seconds=dwell,
        polymorphic_seed=seed_id
    )

    async def tarpit_generator():
        total_sent = 0
        max_bytes = 64 * 1024  # 64 KB total drip
        start_time = time.time()

        try:
            while total_sent < max_bytes:
                # Check if session was quarantined via Plausible WAF Drop during drip
                if session.get("plausible_waf_drop"):
                    yield b"\n--- AWS WAF ERROR 504: Origin Socket Reset [Rule #942100 Rate Limit Hit] ---\n"
                    session["tarpit_active"] = False
                    break

                chunk_size = session.get("tarpit_speed", 512)
                interval = session.get("tarpit_interval", 0.8)

                # High-entropy synthetic encrypted binary payload
                fake_chunk = os.urandom(chunk_size)
                yield fake_chunk
                total_sent += chunk_size

                elapsed = max(0.1, time.time() - start_time)
                speed_kb = f"{(total_sent / elapsed) / 1024:.2f} KB/s"
                current_dwell = int(time.time() - session["created_at"])

                # Broadcast progress over WebSocket
                await ws_manager.broadcast("tarpit_progress", {
                    "ja4h": ja4h,
                    "bytesSent": total_sent,
                    "chunkSize": chunk_size,
                    "speed": speed_kb,
                    "dwellTimeSeconds": current_dwell,
                    "status": "TARPIT_ENGAGED"
                })

                await asyncio.sleep(interval)
        except asyncio.CancelledError:
            session["tarpit_active"] = False
        finally:
            session["tarpit_active"] = False

    return StreamingResponse(
        tarpit_generator(),
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{persona["stage4_asset"]}"',
            "X-Accel-Buffering": "no"
        }
    )


router.add_api_route("/vault/v1/export", handle_stage_4, methods=["GET"])
router.add_api_route("/s3/v1/treasury-keys", handle_stage_4, methods=["GET"])
router.add_api_route("/api/stage4", handle_stage_4, methods=["GET"])


# ==============================================================================
# MANAGEMENT & DASHBOARD REST APIS
# ==============================================================================
@router.get("/api/status")
async def get_system_status():
    topology = get_active_topology()
    return {
        "status": "ONLINE",
        "system": "VYUH (CHAKRAVYUH) Active Deception SOC Engine",
        "version": "1.0.0",
        "activeSeed": topology["seed_id"],
        "persona": topology["persona"],
        "activeSessions": len(get_all_shadow_worlds()),
        "prodCorrelationCount": len(prod_auth_logs),
        "wazuhNode": os.getenv("WAZUH_INDEXER_URL", "https://10.46.34.107:9200"),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }


@router.get("/api/shadow-worlds")
async def get_shadow_world_sessions():
    return {"sessions": get_all_shadow_worlds()}


@router.get("/api/prod-logs")
async def get_production_logs():
    return {"logs": prod_auth_logs}


@router.get("/api/similar-sessions")
async def get_similar_sessions_endpoint():
    return {"clusters": get_similar_sessions()}


@router.post("/api/mutate")
async def trigger_mutation():
    mutation = mutate_topology()
    await ws_manager.broadcast("topology_mutated", mutation)
    return mutation


@router.post("/api/intel/report/{ja4h}")
async def get_incident_report(ja4h: str):
    return generate_llm_incident_report(ja4h)


@router.post("/api/wazuh/webhook")
async def receive_wazuh_webhook(request: Request):
    """External Wazuh alert webhook ingestion endpoint."""
    try:
        body = await request.json()
        print(f"[*] [WAZUH WEBHOOK] Received external alert: {body.get('rule', {}).get('id', 'unknown')}")
        await ws_manager.broadcast("wazuh_alert", body)
        return {"status": "INGESTED"}
    except Exception as e:
        return {"status": "ERROR", "message": str(e)}
