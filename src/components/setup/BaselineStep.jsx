// Choose how the app learns what is normal for you: type in pre-flight numbers, or learn from the first 7 check-ins.

import { useState } from 'react'
import { CHECKIN_GROUPS, INDICATOR_BY_ID } from '../../data/indicators.js'
import { CALIBRATION_DAYS } from '../../lib/baseline.js'
import IndicatorField from '../checkin/IndicatorField.jsx'
import Button from '../ui/Button.jsx'
import StepHeader from './StepHeader.jsx'

function OptionCard({ selected, title, text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-[24px] border-2 p-5 text-left transition ${selected ? 'border-ink bg-mint' : 'border-transparent bg-field hover:bg-mint'}`}
    >
      <span className="block text-lg">{title}</span>
      <span className="block text-sm text-muted">{text}</span>
    </button>
  )
}

export default function BaselineStep({ onBack, onNext }) {
  const [source, setSource] = useState('calibrate')
  const [values, setValues] = useState({})

  function handleSubmit(event) {
    event.preventDefault()
    onNext({ baselineSource: source, baseline: source === 'entered' ? values : {} })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <StepHeader
        step={2}
        title="Your normal"
        text="Strelka compares every reading with what's normal for you, not a textbook average."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <OptionCard
          selected={source === 'calibrate'}
          onClick={() => setSource('calibrate')}
          title={`Learn it from my first ${CALIBRATION_DAYS} check-ins`}
          text="Easiest. Until then, we'll use general healthy ranges."
        />
        <OptionCard
          selected={source === 'entered'}
          onClick={() => setSource('entered')}
          title="I have my pre-flight numbers"
          text="Type in the values from your pre-flight medical checks."
        />
      </div>

      {source === 'entered' && (
        <div className="space-y-2 rounded-[28px] bg-field p-4">
          <p className="px-2 text-sm text-muted">Leave a field empty if you don't have that number.</p>
          {CHECKIN_GROUPS.flatMap((group) => group.ids).map((id) => (
            <IndicatorField
              key={id}
              indicator={INDICATOR_BY_ID[id]}
              value={values[id] ?? null}
              onChange={(value) => setValues({ ...values, [id]: value })}
            />
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="underline">
          Back
        </button>
        <Button type="submit">Next: first check-in</Button>
      </div>
    </form>
  )
}
