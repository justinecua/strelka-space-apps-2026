// One check-in, in two steps: fill in the fields, then review and submit.
// The parent gives it a new key after each submit, so the form starts fresh for the next check-in.
// The microphone can fill any field ("heart rate 62", "treadmill", "severity 3"), then "review" and "submit".
// In simulation mode Strelka asks one question at a time, out loud, and moves on once it is answered
// (by voice or by hand). "next", "skip", "previous question" and "repeat" move between questions.

import { useEffect, useRef, useState } from 'react'
import { questionFor } from '../../data/checkinQuestions.js'
import { allFields } from '../../data/checkinTypes.js'
import { answerFor, isNone } from '../../lib/guidedAnswer.js'
import { speak, stopSpeaking } from '../../lib/speech.js'
import { cleanValues, fieldIndicator, fieldLabel, missingFields, reviewRows, skippedLabels, startingValues } from '../../lib/checkinForm.js'
import { STATUS } from '../../lib/ui.js'
import { dictateFields } from '../../lib/voiceForm.js'
import { useVoiceEvent } from '../../lib/voiceEvents.js'
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

function isEmpty(value) {
  return value == null || value === '' || (Array.isArray(value) && value.length === 0)
}

// The questions of a simulation: every field, in order, except sections that start folded away (the
// symptom report's optional vital signs), which stay on the review screen's edit view.
function guidedQuestions(type) {
  return type.sections
    .filter((section) => !section.collapsed)
    .flatMap((section) => section.fields.map((field) => ({ field, section: section.title, optional: Boolean(section.optional) })))
}

// Moves on by itself after these are picked by hand: one tap is the whole answer.
function isOneTap(field) {
  return field.kind === 'choice' || field.kind === 'scale' || (field.kind === 'indicator' && Boolean(fieldIndicator(field).scaleLabels))
}

// One question at a time. The Next button submits the form, which moves to the next question.
function Guided({ type, questions, index, values, baseline, onChange, onBack, onRepeat }) {
  const { field, section, optional } = questions[index]
  const label = fieldLabel(field)
  const last = index === questions.length - 1
  const canSkip = optional || !field.required

  return (
    <div className="space-y-4">
      <Card tone="white">
        <div className="flex items-center justify-between gap-3 text-sm text-muted">
          <span>
            Question {index + 1} of {questions.length} · {section}
          </span>
          <button type="button" onClick={onRepeat} className="rounded-full px-3 py-1 underline-offset-2 hover:bg-field hover:text-ink">
            Repeat question
          </button>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-field">
          <div className="h-full rounded-full bg-ink transition-all duration-500" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
        </div>
        <p key={field.key} className="fade-in mt-6 text-2xl leading-snug sm:text-3xl" aria-live="polite">
          {questionFor(type, field, label)}
        </p>
        <div className="mt-5 rounded-[24px] bg-field p-2">
          <FormField key={field.key} field={field} value={values[field.key]} baseline={baseline} onChange={(value) => onChange(field.key, value)} />
        </div>
        <p className="mt-4 text-sm text-muted">
          Answer out loud or tap. Say “{canSkip ? 'skip' : 'next'}” to move on, “previous question” to go back.
        </p>
      </Card>
      <div className="flex flex-wrap justify-end gap-2">
        {index > 0 && (
          <Button variant="light" onClick={onBack} className="px-6 py-3.5 text-lg">
            Back
          </Button>
        )}
        <Button type="submit" className="px-7 py-3.5 text-lg">
          {last ? 'Review' : isEmpty(values[field.key]) && canSkip ? 'Skip' : 'Next'}
        </Button>
      </div>
    </div>
  )
}

