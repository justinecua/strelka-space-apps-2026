// Fills check-in fields that the reading parser doesn't cover, from one spoken sentence:
// exercise type, minutes and heart rates after a workout, symptom choice and severity,
// and free text (where it hurts, what happened, notes). Text keeps the words as spoken.

import { allFields } from '../data/checkinTypes.js'
import { normalize } from './voiceParser.js'

const EXERCISE_WORDS = [
  ['treadmill', /\btreadmill\b|\brun(?:ning)?\b|\bjog/],
  ['cycle', /\bcycl|\bbike\b|\bbicycle/],
  ['resistive', /\bresistive\b|\bweights?\b|\blifting\b|\bared\b|\bstrength\b/],
  ['other', /\bother (?:exercise|workout)\b/],
]

const SEVERITY_WORDS = [
  [5, /\bvery severe\b|\bunbearable\b|\bworst\b/],
  [1, /\bvery mild\b|\bbarely\b/],
  [4, /\bsevere\b|\bbad\b/],
  [3, /\bmoderate\b/],
  [2, /\bmild\b|\bslight\b/],
]

// Returns the text after a lead-in phrase, as spoken, without a trailing period.
function textAfter(sentence, pattern) {
  const match = pattern.exec(sentence)
  return match ? match[1].trim().replace(/[.]+$/, '') : null
}

function firstMatch(text, table) {
  return table.find(([, pattern]) => pattern.test(text))?.[0] ?? null
}

export function dictateFields(type, sentence, current = {}) {
  if (!sentence) return {}
  // Numbers as digits: on-device speech writes them as words ("thirty minutes", "severity three").
  const text = normalize(sentence)
  const keys = new Set(allFields(type).map((field) => field.key))
  const filled = {}

  if (keys.has('exerciseType')) {
    const kind = firstMatch(text, EXERCISE_WORDS)
    if (kind) filled.exerciseType = kind
  }

  if (keys.has('duration') && current.duration == null) {
    const minutes = /(?:duration|for)?\s*(\d{1,3})\s*(?:minutes?|mins?)\b/.exec(text)
    if (minutes) filled.duration = Number(minutes[1])
  }

  if (keys.has('hrRecovery')) {
    const recovery = /(?:recovery|one minute later|1 minute later|after (?:a|one|1) minute)\D{0,15}?(\d{2,3})\b/.exec(text)
    if (recovery) filled.hrRecovery = Number(recovery[1])
  }
  if (keys.has('hrPost') && filled.hrRecovery == null) {
    const peak = /(?:right after|after (?:exercise|the workout|workout)|peak|post[\s-]?exercise)\D{0,15}?(\d{2,3})\b/.exec(text)
    if (peak) filled.hrPost = Number(peak[1])
  }

  if (keys.has('symptom') && /\bother\b/.test(text) && !current.symptom) filled.symptom = 'other'

  if (keys.has('severity')) {
    const number = /(?:severity|level|pain|rate it|it'?s a)\D{0,10}?\b([1-5])\b/.exec(text)
    const word = firstMatch(text, SEVERITY_WORDS)
    if (number) filled.severity = Number(number[1])
    else if (word) filled.severity = word
  }

  if (keys.has('location')) {
    const where = textAfter(
      sentence,
      /(?:location|it hurts (?:in|on|at)|hurts (?:in|on|at)|pain (?:is )?(?:in|on|at)|where it hurts is)\s+(?:my\s+|the\s+)?(.+)/i,
    )
    if (where) filled.location = where
  }

  if (keys.has('description')) {
    const what = textAfter(sentence, /^(?:description|describe|what happened(?: was)?|it (?:happened|started) when)[\s:,]+(.+)/i)
    if (what) filled.description = what
  }

  if (keys.has('notes')) {
    const notes = textAfter(sentence, /^(?:notes?|add (?:a )?note)[\s:,]+(.+)/i)
    if (notes) filled.notes = notes
  }

  return filled
}
