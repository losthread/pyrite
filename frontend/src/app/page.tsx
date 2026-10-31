import { SiteHeader } from "@/components/landing/site-header"
import { SignalTicker } from "@/components/landing/signal-ticker"
import { WordmarkMasthead } from "@/components/landing/wordmark-masthead"
import { BreachSimulator } from "@/components/landing/breach-simulator"
import { CommandCta } from "@/components/landing/command-cta"
import { SiteFooter } from "@/components/landing/site-footer"

export default function Page() {
  return (
    <div id="top" className="paper-grain flex min-h-svh flex-col bg-paper">
      <SiteHeader />
      <SignalTicker />
      <main className="flex-1">
        <WordmarkMasthead />
        <section className="border-b border-ink">
          <BreachSimulator />
        </section>
        <CommandCta />
      </main>
      <SiteFooter />
    </div>
  )
}
