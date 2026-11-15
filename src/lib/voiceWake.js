// The name: every command starts with "Strelka" ("Strelka, go to home", "Strelka, click heart"), so talk
// around the astronaut is ignored. The on-device speech model doesn't know the word "Strelka" (it isn't
// English), but it reliably hears it as "stroger", so that is the word it listens for.
// Only a sentence that *starts* with the name counts: "I had a stroke of luck…" can be heard with "stroger"
// in the middle, and is ignored.

export const NAME_WORDS = ['stroger']

const NAME = /^(?:(?:hey|ok|okay)\s+)?(?:stroger|strelka)\b[\s,]*/

function clean(text) {
  return text.replace(/\[unk\]/g, ' ').replace(/\s+/g, ' ').trim()
}

// What was heard, split into whether it started with the name, and the words after it.
// raw: the text as heard, with "[unk]" still in, so a name after an unknown word doesn't count.
export function splitName(raw) {
  const text = String(raw ?? '').toLowerCase().trim()
  const match = NAME.exec(text)
  if (!match) return { called: false, rest: clean(text) }
  return { called: true, rest: clean(text.slice(match[0].length)) }
}

// Replies to Strelka's own questions (a simulation question, "Delete day 5?") don't need the name.
// Kept here rather than sent as an event, so a question asked before the microphone starts still counts.
const ANSWER_WAIT_MS = 20000
let answerUntil = 0

export function expectAnswer() {
  answerUntil = Date.now() + ANSWER_WAIT_MS
}

export function isAwaitingAnswer() {
  return Date.now() < answerUntil
}
