// Turns a spoken sentence into an app command. Returns null when the sentence is a health reading or chatter.
// The order of the checks matters: more specific phrases come first, so "open heart rate chart" picks a
// chart and not the heart card, and "save report" saves the form while "share report" downloads it.
// Every command here is listed for people in data/voiceHelp.js.

import { normalize } from './voiceParser.js'

const GO_WORDS = /\b(go to|go|open|show|take me to|navigate to|switch to|back to|bring up|view|see)\b/
const MISSION_CHANGE = /\b(mission|switch|change|set)\b/

// Speech recognition often mishears short words, so each command accepts its common mishearings.
const EDIT_WORDS = /\b(edit|editing|it|addit|idit|change|fix|update|correct)\b/
const DELETE_WORDS = /\b(delete|deleted|remove|dilit|delit|erase)\b/
const SHOW_WORDS = /\b(show|open|view|expand|see|check|look at|display)\b/
const ADD_WORDS = /\b(add|log|fill in|create)\b/
const DAY_WORDS = /\b(day|they|dey|dae|dei)\s*(\d{1,3})\b/

// "light mode", "dark mode", "switch to dark mode", "lite mode" (a common mishearing of "light").
const THEME_WORDS = /\b(light|lite|dark)\s*(mode|theme)\b/
const THEME_TOGGLE = /^(toggle|switch|change|flip)( the)? (theme|mode|colou?rs?)$/

// Breathing break on the Relax page. "Stop relax" and "stop breathing" end it; "start breathing" begins it.
const BREATHE_START = /\b(start|begin|do|take)\s+(a\s+|the\s+|my\s+)?(breathing|breath|break|breathe)( exercise)?\b|\bbreathing exercise\b/
const BREATHE_STOP = /\b(stop|end|finish|pause|quit)\s+(the\s+|my\s+)?(relax|relaxing|breathing|breath|break|breathe)\b/

const TAB_WORDS = {
  today: /\b(today|dashboard|home|overview)\b/,
  checkin: /check[\s-]?in/,
  body: /\bbody( map)?\b/,
  relax: /\brelax(ing|ation)?\b/,
  history: /\b(history|past days|past check[\s-]?ins)\b/,
}

// Body map regions, in the order shown on the Body page.
const REGION_WORDS = [
  ['brain', /\bbrain\b|behaviou?r|\bmind\b|mental/],
  ['eyes', /\beyes?\b|\bsans\b|\bvision\b/],
  ['inner ear', /inner ear|\bear\b|balance/],
  ['immune', /immun/],
  ['lungs', /\blungs?\b/],
  ['heart', /\bheart\b(?!\s*rate)/],
  ['nutrition', /nutrition|\bfood\b|\bdiet\b|\bgut\b/],
  ['bones', /\bbones?\b|\bspine\b/],
  ['muscles', /\bmuscles?\b/],
]

// The five missions. "Mars surface" is checked before "Mars transit" so the words don't overlap.
const MISSION_WORDS = [
  ['mars surface', /mars surface/],
  ['mars transit', /mars transit|\btransit\b|mars trip|to mars/],
  ['lunar surface', /lunar surface|moon surface|moon base/],
  ['lunar orbit', /lunar orbit|gateway/],
  ['space station', /space station|\bleo\b|\bstation\b|\biss\b/],
]

// The NASA spaceflight hazards shown on the Body page.
const HAZARD_WORDS = [
  ['radiation', /radiation/],
  ['isolation', /isolation|confinement/],
  ['distance', /distance( from earth)?/],
  ['gravity', /gravity|weightless|microgravity/],
  ['environment', /hostile|closed environment|environment/],
]

// The Today cards that open full screen.
const CARD_WORDS = [
  ['sleep', /\bsleep( (and|&) mood)?\b|\bmood\b/],
  ['blood', /\bblood\b|\boxygen\b|\bglucose\b/],
  ['missionLog', /mission log|last \d* ?days?|good days|\blog\b/],
  ['doNext', /do next|to ?do|tasks?|next steps/],
  ['readings', /\breadings\b/],
  ['heart', /\bheart\b(?! rate)/],
]

