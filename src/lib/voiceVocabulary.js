// The words Strelka listens for when it only needs commands and readings. Limiting the speech engine to
// these words makes it quicker and much less likely to mishear. It is built from the help phrases and the
// app's own data, plus the extra words the command parser (lib/voiceCommands.js) understands.
// On the Check-in page the full vocabulary is used instead, so notes like "what happened" can be dictated.

import { CHECKIN_TYPE_LIST, SYMPTOM_REPORT_OPTIONS } from '../data/checkinTypes.js'
import { HAZARDS } from '../data/hazards.js'
import { INDICATORS, SYMPTOMS } from '../data/indicators.js'
import { MISSIONS } from '../data/missions.js'
import { REGIONS } from '../data/regions.js'
import { VOICE_HELP } from '../data/voiceHelp.js'

const NUMBER_WORDS = `zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen
  sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred point and`

// Words from the command parser that the help phrases don't already contain.
const COMMAND_WORDS = `
  hey okay ok strelka please can you could i want to like let's lets for me now the a an my this that it
  enable disable turn on off activate deactivate resume pause stop listening quiet voice commands command control mode
  microphone mic help what say do show list all yes yeah yep sure confirm go ahead no nope never mind keep not thanks
  close exit dismiss hide minimize minimise leave full screen card window dialog popup panel cancel discard don't save
  back previous page last return scroll page move up down top bottom end start jump of
  log out logout sign reset app demo quit profile account landing welcome home main front overview dashboard
  open take navigate switch bring view see display look at expand enlarge maximize details zoom bigger
  today check in checkin body map history past days relax relaxing relaxation
  light dark theme toggle change flip colors colours grid layout use
  share download send get print copy report health why compare normal baseline explain your
  mark tick complete finish finished done with item task number first second third as
  day days edit fix update correct delete remove erase add log fill create missed skipped more older earlier load
  export pdf whole everything
  morning post exercise workout before sleep bedtime evening night symptom symptoms
  clear empty form fields review submit
  breathing breath breathe break exercise begin take
  hazard risk tell about
  chart graph trend plot readings reading
  heart rate pulse blood pressure systolic diastolic top bottom oxygen saturation breathing respiratory respiration
  temperature temp fever glucose sugar quality mood stress fatigue tiredness water hydration
  slept hours hour minutes minute liters litres bpm percent over by slash
  treadmill cycle bike weights lifting resistive strength running jog
  severity level pain severe mild moderate very slight bad
  right after peak recovery later
  headache head hurts dizzy dizziness lightheaded nausea nauseous sick blurry blurred vision chest
  short shortness breathless congestion stuffy nose rash cold sore sores muscle muscles sore aches ache
  brain eyes eye ear inner lungs immune nutrition food diet gut bones spine
  mars surface transit lunar moon orbit gateway station space radiation isolation confinement distance earth gravity environment
`

