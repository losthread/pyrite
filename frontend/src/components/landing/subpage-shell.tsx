import { SiteHeader } from "@/components/landing/site-header"
import { SiteFooter } from "@/components/landing/site-footer"

export function SubpageShell({ children }: { children: React.ReactNode }) {
  return (
    <div id="top" className="paper-grain flex min-h-svh flex-col bg-paper">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
