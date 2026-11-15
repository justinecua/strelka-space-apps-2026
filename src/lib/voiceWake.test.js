import { describe, expect, it } from 'vitest'
import { splitName } from './voiceWake.js'

describe('the name Strelka', () => {
  it('counts only at the start', () => {
    expect(splitName('stroger go to home')).toEqual({ called: true, rest: 'go to home' })
    expect(splitName('hey stroger click heart')).toEqual({ called: true, rest: 'click heart' })
    expect(splitName('stroger')).toEqual({ called: true, rest: '' })
    expect(splitName('Strelka, open history')).toEqual({ called: true, rest: 'open history' })
  })
  it('ignores talk without it, or with it later on', () => {
    expect(splitName('go to home')).toEqual({ called: false, rest: 'go to home' })
    expect(splitName('[unk] stroger [unk] go to home').called).toBe(false)
    expect(splitName('the stroger thing').called).toBe(false)
  })
  it('drops unknown words after the name', () => {
    expect(splitName('stroger [unk] go to body')).toEqual({ called: true, rest: 'go to body' })
  })
})
