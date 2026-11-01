import type { Metadata } from "next"

import { Pipeline } from "@/components/landing/pipeline"
import { CommandCta } from "@/components/landing/command-cta"
import { SubpageShell } from "@/components/landing/subpage-shell"

export const metadata: Metadata = {
  title: "Pipeline — PYRITE // Autonomous Deception",
  description:
    "The PYRITE system pipeline: controlled attack simulation, polymorphic labyrinth, Wazuh detection, FastAPI intelligence, and SOC command.",
}

export default function PipelinePage() {
  return (
    <SubpageShell>
      <Pipeline />
      <CommandCta />
    </SubpageShell>
  )
}
