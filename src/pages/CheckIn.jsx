import { useState } from 'react'
import { CHECKIN_GROUPS, INDICATOR_BY_ID } from '../data/indicators.js'
import { dayNumberFor, hasCheckedInToday } from '../lib/entries.js'
import IndicatorField from '../components/checkin/IndicatorField.jsx'
import SymptomPicker from '../components/checkin/SymptomPicker.jsx'
import StepHeader from '../components/setup/StepHeader.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'

function introText(isFirst, alreadyToday, editing) {
  if (editing) return 'Changes here update your history, charts and today\'s result.'
  if (isFirst) return 'Measure what you can and type it in. Leave a field empty if you skipped it.'
  if (alreadyToday) return "You already checked in today. Saving will update today's entry."
  return "Takes about 2 minutes. We've filled in your usual numbers, so just change what you measured."
}

// editing = { day, loggedOn } when fixing or adding a past day from History; null for today's check-in.
export default function CheckIn({ state, editing, onSubmit, onCancel }) {
  const lastEntry = state.entries.at(-1)
  const isFirst = state.entries.length === 0
  const alreadyToday = hasCheckedInToday(state.entries)
  const pastEntry = editing && state.entries.find((entry) => entry.day === editing.day)
  const day = editing ? editing.day : dayNumberFor(state.profile, state.entries)

  // The form starts from the check-in being edited; a new one starts from your usual numbers (empty at first).
  const startFrom = editing ? pastEntry : alreadyToday ? lastEntry : null
  const [values, setValues] = useState(startFrom ? { ...startFrom } : { ...state.baseline })
  const [symptoms, setSymptoms] = useState(startFrom?.symptoms ?? [])

  function updateValue(id, value) {
    setValues({ ...values, [id]: value })
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
    onSubmit({ ...values, symptoms })
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-5xl space-y-4">
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

      <div className="sticky bottom-4 flex justify-end gap-2">
        {editing && (
          <Button variant="light" onClick={onCancel} className="px-6 py-3.5 text-lg shadow-lg">
            Cancel
          </Button>
        )}
        <Button type="submit" icon="check" className="px-7 py-3.5 text-lg shadow-lg">
          {editing || alreadyToday ? 'Save changes' : 'Save check-in'}
        </Button>
      </div>
    </form>
  )
}
