// A floating microphone button, always on screen. Tap it once and the astronaut can use the app hands-free:
// open a tab ("go to body"), start the check-in, say readings ("heart rate 62, I slept 7 hours")
// and save ("save check-in"). It talks to the check-in page through two window events, so the
// pages do not need to know about voice.

import { useEffect, useRef, useState } from 'react'
import { INDICATOR_BY_ID } from '../../data/indicators.js'
import { parseCommand } from '../../lib/voiceCommands.js'
import { parseVoice } from '../../lib/voiceParser.js'

const Recognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

const TAB_NAMES = { today: 'Today', checkin: 'Check-in', body: 'Body', history: 'History' }

function isPossible(indicator, value) {
  return !((indicator.validMin != null && value < indicator.validMin) || (indicator.validMax != null && value > indicator.validMax))
}

export default function VoiceAssistant({ tab, onNavigate }) {
  const [on, setOn] = useState(false)
  const [caption, setCaption] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const recognition = useRef(null)
  const wantOn = useRef(false)
  // The speech engine keeps its first callbacks, so it reads the newest tab and navigate function from here.
  const latest = useRef({ tab, onNavigate })

  useEffect(() => {
    latest.current = { tab, onNavigate }
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
    const { tab: currentTab, onNavigate: navigate } = latest.current

    // Readings are only taken on the check-in page.
    if (currentTab === 'checkin') {
      const heard = parseVoice(sentence)
      const values = {}
      for (const [id, value] of Object.entries(heard.values)) {
        const indicator = INDICATOR_BY_ID[id]
        if (indicator && isPossible(indicator, value)) values[id] = value
      }
      const names = [...Object.keys(values).map((id) => INDICATOR_BY_ID[id].label), ...heard.symptoms.map(() => 'symptom')]
      if (names.length > 0) {
        window.dispatchEvent(new CustomEvent('strelka:voice', { detail: { values, symptoms: heard.symptoms } }))
        setNote(`Added: ${names.join(', ')}`)
      }
    }

    const command = parseCommand(sentence)
    if (!command) return

    if (command.type === 'navigate') {
      navigate(command.tab)
      setNote(`Opening ${TAB_NAMES[command.tab]}`)
    } else if (command.type === 'save') {
      if (currentTab !== 'checkin') {
        setNote('Open the check-in first, then say “save check-in”.')
      } else {
        setNote('Checking your check-in…')
        // A short wait lets the numbers just spoken reach the form before it is submitted.
        setTimeout(() => window.dispatchEvent(new Event('strelka:save')), 400)
      }
    } else if (command.type === 'stop') {
      turnOff()
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
    // The browser stops listening after a pause, so listening restarts until the astronaut turns it off.
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

  const hint = tab === 'checkin' ? 'Say “heart rate 62”, “I slept 7 hours”, then “save check-in”.' : 'Say “go to body”, “open history” or “start check-in”.'

  return (
    <div className="fixed left-5 z-50 flex flex-col items-start gap-3" style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}>
      {(on || error) && (
        <div role="status" aria-live="polite" className="fade-in max-w-xs rounded-[24px] border border-line bg-white p-4 shadow-xl">
          {error ? (
            <p className="text-danger">{error}</p>
          ) : (
            <>
              <p className="text-sm text-good-dark">Listening…</p>
              <p className="mt-1 text-lg">{caption || hint}</p>
              {note && <p className="mt-2 rounded-2xl bg-good-soft px-3 py-1.5 text-sm text-good-dark">{note}</p>}
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
        className="relative grid h-16 w-16 place-items-center rounded-full bg-ink text-white shadow-xl outline-none focus-visible:ring-4 focus-visible:ring-good"
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