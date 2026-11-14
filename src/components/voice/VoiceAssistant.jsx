// The microphone at the right end of the bottom navigation. One line above it says what is happening.
// Three modes:
//   off       the mic is closed. Tap it to start.
//   active    "Strelka is listening…". Every command works: pages, body regions, missions, theme,
//             check-ins and their fields, save or cancel, past days, export, breathing.
//   paused    after 5 seconds of silence, or "disable voice command". The mic stays open but only
//             reacts to "enable voice command" (or "hey Strelka"). "stop" or a tap turns it fully off.
// Pages receive commands through props and window events.

import { useEffect, useRef, useState } from 'react'
import { INDICATOR_BY_ID } from '../../data/indicators.js'
import { parseCommand } from '../../lib/voiceCommands.js'
import { parseVoice } from '../../lib/voiceParser.js'

const Recognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

const SILENCE_MS = 5000
const NOTE_MS = 4000

// Short messages for the speech errors people actually hit.
// "network" is what Brave and some other browsers report, because they block the online speech service.
const ERRORS = {
  'not-allowed': 'Mic is blocked. Allow it in your browser settings.',
  'service-not-allowed': 'Voice command is only available on Chrome or Edge.',
  network: 'Voice command is only available on Chrome or Edge.',
  'audio-capture': 'No microphone found.',
}

const TAB_NAMES = { today: 'Today', checkin: 'Check-in', body: 'Body', relax: 'Relax', history: 'History' }
const CHECKIN_NAMES = { morning: 'morning check-in', exercise: 'post-exercise check-in', evening: 'before-sleep check-in', symptom: 'symptom report' }
const PAUSED_HINT = 'Paused. Say “enable voice command” to continue.'

function isPossible(indicator, value) {
  return !((indicator.validMin != null && value < indicator.validMin) || (indicator.validMax != null && value > indicator.validMax))
}

// While paused, only these wake the assistant up.
function isWakeUp(sentence) {
  return parseCommand(sentence)?.type === 'voiceOn' || /\b(hey|ok|okay)\s+strelka\b/i.test(sentence)
}

