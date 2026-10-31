import type { Metadata } from "next"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { DashboardProvider } from "@/hooks/useDashboardTelemetry"

export const metadata: Metadata = {
  title: "Dashboard — VYUHA",
  description:
    "VYUHA honeytrap network command center: live topology, attackers, events, honeypots, and analytics.",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  )
}
