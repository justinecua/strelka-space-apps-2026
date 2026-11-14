// Makes voice commands forgiving. Speech engines often get one word wrong ("go two buddy", "hard rate
// sixty two", "open histry"). When the exact parse fails, this:
//   1. swaps unknown words for the closest known word, comparing how they sound ("hard" → "heart"), then
//   2. compares the whole sentence with every phrase Strelka knows, and picks the closest if it is close enough.
// Numbers are kept as they were heard, so "show they twelve" still becomes "show day 12".

import { CHECKIN_TYPE_LIST } from '../data/checkinTypes.js'
import { HAZARDS } from '../data/hazards.js'
import { INDICATORS } from '../data/indicators.js'
import { MISSIONS } from '../data/missions.js'
import { REGIONS } from '../data/regions.js'
import { VOICE_HELP } from '../data/voiceHelp.js'
import { fixTo, parseCommand } from './voiceCommands.js'
import { normalize, parseVoice } from './voiceParser.js'
import { COMMAND_VOCABULARY } from './voiceVocabulary.js'

const WORD_MATCH = 0.7
const PHRASE_MATCH = 0.72
// The best phrase must beat the runner-up by this much, so a sentence halfway between two commands does nothing.
const PHRASE_MARGIN = 0.04
const FILLER = /\b(the|a|an|please|my|me|now|can|you|could|would|i|want|to|like|um|uh|okay|ok|hey|strelka)\b/g

// A rough "sounds like" key: English spelling rules squeezed down to consonant sounds.
export function soundKey(word) {
  let w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!w) return ''
  w = w
    .replace(/^kn|^gn|^pn|^wr/, (m) => m[1])
    .replace(/ph/g, 'f')
    .replace(/ck/g, 'k')
    .replace(/sch/g, 'sk')
    .replace(/sh|ch/g, 'x')
    .replace(/th/g, '0')
    .replace(/dg/g, 'j')
    .replace(/gh/g, '')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/[cq]/g, 'k')
    .replace(/x/g, 'ks')
    .replace(/z/g, 's')
    .replace(/v/g, 'f')
    .replace(/b/g, 'p')
    .replace(/d/g, 't')
    .replace(/g/g, 'k')
  const first = w[0]
  const rest = w.slice(1).replace(/[aeiouyhw]/g, '')
  return (first + rest).replace(/(.)\1+/g, '$1')
}

export function editDistance(a, b) {
  if (a === b) return 0
  const row = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const saved = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1))
      previous = saved
    }
  }
  return row[b.length]
}

function similarity(a, b) {
  const longest = Math.max(a.length, b.length)
  return longest === 0 ? 1 : 1 - editDistance(a, b) / longest
}

// How alike two words are, by spelling and by sound; the better of the two counts.
function wordSimilarity(a, b) {
  return Math.max(similarity(a, b), similarity(soundKey(a), soundKey(b)) * 0.95)
}

const KNOWN_WORDS = new Set(COMMAND_VOCABULARY)
const KNOWN_LIST = COMMAND_VOCABULARY.filter((word) => word.length >= 3)

// Swaps each unknown word for the closest known one, if one is close enough. Numbers are left alone.
export function correctWords(text) {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => {
      if (word.length < 3 || /\d/.test(word) || KNOWN_WORDS.has(word)) return word
      let best = word
      let bestScore = WORD_MATCH
      for (const known of KNOWN_LIST) {
        if (Math.abs(known.length - word.length) > 3) continue
        const score = wordSimilarity(word, known)
        if (score > bestScore) {
          best = known
          bestScore = score
        }
      }
      return best
    })
    .join(' ')
}

