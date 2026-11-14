import { describe, expect, it } from 'vitest'
import { checkInDate, dueType, partOfDay, suggestedType } from './schedule.js'
import { todayDate } from './entries.js'
import { mergeRecord } from './records.js'
import { missingFields } from './checkinForm.js'
import { CHECKIN_TYPES } from '../data/checkinTypes.js'
import { evaluate } from './triage.js'

const at = (hour, minute = 0) => {
  const date = new Date()
  date.setHours(hour, minute, 0, 0)
  return date
}
const today = todayDate()
const record = (type, values = {}) => ({ type, loggedOn: today, at: new Date().toISOString(), values })

describe('time of day', () => {
  it('splits the day into morning, afternoon and evening', () => {
    expect(partOfDay(at(6))).toBe('morning')
    expect(partOfDay(at(14))).toBe('afternoon')
    expect(partOfDay(at(21))).toBe('evening')
    expect(partOfDay(at(2))).toBe('evening')
  })

  it('opens the morning check-in in the morning, and post-exercise once it is done', () => {
    expect(suggestedType([], [], at(7))).toBe('morning')
    expect(suggestedType([record('morning')], [], at(7))).toBe('exercise')
  })

  it('opens the before-sleep check-in in the evening and after midnight', () => {
    expect(suggestedType([], [], at(22))).toBe('evening')
    expect(suggestedType([], [], at(1))).toBe('evening')
  })

  it('a before-sleep check-in after midnight counts for the day before', () => {
    expect(checkInDate('evening', at(1))).not.toBe(checkInDate('evening', at(22)))
    expect(checkInDate('morning', at(1))).toBe(checkInDate('morning', at(22)))
  })

  it('knows which daily check-in is due', () => {
    expect(dueType([], [], at(8))).toBe('morning')
    expect(dueType([record('morning')], [], at(8))).toBe(null)
    expect(dueType([record('morning')], [], at(21))).toBe('evening')
    expect(dueType([record('morning'), record('evening')], [], at(21))).toBe(null)
  })
})

describe('check-ins fold into the day', () => {
  it('morning readings fill the day', () => {
    const entry = mergeRecord({ symptoms: [] }, record('morning', { hr: 60, resp: 14 }))
    expect(entry).toMatchObject({ hr: 60, resp: 14 })
  })

  it('exercise sessions add up and warnings become symptoms', () => {
    let entry = mergeRecord({ symptoms: [] }, record('exercise', { duration: 40, hrPost: 150, hrRecovery: 125 }))
    entry = mergeRecord(entry, record('exercise', { duration: 50, hrPost: 150, hrRecovery: 125, warnings: ['dizziness'] }))
    expect(entry.exercise).toBe(90)
    expect(entry.symptoms).toEqual(['dizziness'])
  })

  it('a severe symptom report goes to the crew medic', () => {
    const entry = mergeRecord({ day: 1, symptoms: [] }, record('symptom', { symptom: 'headache', severity: 4 }))
    expect(evaluate([entry], {}).tier.id).toBe('cmo')
  })

  it('slow heart-rate recovery after exercise is flagged', () => {
    const entry = mergeRecord({ day: 1, symptoms: [] }, record('exercise', { duration: 30, hrPost: 150, hrRecovery: 145 }))
    expect(evaluate([entry], {}).findings.map((finding) => finding.id)).toContain('exercise_recovery')
  })
})

describe('form checks', () => {
  it('the morning check-in needs every reading except glucose', () => {
    const missing = missingFields(CHECKIN_TYPES.morning, {}).map((field) => field.key)
    expect(missing).toContain('resp')
    expect(missing).not.toContain('glucose')
  })

  it('"Other" symptom needs a description', () => {
    const base = { symptom: 'other', startedAt: '2026-11-14T10:00', severity: 2 }
    expect(missingFields(CHECKIN_TYPES.symptom, base).map((field) => field.key)).toEqual(['description'])
  })
})
