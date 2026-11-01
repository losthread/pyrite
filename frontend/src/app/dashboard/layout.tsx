import type { Metadata } from "next"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { PyriteTelemetryProvider } from "@/hooks/usePyriteTelemetry"

export const metadata: Metadata = {
  title: "PYRITE // SOC Command Center",
  description:
    "PYRITE Active Deception Grid: live topology, shadow worlds, real-time red-team console, attackers, and Wazuh telemetry.",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PyriteTelemetryProvider>
      <DashboardShell>{children}</DashboardShell>
    </PyriteTelemetryProvider>
  )
}