export default function CheckInForm({ type, baseline, onSubmit, guided = false }) {
  const [values, setValues] = useState(() => startingValues(type))
  const [step, setStep] = useState('edit')
  const [problem, setProblem] = useState(null)
  const [voiceNote, setVoiceNote] = useState('')
  const [question, setQuestion] = useState(0)
  const topRef = useRef(null)
  const questions = guidedQuestions(type)
  const latest = useRef({ step, values, question, guided })

  useEffect(() => {
    latest.current = { step, values, question, guided }
  })

  // Simulation: Strelka asks each question aloud as it comes up, and shows it in the voice bar.
  useEffect(() => {
    if (!guided || step !== 'edit') return undefined
    const { field } = questions[Math.min(question, questions.length - 1)]
    const text = questionFor(type, field, fieldLabel(field))
    speak(text)
    window.dispatchEvent(new CustomEvent('strelka:notice', { detail: { message: text } }))
    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guided, step, question, type])

  useEffect(() => () => stopSpeaking(), [])
  useEffect(() => {
    if (!guided) stopSpeaking()
  }, [guided])

  // The next question after this one that still has no answer; past the last one, the review.
  function advance(fromValues = latest.current.values) {
    const from = latest.current.question
    const next = questions.findIndex((item, index) => index > from && isEmpty(fromValues[item.field.key]))
    if (next >= 0) setQuestion(next)
    else goToReview(fromValues)
  }

  function nextQuestion() {
    const from = latest.current.question
    if (from >= questions.length - 1) goToReview()
    else setQuestion(from + 1)
  }

  function previousQuestion() {
    if (latest.current.step === 'review') {
      setStep('edit')
      setQuestion(questions.length - 1)
      return
    }
    setQuestion(Math.max(0, latest.current.question - 1))
  }

  function repeatQuestion() {
    const { field } = questions[latest.current.question]
    speak(questionFor(type, field, fieldLabel(field)))
  }

  // Voice: "next", "skip", "previous question", "repeat". Only while a simulation is running.
  useVoiceEvent('guide', ({ action }) => {
    if (!latest.current.guided) return false
    if (action === 'next') {
      if (latest.current.step === 'review') return false
      nextQuestion()
    } else if (action === 'previous') previousQuestion()
    else if (action === 'repeat') {
      if (latest.current.step === 'review') speak('Check your answers. Say submit to send them.')
      else repeatQuestion()
    }
    return true
  })

  // "no" to "Did you have a headache or dizziness?": nothing to add, next question.
  useVoiceEvent('answer', ({ yes }) => {
    if (!latest.current.guided || latest.current.step !== 'edit') return false
    if (yes) {
      speak('Which one? Say its name.')
      return true
    }
    nextQuestion()
    return true
  })

  // "clear the form" by voice: start this check-in again from empty.
  useVoiceEvent('clear-form', () => {
    setValues(startingValues(type))
    setStep('edit')
    setProblem(null)
    setVoiceNote('')
    setQuestion(0)
  })

  function update(key, value) {
    setValues((current) => ({ ...current, [key]: value }))
    setProblem(null)
    // Simulation: one tap answers a scale or a choice, so move on after a moment.
    const current = questions[latest.current.question]
    if (guided && current?.field.key === key && isOneTap(current.field) && value != null) {
      setTimeout(() => advance({ ...latest.current.values, [key]: value }), 500)
    }
  }

  function goToReview(fromValues = latest.current.values) {
    const missing = missingFields(type, fromValues)
    if (missing.length > 0) {
      const names = missing.map(fieldLabel)
      setProblem(names)
      window.dispatchEvent(new CustomEvent('strelka:notice', { detail: { message: `Missing: ${names.join(', ')}` } }))
      if (latest.current.guided) {
        // Back to the first unanswered question, asked again.
        const index = questions.findIndex((item) => item.field.key === missing[0].key)
        if (index >= 0) setQuestion(index)
        if (index === latest.current.question) repeatQuestion()
        speak(`I still need your ${names[0].toLowerCase()}.`)
      } else {
        document.getElementById(`field-${missing[0].key}`)?.focus()
      }
      return
    }
    setStep('review')
    if (latest.current.guided) {
      speak('That is everything. Check your answers, then say submit to send them.')
      window.dispatchEvent(new CustomEvent('strelka:notice', { detail: { message: 'Check your answers, then say “submit”.' } }))
    }
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
      const asked = latest.current.guided && latest.current.step === 'edit' ? questions[latest.current.question]?.field : null

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

      // Simulation: a short answer to the question on screen ("62", "seven hours", "very tired", "none").
      if (asked && sentence && !(asked.key in filled)) {
        if (isNone(sentence) && asked.kind !== 'text' && asked.kind !== 'textarea') {
          advance()
          return
        }
        Object.assign(filled, answerFor(asked, sentence))
      }

      const keys = Object.keys(filled)
      if (keys.length === 0) {
        if (asked && sentence) {
          speak(`Sorry, I didn't get that. ${questionFor(type, asked, fieldLabel(asked))}`)
          window.dispatchEvent(new CustomEvent('strelka:notice', { detail: { message: `Didn't catch that: “${sentence}”` } }))
          return
        }
        if (sentence) window.dispatchEvent(new CustomEvent('strelka:notice', { detail: { message: `Didn't catch that: “${sentence}”` } }))
        return
      }

      setValues((latestValues) => ({ ...latestValues, ...filled }))
      setProblem(null)
      if (asked && asked.key in filled) {
        // Answered: on to the next question that still needs one.
        const after = { ...current, ...filled }
        setTimeout(() => advance(after), 400)
      }
      if (latest.current.step === 'review') {
        setStep('edit')
        if (latest.current.guided) {
          const index = questions.findIndex((item) => item.field.key in filled)
          if (index >= 0) setQuestion(index)
        }
      }
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
        if (step === 'edit' && guided) nextQuestion()
        else if (step === 'edit') goToReview()
        else submit()
      }}
      className="scroll-mt-6 space-y-4"
    >
      {voiceNote && step === 'edit' && !guided && (
        <p role="status" className="fade-in rounded-2xl bg-good-soft px-4 py-3 text-good-dark">
          {voiceNote}
        </p>
      )}

      {step === 'edit' && guided ? (
        <Guided
          type={type}
          questions={questions}
          index={Math.min(question, questions.length - 1)}
          values={values}
          baseline={baseline}
          onChange={update}
          onBack={previousQuestion}
          onRepeat={repeatQuestion}
        />
      ) : step === 'edit' ? (
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
        <div className={`flex flex-wrap justify-end gap-2 ${step === 'edit' && guided ? 'hidden' : ''}`}>
          {step === 'review' && (
            <Button variant="light" onClick={guided ? previousQuestion : () => setStep('edit')} className="px-6 py-3.5 text-lg">
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
