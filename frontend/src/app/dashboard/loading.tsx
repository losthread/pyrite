export default function DashboardLoading() {
  return (
    <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-3">
      <div className="h-6 w-48 animate-pulse bg-surface" />
      <div className="h-10 w-80 animate-pulse bg-surface/70" />
      <div className="grid grid-cols-2 gap-px bg-ink/15 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="min-h-[86px] bg-paper p-3">
            <div className="h-2 w-20 animate-pulse bg-surface" />
            <div className="mt-5 h-6 w-16 animate-pulse bg-surface/80" />
          </div>
        ))}
      </div>
      <div className="h-[360px] animate-pulse border border-ink/15 bg-surface/30" />
      <p className="font-mono text-[9px] tracking-[0.1em] text-muted-ink uppercase">
        Connecting to telemetry surface…
      </p>
    </div>
  )
}
