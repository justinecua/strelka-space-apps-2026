// The microphone at the right end of the bottom navigation. One line above it says what is happening.
//
// Three modes:
//   standby  the default. The mic starts by itself when the app opens and only listens for
//            "enable voice command" (or "hey Strelka"). No other command does anything.
//   active   "Strelka is listening…". Every command works until "disable voice command".
//   off      the mic is closed. Only after "turn off the microphone", or when the browser can't do voice.
//
// The mode is remembered on this device. Say "enable voice command" once and commands stay on, after a reload
// or on the next visit, until "disable voice command". After "turn off the microphone" it stays closed.
//
// The button: tap to enable commands, tap again to go back to standby.
// Pages receive commands through props and window events.

import { useEffect, useRef, useState } from 'react'
import { INDICATOR_BY_ID } from '../../data/indicators.js'
import { parseCommand } from '../../lib/voiceCommands.js'
import { parseVoice } from '../../lib/voiceParser.js'
import { sendVoice } from '../../lib/voiceEvents.js'
import { VOICE_HELP } from '../../data/voiceHelp.js'
import Modal from '../ui/Modal.jsx'

const Recognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

const NOTE_MS = 4000
const RESTART_DELAY_MS = 300
const MODE_KEY = 'strelka.voiceMode'

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
const STANDBY_HINT = 'Say “enable voice command” to start.'

// Spoken phrases are rarely exact ("okay, enable the voice commands please"), so on and off are matched loosely.
const ENABLE = /\b(enable|turn on|activate|start|resume|open)\b.*\bvoice\b|\b(hey|ok|okay)\s+strelka\b/i
const DISABLE = /\b(disable|turn off|deactivate|stop|pause|close)\b.*\bvoice\b/i
const MIC_OFF = /\b(turn off|close|switch off)\b.*\b(mic|microphone)\b/i

// Scrolls whatever is on top: an open full-screen card or pop-up, otherwise the page.
function scrollPage(to) {
  const dialogs = document.querySelectorAll('[role="dialog"]')
  const dialog = dialogs[dialogs.length - 1]
  const inner = dialog && (dialog.scrollHeight > dialog.clientHeight ? dialog : dialog.querySelector('.overflow-y-auto'))
  const target = inner ?? window
  const height = inner ? inner.clientHeight : window.innerHeight
  if (to === 'top') target.scrollTo({ top: 0, behavior: 'smooth' })
  else if (to === 'bottom') target.scrollTo({ top: (inner ?? document.documentElement).scrollHeight, behavior: 'smooth' })
  else target.scrollBy({ top: (to === 'up' ? -0.8 : 0.8) * height, behavior: 'smooth' })
}

function isPossible(indicator, value) {
  return !((indicator.validMin != null && value < indicator.validMin) || (indicator.validMax != null && value > indicator.validMax))
}

// The last chosen mode: 'active', 'standby' or 'off'. New visitors start in standby.
function readSavedMode() {
  try {
    const saved = localStorage.getItem(MODE_KEY)
    return saved === 'active' || saved === 'off' ? saved : 'standby'
  } catch {
    return 'standby'
  }
}

function saveMode(mode) {
  try {
    localStorage.setItem(MODE_KEY, mode)
  } catch {
    // Remembering the choice is optional.
  }
}

