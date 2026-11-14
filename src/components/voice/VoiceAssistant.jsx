// A floating microphone on every page. Tap it once, then speak: open pages, show body regions, switch missions,
// switch light or dark mode, record readings, save or cancel, edit or delete past days, and export PDF.
// Pages receive commands through props and window events.

import { useEffect, useRef, useState } from 'react'
import { INDICATOR_BY_ID } from '../../data/indicators.js'
import { parseCommand } from '../../lib/voiceCommands.js'
import { parseVoice } from '../../lib/voiceParser.js'

const Recognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

const TAB_NAMES = { today: 'Today', checkin: 'Check-in', body: 'Body', relax: 'Relax', history: 'History' }

const HELP = [
  ['Pages', '“go to body”, “open history”, “start check-in”'],
  ['Body', '“show brain”, “go to eyes”, “open lungs”'],
  ['Mission', '“switch to Mars surface”, “lunar orbit”'],
  ['Theme', '“dark mode”, “light mode”'],
  ['Readings', '“heart rate 62, I slept 7 hours, mood 4”'],
  ['Save', '“save check-in”, “save changes”'],
  ['Cancel', '“cancel” (leaves an edit without saving)'],
  ['Past days', '“edit day 5”, “delete day 5”'],
  ['Export', '“export PDF”, “export all”'],
  ['Off', '“stop”'],
]

function isPossible(indicator, value) {
  return !((indicator.validMin != null && value < indicator.validMin) || (indicator.validMax != null && value > indicator.validMax))
}

