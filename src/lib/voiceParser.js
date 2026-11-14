const UNITS = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
}

const TENS = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
}

// Converts spoken numbers into digits.
// Examples: "sixty two" -> "62", "thirty five" -> "35".
export function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/,/g, ' ')
    .replace(
      /\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[\s-](one|two|three|four|five|six|seven|eight|nine)\b/g,
      (_, tens, unit) => String(TENS[tens] + UNITS[unit])
    )
    .replace(
      /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\b/g,
      (word) => String(UNITS[word] ?? TENS[word])
    )
    .replace(/(\d+)\s+point\s+(\d)/g, '$1.$2')
}

// Regular health indicators.
// Each rule identifies the indicator ids it fills and the matching pattern.
const RULES = [
    {
    ids: ['sbp', 'dbp'],
    re: /(?:blood pressure|bp)\D{0,25}?(\d{2,3})\s*(?:over|\/|by|slash)\s*(\d{2,3})/g,
    },
    {
    ids: ['sbp'],
    re: /(?:systolic|top number)\D{0,15}?(\d{2,3})/g,
    },

    {
    ids: ['dbp'],
    re: /(?:diastolic|bottom number)\D{0,15}?(\d{2,3})/g,
    },
  {
    ids: ['hr'],
    re: /(?:heart rate|pulse|heart)\D{0,15}?(\d{2,3})/g,
  },
  {
    ids: ['spo2'],
    re: /(?:oxygen|spo2|sp o2|saturation)\D{0,15}?(\d{2,3})/g,
  },
  {
    ids: ['temp'],
    re: /(?:temperature|temp)\D{0,15}?(\d{2}(?:\.\d+)?)/g,
  },
  {
    ids: ['glucose'],
    re: /(?:glucose|blood sugar)\D{0,15}?(\d{2,3})/g,
  },
  {
    ids: ['mood'],
    re: /mood\D{0,15}?([1-5])\b/g,
  },
  {
    ids: ['stress'],
    re: /stress\D{0,15}?([1-5])\b/g,
  },
]

// Both indicators are stored as total minutes internally.
const SLEEP_PATTERN =
  /\b(?:slept|sleep)\b\D{0,25}?(?:(\d{1,2}(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b(?:\s*(?:and\s*)?(\d{1,2})\s*(?:minutes?|mins?)\b)?|(\d{1,3})\s*(?:minutes?|mins?)\b)/g

const EXERCISE_PATTERN =
  /\b(?:exercise|exercised|workout|worked out)\b\D{0,25}?(?:(\d{1,2})\s*(?:hours?|hrs?|h)\b(?:\s*(?:and\s*)?(\d{1,2})\s*(?:minutes?|mins?)\b)?|(\d{1,3})\s*(?:minutes?|mins?)\b)/g

// Symptoms an astronaut can report.
const SYMPTOM_WORDS = {
  headache: /headache|head hurts|head is hurting/,
  vision: /blurry|blurred|vision (?:change|problem)|can'?t see (?:well|clearly)/,
  nausea: /nausea|nauseous|feel sick/,
  congestion: /congest|stuffy|blocked nose/,
  backpain: /back pain|back hurts|sore back/,
  rash: /rash|cold sore/,
  chestpain: /chest pain|chest hurts|pain in (?:my )?chest/,
  breath: /short(?:ness)? of breath|can'?t breathe|breathless|hard to breathe/,
}

const NEGATION = /\b(?:no|not|without|don'?t have|dont have)\s+(?:\w+\s+){0,2}$/

// Extract the last matching duration from a transcript.
// Returns total minutes or null if no valid duration was found.
function extractDuration(text, pattern) {
  let match = null

  for (const found of text.matchAll(pattern)) {
    match = found
  }

  if (!match) return null

  const hours = Number(match[1] ?? 0)
  const minutes = Number(match[2] ?? match[3] ?? 0)

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null
  }

  return Math.round(hours * 60 + minutes)
}

// Main voice parser.
export function parseVoice(transcript) {
  const text = normalize(transcript)
  const values = {}
  const symptoms = []

  // Extract regular health readings.
  // If a reading is corrected, the last spoken value wins.
  for (const { ids, re } of RULES) {
    let match = null

    for (const found of text.matchAll(re)) {
      match = found
    }

    if (!match) continue

    ids.forEach((id, index) => {
      values[id] = Number(match[index + 1])
    })
  }

  // Extract sleep duration in total minutes.
  const sleep = extractDuration(text, SLEEP_PATTERN)

  if (sleep !== null) {
    values.sleep = sleep
  }

  // Extract exercise duration in total minutes.
  const exercise = extractDuration(text, EXERCISE_PATTERN)

  if (exercise !== null) {
    values.exercise = exercise
  }

  // Extract symptoms while respecting negation.
  for (const [id, re] of Object.entries(SYMPTOM_WORDS)) {
    const match = re.exec(text)

    if (!match) continue

    const before = text.slice(
      Math.max(0, match.index - 25),
      match.index
    )

    if (!NEGATION.test(before)) {
      symptoms.push(id)
    }
  }

  return {
    values,
    symptoms,
    found: Object.keys(values).length + symptoms.length,
  }
}
