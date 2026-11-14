// A 2-minute guided breathing break. Breathe in for 4 seconds, out for 6, and repeat.
// Used on the Relax page. Voice commands "start breathing" and "stop relax" control it through window events.

import { useEffect, useRef, useState } from 'react'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'

const IN_SECONDS = 4
const OUT_SECONDS = 6
const TOTAL_SECONDS = 120
const CYCLE_SECONDS = IN_SECONDS + OUT_SECONDS

export default function StressBreak() {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startedAt = useRef(0)

  // Track elapsed time from the real clock, so the count stays correct even if the
  // browser slows timers down (for example when the tab is in the background).
  useEffect(() => {
    if (!running) return undefined
    startedAt.current = Date.now()
    setElapsed(0)
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000))
    }, 250)
    return () => clearInterval(timer)
  }, [running])

  // Stop by itself when the 2 minutes are over.
  useEffect(() => {
    if (running && elapsed >= TOTAL_SECONDS) setRunning(false)
  }, [elapsed, running])

  // Voice: "start breathing" sends action "start", and "stop relax" sends action "stop".
  useEffect(() => {
    function onBreathing(event) {
      if (event.detail?.action === 'start') {
        setRunning(true)
      } else {
        setRunning(false)
      }
    }
    window.addEventListener('strelka:breathing', onBreathing)
    return () => window.removeEventListener('strelka:breathing', onBreathing)
  }, [])

  const breathingIn = elapsed % CYCLE_SECONDS < IN_SECONDS
  const done = !running && elapsed >= TOTAL_SECONDS
  const secondsLeft = Math.max(TOTAL_SECONDS - elapsed, 0)

  function start() {
    setRunning(true)
  }

  function stop() {
    setRunning(false)
  }

  const label = running ? (breathingIn ? 'Breathe in' : 'Breathe out') : done ? 'Well done' : 'Ready'
  const cyclePos = elapsed % CYCLE_SECONDS
  const phaseLeft = breathingIn ? IN_SECONDS - cyclePos : CYCLE_SECONDS - cyclePos
  const shownSeconds = running ? secondsLeft : TOTAL_SECONDS
  const clock = `${Math.floor(shownSeconds / 60)}:${String(shownSeconds % 60).padStart(2, '0')}`
  const progress = running || done ? Math.min(elapsed / TOTAL_SECONDS, 1) : 0

  // The gauge fills over the 4-second inhale and empties over the 6-second exhale.
  const fill = running ? (breathingIn ? 1 : 0.08) : done ? 1 : 0.08
  const fillStyle = {
    transform: `scaleY(${fill})`,
    transitionDuration: `${running && !breathingIn ? OUT_SECONDS : IN_SECONDS}s`,
  }

  const hint = running
    ? breathingIn
      ? 'In through your nose.'
      : 'Out slowly through your mouth.'
    : done
      ? 'Take a moment before you go back.'
      : '4 seconds in, 6 seconds out.'

  return (
    <Card title="Take a 2-minute break" tone="mint" action={<span className="tabular-nums text-muted">{clock}</span>}>
      <div className="mt-2 flex items-center gap-8 sm:gap-12">
        <div className="relative h-56 w-20 shrink-0 overflow-hidden rounded-full border border-ink/15 bg-white sm:h-64 sm:w-24">
          <div
            aria-hidden="true"
            className="absolute inset-0 origin-bottom bg-good transition-transform ease-in-out motion-reduce:transition-none"
            style={fillStyle}
          />
        </div>

        <div className="min-w-0">
          <p aria-live="polite" className="text-4xl sm:text-5xl">
            {label}
          </p>
          <p className="mt-2 text-muted">
            {running && <span className="mr-2 tabular-nums text-ink">{phaseLeft}</span>}
            {hint}
          </p>
        </div>
      </div>

      <div className="mt-8 h-1 overflow-hidden rounded-full bg-ink/10">
        <div className="h-full bg-ink transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="mt-6">
        {running ? (
          <Button variant="outline" onClick={stop}>
            Stop
          </Button>
        ) : (
          <Button onClick={start}>{done ? 'Do it again' : 'Start breathing'}</Button>
        )}
      </div>
    </Card>
  )
}
