import { SiteHeader } from "@/components/landing/site-header"
import { WordmarkMasthead } from "@/components/landing/wordmark-masthead"
import { SiteFooter } from "@/components/landing/site-footer"

export default function Page() {
  return (
    <div id="top" className="paper-grain flex min-h-svh flex-col bg-paper">
      <SiteHeader />
      <main className="flex-1">
        <WordmarkMasthead />
      </main>
      <SiteFooter />
    </div>
  )
}
