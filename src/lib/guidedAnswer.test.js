import { describe, expect, it } from 'vitest'
import { CHECKIN_TYPES, allFields } from '../data/checkinTypes.js'
import { answerFor, isNone } from './guidedAnswer.js'
import { parseCommand } from './voiceCommands.js'

const field = (type, key) => allFields(CHECKIN_TYPES[type]).find((item) => item.key === key)

describe('simulation answers', () => {
  it('reads a bare number for the question asked', () => {
    expect(answerFor(field('morning', 'hr'), 'sixty two')).toEqual({ hr: 62 })
    expect(answerFor(field('morning', 'temp'), 'thirty six point five')).toEqual({ temp: 36.5 })
    expect(answerFor(field('morning', 'hr'), 'nine hundred')).toEqual({})
  })
  it('fills both blood pressure numbers', () => {
    expect(answerFor(field('morning', 'sbp'), 'one hundred eighteen over seventy six')).toEqual({ sbp: 118, dbp: 76 })
    expect(answerFor(field('morning', 'dbp'), 'seventy six')).toEqual({ dbp: 76 })
  })
  it('reads sleep in hours', () => {
    expect(answerFor(field('morning', 'sleep'), 'seven hours')).toEqual({ sleep: 420 })
    expect(answerFor(field('morning', 'sleep'), 'six hours and thirty minutes')).toEqual({ sleep: 390 })
    expect(answerFor(field('morning', 'sleep'), 'eight')).toEqual({ sleep: 480 })
  })
  it('reads scales by number or label', () => {
    expect(answerFor(field('morning', 'sleepQuality'), 'four')).toEqual({ sleepQuality: 4 })
    expect(answerFor(field('exercise', 'fatigue'), 'very tired')).toEqual({ fatigue: 4 })
    expect(answerFor(field('symptom', 'severity'), 'moderate')).toEqual({ severity: 3 })
  })
  it('reads choices and symptoms', () => {
    expect(answerFor(field('exercise', 'exerciseType'), 'weights')).toEqual({ exerciseType: 'resistive' })
    expect(answerFor(field('exercise', 'duration'), 'thirty minutes')).toEqual({ duration: 30 })
    expect(answerFor(field('evening', 'headDizzy'), 'a headache')).toEqual({ headDizzy: ['headache'] })
    expect(answerFor(field('symptom', 'symptom'), 'nausea')).toEqual({ symptom: 'nausea' })
  })
  it('takes the whole sentence for text', () => {
    expect(answerFor(field('symptom', 'location'), 'left side of my head')).toEqual({ location: 'left side of my head' })
  })
  it('knows "none"', () => {
    expect(isNone('none')).toBe(true)
    expect(isNone("I'm fine")).toBe(true)
    expect(isNone('headache')).toBe(false)
  })
  it('parses simulation commands', () => {
    expect(parseCommand('start simulation')).toEqual({ type: 'guide', action: 'on' })
    expect(parseCommand('stop simulation')).toEqual({ type: 'guide', action: 'off' })
    expect(parseCommand('skip')).toEqual({ type: 'guide', action: 'next' })
    expect(parseCommand('previous question')).toEqual({ type: 'guide', action: 'previous' })
    expect(parseCommand('repeat the question')).toEqual({ type: 'guide', action: 'repeat' })
  })
})
