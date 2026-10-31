import type { Metadata } from "next"

import { SignalTicker } from "@/components/landing/signal-ticker"
import { StageTelemetry } from "@/components/landing/stage-telemetry"
import { SubpageShell } from "@/components/landing/subpage-shell"

export const metadata: Metadata = {
  title: "Telemetry — VYUHA",
  description:
    "Four-stage labyrinth telemetry, breadcrumb tokens, Wazuh rule mapping, and attack attribution.",
}

export default function TelemetryPage() {
  return (
    <SubpageShell>
      <SignalTicker />
      <StageTelemetry />
    </SubpageShell>
  )
}
