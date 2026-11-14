// The microphone at the right end of the bottom navigation. One line above it says what is happening.
// Speech is recognised on the device with Vosk (lib/voiceEngine.js): offline, private and quick.
//
// Three modes:
//   standby  the default. The mic starts by itself when the app opens and only listens for
//            "enable voice command" (or "hey Strelka"). No other command does anything.
//   active   "Strelka is listening…". Every command works until "disable voice command".
//   off      the mic is closed. Only after "turn off the microphone", or when the device can't do voice.
//
// The mode is remembered on this device. Say "enable voice command" once and commands stay on, after a reload
// or on the next visit, until "disable voice command". After "turn off the microphone" it stays closed.
//
// The button: tap to enable commands, tap again to go back to standby.
// Pages receive commands through props and window events.

import { useEffect, useRef, useState } from 'react'
import { INDICATOR_BY_ID } from '../../data/indicators.js'
import { VOICE_HELP } from '../../data/voiceHelp.js'
import { parseCommand } from '../../lib/voiceCommands.js'
import { createVoiceEngine, isVoiceSupported } from '../../lib/voiceEngine.js'
import { matchCommand, matchReadings } from '../../lib/voiceMatch.js'
import { sendVoice } from '../../lib/voiceEvents.js'
import { isSpeaking } from '../../lib/speech.js'
import { CLICK, CLICK_START, clickByName, clickPhrases, screenButtons, screenWords } from '../../lib/voiceScreen.js'
import { COMMAND_PHRASES, COMMAND_VOCABULARY, WAKE_PHRASES } from '../../lib/voiceVocabulary.js'
import Modal from '../ui/Modal.jsx'

const SUPPORTED = isVoiceSupported()

const NOTE_MS = 4000
// How long the unfinished words must stay the same before a short command runs early.
const STEADY_MS = 350
// When those words could still grow into a longer command ("open sleep" → "open sleep and mood"), wait longer.
const PREFIX_STEADY_MS = 1200
// The speech engine ends a sentence after about half a second of quiet, so someone who speaks slowly gets cut
// in pieces ("go to" … "history", "heart rate" … "sixty two"). An unfinished piece is held this long for the rest.
const JOIN_MS = 2500
// On Check-in, anything can follow ("heart rate" … "sixty two"), so every piece waits this long after the last word.
const CHECKIN_JOIN_MS = 1500
// Commands that are safe to run before the sentence is finished (no numbers, nothing that saves data).
const EARLY_COMMANDS = new Set([
  'navigate', 'openCard', 'close', 'back', 'help', 'layout', 'theme', 'landing', 'profile', 'region', 'hazard',
  'mission', 'checkinType', 'why', 'scroll', 'breathe', 'showMore', 'addMissed', 'report', 'stop', 'guide',
])
const MODE_KEY = 'strelka.voiceMode'

// Short messages for what can go wrong with the microphone or the speech model.
const ERRORS = {
  'not-allowed': 'Mic is blocked. Allow it in your browser settings.',
  'no-microphone': 'No microphone found.',
  model: 'The voice model could not load. Check the connection and reload once.',
}

