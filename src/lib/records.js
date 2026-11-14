// Folds one saved check-in (a "record") into that day's summary entry, which the dashboard,
// triage and history read. The record itself is kept too, with its date and time.

import { INDICATOR_BY_ID, SYMPTOM_BY_ID } from '../data/indicators.js'

function union(...lists) {
  return [...new Set(lists.flat().filter(Boolean))]
}

// Copies the readings that were filled in. Empty fields leave the day's earlier value alone.
function copyReadings(entry, values, keys) {
  const next = { ...entry }
  for (const key of keys) {
    if (values[key] != null) next[key] = values[key]
  }
  return next
}

export function mergeRecord(entry, record) {
  const { type, values } = record
  const symptoms = entry.symptoms ?? []

  if (type === 'morning') {
    return copyReadings(entry, values, ['hr', 'sbp', 'dbp', 'spo2', 'resp', 'temp', 'sleep', 'sleepQuality', 'glucose'])
  }

  if (type === 'exercise') {
    return {
      ...entry,
      // Several sessions a day add up to the day's exercise total.
      exercise: (entry.exercise ?? 0) + (values.duration ?? 0),
      hrPost: values.hrPost,
      hrRecovery: values.hrRecovery,
      symptoms: union(symptoms, values.warnings ?? []),
    }
  }

  if (type === 'evening') {
    return {
      ...copyReadings(entry, values, ['hrEvening', 'fatigue', 'stress', 'mood', 'water']),
      symptoms: union(symptoms, values.headDizzy ?? [], values.symptoms ?? []),
    }
  }

  if (type === 'symptom') {
    const id = values.symptom
    const severity = entry.symptomSeverity ?? {}
    return {
      ...entry,
      symptoms: union(symptoms, [id]),
      symptomSeverity: { ...severity, [id]: Math.max(severity[id] ?? 0, values.severity ?? 0) },
    }
  }

  return entry
}

// The readings a record holds, as "Label value unit" for lists like History.
export function recordHighlights(record) {
  const { type, values } = record
  const show = (id, key = id) => {
    const indicator = INDICATOR_BY_ID[id]
    return values[key] != null ? `${indicator.short} ${values[key]}` : null
  }
  if (type === 'morning') return [show('hr'), values.sbp != null ? `BP ${values.sbp}/${values.dbp}` : null, show('spo2')].filter(Boolean).join(' · ')
  if (type === 'exercise') return `${values.duration} min · HR ${values.hrPost} → ${values.hrRecovery}`
  if (type === 'evening') return [show('hr', 'hrEvening'), show('fatigue'), show('stress')].filter(Boolean).join(' · ')
  if (type === 'symptom') return `${SYMPTOM_BY_ID[values.symptom]?.label ?? 'Symptom'} · severity ${values.severity}/5`
  return ''
}