function words(text) {
  return text
    .toLowerCase()
    .replace(/[₂“”"'.,()/&·–-]/g, ' ')
    .split(/\s+/)
    .filter((word) => /^[a-z]+$/.test(word))
}

const sources = [
  NUMBER_WORDS,
  COMMAND_WORDS,
  ...VOICE_HELP.flatMap((group) => group.phrases),
  ...INDICATORS.flatMap((indicator) => [indicator.label, indicator.short]),
  ...SYMPTOMS.map((symptom) => symptom.label),
  ...SYMPTOM_REPORT_OPTIONS.map((option) => option.label),
  ...REGIONS.map((region) => region.name),
  ...MISSIONS.map((mission) => mission.name),
  ...HAZARDS.map((hazard) => hazard.name),
  ...CHECKIN_TYPE_LIST.flatMap((type) => [type.title, type.short]),
]

export const COMMAND_VOCABULARY = [...new Set(sources.flatMap(words))].sort()

// ---------------------------------------------------------------------------------------------
// Whole phrases. Telling the speech engine the exact sentences to expect makes it far more accurate than a
// word list: it only has to pick between known commands, and anything else is ignored. Numbers are written
// as words ("show day twelve"), the way the engine hears them.

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

export function numberWords(n) {
  if (n < 20) return ONES[n]
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : '')
  return `${ONES[Math.floor(n / 100)]} hundred${n % 100 ? ` ${numberWords(n % 100)}` : ''}`
}

function spoken(phrase) {
  return phrase
    .toLowerCase()
    .replace(/\d+/g, (digits) => numberWords(Number(digits)))
    .replace(/[₂“”"'.,()/&·–-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const MAX_DAY = 60
const CARDS = ['heart', 'sleep and mood', 'sleep', 'mood', 'blood', 'mission log', 'do next', 'readings']
const TABS = ['today', 'check in', 'body', 'history', 'relax', 'dashboard', 'home']

function* commandPhrases() {
  yield* VOICE_HELP.flatMap((group) => group.phrases)
  // Tabs always with a verb ("go to history"); a lone tab name turns up too easily in conversation.
  for (const tab of TABS) {
    for (const verb of ['go to', 'open', 'show', 'take me to', 'switch to']) yield `${verb} ${tab}`
  }
  for (const card of CARDS) {
    for (const form of [`open the ${card} card`, `open ${card} card`, `open ${card}`, `expand ${card}`, `full screen ${card}`, `show ${card}`]) yield form
  }
  for (const region of REGIONS) {
    for (const verb of ['show', 'open', 'go to', 'show the']) yield `${verb} ${region.name}`
  }
  for (const hazard of HAZARDS) {
    for (const verb of ['what is', 'tell me about', 'explain']) yield `${verb} ${hazard.name}`
  }
  for (const mission of MISSIONS) {
    for (const verb of ['switch to', 'change mission to']) yield `${verb} ${mission.name}`
  }
  for (const indicator of INDICATORS) {
    for (const form of [`show the ${indicator.label} chart`, `${indicator.label} chart`, `${indicator.label} trend`]) yield form
  }
  for (const type of CHECKIN_TYPE_LIST) {
    yield type.title
    yield type.short
  }
  for (let day = 1; day <= MAX_DAY; day++) {
    for (const verb of ['show', 'open', 'edit', 'delete', 'add', 'export']) yield `${verb} day ${day}`
  }
  for (let item = 1; item <= 9; item++) yield `mark ${item} done`
  yield* [
    'enable voice command', 'enable voice commands', 'disable voice command', 'disable voice commands', 'turn off voice',
    'turn off the microphone', 'stop', 'stop listening', 'help', 'what can i say', 'show commands',
    'yes', 'yeah', 'confirm', 'do it', 'no', 'nope', 'never mind', 'cancel', 'back to edit',
    'close', 'close it', 'close full screen', 'exit full screen', 'go back', 'back', 'scroll up', 'scroll down',
    'go to the top', 'go to the bottom', 'page down', 'page up', 'list view', 'grid view', 'switch to list view',
    'switch to grid view', 'share report', 'download report', 'copy report', 'why compare with my normal',
    'mark all done', 'mark the first item done', 'log out', 'sign out', 'exit demo', 'reset the app', 'open my profile',
    'go to the home page', 'home page', 'landing page', 'dark mode', 'light mode', 'toggle theme',
    'start breathing', 'stop breathing', 'start check in', 'review', 'submit', 'save', 'save check in',
    'clear the form', 'start over', 'show more', 'add a missed day', 'export pdf', 'export all', 'symptom report',
    'morning check in', 'before sleep check in', 'post exercise check in',
  ]
}

// One-word phrases are easy to trigger by accident in normal talk ("nice day today", "good morning"),
// so only these clearly deliberate ones are allowed on their own.
const SINGLE_WORD_OK = new Set(['close', 'help', 'yes', 'no', 'nope', 'yeah', 'cancel', 'review', 'submit', 'stop'])

export const COMMAND_PHRASES = [...new Set([...commandPhrases()].map(spoken))].filter(
  (phrase) => phrase && (phrase.includes(' ') || SINGLE_WORD_OK.has(phrase)),
)

// In standby only these are listened for; anything else is ignored.
export const WAKE_PHRASES = [
  'enable voice command', 'enable voice commands', 'enable voice', 'turn on voice', 'turn on voice commands',
  'hey strelka', 'okay strelka', 'turn off the microphone',
].map(spoken)