export default function VoiceAssistant({ tab, onNavigate, onEditDay, onDeleteDay, onRegion, onMission, onTheme }) {
  const [mode, setMode] = useState('off')
  const [caption, setCaption] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const recognition = useRef(null)
  const modeRef = useRef('off')
  const silenceTimer = useRef(null)
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
      clearTimeout(silenceTimer.current)
      modeRef.current = 'off'
      recognition.current?.abort()
    },
    [],
  )

  // Errors, and notes shown while paused, clear themselves after a few seconds.
  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(''), 6000)
    return () => clearTimeout(timer)
  }, [error])

  useEffect(() => {
    if (mode !== 'paused' || !note) return
    const timer = setTimeout(() => setNote(''), NOTE_MS)
    return () => clearTimeout(timer)
  }, [mode, note])

  // The check-in page reports what it filled in (or what is missing) here.
  useEffect(() => {
    function onNotice(event) {
      setNote(event.detail.message)
    }
    window.addEventListener('strelka:notice', onNotice)
    return () => window.removeEventListener('strelka:notice', onNotice)
  }, [])

  function setModeBoth(next) {
    modeRef.current = next
    setMode(next)
  }

  // Each sound restarts the 5-second countdown. When it runs out, the assistant pauses.
  function restartSilenceTimer() {
    clearTimeout(silenceTimer.current)
    silenceTimer.current = setTimeout(() => {
      if (modeRef.current === 'active') pause()
    }, SILENCE_MS)
  }

  function activate(message = '') {
    setModeBoth('active')
    setNote(message)
    restartSilenceTimer()
  }

  function pause() {
    clearTimeout(silenceTimer.current)
    setModeBoth('paused')
    setCaption('')
    setNote(PAUSED_HINT)
  }

  function handle(sentence) {
    if (modeRef.current === 'paused') {
      if (isWakeUp(sentence)) activate()
      else if (parseCommand(sentence)?.type === 'stop') turnOff()
      return
    }

    const current = latest.current
    const command = parseCommand(sentence)

    // On the Check-in page, readings, symptoms and anything that isn't a command go to the open form.
    // The form answers with a notice saying what it filled in.
    const heard = parseVoice(sentence)
    const readingIds = Object.keys(heard.values).filter((id) => INDICATOR_BY_ID[id] && isPossible(INDICATOR_BY_ID[id], heard.values[id]))
    const hasReadings = readingIds.length > 0 || heard.symptoms.length > 0

    if (current.tab === 'checkin' && (hasReadings || !command)) {
      const values = Object.fromEntries(readingIds.map((id) => [id, heard.values[id]]))
      window.dispatchEvent(new CustomEvent('strelka:voice', { detail: { values, symptoms: heard.symptoms, sentence: command ? '' : sentence } }))
    } else if (hasReadings) {
      setNote('Open Check-in first to record readings.')
    }

    if (!command) {
      if (current.tab !== 'checkin' && !hasReadings) setNote(`Didn't catch that: “${sentence}”`)
      return
    }

    switch (command.type) {
      case 'stop':
        turnOff()
        break
      case 'voiceOff':
        pause()
        break
      case 'voiceOn':
        setNote('Strelka is already listening.')
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
          window.dispatchEvent(new Event('strelka:cancel'))
        }
        break
      case 'save':
        if (current.tab !== 'checkin') {
          setNote('Open Check-in first, then say “review”.')
        } else {
          setNote('Checking…')
          // A short wait lets the numbers just spoken reach the form before it is checked.
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
    const rec = new Recognition()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (event) => {
      if (modeRef.current === 'active') restartSilenceTimer()
      let interim = ''
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index]
        const sentence = result[0].transcript.trim()
        if (result.isFinal) {
          handle(sentence)
          setCaption('')
        } else if (modeRef.current === 'active') {
          interim += `${sentence} `
        }
      }
      if (interim) setCaption(interim.trim())
    }
    rec.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return
      turnOff()
      setError(ERRORS[event.error] ?? 'Voice stopped. Tap the mic to try again.')
    }
    // Browsers stop listening after a pause, so listening restarts until the mic is turned off.
    rec.onend = () => {
      if (modeRef.current === 'off') return
      try {
        rec.start()
      } catch {
        turnOff()
      }
    }
    rec.start()
    recognition.current = rec
    activate()
  }

  function turnOff() {
    clearTimeout(silenceTimer.current)
    setModeBoth('off')
    recognition.current?.abort()
    setCaption('')
    setNote('')
  }

  function handleClick() {
    if (mode === 'off') turnOn()
    else if (mode === 'paused') activate()
    else turnOff()
  }

  if (!Recognition) return null

  // One line only: an error, what is being heard, the result of a command, or the listening state.
  const line = error || (caption ? `“${caption}”` : note) || (mode === 'active' ? 'Strelka is listening…' : '')
  const showLine = Boolean(error || (mode === 'active' && line) || (mode === 'paused' && note))

  const buttonLabel = { off: 'Talk to Strelka', active: 'Stop listening', paused: 'Resume listening' }[mode]

  return (
    <div className="relative flex items-center gap-1.5">
      <span className="mx-0.5 h-7 w-px bg-ink/10" aria-hidden="true" />
      {showLine && (
        <p
          role="status"
          aria-live="polite"
          className={`fade-in absolute right-0 bottom-full mb-3 flex max-w-[min(24rem,calc(100vw-2rem))] items-center gap-2.5 rounded-full bg-white px-4 py-2.5 text-sm whitespace-nowrap shadow-lg ring-1 ring-ink/10 ${
            error ? 'text-danger' : ''
          }`}
        >
          {!error && <span className={`h-2 w-2 shrink-0 rounded-full ${mode === 'active' ? 'bg-good' : 'bg-muted'}`} aria-hidden="true" />}
          <span className="truncate">{line}</span>
        </p>
      )}

      <button
        type="button"
        onClick={handleClick}
        aria-pressed={mode === 'active'}
        aria-label={buttonLabel}
        title={buttonLabel}
        className={`relative grid h-11 w-11 place-items-center rounded-full outline-none transition focus-visible:ring-4 focus-visible:ring-good/50 sm:h-12 sm:w-12 ${
          mode === 'active'
            ? 'bg-ink text-white'
            : mode === 'paused'
              ? 'bg-white text-good-dark ring-2 ring-good'
              : 'bg-good text-[#0b0c0d] hover:brightness-105'
        }`}
      >
        {mode === 'active' ? (
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