// Every command phrase Strelka knows, as written for people (help list) plus generated ones.
// "#" stands for a number.
function buildPhrases() {
  const phrases = new Set()
  for (const group of VOICE_HELP) {
    for (const phrase of group.phrases) {
      if (!/\d/.test(phrase)) phrases.add(phrase)
    }
  }
  const tabs = ['today', 'check in', 'body', 'history', 'relax']
  for (const tab of tabs) ['go to', 'open', 'show'].forEach((verb) => phrases.add(`${verb} ${tab}`))
  for (const region of REGIONS) ['show', 'open', 'go to'].forEach((verb) => phrases.add(`${verb} ${region.name.toLowerCase()}`))
  for (const hazard of HAZARDS) phrases.add(`what is ${hazard.name.toLowerCase()}`)
  for (const mission of MISSIONS) phrases.add(`switch to ${mission.name.toLowerCase().replace(/[()]/g, '')}`)
  for (const indicator of INDICATORS) phrases.add(`show the ${indicator.label.toLowerCase().replace(/[()₂]/g, '')} chart`)
  for (const type of CHECKIN_TYPE_LIST) phrases.add(type.title.toLowerCase())
  for (const verb of ['show', 'edit', 'delete', 'add', 'export']) phrases.add(`${verb} day #`)
  phrases.add('mark # done')
  return [...phrases]
}

const PHRASES = buildPhrases().map((phrase) => ({ phrase, key: simplify(phrase) }))

// The words that matter for matching: lowercase, numbers as digits, filler words dropped.
function simplify(text) {
  return normalize(text)
    .replace(/[^a-z0-9# ]/g, ' ')
    .replace(FILLER, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Compares two simplified sentences word by word (by sound), so one wrong word costs little.
function phraseSimilarity(a, b) {
  const left = a.split(' ')
  const right = b.split(' ')
  const rows = left.length
  const cols = right.length
  // Alignment cost with partial credit for similar words (a word-level edit distance).
  const table = Array.from({ length: rows + 1 }, (_, i) => Array.from({ length: cols + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)))
  for (let i = 1; i <= rows; i++) {
    for (let j = 1; j <= cols; j++) {
      const swap = left[i - 1] === right[j - 1] ? 0 : 1 - wordSimilarity(left[i - 1], right[j - 1])
      table[i][j] = Math.min(table[i - 1][j] + 1, table[i][j - 1] + 1, table[i - 1][j - 1] + swap)
    }
  }
  return 1 - table[rows][cols] / Math.max(rows, cols, 1)
}

// The closest known phrase for a sentence, with the heard number put back in, or null.
export function closestPhrase(text) {
  const simple = simplify(text)
  // A single word ("today", "my") is too little to guess a command from.
  if (!simple || !simple.includes(' ')) return null
  const number = simple.match(/\d+/)?.[0]
  const withHole = simple.replace(/\d+/, '#')
  let best = null
  let second = 0
  for (const candidate of PHRASES) {
    if (candidate.key.includes('#') !== Boolean(number)) continue
    const score = phraseSimilarity(withHole, candidate.key)
    if (!best || score > best.score) {
      second = best?.score ?? second
      best = { phrase: candidate.phrase, score }
    } else if (score > second) {
      second = score
    }
  }
  if (!best || best.score < PHRASE_MATCH || best.score - second < PHRASE_MARGIN) return null
  return number ? best.phrase.replace('#', number) : best.phrase
}

// "delete the 5", "show they 12": a word like "the" between a day verb and a number is almost always "day".
function fixDay(text) {
  return text.replace(/\b(show|open|see|edit|fix|change|delete|remove|add|export)\s+(the|they|dey|de|that|this|date)\s+(\d+)\b/g, '$1 day $3')
}

// The command in a sentence: exact first, then with words corrected, then the closest known phrase.
export function matchCommand(sentence) {
  const exact = parseCommand(sentence)
  if (exact) return exact
  const corrected = fixDay(correctWords(normalize(fixTo(sentence))))
  const fixed = parseCommand(corrected)
  if (fixed) return fixed
  const phrase = closestPhrase(corrected)
  return phrase ? parseCommand(phrase) : null
}

// Readings and symptoms in a sentence; if none are found, try again with misheard words corrected.
export function matchReadings(sentence) {
  const heard = parseVoice(sentence)
  if (heard.found > 0) return heard
  return parseVoice(correctWords(normalize(sentence)))
}
