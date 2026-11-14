// Turns a spoken sentence into an app command. Returns null when the sentence is a health reading or chatter.
// Commands: stop, light or dark mode, open a tab (including Relax), start or stop breathing,
// show a body region, switch mission, edit or delete a past day, export PDF or all, save check-in or changes, cancel an edit.

import { normalize } from './voiceParser.js'

const GO_WORDS = /\b(go to|go|open|show|take me to|navigate to|switch to|back to|bring up)\b/
const MISSION_CHANGE = /\b(mission|switch|change|set)\b/

// Speech recognition often mishears short words, so each command accepts its common mishearings.
const EDIT_WORDS = /\b(edit|editing|it|addit|idit|change|fix|add|open|show|view)\b/
const DELETE_WORDS = /\b(delete|deleted|remove|dilit|delit)\b/
const DAY_WORDS = /\b(day|they|dey|dae|dei)\s*(\d{1,3})\b/

// "light mode", "dark mode", "switch to dark mode", "lite mode" (a common mishearing of "light").
const THEME_WORDS = /\b(light|lite|dark)\s*mode\b/

// Breathing break on the Relax page. "Stop relax" and "stop breathing" end it; "start breathing" begins it.
const BREATHE_START = /\b(start|begin|do|take)\s+(a\s+|the\s+|my\s+)?(breathing|breath|break|breathe)( exercise)?\b|\bbreathing exercise\b/
const BREATHE_STOP = /\b(stop|end|finish|pause|quit)\s+(the\s+|my\s+)?(relax|relaxing|breathing|breath|break|breathe)\b/

const TAB_WORDS = {
  today: /\b(today|dashboard|home)\b/,
  checkin: /check[\s-]?in/,
  body: /\bbody\b/,
  relax: /\brelax(ing|ation)?\b/,
  history: /\bhistory\b/,
}

// Body map regions, in the order shown on the Body page.
const REGION_WORDS = [
  ['brain', /\bbrain\b|behaviou?r|\bmind\b|mental/],
  ['eyes', /\beyes?\b|\bsans\b|\bvision\b/],
  ['inner ear', /inner ear|\bear\b|balance/],
  ['immune', /immun/],
  ['lungs', /\blungs?\b/],
  ['heart', /\bheart\b(?!\s*rate)/],
  ['nutrition', /nutrition|\bfood\b|\bdiet\b/],
  ['bones', /\bbones?\b|\bspine\b/],
  ['muscles', /\bmuscles?\b/],
]

// The five missions. "Mars surface" is checked before "Mars transit" so the words don't overlap.
const MISSION_WORDS = [
  ['mars surface', /mars surface/],
  ['mars transit', /mars transit|\btransit\b|mars trip|to mars/],
  ['lunar surface', /lunar surface|moon surface/],
  ['lunar orbit', /lunar orbit|gateway/],
  ['space station', /space station|\bleo\b|\bstation\b/],
]

const VOICE_TOGGLE = /^(?:please )?(enable|turn on|start|activate|resume|disable|turn off|deactivate|pause)( the)? voice( commands?| control| mode)?$/

const CHECKIN_TYPE_WORDS = [
  ['symptom', /\bsymptom report\b|\breport (?:a |my )?symptoms?\b|\bsymptom check[\s-]?in\b/],
  ['morning', /\bmorning check[\s-]?in\b/],
  ['exercise', /\b(?:post[\s-]?exercise|exercise|workout) check[\s-]?in\b/],
  ['evening', /\b(?:before[\s-]?sleep|bedtime|evening|night) check[\s-]?in\b/],
]

// Just the name, as on the Check-in tiles: "morning", "post-exercise", "before sleep", "symptom",
// optionally after "open", "go to", "switch to" and the like.
const CHECKIN_TILE_NAME =
  /^(?:(?:open|go to|switch to|show|start|choose|pick|select)\s+(?:the\s+)?)?(morning|post[\s-]?exercise|exercise|workout|before[\s-]?sleep|bedtime|evening|night|symptoms?)(?:\s+(?:check[\s-]?in|report|form))?$/

const TILE_TO_TYPE = { morning: 'morning', exercise: 'exercise', workout: 'exercise', bedtime: 'evening', evening: 'evening', night: 'evening' }

