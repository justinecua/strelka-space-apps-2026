import { describe, expect, it } from 'vitest'
import { getStreak } from './streak.js'

const days = (...numbers) => numbers.map((day) => ({ day }))

describe('streak', () => {
  it('is zero with no check-ins', () => {
    expect(getStreak([], 5)).toMatchObject({ current: 0, best: 0, atRisk: false })
  })

  it('counts consecutive days ending today', () => {
    expect(getStreak(days(1, 2, 3), 3)).toMatchObject({ current: 3, best: 3, checkedInToday: true, atRisk: false })
  })

  it('keeps the streak alive until today is over, but marks it at risk', () => {
    expect(getStreak(days(1, 2, 3), 4)).toMatchObject({ current: 3, atRisk: true, checkedInToday: false })
  })

  it('ends the streak after a whole missed day but remembers the best one', () => {
    expect(getStreak(days(1, 2, 3, 4, 5), 7)).toMatchObject({ current: 0, best: 5 })
  })

  it('restarts after a gap', () => {
    expect(getStreak(days(1, 2, 3, 5, 6), 6)).toMatchObject({ current: 2, best: 3 })
  })

  it('ignores duplicate days and order', () => {
    expect(getStreak(days(3, 1, 2, 2), 3).current).toBe(3)
  })

  it('works in the demo, which has no calendar today', () => {
    expect(getStreak(days(1, 2, 3, 4), null)).toMatchObject({ current: 4, checkedInToday: true })
  })

  it('points to the next milestone', () => {
    expect(getStreak(days(1, 2, 3, 4), 4).next).toBe(7)
  })
})