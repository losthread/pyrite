"""
VYUH (CHAKRAVYUH) // Generative Linux Kernel (Beelzebub / Galah paradigm)

Novel or unusual shell commands that fall outside the deterministic fast-path
are routed here. The DeepSeek LLM generates byte-accurate Ubuntu 22.04 stdout,
stderr and exit_code, plus a dynamic zero-day threat classification mapped to
Wazuh Rule 100599. When DEEPSEEK_API_KEY is unset or the API is unreachable,
a deterministic fallback keeps the demo alive.
"""

from __future__ import annotations

import json
import os
import sqlite3
import time
from typing import Any, Dict, List, Optional

import requests

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions"
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

# Same SQLite file as the SOC engine so virtual files survive a session restart.
_BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
_DATA_DIR = os.path.join(_BASE_DIR, "data")
os.makedirs(_DATA_DIR, exist_ok=True)
_DB_PATH = os.path.join(_DATA_DIR, "vyuh_soc.db")

_SYSTEM_PROMPT = (
    "You are the Linux bash shell of a production Ubuntu 22.04.3 LTS server at "
    "a tier-1 fintech company. Hostname: fin-jumpbox-p01.corp.internal "
    "(IP 10.24.0.15). User: deployer (UID 1001). Current directory: "
    "/home/deployer. Simulate the exact, byte-accurate Linux stdout, stderr and "
    "exit_code for the given command. Never break character, never output "
    "markdown or explanations. Return ONLY strict JSON with keys: "
    '{"stdout": "...", "stderr": "...", "exit_code": 0, '
    '"intent_summary": "...", "dynamic_mitre_attack": "Txxxx", '
    '"dynamic_mitre_d3fend": "D3-XXX", "dynamic_mitre_engage": "EACxxxx", '
    '"risk_delta": 0}. Subtly reference a vault backup script named '
    "vault_sync.sh only when it feels natural."
)


def init_virtual_fs() -> None:
    try:
        conn = sqlite3.connect(_DB_PATH)
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS virtual_fs (
                ja4h TEXT NOT NULL,
                path TEXT NOT NULL,
                content TEXT,
                created_at REAL,
                PRIMARY KEY (ja4h, path)
            )
            """
        )
        conn.commit()
        conn.close()
    except Exception as exc:  # noqa: BLE001
        print(f"[!] [VIRTUAL FS] init failed: {exc}")


def apply_virtual_fs(command: str, ja4h: str) -> Optional[str]:
    """Record file/dir creation for `touch`, `mkdir`, and `echo > file`."""
    init_virtual_fs()
    parts = command.split()
    if not parts:
        return None

    if parts[0] == "touch" and len(parts) >= 2:
        path = parts[1]
        _store_virtual_fs(ja4h, path, "")
        return f"touch: created {path}"

    if parts[0] == "mkdir" and len(parts) >= 2:
        path = parts[1]
        _store_virtual_fs(ja4h, path + "/", "")
        return f"mkdir: created directory {path}"

    if ">" in command and parts[0] == "echo":
        try:
            target = command.split(">", 1)[1].strip()
            content = command[5:].split(">", 1)[0].strip()
            _store_virtual_fs(ja4h, target, content)
            return f"echo: wrote {len(content)} bytes to {target}"
        except Exception:  # noqa: BLE001
            return None

    return None


def list_virtual_fs(ja4h: str) -> List[str]:
    init_virtual_fs()
    try:
        conn = sqlite3.connect(_DB_PATH)
        rows = conn.execute(
            "SELECT path FROM virtual_fs WHERE ja4h = ? ORDER BY path", (ja4h,)
        ).fetchall()
        conn.close()
        return [row[0] for row in rows]
    except Exception:  # noqa: BLE001
        return []


def _store_virtual_fs(ja4h: str, path: str, content: str) -> None:
    try:
        conn = sqlite3.connect(_DB_PATH)
        conn.execute(
            """
            INSERT INTO virtual_fs (ja4h, path, content, created_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(ja4h, path) DO UPDATE SET content = excluded.content
            """,
            (ja4h, path, content, time.time()),
        )
        conn.commit()
        conn.close()
    except Exception:  # noqa: BLE001
        pass


def _deepseek_call(command: str, context: str) -> Optional[Dict[str, Any]]:
    if not DEEPSEEK_API_KEY:
        return None
    try:
        response = requests.post(
            DEEPSEEK_URL,
            headers={
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": DEEPSEEK_MODEL,
                "temperature": 0.4,
                "messages": [
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": f"Context: {context}\nCommand: {command}",
                    },
                ],
            },
            timeout=2.0,
        )
        if response.status_code != 200:
            return None
        content = response.json()["choices"][0]["message"]["content"].strip()
        content = content.strip("```json").strip("```").strip()
        return json.loads(content)
    except Exception:  # noqa: BLE001
        return None


def execute_generative_shell(
    command: str,
    session: Dict[str, Any],
    ja4h: str,
    hostname: str,
    ip: str,
    stage4_endpoint: str,
    crumb3: str,
) -> Dict[str, Any]:
    """Generate a plausible response for a novel command plus a zero-day eval."""
    context = (
        f"hostname={hostname} ip={ip} cwd=/home/deployer "
        f"stage4={stage4_endpoint} created_files={list_virtual_fs(ja4h)}"
    )

    result = _deepseek_call(command, context)

    if result is None:
        first_word = command.split()[0] if command.split() else "command"
        result = {
            "stdout": "",
            "stderr": f"bash: {first_word}: command not found\n",
            "exit_code": 127,
            "intent_summary": f"Unusual command executed: {command[:80]}",
            "dynamic_mitre_attack": "T1059.004",
            "dynamic_mitre_d3fend": "D3-EDA",
            "dynamic_mitre_engage": "EAC0012",
            "risk_delta": 3,
        }

    zero_day_eval = {
        "intent_summary": str(result.get("intent_summary") or "Novel shell command")[
            :200
        ],
        "dynamic_mitre_attack": str(result.get("dynamic_mitre_attack") or "T1059.004"),
        "dynamic_mitre_d3fend": str(result.get("dynamic_mitre_d3fend") or "D3-EDA"),
        "dynamic_mitre_engage": str(
            result.get("dynamic_mitre_engage") or "EAC0012"
        ),
        "risk_delta": int(result.get("risk_delta") or 0),
    }

    # Weave the vault crumb naturally when the attacker digs for it.
    stdout = str(result.get("stdout") or "")
    if "vault_sync" in command and crumb3 and crumb3 not in stdout:
        stdout += f"\n# export VAULT_MASTER_KEY={crumb3}\n"

    return {
        "stdout": stdout,
        "stderr": str(result.get("stderr") or ""),
        "exit_code": int(result.get("exit_code") or 0),
        "crumb_minted": crumb3 if "vault_sync" in command else None,
        "zero_day_eval": zero_day_eval,
        "llm_generated": result.get("__generated__", True),
    }
