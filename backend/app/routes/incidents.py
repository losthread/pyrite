"""Authenticated incident views and development-only mock replay."""
import os

from fastapi import APIRouter, Depends, HTTPException, Query

from ..core.dependencies import get_user_id
from ..core.wazuh import MockWazuhProvider
from ..crud import incidents

router = APIRouter(prefix="/api", dependencies=[Depends(get_user_id)])


@router.get("/incidents")
def list_incidents(limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0)):
    return incidents.list_incidents(limit, offset)


@router.get("/incidents/{incident_id}")
def get_incident(incident_id: int):
    item = incidents.get_incident(incident_id)
    if item is None:
        raise HTTPException(404, "Incident not found")
    return item


@router.get("/incidents/{incident_id}/timeline")
def timeline(incident_id: int):
    if incidents.get_incident(incident_id) is None:
        raise HTTPException(404, "Incident not found")
    return incidents.timeline(incident_id)


@router.post("/dev/replay")
def replay(limit: int = Query(100, ge=1, le=1000)):
    if os.getenv("WAZUH_ENABLE_DEV_REPLAY") != "true" or os.getenv("WAZUH_MODE", "mock") != "mock":
        raise HTTPException(404, "Not found")
    return {"ingested": incidents.ingest(MockWazuhProvider(), limit, source="mock")}
