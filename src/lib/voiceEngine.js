// On-device speech recognition with Vosk (small US English model, about 41 MB). Audio never leaves the device and it works offline,
// in every modern browser and in the desktop app.
//
// The microphone feeds small chunks of sound (about 40 ms each) to a Vosk recognizer running in a
// background worker. It reports words as they are heard ("partial") and the whole sentence after a
// short pause ("final"). An optional word list (grammar) limits what it listens for, which makes
// commands faster and more accurate; without it, it can take down any words (for notes).

const MODEL_URL = `${import.meta.env.BASE_URL}models/vosk-model-small-en-us-0.15.tar.gz`
const CHUNK_FRAMES = 2048

let modelPromise = null

// The model is loaded once per page and shared. The library is only downloaded when voice is used.
function loadModel() {
  if (!modelPromise) {
    modelPromise = import('vosk-browser')
      .then(({ createModel }) => createModel(new URL(MODEL_URL, window.location.href).href, -1))
      .catch((error) => {
        modelPromise = null
        throw error
      })
  }
  return modelPromise
}

export function isVoiceSupported() {
  return (
    typeof window !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    Boolean(window.AudioContext || window.webkitAudioContext) &&
    typeof Worker !== 'undefined' &&
    typeof WebAssembly !== 'undefined'
  )
}

// Vosk marks words it couldn't place with [unk]; drop them.
function cleanText(text) {
  return (text ?? '').replace(/\[unk\]/g, ' ').replace(/\s+/g, ' ').trim()
}

// handlers: onPartial(text, raw), onFinal(text, confidence 0–1, raw), onError(code), onStateChange('loading' | 'listening' | 'waiting-for-tap')
// raw is the text as heard, with "[unk]" (an unknown word) still in it: the voice assistant needs to know what came first.
export function createVoiceEngine(handlers) {
  let stream = null
  let audioContext = null
  let source = null
  let processor = null
  let model = null
  let recognizer = null
  let grammar = null
  let stopped = false
  let lastPartial = ''
  let resumeOnGesture = null

  function makeRecognizer() {
    if (!model || !audioContext) return
    recognizer?.remove()
    recognizer = grammar
      ? new model.KaldiRecognizer(audioContext.sampleRate, JSON.stringify(grammar))
      : new model.KaldiRecognizer(audioContext.sampleRate)
    recognizer.on('partialresult', (message) => {
      const raw = (message.result.partial ?? '').trim()
      const text = cleanText(raw)
      if (text && text !== lastPartial) {
        lastPartial = text
        handlers.onPartial?.(text, raw)
      }
    })
    recognizer.setWords(true)
    recognizer.on('result', (message) => {
      lastPartial = ''
      const text = cleanText(message.result.text)
      if (!text) return
      // How sure the engine is, from 0 to 1: the average over the words it recognised.
      const words = (message.result.result ?? []).filter((word) => word.word !== '[unk]')
      const confidence = words.length ? words.reduce((sum, word) => sum + word.conf, 0) / words.length : 1
      handlers.onFinal?.(text, confidence, (message.result.text ?? '').trim())
    })
  }

  // Browsers keep sound paused until the person has clicked or pressed a key on the page once.
  function waitForGesture() {
    handlers.onStateChange?.('waiting-for-tap')
    resumeOnGesture = () => {
      audioContext?.resume().then(() => handlers.onStateChange?.('listening'))
      stopWaitingForGesture()
    }
    window.addEventListener('pointerdown', resumeOnGesture, { once: true })
    window.addEventListener('keydown', resumeOnGesture, { once: true })
  }

  function stopWaitingForGesture() {
    if (!resumeOnGesture) return
    window.removeEventListener('pointerdown', resumeOnGesture)
    window.removeEventListener('keydown', resumeOnGesture)
    resumeOnGesture = null
  }

  async function start() {
    stopped = false
    handlers.onStateChange?.('loading')
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
    } catch (error) {
      handlers.onError?.(error?.name === 'NotFoundError' ? 'no-microphone' : 'not-allowed')
      return
    }
    if (stopped) return stop()

    try {
      model = await loadModel()
    } catch {
      handlers.onError?.('model')
      return stop()
    }
    if (stopped) return stop()

    const Context = window.AudioContext || window.webkitAudioContext
    audioContext = new Context()
    makeRecognizer()

    source = audioContext.createMediaStreamSource(stream)
    processor = audioContext.createScriptProcessor(CHUNK_FRAMES, 1, 1)
    processor.onaudioprocess = (event) => {
      if (!stopped && recognizer) recognizer.acceptWaveform(event.inputBuffer)
    }
    source.connect(processor)
    // The processor only runs while connected to the output. It writes silence, so nothing is heard.
    processor.connect(audioContext.destination)

    // The microphone was unplugged or switched off.
    stream.getAudioTracks().forEach((track) => {
      track.onended = () => !stopped && handlers.onError?.('no-microphone')
    })

    if (audioContext.state === 'suspended') {
      await audioContext.resume().catch(() => {})
    }
    if (audioContext.state === 'suspended') waitForGesture()
    else handlers.onStateChange?.('listening')
  }

  // A list of words to listen for, or null for any words. Switching keeps the microphone open.
  function setGrammar(words) {
    const next = words ? [...words, '[unk]'] : null
    if (JSON.stringify(next) === JSON.stringify(grammar)) return
    grammar = next
    makeRecognizer()
  }

  function stop() {
    stopped = true
    stopWaitingForGesture()
    try {
      processor?.disconnect()
      source?.disconnect()
    } catch {
      // Already disconnected.
    }
    stream?.getTracks().forEach((track) => track.stop())
    audioContext?.close().catch(() => {})
    recognizer?.remove()
    processor = source = stream = audioContext = recognizer = null
  }

  return { start, stop, setGrammar }
}
