import { useEffect, useState } from 'react'

/** Re-renders every `intervalMs` while `enabled`, returning the current time. */
export function useTicker(enabled: boolean, intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!enabled) return
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [enabled, intervalMs])
  return now
}
