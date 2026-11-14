// One check-in, in two steps: fill in the fields, then review and submit.
// The parent gives it a new key after each submit, so the form starts fresh for the next check-in.
// The microphone can fill any field ("heart rate 62", "treadmill", "severity 3"), then "review" and "submit".

import { useEffect, useRef, useState } from 'react'
import { allFields } from '../../data/checkinTypes.js'
import { cleanValues, fieldLabel, missingFields, reviewRows, skippedLabels, startingValues } from '../../lib/checkinForm.js'
import { STATUS } from '../../lib/ui.js'
import { dictateFields } from '../../lib/voiceForm.js'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'
import FormField from './FormField.jsx'

function Section({ section, values, baseline, onChange }) {
  const [open, setOpen] = useState(!section.collapsed)

  return (
    <Card
      title={section.title}
      action={section.optional && <span className="text-sm text-muted">Optional</span>}
    >
      {open ? (
        <div className="space-y-2">
          {section.fields.map((field) => (
            <FormField key={field.key} field={field} value={values[field.key]} baseline={baseline} onChange={(value) => onChange(field.key, value)} />
          ))}
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="text-sm text-muted underline hover:text-ink">
          Add {section.title.toLowerCase()}
        </button>
      )}
    </Card>
  )
}

function Review({ type, values, baseline }) {
  const rows = reviewRows(type, values, baseline)
  const skipped = skippedLabels(type, values)

  return (
    <Card title="Review" tone="white">
      <dl className="divide-y divide-line">
        {rows.map((row) => (
          <div key={row.key} className="flex items-baseline justify-between gap-6 py-3">
            <dt className="text-muted">{row.label}</dt>
            <dd className="flex items-center gap-2 text-right">
              {row.status && row.status !== 'none' && <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS[row.status].bar}`} aria-label={STATUS[row.status].label} />}
              <span className="whitespace-pre-line">{row.text}</span>
            </dd>
          </div>
        ))}
      </dl>
      {skipped.length > 0 && <p className="mt-4 text-sm text-muted">Skipped: {skipped.join(', ')}</p>}
    </Card>
  )
}

export default function CheckInForm({ type, baseline, onSubmit }) {
  const [values, setValues] = useState(() => startingValues(type))
  const [step, setStep] = useState('edit')
  const [problem, setProblem] = useState(null)
  const [voiceNote, setVoiceNote] = useState('')
  const topRef = useRef(null)
  const latest = useRef({ step, values })

  useEffect(() => {
    latest.current = { step, values }
  })

  function update(key, value) {
    setValues((current) => ({ ...current, [key]: value }))
    setProblem(null)
  }

  function goToReview() {
    const missing = missingFields(type, latest.current.values)
    if (missing.length > 0) {
      const names = missing.map(fieldLabel)
      setProblem(names)
      window.dispatchEvent(new CustomEvent('strelka:notice', { detail: { message: `Missing: ${names.join(', ')}` } }))
      document.getElementById(`field-${missing[0].key}`)?.focus()
      return
    }
    setStep('review')
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function submit() {
    onSubmit({ type: type.id, values: cleanValues(latest.current.values) })
  }

  // Voice: spoken readings fill matching fields; "save" reviews, then submits.
  useEffect(() => {
    const fields = allFields(type)

    function onVoice(event) {
      const { values: spoken, symptoms: heard, sentence } = event.detail
      const current = latest.current.values

      // Words like "treadmill", "severity 3", "it hurts in my left knee" or "notes ...".
      const filled = dictateFields(type, sentence, current)

      for (const field of fields) {
        const source = field.indicator ?? field.key
        if (field.kind === 'indicator' && spoken[source] != null) filled[field.key] = spoken[source]
      }
      // Post-exercise: the first heart rate is the one right after exercise, the next one is the recovery.
      if (type.id === 'exercise') {
        if (spoken.exercise != null) filled.duration = spoken.exercise
        if (spoken.hr != null && filled.hrPost == null && filled.hrRecovery == null) {
          filled[current.hrPost == null ? 'hrPost' : 'hrRecovery'] = spoken.hr
        }
        if (spoken.fatigue != null) filled.fatigue = spoken.fatigue
      }

      // Symptoms with their own yes/no buttons (headache, dizziness, trouble breathing) go there first,
      // the rest into the symptom list, or into the single symptom choice of a symptom report.
      let rest = heard
      for (const field of fields.filter((item) => item.kind === 'toggles')) {
        const ids = field.options.map((option) => option.id)
        const matches = heard.filter((id) => ids.includes(id))
        if (matches.length > 0) filled[field.key] = [...new Set([...(current[field.key] ?? []), ...matches])]
        rest = rest.filter((id) => !ids.includes(id))
      }
      const symptomField = fields.find((field) => field.kind === 'symptoms')
      if (symptomField && rest.length > 0) filled[symptomField.key] = [...new Set([...(current[symptomField.key] ?? []), ...rest])]
      if (type.id === 'symptom' && heard.length > 0 && !current.symptom) filled.symptom = heard[0]

      const keys = Object.keys(filled)
      if (keys.length === 0) {
        if (sentence) window.dispatchEvent(new CustomEvent('strelka:notice', { detail: { message: `Didn't catch that: “${sentence}”` } }))
        return
      }

      setValues((latestValues) => ({ ...latestValues, ...filled }))
      setProblem(null)
      if (latest.current.step === 'review') setStep('edit')
      const names = keys.map((key) => fieldLabel(fields.find((field) => field.key === key)))
      setVoiceNote(`Added by voice: ${names.join(', ')}. Say “review” when you're done.`)
      window.dispatchEvent(new CustomEvent('strelka:notice', { detail: { message: `Added: ${names.join(', ')}` } }))
    }

    function onSave() {
      if (latest.current.step === 'edit') goToReview()
      else submit()
    }

    // "cancel" steps back from the review screen. A form being filled in has nothing to cancel.
    function onCancel() {
      const message =
        latest.current.step === 'review' ? 'Back to editing. Nothing was sent.' : 'Nothing to cancel. Say "stop" to turn off the microphone.'
      if (latest.current.step === 'review') setStep('edit')
      window.dispatchEvent(new CustomEvent('strelka:notice', { detail: { message } }))
    }

    window.addEventListener('strelka:voice', onVoice)
    window.addEventListener('strelka:save', onSave)
    window.addEventListener('strelka:cancel', onCancel)
    return () => {
      window.removeEventListener('strelka:voice', onVoice)
      window.removeEventListener('strelka:save', onSave)
      window.removeEventListener('strelka:cancel', onCancel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  return (
    <form
      ref={topRef}
      onSubmit={(event) => {
        event.preventDefault()
        if (step === 'edit') goToReview()
        else submit()
      }}
      className="scroll-mt-6 space-y-4"
    >
      {voiceNote && step === 'edit' && (
        <p role="status" className="fade-in rounded-2xl bg-good-soft px-4 py-3 text-good-dark">
          {voiceNote}
        </p>
      )}

      {step === 'edit' ? (
        type.sections.map((section) => <Section key={section.title} section={section} values={values} baseline={baseline} onChange={update} />)
      ) : (
        <Review type={type} values={values} baseline={baseline} />
      )}

      <div className="space-y-3 pt-2">
        {problem && (
          <div role="alert" className="fade-in rounded-2xl bg-danger-soft px-4 py-3 text-danger">
            <p className="font-semibold">A few fields still need an answer.</p>
            <p className="text-sm">Missing: {problem.join(', ')}</p>
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          {step === 'review' && (
            <Button variant="light" onClick={() => setStep('edit')} className="px-6 py-3.5 text-lg">
              Back to edit
            </Button>
          )}
          <Button type="submit" icon={step === 'review' ? 'check' : undefined} className="px-7 py-3.5 text-lg">
            {step === 'review' ? type.submitLabel : 'Review'}
          </Button>
        </div>
      </div>
    </form>
  )
}