export default function VoiceAssistant({ tab, onNavigate, onEditDay, onDeleteDay, onRegion, onMission, onTheme }) {
  const [on, setOn] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [caption, setCaption] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [micReady, setMicReady] = useState(false)
  const recognition = useRef(null)
  const wantOn = useRef(false)
  // The speech engine keeps its first callbacks, so it reads the newest props from here.
  const latest = useRef({})

  // Mic stays hidden after a refresh, then fades in.
  useEffect(() => {
    const timer = setTimeout(() => setMicReady(true), 1500) // 1500 = 1.5 seconds
    return () => clearTimeout(timer)
  }, [])

  // Hides the page scrollbar (scrolling with wheel, touch and keyboard still works).
  useEffect(() => {
    const style = document.createElement('style')
    style.setAttribute('data-hide-scrollbar', '')
    style.textContent = `
      html, body, * { scrollbar-width: none; -ms-overflow-style: none; }
      html::-webkit-scrollbar, body::-webkit-scrollbar, *::-webkit-scrollbar { display: none; width: 0; height: 0; }
    `
    document.head.appendChild(style)
    return () => style.remove()
  }, [])

  useEffect(() => {
    latest.current = { tab, onNavigate, onEditDay, onDeleteDay, onRegion, onMission, onTheme }
  })

  useEffect(
    () => () => {
      wantOn.current = false
      recognition.current?.abort()
    },
    [],
  )

  // The check-in page reports problems (like missing fields) here, so they show next to the microphone.
  useEffect(() => {
    function onNotice(event) {
      setNote(event.detail.message)
    }
    window.addEventListener('strelka:notice', onNotice)
    return () => window.removeEventListener('strelka:notice', onNotice)
  }, [])

  function handle(sentence) {
    const current = latest.current

    // Readings are recorded only on the check-in page.
    const heard = parseVoice(sentence)
    const readingIds = Object.keys(heard.values).filter((id) => INDICATOR_BY_ID[id] && isPossible(INDICATOR_BY_ID[id], heard.values[id]))
    if (readingIds.length > 0 || heard.symptoms.length > 0) {
      if (current.tab === 'checkin') {
        const values = Object.fromEntries(readingIds.map((id) => [id, heard.values[id]]))
        window.dispatchEvent(new CustomEvent('strelka:voice', { detail: { values, symptoms: heard.symptoms } }))
        const names = [...readingIds.map((id) => INDICATOR_BY_ID[id].label), ...heard.symptoms.map(() => 'symptom')]
        setNote(`Added: ${names.join(', ')}`)
      } else {
        setNote('Open Check-in first to record readings.')
      }
    }

    const command = parseCommand(sentence)
    if (!command) {
      // Show what was heard, so you can see why nothing happened.
      if (readingIds.length === 0 && heard.symptoms.length === 0) setNote(`Didn't catch a command: “${sentence}”`)
      return
    }

    switch (command.type) {
      case 'stop':
        turnOff()
        break
      case 'theme':
        current.onTheme(command.theme)
        setNote(`${command.theme === 'dark' ? 'Dark' : 'Light'} mode on`)
        break
      case 'navigate':
        current.onNavigate(command.tab)
        setNote(`Opening ${TAB_NAMES[command.tab]}`)
        break
      case 'region':
        current.onRegion(command.key)
        setNote(`Showing ${command.key}`)
        break
      case 'mission':
        current.onMission(command.key)
        setNote(`Mission: ${command.key}`)
        break
      case 'editDay':
        setNote(`Opening day ${command.day}`)
        current.onEditDay(command.day)
        break
      case 'deleteDay':
        setNote(`Deleting day ${command.day}…`)
        current.onDeleteDay(command.day)
        break
      case 'export':
        // Goes to History first, then asks that page to export. The short wait lets the page mount.
        current.onNavigate('history')
        setNote(command.scope === 'all' ? 'Exporting all check-ins…' : 'Exporting the open check-in…')
        setTimeout(() => window.dispatchEvent(new CustomEvent('strelka:export', { detail: { scope: command.scope } })), 400)
        break
      case 'cancel':
        if (current.tab !== 'checkin') {
          setNote('Nothing to cancel here.')
        } else {
          setNote('Cancelling…')
          window.dispatchEvent(new Event('strelka:cancel'))
        }
        break
      case 'save':
        if (current.tab !== 'checkin') {
          setNote('Open the check-in first, then say “save check-in”.')
        } else {
          setNote('Checking your check-in…')
          // A short wait lets the numbers just spoken reach the form before it is submitted.
          setTimeout(() => window.dispatchEvent(new Event('strelka:save')), 400)
        }
        break
      case 'breathe':
        if (command.action === 'start') {
          // Go to Relax first if needed, then give the page a moment to mount before starting.
          if (current.tab !== 'relax') current.onNavigate('relax')
          setNote('Starting breathing…')
          setTimeout(() => window.dispatchEvent(new CustomEvent('strelka:breathing', { detail: { action: 'start' } })), 400)
        } else {
          setNote('Breathing break stopped.')
          window.dispatchEvent(new CustomEvent('strelka:breathing', { detail: { action: 'stop' } }))
        }
        break
      default:
        break
    }
  }

  function turnOn() {
    setError('')
    setNote('')
    wantOn.current = true
    const rec = new Recognition()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (event) => {
      let interim = ''
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index]
        const sentence = result[0].transcript.trim()
        if (result.isFinal) {
          handle(sentence)
          setCaption('')
        } else {
          interim += `${sentence} `
        }
      }
      if (interim) setCaption(interim.trim())
    }
    rec.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return
      wantOn.current = false
      setOn(false)
      setError(event.error === 'not-allowed' ? 'Microphone is blocked. Allow it in the browser settings.' : 'Voice stopped working. Tap the microphone to try again.')
    }
    // Browsers stop listening after a pause, so listening restarts until the astronaut says "stop".
    rec.onend = () => {
      if (!wantOn.current) return setOn(false)
      try {
        rec.start()
      } catch {
        setOn(false)
      }
    }
    rec.start()
    recognition.current = rec
    setOn(true)
  }

  function turnOff() {
    wantOn.current = false
    recognition.current?.abort()
    setOn(false)
    setCaption('')
  }

  if (!Recognition) return null

  const hint =
    tab === 'checkin'
      ? 'Say “heart rate 62”, “I slept 7 hours”, then “save check-in”.'
      : tab === 'body'
        ? 'Say “show brain” or “go to eyes”.'
        : 'Say “go to body”, “edit day 1”, “dark mode” or “export PDF”.'

  return (
    <div
      className="fixed z-50 flex flex-col items-start gap-3"
      style={{
        left: 'max(4.25rem, calc((100vw - 1800px) / 2 + 47px))',
        bottom: 'calc(3.25rem + env(safe-area-inset-bottom, 0px) + 4.75rem)',
      }}
    >
      {(on || error) && (
        <div role="status" aria-live="polite" className="fade-in max-w-xs rounded-[24px] border border-line bg-white p-4 shadow-xl">
          {error ? (
            <p className="text-danger">{error}</p>
          ) : (
            <>
              <p className="text-sm text-good-dark">Listening…</p>
              <p className="mt-1 text-lg">{caption || hint}</p>
              {note && <p className="mt-2 rounded-2xl bg-good-soft px-3 py-1.5 text-sm text-good-dark">{note}</p>}
              <button type="button" onClick={() => setShowHelp(!showHelp)} aria-expanded={showHelp} className="mt-2 text-xs text-muted underline">
                {showHelp ? 'Hide commands' : 'What can I say?'}
              </button>
              {showHelp && (
                <dl className="mt-2 space-y-1 text-xs">
                  {HELP.map(([label, example]) => (
                    <div key={label} className="flex gap-2">
                      <dt className="w-20 shrink-0 text-muted">{label}</dt>
                      <dd>{example}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className="mt-2 text-xs text-muted">Say “stop” to turn the microphone off.</p>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={on ? turnOff : turnOn}
        aria-pressed={on}
        aria-label={on ? 'Turn voice commands off' : 'Turn voice commands on'}
        className="fixed z-50 grid h-16 w-16 place-items-center rounded-full bg-ink text-white shadow-xl outline-none transition-opacity duration-500 focus-visible:ring-4 focus-visible:ring-good"
        style={{
          left: 'max(4.25rem, calc((100vw - 1800px) / 2 + 47px))',
          bottom: 'calc(3.25rem + env(safe-area-inset-bottom, 0px))',
          opacity: micReady ? 1 : 0,
          pointerEvents: micReady ? 'auto' : 'none',
        }}
      >
        {on && <span className="absolute inset-0 animate-ping rounded-full bg-good/40" aria-hidden="true" />}
        <svg viewBox="0 0 24 24" className="relative h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      </button>
    </div>
  )
}