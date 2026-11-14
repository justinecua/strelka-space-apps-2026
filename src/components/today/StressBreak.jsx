// A 2-minute guided breathing break. Breathe in for 4 seconds, out for 6, and repeat.
// Used on the Relax page. Voice commands "start breathing" and "stop relax" control it through window events.

import { useEffect, useState } from 'react'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'

const IN_SECONDS = 4
const OUT_SECONDS = 6
const TOTAL_SECONDS = 120

export default function StressBreak() {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  // Count one second at a time while the break is running.
  useEffect(() => {
    if (!running) return undefined
    const timer = setInterval(() => setElapsed((seconds) => seconds + 1), 1000)
    return () => clearInterval(timer)
  }, [running])

  // Stop by itself when the 2 minutes are over.
  useEffect(() => {
    if (running && elapsed >= TOTAL_SECONDS) setRunning(false)
  }, [elapsed, running])

  // Voice: "start breathing" sends action "start", and "stop relax" sends action "stop".
  useEffect(() => {
    function onBreathing(event) {
      if (event.detail.action === 'start') {
        setElapsed(0)
        setRunning(true)
      } else {
        setRunning(false)
      }
    }
    window.addEventListener('strelka:breathing', onBreathing)
    return () => window.removeEventListener('strelka:breathing', onBreathing)
  }, [])

  const cycle = IN_SECONDS + OUT_SECONDS
  const breathingIn = elapsed % cycle < IN_SECONDS
  const done = !running && elapsed >= TOTAL_SECONDS

  function start() {
    setElapsed(0)
    setRunning(true)
  }

  function stop() {
    setRunning(false)
  }

  return (
    <Card title="Take a 2-minute break" tone="mint">
      <p className="text-muted">Breathing slowly can help you relax. Follow the circle.</p>

      <div className="my-6 flex flex-col items-center gap-3">
        <div
          aria-live="polite"
          className="grid h-40 w-40 place-items-center rounded-full bg-good-soft text-xl transition-transform duration-[4000ms] ease-in-out"
          style={{ transform: running ? (breathingIn ? 'scale(1.25)' : 'scale(0.9)') : 'scale(1)' }}
        >
          {running ? (breathingIn ? 'Breathe in' : 'Breathe out') : done ? 'Well done' : 'Ready'}
        </div>
        {running && <p className="text-sm text-muted">{TOTAL_SECONDS - elapsed} seconds left</p>}
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