const TAB_NAMES = { today: 'Home', checkin: 'Check-in', body: 'Body', relax: 'Relax', history: 'History' }
const CARD_NAMES = { heart: 'Heart', sleep: 'Sleep & mood', blood: 'Blood', missionLog: 'Mission log', doNext: 'Do next', readings: 'Readings' }
const CHECKIN_NAMES = { morning: 'morning check-in', exercise: 'post-exercise check-in', evening: 'before-sleep check-in', symptom: 'symptom report' }
// With a phrase list, a real command comes back word for word with full confidence; background talk comes back
// as fragments that are not on the list. So only exact, confident phrases count.
const KNOWN_COMMANDS = new Set(COMMAND_PHRASES)
const KNOWN_WAKE = new Set(WAKE_PHRASES)
const MIN_CONFIDENCE = 0.85
// The start of every phrase ("go to", "show day"). The engine may hear these on their own, so someone who pauses
// mid-command gets "take me to" (held for the rest) instead of a wrong guess at a whole phrase.
function prefixesOf(phrases) {
  return phrases.flatMap((phrase) => {
    const words = phrase.split(' ')
    return words.slice(1).map((_, index) => words.slice(0, index + 1).join(' '))
  })
}
// Only openers shared by several commands are added; adding every beginning makes the engine sloppier.
function openersOf(phrases, min) {
  const counts = new Map()
  for (const prefix of prefixesOf(phrases)) counts.set(prefix, (counts.get(prefix) ?? 0) + 1)
  return [...counts].filter(([prefix, count]) => count >= min && prefix.includes(' ')).map(([prefix]) => prefix)
}
// Words people say that aren't commands here. Without them on the list the engine turns "click" into the
// nearest command word ("glucose", "delete"); with them it hears "click" and Strelka ignores it.
const NOT_COMMANDS = ['click', 'tap', 'press', 'select', 'choose', 'pick', 'button']
const COMMAND_GRAMMAR = [...new Set([...COMMAND_PHRASES, ...openersOf(COMMAND_PHRASES, 5), ...NOT_COMMANDS])]
const WAKE_GRAMMAR = [...new Set([...WAKE_PHRASES, ...openersOf(WAKE_PHRASES, 2)])]
const PREFIXES = new Set(prefixesOf([...COMMAND_PHRASES, ...WAKE_PHRASES]))
const STANDBY_HINT = 'Say “enable voice command” to start.'

// Spoken phrases are rarely exact ("okay, enable the voice commands please"), so on and off are matched loosely.
const ENABLE = /\b(enable|turn on|activate|start|resume|open)\b.*\bvoice\b|\b(hey|ok|okay)\s+strelka\b/i
const DISABLE = /\b(disable|turn off|deactivate|stop|pause|close)\b.*\bvoice\b/i
const MIC_OFF = /\b(turn off|close|switch off)\b.*\b(mic|microphone)\b/i

