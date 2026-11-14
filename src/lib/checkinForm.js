// Helpers for the check-in forms: starting values, what is still missing, and how to show each answer on the review screen.

import { INDICATOR_BY_ID, SYMPTOM_BY_ID } from '../data/indicators.js'
import { allFields } from '../data/checkinTypes.js'
import { statusOf } from './status.js'

// The reading behind an "indicator" field, renamed when the form uses its own label (e.g. "Overall condition").
export function fieldIndicator(field) {
  const base = INDICATOR_BY_ID[field.indicator ?? field.key]
  return { ...base, id: field.key, label: field.label ?? base.label }
}

export function fieldLabel(field) {
  return field.kind === 'indicator' ? fieldIndicator(field).label : field.label
}

function localDateTime(date = new Date()) {
  const pad = (number) => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function startingValues(type) {
  const values = {}
  for (const field of allFields(type)) {
    if (field.defaultNow) values[field.key] = localDateTime()
  }
  return values
}

function isEmpty(value) {
  return value == null || value === '' || (Array.isArray(value) && value.length === 0)
}

function isRequired(field, values) {
  if (field.required) return true
  if (!field.requiredIf) return false
  return Object.entries(field.requiredIf).every(([key, wanted]) => values[key] === wanted)
}

export function missingFields(type, values) {
  return allFields(type).filter((field) => isRequired(field, values) && isEmpty(values[field.key]))
}

// Drops empty answers so the saved record only holds what was filled in.
export function cleanValues(values) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => !isEmpty(value)))
}

function formatAnswer(field, value) {
  if (field.kind === 'indicator') {
    const indicator = fieldIndicator(field)
    if (indicator.scaleLabels) return `${value} · ${indicator.scaleLabels[value - 1]}`
    if (indicator.inputType === 'duration') return `${Math.floor(value / 60)} h ${value % 60} min`
    return `${value} ${indicator.unit}`
  }
  if (field.kind === 'number') return `${value} ${field.unit}`
  if (field.kind === 'scale') return `${value} · ${field.labels[value - 1]}`
  if (field.kind === 'choice') return field.options.find((option) => option.id === value)?.label ?? value
  if (field.kind === 'toggles') return value.map((id) => field.options.find((option) => option.id === id)?.label ?? id).join(', ')
  if (field.kind === 'symptoms') return value.map((id) => SYMPTOM_BY_ID[id]?.label ?? id).join(', ')
  if (field.kind === 'datetime') return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  return String(value)
}

// One row per answered field for the review screen, with a status for health readings.
export function reviewRows(type, values, baseline) {
  return allFields(type)
    .filter((field) => !isEmpty(values[field.key]))
    .map((field) => {
      const value = values[field.key]
      const status = field.kind === 'indicator' ? statusOf(fieldIndicator(field), value, baseline[field.indicator ?? field.key]).status : null
      return { key: field.key, label: fieldLabel(field), text: formatAnswer(field, value), status }
    })
}

// Fields that were left empty but could be filled, shown as "Skipped" on review.
export function skippedLabels(type, values) {
  return allFields(type)
    .filter((field) => isEmpty(values[field.key]) && field.kind !== 'toggles' && field.kind !== 'symptoms')
    .map(fieldLabel)
}
