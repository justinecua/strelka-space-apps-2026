// Strelka's own voice: reads simulation questions aloud with the browser's built-in speech.
// While it talks (and a moment after), the microphone ignores what it hears, so Strelka never answers itself.

const AFTER_MS = 600
let quietAt = 0

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null

export function canSpeak() {
  return Boolean(synth)
}

export function speak(text) {
  if (!synth || !text) return
  synth.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 1
  // A guess at how long it takes, in case the browser never reports the end.
  quietAt = Date.now() + text.length * 75 + 1200
  utterance.onend = () => {
    quietAt = Date.now() + AFTER_MS
  }
  utterance.onerror = utterance.onend
  synth.speak(utterance)
}

export function stopSpeaking() {
  synth?.cancel()
  quietAt = 0
}

// True while Strelka is talking, or just finished.
export function isSpeaking() {
  return Date.now() < quietAt
}
