// Simulation mode asks one question at a time, so a short answer is enough: "62" for the heart rate,
// "seven hours" for sleep, "very tired" for fatigue, "treadmill" for the exercise. This turns that answer
// into values for the question's field (and its partner: "118 over 76" fills both blood pressure numbers).

import { SYMPTOMS } from '../data/indicators.js'
import { fieldIndicator } from './checkinForm.js'
import { normalize, parseVoice } from './voiceParser.js'

// "No", "none", "nothing", "I'm fine": nothing to report for this question.
const NONE = /^(none|nothing|no|nope|none of (them|these|those)|nothing else|not today|all good|no symptoms|i'?\s?m (fine|good|okay|ok)|i feel (fine|good|okay|ok))$/

const CHOICE_ALIASES = { resistive: ['weights', 'weight', 'lifting', 'strength', 'resistive'], cycle: ['bike', 'cycling', 'cycle'], treadmill: ['treadmill', 'running', 'run', 'jog'] }

function clean(text) {
  return normalize(text).replace(/[^a-z0-9. ]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function isNone(sentence) {
  return NONE.test(clean(sentence))
}

function has(text, phrase) {
  return ` ${text} `.includes(` ${clean(phrase)} `)
}

function firstNumber(text) {
  const match = /\d+(?:\.\d+)?/.exec(text)
  return match ? Number(match[0]) : null
}

function inRange(value, min, max) {
  return value != null && (min == null || value >= min) && (max == null || value <= max)
}

// A 1–5 answer: the number, or the words of a label ("very tired" before "tired").
function scaleAnswer(text, labels) {
  const number = firstNumber(text)
  if (inRange(number, 1, 5)) return number
  const order = labels.map((label, index) => ({ label, score: index + 1 })).sort((a, b) => b.label.length - a.label.length)
  return order.find(({ label }) => has(text, label))?.score ?? null
}

function optionsIn(text, options) {
  return options
    .filter((option) => has(text, option.label) || has(text, option.id) || (CHOICE_ALIASES[option.id] ?? []).some((word) => has(text, word)))
    .map((option) => option.id)
}

// The values an answer gives, as { fieldKey: value }. Empty when the answer doesn't fit the question.
export function answerFor(field, sentence) {
  const text = clean(sentence)
  if (!text) return {}

  if (field.kind === 'text' || field.kind === 'textarea') return { [field.key]: sentence.trim() }

  if (field.kind === 'choice') {
    const [id] = optionsIn(text, field.options)
    const symptom = parseVoice(text).symptoms.find((item) => field.options.some((option) => option.id === item))
    return id || symptom ? { [field.key]: id ?? symptom } : {}
  }

  if (field.kind === 'toggles' || field.kind === 'symptoms') {
    const options = field.kind === 'symptoms' ? SYMPTOMS.filter((symptom) => !(field.exclude ?? []).includes(symptom.id)) : field.options
    const ids = new Set([...optionsIn(text, options), ...parseVoice(text).symptoms.filter((id) => options.some((option) => option.id === id))])
    return ids.size > 0 ? { [field.key]: [...ids] } : {}
  }

  if (field.kind === 'scale') {
    const score = scaleAnswer(text, field.labels)
    return score ? { [field.key]: score } : {}
  }

  if (field.kind === 'number') {
    const minutes = field.unit === 'min' ? parseVoice(`exercise ${text}`).values.exercise : null
    const value = minutes ?? firstNumber(text)
    return inRange(value, field.min, field.max) ? { [field.key]: value } : {}
  }

  if (field.kind === 'indicator') {
    const indicator = fieldIndicator(field)
    const source = field.indicator ?? field.key
    if (indicator.scaleLabels) {
      const score = scaleAnswer(text, indicator.scaleLabels)
      return score ? { [field.key]: score } : {}
    }
    if (source === 'sbp' || source === 'dbp') {
      const both = /(\d{2,3})\s*(?:over|by|slash|and)\s*(\d{2,3})/.exec(text)
      if (both) return { sbp: Number(both[1]), dbp: Number(both[2]) }
    }
    if (indicator.inputType === 'duration') {
      const heard = parseVoice(`slept ${text}`).values.sleep
      const hours = firstNumber(text)
      const value = heard ?? (inRange(hours, 0, 16) ? Math.round(hours * 60) : null)
      return value != null ? { [field.key]: value } : {}
    }
    const value = firstNumber(text)
    return inRange(value, indicator.min, indicator.max) ? { [field.key]: value } : {}
  }

  return {}
}
