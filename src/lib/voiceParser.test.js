// Turns what an astronaut says ("heart rate 62, blood pressure 120 over 80, I slept 7 hours, no headache")
// into check-in values and symptom ids. It works on plain text, so it runs offline and is easy to test.
// It only reads what was said; the astronaut still reviews the numbers before anything is saved.

const UNITS = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20 }
const TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 }

// Speech engines usually return digits, but spoken numbers like "sixty two" are handled too.
export function normalize(text) {
  return text
    .toLowerCase()
    .replace(/,/g, ' ')
    .replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[\s-](one|two|three|four|five|six|seven|eight|nine)\b/g, (_, tens, unit) => String(TENS[tens] + UNITS[unit]))
    .replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\b/g, (word) => String(UNITS[word] ?? TENS[word]))
    .replace(/(\d+)\s+point\s+(\d)/g, '$1.$2')
}

// Each rule: which indicator ids it fills (in order) and the phrase that finds them.
const RULES = [
  { ids: ['sbp', 'dbp'], re: /(?:blood pressure|bp)\D{0,15}(\d{2,3})\s*(?:over|\/|by|slash)\s*(\d{2,3})/ },
  { ids: ['hr'], re: /(?:heart rate|pulse|heart)\D{0,15}(\d{2,3})/ },
  { ids: ['spo2'], re: /(?:oxygen|spo2|sp o2|saturation)\D{0,15}(\d{2,3})/ },
  { ids: ['temp'], re: /(?:temperature|temp)\D{0,15}(\d{2}(?:\.\d+)?)/ },
  { ids: ['glucose'], re: /(?:glucose|blood sugar)\D{0,15}(\d{2,3})/ },
  { ids: ['sleep'], re: /(?:slept|sleep)\D{0,25}?(\d{1,2}(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/ },
  { ids: ['mood'], re: /mood\D{0,15}([1-5])\b/ },
  { ids: ['stress'], re: /stress\D{0,15}([1-5])\b/ },
  { ids: ['exercise'], re: /(?:exercise|exercised|workout|worked out)\D{0,25}?(\d{1,3})\s*(?:minutes|mins?)\b/ },
]

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

export function parseVoice(transcript) {
  const text = normalize(transcript ?? '')
  const values = {}
  const symptoms = []

  for (const { ids, re } of RULES) {
    const match = re.exec(text)
    if (!match) continue
    ids.forEach((id, index) => {
      values[id] = Number(match[index + 1])
    })
  }

  for (const [id, re] of Object.entries(SYMPTOM_WORDS)) {
    const match = re.exec(text)
    if (!match) continue
    const before = text.slice(Math.max(0, match.index - 25), match.index)
    if (!NEGATION.test(before)) symptoms.push(id)
  }

  return { values, symptoms, found: Object.keys(values).length + symptoms.length }
}