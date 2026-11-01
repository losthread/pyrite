import type { Metadata } from "next"

import { Features } from "@/components/landing/features"
import { CommandCta } from "@/components/landing/command-cta"
import { SubpageShell } from "@/components/landing/subpage-shell"

export const metadata: Metadata = {
  title: "Mechanism — PYRITE (FeS₂)",
  description:
    "The four-stage polymorphic Pyrite Nugget labyrinth: recon leak, HoneyPatch database fork, shadow shell, and vault tarpit.",
}

export default function MechanismPage() {
  return (
    <SubpageShell>
      <Features />
      <CommandCta />
    </SubpageShell>
  )
}
