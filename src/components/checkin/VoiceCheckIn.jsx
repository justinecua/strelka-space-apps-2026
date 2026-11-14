// Lets the astronaut say their check-in out loud (or type/paste it). While "Fill the form as I speak" is on,
// every number and symptom heard goes straight into the fields below. The astronaut checks the fields
// and presses Save, so nothing is stored until they confirm.

import { useEffect, useRef, useState } from 'react'
import { INDICATOR_BY_ID, SYMPTOM_BY_ID } from '../../data/indicators.js'
import { parseVoice } from '../../lib/voiceParser.js'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'

const Recognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

function isImpossible(indicator, value) {
  return (indicator.validMin != null && value < indicator.validMin) || (indicator.validMax != null && value > indicator.validMax)
}

export default function VoiceCheckIn({ onApply }) {
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const [auto, setAuto] = useState(true)
  const recognition = useRef(null)
  // What has already been sent to the form, so the same number is not sent twice and manual edits are kept.
  const applied = useRef({ values: {}, symptoms: [] })
  // The speech engine keeps its first callbacks, so it reads the newest props and settings from here.
  const latest = useRef({ onApply, auto })

  useEffect(() => {
    latest.current = { onApply, auto }
  })
  useEffect(() => () => recognition.current?.abort(), [])

  const parsed = parseVoice(text)
  const rows = Object.entries(parsed.values).map(([id, value]) => ({ indicator: INDICATOR_BY_ID[id], value }))
  const goodRows = rows.filter((row) => row.indicator && !isImpossible(row.indicator, row.value))

  // Sends only the numbers and symptoms that are new or changed since the last send.
  function sendToForm(fullText) {
    const heard = parseVoice(fullText)
    const values = {}
    for (const [id, value] of Object.entries(heard.values)) {
      const indicator = INDICATOR_BY_ID[id]
      if (indicator && !isImpossible(indicator, value) && applied.current.values[id] !== value) {
        values[id] = value
        applied.current.values[id] = value
      }
    }
    const symptoms = heard.symptoms.filter((id) => !applied.current.symptoms.includes(id))
    applied.current.symptoms.push(...symptoms)
    if (Object.keys(values).length > 0 || symptoms.length > 0) latest.current.onApply({ values, symptoms })
  }

  function handleText(fullText) {
    setText(fullText)
    if (latest.current.auto) sendToForm(fullText)
  }

  function startListening() {
    setError('')
    applied.current = { values: {}, symptoms: [] }
    const rec = new Recognition()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (event) => handleText(Array.from(event.results).map((result) => result[0].transcript).join(' '))
    rec.onerror = (event) => {
      setError(event.error === 'not-allowed' ? 'Microphone is blocked. Allow it in the browser, or type below.' : 'Could not hear you. Try again or type below.')
      setListening(false)
    }
    rec.onend = () => setListening(false)
    rec.start()
    recognition.current = rec
    setListening(true)
  }

  function stopListening() {
    recognition.current?.stop()
  }

  function applyManually() {
    const values = Object.fromEntries(goodRows.map((row) => [row.indicator.id, row.value]))
    onApply({ values, symptoms: parsed.symptoms })
    setText('')
  }

  return (
    <Card title="Say it out loud" tone="mint">
      <p className="text-muted">
        Try: “Heart rate 62, blood pressure 120 over 80, oxygen 98, I slept 7 hours, mood 4, no headache.”
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        {Recognition ? (
          <Button onClick={listening ? stopListening : startListening} variant={listening ? 'light' : undefined}>
            {listening ? 'Stop listening' : 'Start speaking'}
          </Button>
        ) : (
          <p className="text-sm text-muted">Voice is not supported in this browser. Type your check-in below instead.</p>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={auto} onChange={(event) => setAuto(event.target.checked)} className="h-5 w-5 accent-current" />
          Fill the form as I speak
        </label>
      </div>

      {listening && (
        <p className="mt-3 text-sm text-good-dark" role="status">
          Listening… say the name, then the number.
        </p>
      )}
      {error && (
        <p className="mt-3 text-danger" role="alert">
          {error}
        </p>
      )}

      <label htmlFor="voice-text" className="mt-4 block text-sm text-muted">
        What we heard (you can edit it)
      </label>
      <textarea
        id="voice-text"
        value={text}
        onChange={(event) => handleText(event.target.value)}
        rows={3}
        aria-live="polite"
        className="mt-1 w-full rounded-2xl bg-field p-3"
      />

      {parsed.found > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-muted">
            {auto ? 'Added to the form below. Please check each number, then save.' : 'Please check these before using them:'}
          </p>
          <ul className="space-y-1">
            {rows.map(({ indicator, value }) => {
              const bad = !indicator || isImpossible(indicator, value)
              return (
                <li key={indicator?.id} className={`flex justify-between rounded-2xl px-4 py-2 ${bad ? 'bg-danger-soft text-danger' : 'bg-field'}`}>
                  <span>{indicator?.label}</span>
                  <span>
                    {value} {indicator?.unit} {bad ? '· looks wrong, not used' : auto ? '✓' : ''}
                  </span>
                </li>
              )
            })}
            {parsed.symptoms.map((id) => (
              <li key={id} className="flex justify-between rounded-2xl bg-watch-soft px-4 py-2 text-watch-text">
                <span>Symptom</span>
                <span>
                  {SYMPTOM_BY_ID[id]?.label ?? id} {auto && '✓'}
                </span>
              </li>
            ))}
          </ul>
          {!auto && (
            <Button onClick={applyManually} disabled={goodRows.length === 0 && parsed.symptoms.length === 0}>
              Use these numbers
            </Button>
          )}
        </div>
      )}

      {text.trim() && parsed.found === 0 && <p className="mt-3 text-muted">We did not catch any numbers yet. Say the name, then the number.</p>}
    </Card>
  )
}