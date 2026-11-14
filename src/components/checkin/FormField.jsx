// One field of a check-in form, picked by its kind (see data/checkinTypes.js).
// Health readings reuse IndicatorField, so they keep the live status badge and "how to measure" guide.

import { SYMPTOMS } from '../../data/indicators.js'
import { fieldIndicator } from '../../lib/checkinForm.js'
import IndicatorField from './IndicatorField.jsx'

const INPUT = 'rounded-full bg-field px-4 py-2.5 text-lg outline-none focus:ring-2 focus:ring-ink'
const BOX = 'rounded-[20px] bg-field px-4 py-3 outline-none focus:ring-2 focus:ring-ink'

function Chip({ selected, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full border px-4 py-2 transition ${selected ? 'border-ink bg-ink text-white' : 'border-ink/30 bg-white hover:border-ink'}`}
    >
      {children}
    </button>
  )
}

function Row({ field, inputId, children }) {
  return (
    <div className="rounded-[20px] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-40 flex-1">
          <label htmlFor={inputId} className="block">
            {field.label}
            {field.required && <span className="sr-only"> (required)</span>}
          </label>
          {field.hint && <p className="text-sm text-muted">{field.hint}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}

function Stacked({ field, inputId, children }) {
  return (
    <div className="rounded-[20px] bg-white p-4">
      <label htmlFor={inputId} className="block">
        {field.label}
      </label>
      {field.hint && <p className="text-sm text-muted">{field.hint}</p>}
      <div className="mt-3">{children}</div>
    </div>
  )
}

export default function FormField({ field, value, baseline, onChange }) {
  const inputId = `field-${field.key}`

  if (field.kind === 'indicator') {
    const indicator = fieldIndicator(field)
    return <IndicatorField indicator={indicator} value={value ?? null} baselineValue={baseline[field.indicator ?? field.key]} onChange={onChange} />
  }

  if (field.kind === 'number') {
    return (
      <Row field={field} inputId={inputId}>
        <div className="flex items-center gap-2">
          <input
            id={inputId}
            type="number"
            inputMode="numeric"
            min={field.min}
            max={field.max}
            value={value ?? ''}
            onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}
            className={`w-28 text-right tabular-nums ${INPUT}`}
          />
          <span className="w-12 text-sm text-muted">{field.unit}</span>
        </div>
      </Row>
    )
  }

  if (field.kind === 'scale') {
    return (
      <Row field={field} inputId={inputId}>
        <div className="text-center">
          <div className="flex gap-1.5" role="radiogroup" aria-label={field.label} id={inputId} tabIndex={-1}>
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                type="button"
                role="radio"
                aria-checked={value === score}
                aria-label={field.labels[score - 1]}
                onClick={() => onChange(score)}
                className={`h-10 w-10 rounded-full transition ${value === score ? 'bg-ink text-white' : 'bg-field text-muted hover:text-ink'}`}
              >
                {score}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted">{value ? field.labels[value - 1] : 'Not set'}</p>
        </div>
      </Row>
    )
  }

  if (field.kind === 'choice' || field.kind === 'toggles' || field.kind === 'symptoms') {
    const options =
      field.kind === 'symptoms' ? SYMPTOMS.filter((symptom) => !(field.exclude ?? []).includes(symptom.id)) : field.options
    const multi = field.kind !== 'choice'
    const selected = multi ? (value ?? []) : value

    function toggle(id) {
      if (!multi) return onChange(id)
      onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id])
    }

    return (
      <Stacked field={field} inputId={inputId}>
        <div className="flex flex-wrap gap-2" id={inputId} tabIndex={-1}>
          {options.map((option) => (
            <Chip key={option.id} selected={multi ? selected.includes(option.id) : selected === option.id} onClick={() => toggle(option.id)}>
              {option.label}
            </Chip>
          ))}
        </div>
      </Stacked>
    )
  }

  if (field.kind === 'datetime') {
    return (
      <Row field={field} inputId={inputId}>
        <input id={inputId} type="datetime-local" value={value ?? ''} onChange={(event) => onChange(event.target.value || null)} className={INPUT} />
      </Row>
    )
  }

  if (field.kind === 'text') {
    return (
      <Stacked field={field} inputId={inputId}>
        <input
          id={inputId}
          type="text"
          value={value ?? ''}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value || null)}
          className={`w-full ${INPUT}`}
        />
      </Stacked>
    )
  }

  if (field.kind === 'textarea') {
    return (
      <Stacked field={field} inputId={inputId}>
        <textarea
          id={inputId}
          rows={3}
          value={value ?? ''}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value || null)}
          className={`w-full resize-y ${BOX}`}
        />
      </Stacked>
    )
  }

  return null
}