// Readings, for "show the glucose chart" or "heart rate trend". Longer names first.
const READING_WORDS = [
  ['sleepQuality', /sleep quality/],
  ['sbp', /systolic|top number/],
  ['dbp', /diastolic|bottom number/],
  ['sbp', /blood pressure/],
  ['hr', /heart rate|pulse/],
  ['spo2', /oxygen|spo2|saturation/],
  ['resp', /breathing( rate)?|respiratory|respiration/],
  ['temp', /temperature|\btemp\b|fever/],
  ['glucose', /glucose|blood sugar/],
  ['sleep', /\bsleep\b/],
  ['mood', /\bmood\b/],
  ['stress', /\bstress\b/],
  ['fatigue', /fatigue|tiredness/],
  ['water', /\bwater\b|hydration/],
  ['exercise', /exercise|workout/],
]

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

const VOICE_TOGGLE = /^(?:please )?(enable|turn on|start|activate|resume|disable|turn off|deactivate|pause)( the)? voice( commands?| control| mode)?$/

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

// Speech engines often hear "to" as "two" or "too" ("go two body"). Fix it before numbers are converted.
export function fixTo(text) {
  return text.replace(/\b(go|back|switch|navigate|take me|scroll|jump|change|set|move|bring me)\s+(two|too)\b/gi, '$1 to')
}

