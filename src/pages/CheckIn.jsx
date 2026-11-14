import { useEffect, useRef, useState } from 'react'
import { CHECKIN_GROUPS, INDICATOR_BY_ID, SYMPTOM_BY_ID } from '../data/indicators.js'
import { dayNumberFor, hasCheckedInToday } from '../lib/entries.js'
import IndicatorField from '../components/checkin/IndicatorField.jsx'
import SymptomPicker from '../components/checkin/SymptomPicker.jsx'
import StepHeader from '../components/setup/StepHeader.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'

// Every reading field must be filled before a check-in can be saved. Symptoms are optional.
const FIELD_IDS = CHECKIN_GROUPS.flatMap((group) => group.ids)

function introText(isFirst, alreadyToday, editing) {
  if (editing) return 'Changes here update your history, charts and today\'s result.'
  if (isFirst) return 'Measure everything and fill in every field. Symptoms are optional.'
  if (alreadyToday) return "You already checked in today. Saving will update today's entry."
  return 'Takes about 2 minutes. Fill in every field. Your usual numbers are shown in grey as a guide.'
}

// editing = { day, loggedOn } when fixing or adding a past day from History; null for today's check-in.
export default function CheckIn({ state, editing, onSubmit, onCancel }) {
  const lastEntry = state.entries.at(-1)
  const isFirst = state.entries.length === 0
  const alreadyToday = hasCheckedInToday(state.entries)
  const pastEntry = editing && state.entries.find((entry) => entry.day === editing.day)
  const day = editing ? editing.day : dayNumberFor(state.profile, state.entries)

  // The form starts from the check-in being edited. A new check-in starts empty, so a skipped
  // measurement can never be saved as a "usual" number by accident.
  const startFrom = editing ? pastEntry : alreadyToday ? lastEntry : null
  const [values, setValues] = useState(startFrom ? { ...startFrom } : {})
  const [symptoms, setSymptoms] = useState(startFrom?.symptoms ?? [])
  const [voiceNote, setVoiceNote] = useState('')
  const [problem, setProblem] = useState(null)
  const formRef = useRef(null)

  // The floating microphone (VoiceAssistant) sends what it hears and the "save" command as window events.
  useEffect(() => {
    function onVoice(event) {
      const { values: spoken, symptoms: heard } = event.detail
      setValues((current) => ({ ...current, ...spoken }))
      setSymptoms((current) => [...new Set([...current, ...heard])])
      setProblem(null)

      const names = [
        ...Object.keys(spoken).map((id) => INDICATOR_BY_ID[id]?.label),
        ...heard.map((id) => SYMPTOM_BY_ID[id]?.label),
      ].filter(Boolean)
      if (names.length > 0) setVoiceNote(`Added by voice: ${names.join(', ')}`)
    }

    // Saving by voice goes through the same checks as the Save button.
    function onSave() {
      formRef.current?.requestSubmit()
    }

    window.addEventListener('strelka:voice', onVoice)
    window.addEventListener('strelka:save', onSave)
    return () => {
      window.removeEventListener('strelka:voice', onVoice)
      window.removeEventListener('strelka:save', onSave)
    }
  }, [])

  function updateValue(id, value) {
    setValues({ ...values, [id]: value })
    setProblem(null)
  }

  function toggleSymptom(id) {
    if (symptoms.includes(id)) {
      setSymptoms(symptoms.filter((symptomId) => symptomId !== id))
    } else {
      setSymptoms([...symptoms, id])
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    const missing = FIELD_IDS.filter((id) => values[id] == null)

    if (missing.length > 0) {
      const names = missing.map((id) => INDICATOR_BY_ID[id].label)
      setProblem({ names })
      // Tells the floating microphone panel too, so a hands-free astronaut hears about it on screen.
      window.dispatchEvent(new CustomEvent('strelka:notice', { detail: { message: `Fill in every field first. Missing: ${names.join(', ')}` } }))
      document.getElementById(`field-${missing[0]}`)?.focus()
      return
    }

    setProblem(null)
    onSubmit({ ...values, symptoms })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mx-auto max-w-5xl space-y-4">
      {isFirst && !editing ? (
        <StepHeader step={3} title="Your first check-in" text={introText(isFirst, alreadyToday)} />
      ) : (
        <div>
          <h1 className="text-5xl sm:text-6xl">
            {editing ? (pastEntry ? 'Edit' : 'Add') : 'Check-in'} · day {day}
          </h1>
          <p className="mt-2 text-muted">{introText(isFirst, alreadyToday, editing)}</p>
        </div>
      )}

      {voiceNote && (
        <p role="status" className="fade-in rounded-2xl bg-good-soft px-4 py-3 text-good-dark">
          {voiceNote}. Please check the numbers below, then say “save check-in”.
        </p>
      )}

      {CHECKIN_GROUPS.map((group) => (
        <Card key={group.title} title={group.title}>
          <div className="space-y-2">
            {group.ids.map((id) => (
              <IndicatorField
                key={id}
                indicator={INDICATOR_BY_ID[id]}
                value={values[id] ?? null}
                baselineValue={state.baseline[id]}
                onChange={(value) => updateValue(id, value)}
              />
            ))}
          </div>
        </Card>
      ))}

      <Card title="Symptoms">
        <SymptomPicker selectedIds={symptoms} onToggle={toggleSymptom} />
      </Card>

      <div className="sticky bottom-4 space-y-2 pl-20">
        {problem && (
          <div role="alert" className="fade-in rounded-2xl bg-danger-soft px-4 py-3 text-danger shadow-lg">
            <p className="font-semibold">Please fill up all the fields first before checking in, astronaut.</p>
            <p className="text-sm">Missing: {problem.names.join(', ')}</p>
          </div>
        )}
        <div className="flex justify-end gap-2">
          {editing && (
            <Button variant="light" onClick={onCancel} className="px-6 py-3.5 text-lg shadow-lg">
              Cancel
            </Button>
          )}
          <Button type="submit" icon="check" className="px-7 py-3.5 text-lg shadow-lg">
            {editing || alreadyToday ? 'Save changes' : 'Save check-in'}
          </Button>
        </div>
      </div>
    </form>
  )
}