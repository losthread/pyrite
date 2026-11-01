export function formatDate(value?: string | number | Date | null): string {
  if (!value) return "—"
  try {
    const d = new Date(value)
    if (isNaN(d.getTime())) return String(value)
    return d.toISOString().slice(0, 10)
  } catch {
    return String(value)
  }
}

export function formatTime(value?: string | number | Date | null): string {
  if (!value) return "—"
  try {
    const d = new Date(value)
    if (isNaN(d.getTime())) return String(value)
    return d.toISOString().slice(11, 19)
  } catch {
    return String(value)
  }
}

export function formatRelative(value?: string | number | Date | null): string {
  if (!value) return "never"
  try {
    const d = new Date(value)
    const now = Date.now()
    const diffSec = Math.floor((now - d.getTime()) / 1000)

    if (diffSec < 0) return "just now"
    if (diffSec < 10) return "just now"
    if (diffSec < 60) return `${diffSec}s ago`
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  } catch {
    return "just now"
  }
}

export function formatNumber(value?: number | null): string {
  if (value == null) return "0"
  return value.toLocaleString()
}
