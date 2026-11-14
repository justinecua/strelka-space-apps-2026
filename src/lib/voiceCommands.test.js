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
    ['go to relax', { type: 'navigate', tab: 'relax' }],
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

describe('voice on and off', () => {
  it.each([
    ['enable voice command', 'voiceOn'],
    ['enable voice commands', 'voiceOn'],
    ['turn on voice', 'voiceOn'],
    ['disable voice command', 'voiceOff'],
    ['turn off voice control', 'voiceOff'],
    ['pause voice', 'voiceOff'],
  ])('"%s"', (spoken, type) => {
    expect(parseCommand(spoken)).toEqual({ type })
  })
})

describe('check-in tiles by name', () => {
  it.each([
    ['morning', 'morning'],
    ['post-exercise', 'exercise'],
    ['post exercise', 'exercise'],
    ['before sleep', 'evening'],
    ['switch to before sleep', 'evening'],
    ['symptom', 'symptom'],
    ['open symptoms', 'symptom'],
  ])('"%s"', (spoken, checkin) => {
    expect(parseCommand(spoken)).toEqual({ type: 'checkinType', checkin })
  })

  it('"review" and "submit" both move the form on', () => {
    expect(parseCommand('review')).toEqual({ type: 'save' })
    expect(parseCommand('submit')).toEqual({ type: 'save' })
  })
})

describe('every action on the site by voice', () => {
  it.each([
    // Full-screen cards and closing them
    ['open the heart card', { type: 'openCard', card: 'heart' }],
    ['expand sleep and mood', { type: 'openCard', card: 'sleep' }],
    ['full screen blood', { type: 'openCard', card: 'blood' }],
    ['open mission log', { type: 'openCard', card: 'missionLog' }],
    ['open do next', { type: 'openCard', card: 'doNext' }],
    ['show readings', { type: 'openCard', card: 'readings' }],
    ['close', { type: 'close' }],
    ['close full screen', { type: 'close' }],
    ['exit full screen', { type: 'close' }],
    // Profile, log out, landing, questions
    ['log out', { type: 'logout' }],
    ['logout', { type: 'logout' }],
    ['sign out', { type: 'logout' }],
    ['exit demo', { type: 'logout' }],
    ['reset the app', { type: 'logout' }],
    ['open my profile', { type: 'profile' }],
    ['go to the home page', { type: 'landing' }],
    ['yes', { type: 'answer', yes: true }],
    ['confirm', { type: 'answer', yes: true }],
    ['no', { type: 'answer', yes: false }],
    // Getting around
    ['go back', { type: 'back' }],
    ['scroll down', { type: 'scroll', to: 'down' }],
    ['go to the top', { type: 'scroll', to: 'top' }],
    ['scroll to the bottom', { type: 'scroll', to: 'bottom' }],
    ['go home', { type: 'navigate', tab: 'today' }],
    ['open history', { type: 'navigate', tab: 'history' }],
    ['help', { type: 'help' }],
    ['what can I say', { type: 'help' }],
    // Today
    ['list view', { type: 'layout', layout: 'list' }],
    ['switch to grid view', { type: 'layout', layout: 'grid' }],
    ['show the glucose chart', { type: 'reading', id: 'glucose' }],
    ['heart rate trend', { type: 'reading', id: 'hr' }],
    ['mark 1 done', { type: 'todo', which: 1 }],
    ['mark the first item done', { type: 'todo', which: 1 }],
    ['mark all done', { type: 'todo', which: 'all' }],
    ['share report', { type: 'report', action: 'download' }],
    ['download my report', { type: 'report', action: 'download' }],
    ['copy the report', { type: 'report', action: 'copy' }],
    ['why compare with my normal', { type: 'why' }],
    ['toggle theme', { type: 'theme', theme: 'toggle' }],
    // History
    ['show day 5', { type: 'showDay', day: 5 }],
    ['open day 5', { type: 'showDay', day: 5 }],
    ['edit day 5', { type: 'editDay', day: 5 }],
    ['add day 5', { type: 'addDay', day: 5 }],
    ['export day 5', { type: 'export', scope: 'day', day: 5 }],
    ['add a missed day', { type: 'addMissed' }],
    ['show more', { type: 'showMore' }],
    // Body and check-in
    ['what is space radiation', { type: 'hazard', id: 'radiation' }],
    ['tell me about isolation', { type: 'hazard', id: 'isolation' }],
    ['clear the form', { type: 'clearForm' }],
    ['back to edit', { type: 'cancel' }],
    ['please go to body', { type: 'navigate', tab: 'body' }],
  ])('"%s"', (spoken, expected) => {
    expect(parseCommand(spoken)).toEqual(expected)
  })

  it('keeps readings and region names from turning into other commands', () => {
    expect(parseCommand('blood pressure 120 over 80')).toBeNull()
    expect(parseCommand('show heart')).toEqual({ type: 'region', key: 'heart' })
    expect(parseCommand('show brain')).toEqual({ type: 'region', key: 'brain' })
    expect(parseCommand('save report')).toEqual({ type: 'save' })
  })
})

describe('on-device speech output', () => {
  it('reads "two" after go as "to"', () => {
    expect(parseCommand('go two body')).toEqual({ type: 'navigate', tab: 'body' })
    expect(parseCommand('switch too grid view')).toEqual({ type: 'layout', layout: 'grid' })
  })
  it('still reads real numbers', () => {
    expect(parseCommand('show day two')).toEqual({ type: 'showDay', day: 2 })
  })
  it('reads hundreds in readings', () => {
    expect(parseVoice('blood pressure one hundred eighteen over seventy six').values).toMatchObject({ sbp: 118, dbp: 76 })
  })
})