// compact: no divider in front, for the mic on the landing page.
export default function VoiceAssistant({ tab, actions, compact = false }) {
  const [mode, setMode] = useState('off')
  const [caption, setCaption] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const recognition = useRef(null)
  const modeRef = useRef('off')
  // True when the person tapped the mic, so errors are shown. A silent start on page load stays quiet.
  const startedByTap = useRef(false)
  const restartTimer = useRef(null)
  // When commands were last enabled. The same "enable voice command" often arrives twice (early, then final).
  const enabledAt = useRef(0)
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
    latest.current = { tab, actions }
  })

  // Open the mic as soon as the app opens, in the mode chosen last time (standby for new visitors).
  useEffect(() => {
    const saved = readSavedMode()
    if (Recognition && saved !== 'off') startListening(saved, false)
    return () => {
      clearTimeout(restartTimer.current)
      modeRef.current = 'off'
      recognition.current?.abort()
      recognition.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Errors, and notes shown in standby, clear themselves after a few seconds.
  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(''), 6000)
    return () => clearTimeout(timer)
  }, [error])

  useEffect(() => {
    if (mode !== 'standby' || !note) return
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

  function enable() {
    enabledAt.current = Date.now()
    saveMode('active')
    setModeBoth('active')
    setCaption('')
    setNote('')
  }

  function disable() {
    saveMode('standby')
    setModeBoth('standby')
    setCaption('')
    setNote('Voice commands off. Say “enable voice command” to turn them back on.')
  }

  function handle(sentence) {
    if (MIC_OFF.test(sentence)) return turnOff()

    if (modeRef.current === 'standby') {
      if (ENABLE.test(sentence)) enable()
      return
    }

    if (DISABLE.test(sentence)) return disable()
    if (ENABLE.test(sentence)) {
      if (Date.now() - enabledAt.current > 3000) setNote('Voice commands are already on.')
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
      if (current.tab !== 'checkin' && !hasReadings) setNote(`Didn't catch that: “${sentence}”. Say “help” for ideas.`)
      return
    }

    run(command, current)
  }

  // Sends an action to a page, opening that page first if needed. Says so when nothing could do it.
  function onPage(page, name, detail, failMessage) {
    const current = latest.current
    const send = () => {
      if (!sendVoice(name, detail) && failMessage) setNote(failMessage)
    }
    if (current.tab === page) return send()
    current.actions.navigate(page)
    setTimeout(send, 400)
  }

  function run(command, current) {
    const { actions } = current
    switch (command.type) {
      case 'stop':
        disable()
        break
      case 'help':
        setShowHelp(true)
        setNote('Here is everything you can say.')
        break
      case 'answer':
        if (!sendVoice('answer', { yes: command.yes })) setNote('There is no question to answer right now.')
        break
      case 'close':
        if (!sendVoice('close')) setNote('Nothing is open to close.')
        break
      case 'back':
        // Close what's open first; otherwise go to the previous page.
        if (!sendVoice('close')) actions.back()
        break
      case 'cancel':
        // A question on screen, then anything open, then the check-in form.
        if (sendVoice('answer', { yes: false }) || sendVoice('close')) break
        if (current.tab === 'checkin') window.dispatchEvent(new CustomEvent('strelka:cancel', { detail: {} }))
        else setNote('Nothing to cancel here.')
        break
      case 'scroll':
        scrollPage(command.to)
        break
      case 'theme':
        actions.theme(command.theme)
        setNote(command.theme === 'toggle' ? 'Theme switched' : `${command.theme === 'dark' ? 'Dark' : 'Light'} mode on`)
        break
      case 'navigate':
        actions.navigate(command.tab)
        setNote(`Opening ${TAB_NAMES[command.tab]}`)
        break
      case 'landing':
        actions.landing()
        break
      case 'profile':
        sendVoice('profile')
        break
      case 'logout':
        actions.logout()
        setNote('Say “yes” to confirm or “no” to stay.')
        break
      case 'region':
        // On Today, "show heart" means the Heart card; elsewhere it opens the Body page.
        if (current.tab === 'today' && command.key === 'heart' && sendVoice('open-card', { card: 'heart' })) break
        actions.region(command.key)
        setNote(`Showing ${command.key}`)
        break
      case 'hazard':
        actions.hazard(command.id)
        break
      case 'mission':
        actions.mission(command.key)
        setNote(`Mission: ${command.key}`)
        break
      case 'openCard':
        onPage('today', 'open-card', { card: command.card }, 'Nothing to open yet. Do a check-in first.')
        break
      case 'reading':
        onPage('today', 'reading', { id: command.id }, 'No readings to show yet.')
        break
      case 'layout':
        onPage('today', 'layout', { layout: command.layout }, 'The layout changes once you have a check-in.')
        break
      case 'todo':
        onPage('today', 'todo', { which: command.which }, 'Nothing to do right now.')
        break
      case 'report':
        onPage('today', 'report', { action: command.action }, 'There is no report yet. Do a check-in first.')
        break
      case 'why':
        onPage('today', 'why', {}, 'Do a check-in first to see this.')
        break
      case 'showDay':
        onPage('history', 'show-day', { day: command.day })
        break
      case 'editDay':
        setNote(`Opening day ${command.day}`)
        actions.editDay(command.day)
        break
      case 'addDay':
        actions.addDay(command.day)
        break
      case 'deleteDay':
        actions.deleteDay(command.day)
        break
      case 'addMissed':
        onPage('history', 'add-missed', {})
        break
      case 'showMore':
        onPage('history', 'show-more', {})
        break
      case 'export':
        setNote(command.scope === 'all' ? 'Exporting all check-ins…' : 'Exporting…')
        onPage('history', 'export', { scope: command.scope, day: command.day })
        break
      case 'checkinType':
        // Opens the Check-in page if needed, then asks it to switch to that check-in.
        setNote(`Opening ${CHECKIN_NAMES[command.checkin]}`)
        onPage('checkin', 'checkin-type', { type: command.checkin })
        break
      case 'clearForm':
        if (current.tab !== 'checkin' || !sendVoice('clear-form')) setNote('Open a check-in first.')
        else setNote('Form cleared.')
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
          setNote('Starting breathing…')
          onPage('relax', 'breathing', { action: 'start' })
        } else {
          setNote('Breathing break stopped.')
          window.dispatchEvent(new CustomEvent('strelka:breathing', { detail: { action: 'stop' } }))
        }
        break
      default:
        break
    }
  }

  // Opens the mic in the given mode. byTap: the person tapped the button, so errors are shown.
  function startListening(nextMode, byTap) {
    startedByTap.current = byTap
    setError('')
    setModeBoth(nextMode)
    if (recognition.current) return

    const rec = new Recognition()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (event) => {
      if (recognition.current !== rec) return
      let interim = ''
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index]
        const sentence = result[0].transcript.trim()
        if (result.isFinal) {
          handle(sentence)
          setCaption('')
        } else if (modeRef.current === 'standby' && ENABLE.test(sentence)) {
          // React to "enable voice command" as soon as it is heard, without waiting for the pause after it.
          enable()
        } else if (modeRef.current === 'active') {
          interim += `${sentence} `
        }
      }
      if (interim) setCaption(interim.trim())
    }
    rec.onerror = (event) => {
      if (recognition.current !== rec) return
      if (event.error === 'no-speech' || event.error === 'aborted') return
      const message = ERRORS[event.error] ?? 'Voice stopped. Tap the mic to try again.'
      // A silent start on page load fails quietly; a tap shows what went wrong.
      closeMic()
      if (startedByTap.current) setError(message)
    }
    // Browsers stop listening every so often, so listening restarts until the mic is turned off.
    rec.onend = () => {
      if (recognition.current !== rec || modeRef.current === 'off') return
      clearTimeout(restartTimer.current)
      restartTimer.current = setTimeout(() => {
        try {
          rec.start()
        } catch {
          // Already running, or the browser refused; try again on the next end event.
        }
      }, RESTART_DELAY_MS)
    }
    recognition.current = rec
    try {
      rec.start()
    } catch {
      closeMic()
    }
  }

  function closeMic() {
    clearTimeout(restartTimer.current)
    setModeBoth('off')
    recognition.current?.abort()
    recognition.current = null
    setCaption('')
  }

  // "turn off the microphone": close it and remember, so it stays closed on the next visit.
  function turnOff() {
    closeMic()
    setNote('')
    saveMode('off')
  }

  function handleClick() {
    if (mode === 'active') disable()
    else if (mode === 'standby') enable()
    else {
      saveMode('active')
      startListening('active', true)
    }
  }

  if (!Recognition) return null

  // One line only: an error, what is being heard, the result of a command, or the listening state.
  const line = error || (caption ? `“${caption}”` : note) || (mode === 'active' ? 'Strelka is listening…' : '')
  const showLine = Boolean(error || (mode === 'active' && line) || (mode === 'standby' && note))

  const buttonLabel = {
    off: 'Turn on voice commands',
    standby: 'Voice commands off. Say “enable voice command” or tap to turn on',
    active: 'Turn off voice commands',
  }[mode]

  return (
    <div className="relative flex items-center gap-1.5">
      {!compact && <span className="mx-0.5 h-7 w-px bg-ink/10" aria-hidden="true" />}
      {showHelp && (
        <Modal title="What you can say" onClose={() => setShowHelp(false)}>
          <p className="mt-2 text-sm text-muted">Say “enable voice command” first, then any of these. Say “close” when you're done.</p>
          <div className="mt-6 space-y-5">
            {VOICE_HELP.map((group) => (
              <section key={group.title}>
                <h3 className="text-sm text-muted">{group.title}</h3>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {group.phrases.map((phrase) => (
                    <li key={phrase} className="rounded-full bg-field px-3 py-1.5 text-sm">
                      “{phrase}”
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </Modal>
      )}
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
        title={mode === 'standby' ? STANDBY_HINT : buttonLabel}
        className={`relative grid h-11 w-11 place-items-center rounded-full outline-none transition focus-visible:ring-4 focus-visible:ring-good/50 sm:h-12 sm:w-12 ${
          mode === 'active'
            ? 'bg-ink text-white'
            : mode === 'standby'
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
