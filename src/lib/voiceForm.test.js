import { describe, expect, it } from 'vitest'
import { CHECKIN_TYPES } from '../data/checkinTypes.js'
import { dictateFields } from './voiceForm.js'

describe('filling check-in fields by voice', () => {
  it('post-exercise: type, minutes and both heart rates', () => {
    expect(dictateFields(CHECKIN_TYPES.exercise, 'treadmill for 30 minutes')).toEqual({ exerciseType: 'treadmill', duration: 30 })
    expect(dictateFields(CHECKIN_TYPES.exercise, 'right after exercise 150')).toEqual({ hrPost: 150 })
    expect(dictateFields(CHECKIN_TYPES.exercise, 'recovery 122')).toEqual({ hrRecovery: 122 })
    expect(dictateFields(CHECKIN_TYPES.exercise, 'weights')).toEqual({ exerciseType: 'resistive' })
  })

  it('symptom report: severity, where and what happened', () => {
    expect(dictateFields(CHECKIN_TYPES.symptom, 'severity 4')).toEqual({ severity: 4 })
    expect(dictateFields(CHECKIN_TYPES.symptom, "it's severe")).toEqual({ severity: 4 })
    expect(dictateFields(CHECKIN_TYPES.symptom, 'it hurts in my left knee')).toEqual({ location: 'left knee' })
    expect(dictateFields(CHECKIN_TYPES.symptom, 'what happened I bumped it on the hatch')).toEqual({ description: 'I bumped it on the hatch' })
    expect(dictateFields(CHECKIN_TYPES.symptom, 'notes started after lunch')).toEqual({ notes: 'started after lunch' })
    expect(dictateFields(CHECKIN_TYPES.symptom, 'other')).toEqual({ symptom: 'other' })
  })

  it('ignores fields the open form does not have', () => {
    expect(dictateFields(CHECKIN_TYPES.morning, 'treadmill severity 4')).toEqual({})
  })
})
