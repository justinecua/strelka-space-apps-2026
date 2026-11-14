import { describe, expect, it } from 'vitest'
import { matchCommand, matchReadings } from './voiceMatch.js'

describe('forgiving voice commands', () => {
  it.each([
    ['go two buddy', { type: 'navigate', tab: 'body' }],
    ['open histry', { type: 'navigate', tab: 'history' }],
    ['go to the hysteria', { type: 'navigate', tab: 'history' }],
    ['open the hard card', { type: 'openCard', card: 'heart' }],
    ['grit view', { type: 'layout', layout: 'grid' }],
    ['lost view', { type: 'layout', layout: 'list' }],
    ['show they twelve', { type: 'showDay', day: 12 }],
    ['delete the five', { type: 'deleteDay', day: 5 }],
    ['enable boys command', { type: 'voiceOn' }],
    ['disable the voice comment', { type: 'voiceOff' }],
    ['what is space radiation', { type: 'hazard', id: 'radiation' }],
    ['start breeding', { type: 'breathe', action: 'start' }],
    ['dark mod', { type: 'theme', theme: 'dark' }],
    ['clothes', { type: 'close' }],
  ])('"%s"', (spoken, expected) => {
    expect(matchCommand(spoken)).toEqual(expected)
  })

  it('does not invent a command from unrelated talk', () => {
    expect(matchCommand('i had pasta for lunch yesterday')).toBeNull()
    expect(matchCommand('the weather is nice')).toBeNull()
  })
})

describe('forgiving readings', () => {
  it('fixes misheard reading names', () => {
    expect(matchReadings('hard rate sixty two').values).toMatchObject({ hr: 62 })
    expect(matchReadings('blood presser one hundred twenty over eighty').values).toMatchObject({ sbp: 120, dbp: 80 })
    expect(matchReadings('oxygen ninety eight').values).toMatchObject({ spo2: 98 })
  })
})

describe('the phrases the engine listens for', async () => {
  const { COMMAND_PHRASES, WAKE_PHRASES } = await import('./voiceVocabulary.js')
  const { parseVoice } = await import('./voiceParser.js')

  it('every command phrase does something', () => {
    // Handled elsewhere: the mic switch in the voice assistant, and check-in form fields.
    const handledElsewhere = ['turn off the microphone', 'treadmill for thirty minutes', 'severity three']
    const silent = COMMAND_PHRASES.filter((phrase) => !matchCommand(phrase) && parseVoice(phrase).found === 0 && !handledElsewhere.includes(phrase))
    expect(silent).toEqual([])
  })

  it('every wake phrase turns voice on (or the mic off)', () => {
    const wrong = WAKE_PHRASES.filter((phrase) => !/hey|okay/.test(phrase) && !['voiceOn'].includes(matchCommand(phrase)?.type) && !/microphone/.test(phrase))
    expect(wrong).toEqual([])
  })
})
