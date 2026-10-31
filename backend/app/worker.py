"""Run separately from the API: python -m app.worker."""
import logging
import os
import time

from .core.wazuh import provider
from .crud.incidents import ingest


def main():
    interval = float(os.getenv("WAZUH_POLL_SECONDS", "30"))
    if interval <= 0:
        raise ValueError("WAZUH_POLL_SECONDS must be positive")
    logging.basicConfig(level=logging.INFO)
    source = provider()
    while True:
        try:
            count = ingest(source, source=os.getenv("WAZUH_MODE", "mock"))
            logging.info("Ingested %d alerts", count)
        except Exception:
            logging.exception("Ingestion failed; retrying after poll interval")
        time.sleep(interval)


if __name__ == "__main__":
    main()
