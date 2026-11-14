// Turns a spoken sentence into an app command: open a tab, save the check-in, or stop listening.
// Returns null when the sentence is not a command (it may be a health reading instead).
// Plain text in, plain object out, so it is easy to test.

const TAB_WORDS = {
  today: /\b(today|dashboard|home)\b/,
  checkin: /check[\s-]?in/,
  body: /\bbody\b/,
  history: /\bhistory\b/,
}

const GO_WORDS = /\b(go to|go|open|show|take me to|navigate to|switch to|back to)\b/

export function parseCommand(spoken) {
  const text = (spoken ?? '')
    .toLowerCase()
    .replace(/[.,!?]/g, ' ')
    .replace(/\b(?:hey|ok|okay)\s+strelka\b|\bstrelka\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (/^(stop|stop listening|turn off|close|cancel)$/.test(text)) return { type: 'stop' }

  // "save" counts only at the end, so it can follow a reading: "mood 4, save check-in".
  if (/\b(save|submit)( (my|the))?( check[\s-]?in| form| it)?$/.test(text)) return { type: 'save' }

  if (/^(please )?(start|begin|do|new|open)( (my|a|the|new))? check[\s-]?in$/.test(text)) {
    return { type: 'navigate', tab: 'checkin' }
  }

  if (GO_WORDS.test(text)) {
    for (const [tab, pattern] of Object.entries(TAB_WORDS)) {
      if (pattern.test(text)) return { type: 'navigate', tab }
    }
  }

  return null
}