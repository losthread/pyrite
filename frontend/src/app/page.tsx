import { SiteHeader } from "@/components/landing/site-header"
import { SignalTicker } from "@/components/landing/signal-ticker"
import { WordmarkMasthead } from "@/components/landing/wordmark-masthead"
import { PinnedScrollJourney } from "@/components/landing/pinned-scroll-journey"
import { TokenAnatomyCard } from "@/components/landing/token-anatomy-card"
import { LandingMiniTerminal } from "@/components/landing/landing-mini-terminal"
import { BreachSimulator } from "@/components/landing/breach-simulator"
import { CommandCta } from "@/components/landing/command-cta"
import { SiteFooter } from "@/components/landing/site-footer"

export default function Page() {
  return (
    <div id="top" className="paper-grain flex min-h-svh flex-col bg-paper">
      <SiteHeader />
      <main className="flex-1">
        <WordmarkMasthead />
        <PinnedScrollJourney />
        <TokenAnatomyCard />
        <LandingMiniTerminal />
        <CommandCta />
      </main>
      <SiteFooter />
    </div>
  )
}
