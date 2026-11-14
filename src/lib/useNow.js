// The current time, refreshed every interval (default one minute), for clocks and time-of-day checks.

import { useEffect, useState } from 'react'

export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
  return now
}

export function greetingFor(now = new Date()) {
  const hour = now.getHours()
  if (hour >= 4 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 18) return 'Good afternoon'
  return 'Good evening'
}
