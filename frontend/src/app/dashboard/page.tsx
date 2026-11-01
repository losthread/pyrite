import type { Metadata } from "next"
import HoneytrapDashboard from "@/components/dashboard/honeytrap-dashboard"

export const metadata: Metadata = {
  title: "PYRITE (FeS₂) // Autonomous Deception SOC",
  description:
    "Real-time honeypot & active deception SOC command center with interactive network topology, live event telemetry, and containment operations.",
}

export default function DashboardPage() {
  return <HoneytrapDashboard />
}
