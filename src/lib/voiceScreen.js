// The words written on the page (field names, options, symptom names, scale labels like "Very tired"),
// so on the Check-in page the speech engine only hears words that appear on the website, plus Strelka's
// own vocabulary and numbers. What you say then always comes out as the site's words, never a different
// word that merely sounds alike. When a pop-up or full-screen card is open, only what's inside it counts.

//
// It also lets people press what they see: "click Review", "tap Very tired", "press the Save button".

import { editDistance } from './voiceMatch.js'
import { spoken } from './voiceVocabulary.js'

// Where the words on a page live: buttons, links, form labels, option chips, scale buttons, headings.
const TEXT_SOURCES = 'button, a[href], label, [role="radio"], [role="tab"], [role="option"], option, h1, h2, h3, legend, dt, th'
// What can be pressed.
const CLICKABLE = 'button, a[href], summary, [role="button"], [role="radio"], [role="tab"], [role="option"], [role="checkbox"], [role="switch"], [role="menuitem"]'
// Longer texts are paragraphs inside a button, not a name anyone would say.
const MAX_NAME_WORDS = 6

export const CLICK_VERBS = ['click', 'tap', 'press', 'select', 'choose', 'pick']
// "click Review", "tap on the Save button", "press very tired".
export const CLICK = /^(?:click|tap|press|select|choose|pick)(?:\s+on)?(?:\s+the)?\s+(.+?)(?:\s+button)?$/
// The verb on its own ("click", "tap on the"): the name is still coming.
export const CLICK_START = /^(?:click|tap|press|select|choose|pick)(?:\s+on)?(?:\s+the)?$/

function topLayer() {
  const dialogs = document.querySelectorAll('[role="dialog"]')
  return dialogs[dialogs.length - 1] ?? document
}

// Every word on screen, in spoken form, sorted. Text inside the voice controls themselves is skipped.
export function screenWords() {
  const words = new Set()
  for (const element of topLayer().querySelectorAll(TEXT_SOURCES)) {
    if (element.closest('[data-voice-ignore]')) continue
    const text = [element.getAttribute('aria-label'), visibleText(element)].filter(Boolean).join(' ')
    for (const word of spoken(text).split(' ')) {
      if (/^[a-z]+$/.test(word)) words.add(word)
    }
  }
  return [...words].sort()
}

// The text as shown, with line breaks between parts ("Before sleep" / "Before going to sleep"), so words
// from separate lines aren't glued together the way textContent glues them.
function visibleText(element) {
  return element.innerText ?? element.textContent ?? ''
}

function isUsable(element) {
  if (element.closest('[data-voice-ignore], [aria-hidden="true"], [inert]')) return false
  if (element.disabled || element.getAttribute('aria-disabled') === 'true') return false
  return element.getClientRects().length > 0
}

function clean(text) {
  return spoken(text).replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim()
}

// The names a button can be called by: its label, its first line ("Before sleep" on a tab that also says
// "Before going to sleep"), and all of its text, as said aloud. Long texts are skipped.
function namesOf(element) {
  const label = element.getAttribute('aria-label')
  const lines = visibleText(element).split('\n').map(clean).filter(Boolean)
  const names = [label && clean(label), lines[0], lines.join(' ')]
  return [...new Set(names.filter((name) => name && name.split(' ').length <= MAX_NAME_WORDS))]
}

// Everything on screen that can be pressed, with its spoken name.
export function screenButtons() {
  const buttons = []
  for (const element of topLayer().querySelectorAll(CLICKABLE)) {
    if (!isUsable(element)) continue
    for (const name of namesOf(element)) buttons.push({ element, name })
  }
  return buttons
}

// The sentences that press something on screen ("click review", "tap on the save button"), for the speech engine.
export function clickPhrases(names) {
  const phrases = new Set()
  for (const name of names) {
    for (const verb of CLICK_VERBS) {
      phrases.add(`${verb} ${name}`)
      phrases.add(`${verb} the ${name}`)
    }
    phrases.add(`click on ${name}`)
    phrases.add(`tap on ${name}`)
    phrases.add(`click the ${name} button`)
    phrases.add(`press the ${name} button`)
  }
  return [...phrases]
}

// How well a spoken name fits a button's name, 0 to 1.
function fit(said, name) {
  if (said === name) return 1
  const words = name.split(' ')
  // "click save" for "Save check-in", "tap tired" for "Very tired".
  if (` ${name} `.includes(` ${said} `)) return 0.9 - 0.02 * (words.length - said.split(' ').length)
  return 1 - editDistance(said, name) / Math.max(said.length, name.length)
}

// Presses the button whose name was said. Returns its name, or null if nothing on screen fits well enough.
export function clickByName(said) {
  const target = spoken(said).replace(/^(?:on\s+)?(?:the\s+)?/, '').replace(/\s+button$/, '')
  if (!target) return null
  let best = null
  for (const button of screenButtons()) {
    const score = fit(target, button.name)
    if (!best || score > best.score) best = { ...button, score }
  }
  if (!best || best.score < 0.75) return null
  best.element.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  best.element.focus?.({ preventScroll: true })
  best.element.click()
  return best.name
}
