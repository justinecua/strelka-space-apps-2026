import { describe, expect, it } from 'vitest'
import { parseCommand } from './voiceCommands.js'
import { parseVoice } from './voiceParser.js'

describe('voice commands on every page', () => {
  it.each([
    ['go to today', { type: 'navigate', tab: 'today' }],
    ['open check-in', { type: 'navigate', tab: 'checkin' }],
    ['start check-in', { type: 'navigate', tab: 'checkin' }],
    ['go to body', { type: 'navigate', tab: 'body' }],
    ['open history', { type: 'navigate', tab: 'history' }],
    ['relax', { type: 'navigate', tab: 'relax' }],
    ['show brain', { type: 'region', key: 'brain' }],
    ['switch to mars surface', { type: 'mission', key: 'mars surface' }],
    ['dark mode', { type: 'theme', theme: 'dark' }],
    ['edit day 5', { type: 'editDay', day: 5 }],
    ['delete day 5', { type: 'deleteDay', day: 5 }],
    ['export pdf', { type: 'export', scope: 'day' }],
    ['start breathing', { type: 'breathe', action: 'start' }],
    ['save', { type: 'save' }],
    ['save check-in', { type: 'save' }],
    ['cancel', { type: 'cancel' }],
    ['stop', { type: 'stop' }],
  ])('"%s"', (spoken, expected) => {
    expect(parseCommand(spoken)).toEqual(expected)
  })
})

describe('picking a check-in by voice', () => {
  it.each([
    ['morning check-in', 'morning'],
    ['start morning check-in', 'morning'],
    ['open the exercise check-in', 'exercise'],
    ['post exercise check-in', 'exercise'],
    ['before sleep check-in', 'evening'],
    ['bedtime check-in', 'evening'],
    ['symptom report', 'symptom'],
    ['report a symptom', 'symptom'],
  ])('"%s"', (spoken, checkin) => {
    expect(parseCommand(spoken)).toEqual({ type: 'checkinType', checkin })
  })
})

describe('new readings by voice', () => {
  it('reads breathing rate, fatigue, sleep quality and overall condition', () => {
    const { values } = parseVoice('breathing rate 16, fatigue 3, sleep quality 4, overall condition 5')
    expect(values).toMatchObject({ resp: 16, fatigue: 3, sleepQuality: 4, mood: 5 })
  })

  it('hears dizziness and muscle pain, but not when negated', () => {
    expect(parseVoice('I feel dizzy and my muscles hurt').symptoms).toEqual(expect.arrayContaining(['dizziness', 'musclepain']))
    expect(parseVoice('no dizziness').symptoms).toEqual([])
  })

  it('"start breathing" is not a breathing-rate reading', () => {
    expect(parseVoice('start breathing').values.resp).toBeUndefined()
  })
})
