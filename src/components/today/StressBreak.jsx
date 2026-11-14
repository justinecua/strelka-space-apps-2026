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

  // The circle grows over the 4-second inhale and shrinks over the 6-second exhale.
  // The ring uses the text color, so the circle stays visible in both light and dark mode.
  const circleStyle = {
    transform: running ? (breathingIn ? 'scale(1.25)' : 'scale(0.9)') : 'scale(1)',
    transitionDuration: `${running && !breathingIn ? OUT_SECONDS : IN_SECONDS}s`,
    boxShadow: '0 0 0 2px color-mix(in srgb, currentColor 40%, transparent)',
  }

  return (
    <Card title="Take a 2-minute break" tone="mint">
      <p className="text-muted">Breathing slowly can help you relax. Follow the circle.</p>

      <div className="my-6 flex flex-col items-center gap-3">
        <div
          aria-live="polite"
          className="grid h-40 w-40 place-items-center rounded-full bg-good-soft text-xl transition-transform ease-in-out motion-reduce:transition-none"
          style={circleStyle}
        >
          {label}
        </div>
        {running && <p className="text-sm text-muted">{secondsLeft} seconds left</p>}
      </div>

      {running ? (
        <Button variant="light" onClick={stop}>
          Stop
        </Button>
      ) : (
        <Button onClick={start}>{done ? 'Do it again' : 'Start breathing'}</Button>
      )}
    </Card>
  )
}