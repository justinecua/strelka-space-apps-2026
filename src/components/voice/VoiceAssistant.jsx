// The microphone at the right end of the bottom navigation. Its panel opens above it. Tap it once, then speak: open pages, show body regions, switch missions,
// switch light or dark mode, record readings, save or cancel, edit or delete past days, and export PDF.
// Pages receive commands through props and window events.

import { useEffect, useRef, useState } from 'react'
import { INDICATOR_BY_ID } from '../../data/indicators.js'
import { parseCommand } from '../../lib/voiceCommands.js'
import { parseVoice } from '../../lib/voiceParser.js'

const Recognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

// One example phrase per page, shown when the mic turns on.
const EXAMPLE = {
  today: 'go to body',
  checkin: 'heart rate 62',
  body: 'show brain',
  history: 'export PDF',
  relax: 'start breathing',
}

// Short messages for the speech errors people actually hit.
// "network" is what Brave and some other browsers report, because they block the online speech service.
const ERRORS = {
  'not-allowed': 'Mic is blocked. Allow it in your browser settings.',
  'service-not-allowed': 'Voice isn’t available in this browser. Try Chrome or Edge.',
  network: 'Voice isn’t available in this browser. Try Chrome or Edge.',
  'audio-capture': 'No microphone found.',
}

const TAB_NAMES = { today: 'Today', checkin: 'Check-in', body: 'Body', relax: 'Relax', history: 'History' }
const CHECKIN_NAMES = { morning: 'morning check-in', exercise: 'post-exercise check-in', evening: 'before-sleep check-in', symptom: 'symptom report' }


function isPossible(indicator, value) {
  return !((indicator.validMin != null && value < indicator.validMin) || (indicator.validMax != null && value > indicator.validMax))
}

export default function VoiceAssistant({ tab, onNavigate, onEditDay, onDeleteDay, onRegion, onMission, onTheme }) {
  const [on, setOn] = useState(false)
  const [caption, setCaption] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const recognition = useRef(null)
  const wantOn = useRef(false)
  // The speech engine keeps its first callbacks, so it reads the newest props from here.
  const latest = useRef({})

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

  // An error message clears itself after a few seconds.
  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(''), 6000)
    return () => clearTimeout(timer)
  }, [error])

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
      case 'checkinType':
        // Opens the Check-in page if needed, then asks it to switch to that check-in.
        if (current.tab !== 'checkin') current.onNavigate('checkin')
        setNote(`Opening ${CHECKIN_NAMES[command.checkin]}`)
        setTimeout(() => window.dispatchEvent(new CustomEvent('strelka:checkin-type', { detail: { type: command.checkin } })), 400)
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
          setNote('Checking…')
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
      setError(ERRORS[event.error] ?? 'Voice stopped. Tap the mic to try again.')
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

  // One line only: what was just heard, the result of a command, or an example to try.
  const line = error || caption || note || `Try “${EXAMPLE[tab] ?? EXAMPLE.today}”`

  return (
    <div className="relative flex items-center gap-1.5">
      <span className="mx-0.5 h-7 w-px bg-ink/10" aria-hidden="true" />
      {(on || error) && (
        <p
          role="status"
          aria-live="polite"
          className={`fade-in absolute right-0 bottom-full mb-3 flex max-w-[min(22rem,calc(100vw-2rem))] items-center gap-2.5 rounded-full bg-white px-4 py-2.5 text-sm whitespace-nowrap shadow-lg ring-1 ring-ink/10 ${
            error ? 'text-danger' : ''
          }`}
        >
          {!error && <span className="h-2 w-2 shrink-0 rounded-full bg-good" aria-hidden="true" />}
          <span className="truncate">{caption ? `“${line}”` : line}</span>
        </p>
      )}

      <button
        type="button"
        onClick={on ? turnOff : turnOn}
        aria-pressed={on}
        aria-label={on ? 'Stop talking to Strelka' : 'Talk to Strelka'}
        title={on ? 'Stop listening' : 'Talk to Strelka'}
        className={`relative grid h-11 w-11 place-items-center rounded-full outline-none ${on ? 'bg-ink text-white' : 'bg-good text-[#0b0c0d] hover:brightness-105'} transition focus-visible:ring-4 focus-visible:ring-good/50 sm:h-12 sm:w-12`}
      >
        {on ? (
          <span className="h-4 w-4 rounded-[4px] bg-current" aria-hidden="true" />
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          </svg>
        )}
      </button>
    </div>
  )
}