function checkinTypeFrom(text) {
  const named = firstMatch(text, CHECKIN_TYPE_WORDS)
  if (named) return named
  const tile = CHECKIN_TILE_NAME.exec(text)?.[1]
  if (!tile) return null
  if (/^post/.test(tile)) return 'exercise'
  if (/^before/.test(tile)) return 'evening'
  if (/^symptom/.test(tile)) return 'symptom'
  return TILE_TO_TYPE[tile]
}

function firstMatch(text, table) {
  return table.find(([, pattern]) => pattern.test(text))?.[0] ?? null
}

export function parseCommand(spoken) {
  // normalize() turns "day one" into "day 1", so spoken and typed numbers both work.
  const text = normalize(spoken ?? '')
    .replace(/[.,!?]/g, ' ')
    .replace(/\b(?:hey|ok|okay)\s+strelka\b|\bstrelka\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Voice on and off: "enable voice command", "disable voice commands", "turn off voice control".
  // Checked first, so "turn off voice" never reads as "stop".
  const voiceToggle = VOICE_TOGGLE.exec(text)
  if (voiceToggle) return { type: /^(enable|turn on|start|activate|resume)$/.test(voiceToggle[1]) ? 'voiceOn' : 'voiceOff' }

  // Stop turns the microphone off. "stop relax" is handled below, so it does not switch the mic off.
  if (/^(stop|stop listening|turn off|close)$/.test(text)) return { type: 'stop' }

  // Cancel leaves an edit without saving: "cancel", "cancel changes", "discard", "don't save".
  if (/^(cancel|cancel (edit|edits|changes|this|it)|discard( changes)?|don'?t save( (it|changes))?)$/.test(text)) {
    return { type: 'cancel' }
  }

  // Breathing break: "stop relax", "stop breathing" and "start breathing".
  // Checked before tabs, so "stop relax" does not just open the Relax page.
  if (BREATHE_STOP.test(text)) return { type: 'breathe', action: 'stop' }
  if (BREATHE_START.test(text)) return { type: 'breathe', action: 'start' }

  // Theme: "light mode", "dark mode". Checked early so "dark mode" is never read as a body region or tab.
  const theme = THEME_WORDS.exec(text)
  if (theme) return { type: 'theme', theme: theme[1] === 'dark' ? 'dark' : 'light' }

  // Past days: "edit day 1", "open day 1", "delete day 1".
  const dayMatch = DAY_WORDS.exec(text)
  if (dayMatch) {
    const day = Number(dayMatch[2])
    if (DELETE_WORDS.test(text)) return { type: 'deleteDay', day }
    if (EDIT_WORDS.test(text)) return { type: 'editDay', day }
  }

  // Export: "export PDF" (the open or latest check-in), "export all" (every check-in).
  // Checked before "save", so "save as PDF" exports instead of saving the form.
  if (/\b(export|pdf)\b/.test(text)) {
    const all = /\b(all|everything|whole|full)\b|\bhistory\b/.test(text)
    return { type: 'export', scope: all ? 'all' : 'day' }
  }

  // Check-in types: "morning check-in", "symptom report", "exercise check-in", "before sleep check-in".
  // Checked before "save", so "start morning check-in" opens the form instead of saving.
  const checkin = checkinTypeFrom(text)
  if (checkin) return { type: 'checkinType', checkin }

  // Save counts only at the end, so it can follow a reading: "mood 4, save check-in".
  // "save changes" and "save edits" are accepted for editing. "safe" is a common mishearing of "save".
  if (/\b(save|safe|submit|send|review)( (my|the))?( check[\s-]?in| form| it| changes| edits| edit| report)?$/.test(text)) {
    return { type: 'save' }
  }

  if (/^(please )?(start|begin|do|new|open)( (my|a|the|new))? check[\s-]?in$/.test(text)) {
    return { type: 'navigate', tab: 'checkin' }
  }

  // Missions: "switch to Mars surface", "change mission to lunar orbit", "space station".
  const mission = firstMatch(text, MISSION_WORDS)
  if (mission && (GO_WORDS.test(text) || MISSION_CHANGE.test(text))) return { type: 'mission', key: mission }

  // Body regions: "show brain", "go to eyes", "open lungs".
  const region = firstMatch(text, REGION_WORDS)
  if (region && GO_WORDS.test(text)) return { type: 'region', key: region }

  // Tabs: "go to body", "open history", "go to relax", or just "relax".
  if (GO_WORDS.test(text) || /^relax(ing|ation)?$/.test(text)) {
    for (const [tab, pattern] of Object.entries(TAB_WORDS)) {
      if (pattern.test(text)) return { type: 'navigate', tab }
    }
  }

  return null
}