export function cleanSpoken(spoken) {
  // normalize() turns "day one" into "day 1", so spoken and typed numbers both work.
  return normalize(fixTo(spoken ?? ''))
    .replace(/[.,!?]/g, ' ')
    .replace(/\b(?:hey|ok|okay)\s+strelka\b|\bstrelka\b/g, ' ')
    .replace(/^(please|can you|could you|i want to|i'd like to|let's|lets)\s+/, '')
    .replace(/\s+(please|for me|now)$/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseCommand(spoken) {
  const text = cleanSpoken(spoken)
  if (!text) return null

  // Voice on and off: "enable voice command", "disable voice commands", "turn off voice control".
  const voiceToggle = VOICE_TOGGLE.exec(text)
  if (voiceToggle) return { type: /^(enable|turn on|start|activate|resume)$/.test(voiceToggle[1]) ? 'voiceOn' : 'voiceOff' }

  // Help: "help", "what can I say", "show commands".
  if (/^(help|what can i (say|do)|what do i say|show( me)?( the| all)?( voice)? commands|list( the)? commands|all commands|commands)$/.test(text)) {
    return { type: 'help' }
  }

  // Answers to a question on screen ("Delete day 5?"): yes or no.
  if (/^(yes|yeah|yep|yup|confirm|do it|sure|go ahead|delete it|yes please|i'?m sure|proceed)$/.test(text)) return { type: 'answer', yes: true }
  if (/^(no|nope|don'?t|keep it|never ?mind|not now|no thanks)$/.test(text)) return { type: 'answer', yes: false }

  // "stop" on its own turns voice commands off. "stop breathing" is handled below.
  if (/^(stop|stop listening|be quiet|quiet)$/.test(text)) return { type: 'stop' }

  // Close whatever is open on top: a full-screen card, a pop-up or the commands list.
  if (/^(close|close (it|this|that|the (card|window|dialog|pop ?up|panel|full ?screen))|exit( full ?screen)?|close full ?screen|minimi[sz]e( it)?|dismiss|hide( it| this)?|leave full ?screen)$/.test(text)) {
    return { type: 'close' }
  }

  // Cancel leaves an edit or the review step without saving: "cancel", "discard", "back to edit".
  if (/^(cancel|cancel (edit|edits|changes|this|it)|discard( changes)?|don'?t save( (it|changes))?|back to edit(ing)?|edit again)$/.test(text)) {
    return { type: 'cancel' }
  }

  // Simulation mode on the Check-in page: Strelka asks one question at a time.
  if (/^(start|enable|turn on|begin|open|use)( the)? (simulation|guided)( mode| check[\s-]?in)?$|^(simulation|guided)( mode)? on$/.test(text)) {
    return { type: 'guide', action: 'on' }
  }
  if (/^(stop|disable|turn off|end|exit|close|quit)( the)? (simulation|guided)( mode| check[\s-]?in)?$|^(simulation|guided)( mode)? off$|^show( me)?( the)? (whole|full) form$/.test(text)) {
    return { type: 'guide', action: 'off' }
  }
  if (/^(next|next one|next question|skip|skip it|skip this( one| question)?|skip question|move on|pass)$/.test(text)) return { type: 'guide', action: 'next' }
  if (/^(previous|previous question|last question|go back a question|back a question|question back)$/.test(text)) return { type: 'guide', action: 'previous' }
  if (/^(repeat|repeat that|repeat it|repeat the question|say (that|it) again|again|what was the question|what'?s the question|pardon)$/.test(text)) {
    return { type: 'guide', action: 'repeat' }
  }

  // Back: "go back", "back", "previous page".
  if (/^(go back|back|previous page|last page|return)$/.test(text)) return { type: 'back' }

  // Scrolling: "scroll down", "page up", "go to the top", "scroll to the bottom".
  const scroll = /^(?:scroll|page|move)\s+(up|down)$|^(?:go|scroll|jump)\s+(?:to\s+)?(?:the\s+)?(top|bottom|end|start)( of the page)?$/.exec(text)
  if (scroll) {
    const where = scroll[1] ?? scroll[2]
    return { type: 'scroll', to: where === 'end' ? 'bottom' : where === 'start' ? 'top' : where }
  }

  // Log out: "log out", "sign out", "reset the app", "exit demo".
  if (/^(log ?out|log me out|sign ?out|sign me out|reset( the)? app|exit( the)? demo|leave( the)? demo|quit( the)? demo|end( the)? demo|close( the)? demo)$/.test(text)) {
    return { type: 'logout' }
  }

  // Profile menu: "open my profile", "show profile".
  if (/\b(profile|account)\b/.test(text) && !/log ?out|sign ?out/.test(text)) return { type: 'profile' }

  // The landing page: "go to the home page", "landing page", "start page".
  if (/\b(landing|start|welcome|home|main|front) (page|screen)\b/.test(text)) return { type: 'landing' }

  // Breathing break: "stop relax", "stop breathing" and "start breathing".
  if (BREATHE_STOP.test(text)) return { type: 'breathe', action: 'stop' }
  if (BREATHE_START.test(text)) return { type: 'breathe', action: 'start' }

  // Theme: "light mode", "dark mode", "toggle theme".
  const theme = THEME_WORDS.exec(text)
  if (theme) return { type: 'theme', theme: theme[1] === 'dark' ? 'dark' : 'light' }
  if (THEME_TOGGLE.test(text)) return { type: 'theme', theme: 'toggle' }

  // Today layout: "list view", "switch to grid layout".
  const layout = /^(?:(?:switch|change|go)(?: to)?|show|use|open)?\s*(?:the\s+)?(list|grid)(?: view| layout| mode)?$/.exec(text)
  if (layout) return { type: 'layout', layout: layout[1] }

  // Report: "share report", "download my report", "copy the report".
  const report = /^(share|download|send|get|print)( the| my)?( health)? report$|^(copy)( the| my)?( health)? report$/.exec(text)
  if (report) return { type: 'report', action: report[4] ? 'copy' : 'download' }

  // "Why compare with my normal?"
  if (/why (compare|my normal|your normal|baseline)|what is (my )?normal|explain( the)? baseline/.test(text)) return { type: 'why' }

  // Do next: "mark 1 done", "check off item 2", "complete number 3", "mark all done".
  const todo = /^(?:mark|check|tick|complete|finish|done with)(?: off)?\s+(?:item\s+|task\s+|number\s+|the\s+)?(\d|all|first|second|third)(?:\s+(?:item|task|one))?(?:\s+(?:as\s+)?(?:done|complete|finished))?$/.exec(text)
  if (todo) {
    const words = { first: 1, second: 2, third: 3 }
    return { type: 'todo', which: todo[1] === 'all' ? 'all' : Number(words[todo[1]] ?? todo[1]) }
  }

  // Past days: "delete day 5", "edit day 5", "add day 5", "show day 5", "export day 5".
  const dayMatch = DAY_WORDS.exec(text)
  if (dayMatch) {
    const day = Number(dayMatch[2])
    if (DELETE_WORDS.test(text)) return { type: 'deleteDay', day }
    if (/\b(export|pdf|print)\b/.test(text)) return { type: 'export', scope: 'day', day }
    if (EDIT_WORDS.test(text)) return { type: 'editDay', day }
    if (ADD_WORDS.test(text)) return { type: 'addDay', day }
    if (SHOW_WORDS.test(text) || GO_WORDS.test(text)) return { type: 'showDay', day }
  }

  // History: "add a missed day", "show more", "load older check-ins".
  if (/\b(missed|skipped) (day|check[\s-]?in)\b/.test(text)) return { type: 'addMissed' }
  if (/^(show|load|see)( me)? (more|older|earlier)( check[\s-]?ins| days)?$/.test(text)) return { type: 'showMore' }

  // Export: "export PDF" (the open or latest check-in), "export all" (every check-in).
  // Checked before "save", so "save as PDF" exports instead of saving the form.
  if (/\b(export|pdf)\b/.test(text)) {
    const all = /\b(all|everything|whole|full)\b|\bhistory\b/.test(text)
    return { type: 'export', scope: all ? 'all' : 'day' }
  }

  // Check-in types: "morning check-in", "symptom report", "exercise check-in", "before sleep check-in".
  const checkin = checkinTypeFrom(text)
  if (checkin) return { type: 'checkinType', checkin }

  // Clear the open check-in form: "clear the form", "start over".
  if (/^(clear|reset|empty)( the| this)?( form| fields| check[\s-]?in)?$|^start over$/.test(text)) return { type: 'clearForm' }

  // Save counts only at the end, so it can follow a reading: "mood 4, save check-in".
  // "safe" is a common mishearing of "save".
  if (/\b(save|safe|submit|send|review|done|finish|finished)( (my|the))?( check[\s-]?in| form| it| changes| edits| edit| report)?$/.test(text)) {
    return { type: 'save' }
  }

  if (/^(start|begin|do|new|open)( (my|a|the|new))? check[\s-]?in$/.test(text)) {
    return { type: 'navigate', tab: 'checkin' }
  }

  // NASA hazards: "what is space radiation", "tell me about isolation", "show the gravity hazard".
  const hazard = firstMatch(text, HAZARD_WORDS)
  if (hazard && (/\b(what|explain|tell me about|about|hazard|risk)\b/.test(text) || GO_WORDS.test(text))) return { type: 'hazard', id: hazard }

  // A reading's chart: "show the glucose chart", "heart rate trend", "open blood pressure graph".
  const reading = firstMatch(text, READING_WORDS)
  if (reading && /\b(chart|graph|trend|history of|readings? (for|of)|plot)\b/.test(text)) return { type: 'reading', id: reading }

  // Full-screen cards on Today: "open the heart card", "expand sleep and mood", "full screen blood".
  const card = firstMatch(text, CARD_WORDS)
  if (card && (/\b(card|expand|full ?screen|enlarge|maximi[sz]e|details?|zoom|bigger)\b/.test(text) || (GO_WORDS.test(text) && card !== 'heart'))) {
    return { type: 'openCard', card }
  }

  // Missions: "switch to Mars surface", "change mission to lunar orbit", "space station".
  const mission = firstMatch(text, MISSION_WORDS)
  if (mission && (GO_WORDS.test(text) || MISSION_CHANGE.test(text))) return { type: 'mission', key: mission }

  // Body regions: "show brain", "go to eyes", "open lungs".
  const region = firstMatch(text, REGION_WORDS)
  if (region && GO_WORDS.test(text)) return { type: 'region', key: region }

  // Tabs: "go to body", "open history", "go to relax". A verb is needed: a lone "today" or "relax"
  // turns up too easily in normal conversation.
  if (GO_WORDS.test(text)) {
    for (const [tab, pattern] of Object.entries(TAB_WORDS)) {
      if (pattern.test(text)) return { type: 'navigate', tab }
    }
  }

  return null
}
