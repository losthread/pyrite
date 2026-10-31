# CONTROLLED SIMULATION

                     +-------------------+
                     |     attack sim    |
                     | Authorized Tests  |
                     +---------+---------+
                               |
                               | Traffic to allowlisted lab decoys
                               v
+----------------------------------------------------------------+
|                       DECEPTION LAYER                          |
|                             Honeypots                             |
|                                                                |
|  +-------------+  +-------------+  +------------------------+  |
|  | Cowrie      |  | Dionaea     |  | Other supported decoys |  |
|  | SSH/Telnet  |  | Services    |  | HTTP / Auth / etc.     |  |
|  +------+------+  +------+------+  +-----------+------------+  |
|         |                |                     |               |
|         +----------------+---------------------+               |
|                          | Structured logs                     |
|                          v                                     |
|                  T-Pot log storage                             |
+--------------------------+-------------------------------------+
                           |
                           | Configured log forwarding
                           v
+----------------------------------------------------------------+
|                       DETECTION LAYER                          |
|                           Wazuh                                |
|                                                                |
|  Log collection / JSON decoding                                |
|       -> built-in security rules                               |
|       -> custom honeypot rules                                 |
|       -> alerts + supported MITRE ATT&CK mappings              |
+--------------------------+-------------------------------------+
                           | Alerts
                           v
+----------------------------------------------------------------+
|                    INTELLIGENCE LAYER                          |
|                      FastAPI Backend                            |
|                                                                |
|  Wazuh Alerts -------+                                         |
|                      +--> Normalize -> Deduplicate -> Enrich    |
|  T-Pot Raw Events ---+            |                             |
|                                  v                             |
|                          Correlation Engine                    |
|                                  |                             |
|                          Attack Chain Builder                  |
|                                  |                             |
|             +--------------------+------------------+          |
|             |                    |                  |          |
|             v                    v                  v          |
|        Rule-Based           ML Intelligence     LLM Analysis   |
|        Risk Scorer          - Anomalies         - Reports      |
|        + MITRE             - Fingerprints      - Recommendations|
|             |                    |                  |          |
|             +--------------------+------------------+          |
|                                  |                             |
|                 Honeytokens / Production Overlap               |
|                                  |                             |
|                        Incident Management                    |
|                           /              \                     |
|                          v                v                    |
|                       SQLite         REST / WebSocket          |
+--------------------------+----------------+--------------------+
                           |                |
                           +-------+--------+
                                   v
+----------------------------------------------------------------+
|                      PRESENTATION LAYER                        |
|                        Next.js SOC                              |
|  Live Incidents | Attack Graph | Risk Reasons | ATT&CK Evidence |
|  AI Reports | Similar Sessions | Honeytokens | Response Review  |
+----------------------------------------------------------------+