// Runs once React has drawn the next screen (two animation frames), instead of a fixed wait.
// Animation frames pause in hidden tabs, so a short timer is the fallback; whichever comes first wins.
function afterRender(callback) {
  let done = false
  const run = () => {
    if (done) return
    done = true
    callback()
  }
  requestAnimationFrame(() => requestAnimationFrame(run))
  setTimeout(run, 150)
}

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
  // What the engine is doing: 'idle', 'loading' (first start), 'waiting-for-tap' (browser wants a click first), 'listening'.
  const [engineState, setEngineState] = useState('idle')
  const [caption, setCaption] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const engine = useRef(null)
  const modeRef = useRef('off')
  // True when the person tapped the mic, so errors are shown. A silent start on page load stays quiet.
  const startedByTap = useRef(false)
  const earlyTimer = useRef(null)
  // The sentence being spoken right now was already acted on early, so its final result is skipped.
  // The words of the sentence that was already acted on early, or ''. Its final result is skipped only if it
  // is the same sentence; any new sentence clears it. (The final can go missing, e.g. when the page changes.)
  const handledEarly = useRef('')
  // Words heard before a pause, waiting for the rest of the sentence (see JOIN_MS).
  const pending = useRef({ text: '', confidence: 1, wait: 0 })
  const flushTimer = useRef(null)
  // The speech engine keeps its first callbacks, so it reads the newest props from here.
  const latest = useRef({})
  // The words written on the current page, refreshed as the page changes (see lib/voiceScreen.js).
  const [pageWords, setPageWords] = useState('')
  // The names of the buttons on screen ("review", "very tired"), for "click …". One string, so it only
  // changes when the buttons do.
  const [pageButtons, setPageButtons] = useState('')
  // "click review", "tap on very tired"… for the buttons on screen now.
  const clickKnown = useRef(new Set())

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
    if (SUPPORTED && saved !== 'off') startListening(saved, false)
    return () => {
      clearTimeout(earlyTimer.current)
      clearTimeout(flushTimer.current)
      modeRef.current = 'off'
      engine.current?.stop()
      engine.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the page's words up to date while on Check-in (forms and options change as you switch check-ins or
  // open a section). Re-read a moment after the page settles, and only count it when the words changed.
  // The buttons on screen are tracked on every page, for "click …".
  const micOpen = mode !== 'off'
  useEffect(() => {
    if (!micOpen) return undefined
    let timer = null
    const refresh = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (tab === 'checkin') setPageWords(screenWords().join(' '))
        setPageButtons([...new Set(screenButtons().map((button) => button.name))].sort().join('|'))
      }, 400)
    }
    refresh()
    const observer = new MutationObserver(refresh)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [tab, micOpen])

  useEffect(() => {
    clickKnown.current = new Set(clickPhrases(pageButtons.split('|').filter(Boolean)))
  }, [pageButtons])

  // What the engine listens for. Telling it which words or phrases to expect makes it far more accurate:
  //   standby   only the wake phrases ("enable voice command"); everything else is ignored.
  //   active    Strelka's command phrases.
  //   Check-in  only words that appear on the website: Strelka's vocabulary plus every word on the page
  //             (field names, options, symptom names, scale labels), and numbers. What you say comes out in
  //             the site's words, so a word on the page is never heard as a different word.
  useEffect(() => {
    let grammar = null
    if (mode === 'standby') grammar = WAKE_GRAMMAR
    else if (mode === 'active' && tab !== 'checkin') grammar = [...COMMAND_GRAMMAR, ...clickPhrases(pageButtons.split('|').filter(Boolean))]
    else if (mode === 'active') grammar = [...new Set([...COMMAND_VOCABULARY, ...pageWords.split(' ').filter(Boolean)])]
    engine.current?.setGrammar(grammar)
  }, [mode, tab, engineState, pageWords, pageButtons])

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

  // Whether the engine is limited to a phrase list right now (standby, or commands outside Check-in).
  function isStrict() {
    return modeRef.current === 'standby' || (modeRef.current === 'active' && latest.current.tab !== 'checkin')
  }

  function isKnownPhrase(sentence) {
    const text = sentence.toLowerCase().trim()
    return modeRef.current === 'standby' ? KNOWN_WAKE.has(text) : KNOWN_COMMANDS.has(text) || clickKnown.current.has(text)
  }

  function handle(sentence, confidence = 1) {
    // Against a phrase list, ignore anything that isn't an exact phrase heard with confidence (background talk).
    if (isStrict() && (!isKnownPhrase(sentence) || confidence < MIN_CONFIDENCE)) return

    if (MIC_OFF.test(sentence)) return turnOff()

    // Exact phrases parse directly. Free speech (Check-in) is forgiven: "hard rate sixty two" still works.
    const command = isStrict() ? parseCommand(sentence) : matchCommand(sentence)

    if (modeRef.current === 'standby') {
      if (ENABLE.test(sentence) || command?.type === 'voiceOn') enable()
      return
    }

    if (DISABLE.test(sentence) || command?.type === 'voiceOff') return disable()
    if (ENABLE.test(sentence) || command?.type === 'voiceOn') return setNote('Voice commands are already on.')

    // "click review", "tap very tired": press that button on screen. If nothing fits, the sentence is
    // treated as usual ("select morning" is also a command).
    const click = CLICK.exec(sentence.toLowerCase().trim())
    if (click) {
      const pressed = clickByName(click[1])
      if (pressed) return setNote(`Pressed “${pressed}”`)
      if (!command) return setNote(`No “${click[1]}” button on screen.`)
    }

    const current = latest.current

    // On the Check-in page, readings, symptoms and anything that isn't a command go to the open form.
    // The form answers with a notice saying what it filled in.
    const heard = matchReadings(sentence)
    const readingIds = Object.keys(heard.values).filter((id) => INDICATOR_BY_ID[id] && isPossible(INDICATOR_BY_ID[id], heard.values[id]))
    const hasReadings = readingIds.length > 0 || heard.symptoms.length > 0

    if (current.tab === 'checkin' && (hasReadings || !command)) {
      const values = Object.fromEntries(readingIds.map((id) => [id, heard.values[id]]))
      window.dispatchEvent(new CustomEvent('strelka:voice', { detail: { values, symptoms: heard.symptoms, sentence: command ? '' : sentence } }))
    } else if (hasReadings) {
      setNote('Open Check-in first to record readings.')
    }

    if (!command) {
      if (!isStrict() && current.tab !== 'checkin' && !hasReadings) setNote(`Didn't catch that: “${sentence}”. Say “help” for ideas.`)
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
    afterRender(send)
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
      case 'guide':
        if (command.action === 'on' || command.action === 'off') {
          const on = command.action === 'on'
          onPage('checkin', 'simulation', { on }, 'Open Check-in to change simulation mode.')
          setNote(on ? 'Simulation on. Strelka will ask one question at a time.' : 'Simulation off. The whole form is shown.')
        } else if (current.tab !== 'checkin' || !sendVoice('guide', { action: command.action })) {
          setNote('Say “start simulation” on the Check-in page first.')
        }
        break
      case 'answer':
        if (!sendVoice('answer', { yes: command.yes })) setNote('There is no question to answer right now.')
        break
      case 'close':
        if (!sendVoice('close')) setNote('Nothing is open to close.')
        else setNote('Closed')
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
        setNote(`Opening ${CARD_NAMES[command.card] ?? 'card'}`)
        onPage('today', 'open-card', { card: command.card }, 'Nothing to open yet. Do a check-in first.')
        break
      case 'reading':
        onPage('today', 'reading', { id: command.id }, 'No readings to show yet.')
        break
      case 'layout':
        setNote(command.layout === 'list' ? 'List view' : 'Grid view')
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
        setNote(`Showing day ${command.day}`)
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
          afterRender(() => window.dispatchEvent(new Event('strelka:save')))
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
    if (engine.current) return

    engine.current = createVoiceEngine({
      onPartial: (piece) => {
        // Strelka is reading a question aloud: that is its own voice, not the astronaut's.
        if (isSpeaking()) return
        // Still talking: keep waiting for the rest of a held piece.
        if (pending.current.text) holdPending(pending.current.text, pending.current.confidence, pending.current.wait)
        const text = withPending(piece)
        if (modeRef.current === 'standby') {
          // React to "enable voice command" as soon as it is heard, without waiting for the pause after it.
          if (KNOWN_WAKE.has(text) && ENABLE.test(text) && handledEarly.current !== text) {
            handledEarly.current = text
            clearPending()
            enable()
          }
          return
        }
        if (modeRef.current !== 'active') return
        // A new sentence that isn't a continuation of the one handled early: forget that one.
        if (handledEarly.current && !text.startsWith(handledEarly.current)) handledEarly.current = ''
        setCaption(text)
        runEarlyWhenSteady(text)
      },
      onFinal: (piece, pieceConfidence) => {
        clearTimeout(earlyTimer.current)
        if (isSpeaking()) {
          setCaption('')
          return
        }
        const text = withPending(piece)
        // The new words decide: the held opener was already checked against the phrase list.
        const confidence = pieceConfidence
        const early = handledEarly.current
        const skip = Boolean(early) && (text.startsWith(early) || piece.startsWith(early))
        handledEarly.current = ''
        window.__strelkaVoiceLog?.push({ text, confidence: Number(confidence.toFixed(2)), mode: modeRef.current })
        if (skip) {
          clearPending()
          setCaption('')
          return
        }
        onSentence(text, confidence, piece, pieceConfidence)
      },
      onError: (code) => {
        // A silent start on page load fails quietly; a tap shows what went wrong.
        const message = ERRORS[code] ?? 'Voice stopped. Tap the mic to try again.'
        closeMic()
        if (startedByTap.current || code === 'model') setError(message)
      },
      onStateChange: setEngineState,
    })
    engine.current.start()
  }

  // The words held from before a pause, followed by the new ones.
  function withPending(text) {
    return pending.current.text ? `${pending.current.text} ${text}` : text
  }

  function clearPending() {
    clearTimeout(flushTimer.current)
    pending.current = { text: '', confidence: 1, wait: 0 }
  }

  // Holds words for the rest of the sentence; if nothing more is said in time, they are acted on as they are.
  function holdPending(text, confidence, wait) {
    clearTimeout(flushTimer.current)
    pending.current = { text, confidence, wait }
    flushTimer.current = setTimeout(() => {
      clearPending()
      setCaption('')
      handle(text, confidence)
    }, wait)
  }

  // A sentence the engine finished (after a pause). Acts on it now, or holds it if it looks unfinished.
  function onSentence(text, confidence, piece, pieceConfidence) {
    if (modeRef.current === 'active' && !isStrict()) {
      // Check-in: "heart rate" … "sixty two" — wait a moment in case more follows.
      setCaption(text)
      return holdPending(text, confidence, CHECKIN_JOIN_MS)
    }
    const known = isKnownPhrase(text)
    const unfinished = PREFIXES.has(text) || CLICK_START.test(text)
    // "take me to demo" heard unsurely after a pause: the engine guessed an ending. Keep "take me to", wait for the rest.
    if (known && confidence < MIN_CONFIDENCE && !pending.current.text) {
      const words = text.split(' ')
      const opener = words.slice(0, -1).map((_, index) => words.slice(0, words.length - 1 - index).join(' ')).find((start) => PREFIXES.has(start) && start.includes(' '))
      if (opener) {
        if (modeRef.current === 'active') setCaption(opener)
        return holdPending(opener, 1, JOIN_MS)
      }
    }
    if (known && !unfinished) {
      clearPending()
      setCaption('')
      return handle(text, confidence)
    }
    // "go to" … or "show day twenty" … (could still be "twenty two"): wait for the rest.
    if (known || unfinished) {
      if (modeRef.current === 'active') setCaption(text)
      return holdPending(text, confidence, JOIN_MS)
    }
    // The new words don't continue the held ones: act on the held words, then look at the new ones alone.
    if (pending.current.text) {
      const held = pending.current
      clearPending()
      handle(held.text, held.confidence)
      return onSentence(piece, pieceConfidence, piece, pieceConfidence)
    }
    setCaption('')
    handle(text, confidence)
  }

  // Short commands without numbers ("go to body", "close", "list view") run as soon as the words stop changing,
  // instead of waiting for the pause at the end of the sentence.
  function runEarlyWhenSteady(text) {
    clearTimeout(earlyTimer.current)
    if (handledEarly.current === text || /\d/.test(text)) return
    if (isStrict() && !KNOWN_COMMANDS.has(text)) return
    const command = parseCommand(text)
    if (!command || !EARLY_COMMANDS.has(command.type)) return
    earlyTimer.current = setTimeout(() => {
      if (modeRef.current !== 'active' || handledEarly.current === text) return
      handledEarly.current = text
      clearPending()
      setCaption('')
      handle(text)
    }, PREFIXES.has(text) ? PREFIX_STEADY_MS : STEADY_MS)
  }

  function closeMic() {
    clearTimeout(earlyTimer.current)
    clearPending()
    setModeBoth('off')
    engine.current?.stop()
    engine.current = null
    setEngineState('idle')
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

  if (!SUPPORTED) return null

  // One line only: an error, what is being heard, the result of a command, or the listening state.
  const engineLine =
    engineState === 'loading' ? 'Loading voice…' : engineState === 'waiting-for-tap' ? 'Click anywhere to start listening.' : ''
  const line = error || (caption ? `“${caption}”` : note) || engineLine || (mode === 'active' ? 'Strelka is listening…' : '')
  const showLine = Boolean(error || engineLine || (mode === 'active' && line) || (mode === 'standby' && note))

  const buttonLabel = {
    off: 'Turn on voice commands',
    standby: 'Voice commands off. Say “enable voice command” or tap to turn on',
    active: 'Turn off voice commands',
  }[mode]

  return (
    <div data-voice-ignore className="relative flex items-center gap-1.5">
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
