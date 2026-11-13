import { describe, expect, it } from 'vitest'
import { evaluate } from './triage.js'
import { statusOf } from './status.js'
import { addOrReplaceEntry, dayNumberFor, hasCheckedInToday, removeEntry, saveEntry } from './entries.js'
import { getBaseline } from './baseline.js'
import { missionDayOn } from './mission.js'
import { buildReport } from './report.js'
import { generateMission } from './seed.js'
import { INDICATOR_BY_ID } from '../data/indicators.js'
import { DEMO_BASELINE as BASELINE } from '../data/astronaut.js'
import { MISSION_BY_ID } from '../data/missions.js'

const day = (overrides = {}, symptoms = []) => ({ ...BASELINE, ...overrides, symptoms })
const history = (n, last) => [...Array.from({ length: n }, () => day()), last]

describe('statusOf', () => {
  const hr = INDICATOR_BY_ID.hr
  it('is green at baseline', () => expect(statusOf(hr, 62, 62).status).toBe('green'))
  it('flags absolute limits', () => {
    expect(statusOf(hr, 105, 62).status).toBe('yellow')
    expect(statusOf(hr, 125, 62).status).toBe('red')
    expect(statusOf(hr, 38, 62).status).toBe('red')
  })
  it('flags drift from personal baseline even inside the healthy range', () => {
    const s = statusOf(hr, 80, 62)
    expect(s.status).toBe('yellow')
    expect(s.reason).toMatch(/your normal/)
  })
  it('respects direction (high sleep is fine)', () => {
    expect(statusOf(INDICATOR_BY_ID.sleep, 9.5, 7).status).toBe('green')
    expect(statusOf(INDICATOR_BY_ID.sleep, 5, 7).status).toBe('yellow')
  })
  it('handles missing values', () => expect(statusOf(hr, null, 62).status).toBe('none'))
})

describe('evaluate tiers', () => {
  it('all normal → nominal', () => {
    const r = evaluate(history(5, day()), BASELINE)
    expect(r.tier.id).toBe('nominal')
    expect(r.findings).toHaveLength(0)
  })
  it('one yellow → self-care', () => {
    const r = evaluate(history(5, day({ glucose: 130 })), BASELINE)
    expect(r.tier.id).toBe('self')
  })
  it('any red → flight surgeon', () => {
    const r = evaluate(history(5, day({ spo2: 88 })), BASELINE)
    expect(r.tier.id).toBe('surgeon')
    expect(r.regionStatus.lungs).toBe('red')
  })
  it('chest pain → flight surgeon', () => {
    expect(evaluate(history(5, day({}, ['chestpain'])), BASELINE).tier.id).toBe('surgeon')
  })
  it('headache + vision change → CMO with SANS finding', () => {
    const r = evaluate(history(5, day({}, ['headache', 'vision'])), BASELINE)
    expect(r.tier.id).toBe('cmo')
    expect(r.findings.some((f) => f.id === 'combo_sans')).toBe(true)
  })
  it('a yellow sustained for 3 days escalates to CMO', () => {
    const e = [day(), day(), day({ sbp: 138 }), day({ sbp: 140 }), day({ sbp: 139 })]
    const r = evaluate(e, BASELINE)
    expect(r.tier.id).toBe('cmo')
    expect(r.findings.some((f) => f.id === 'sbp_trend')).toBe(true)
  })
  it('adds a comm-delay note on deep-space missions', () => {
    const e = history(3, day({ spo2: 88 }))
    expect(evaluate(e, BASELINE, MISSION_BY_ID.transit).commNote).toMatch(/don't wait/)
    expect(evaluate(e, BASELINE, MISSION_BY_ID.iss).commNote).toMatch(/almost instantly/)
  })
  it('one low exercise day does not flag (7-day average)', () => {
    const r = evaluate(history(6, day({ exercise: 0 })), BASELINE)
    expect(r.readings.exercise.status).toBe('green')
  })
})

describe('demo mission', () => {
  it('ends on a CMO-level SANS alert', () => {
    const r = evaluate(generateMission(), BASELINE, MISSION_BY_ID.transit)
    expect(r.tier.id).toBe('cmo')
    expect(r.regionStatus.eyes).toBe('yellow')
  })
})

describe('check-in entries', () => {
  const start = [{ ...day(), day: 180, loggedOn: '2026-11-13' }]

  it('a check-in on a new date adds a new mission day', () => {
    const entries = addOrReplaceEntry(start, day({ hr: 70 }), '2026-11-14', 181)
    expect(entries).toHaveLength(2)
    expect(entries[1].day).toBe(181)
  })

  it('a second check-in on the same date replaces the first one', () => {
    const first = addOrReplaceEntry(start, day({ hr: 70 }), '2026-11-14', 181)
    const second = addOrReplaceEntry(first, day({ hr: 75 }), '2026-11-14', 181)
    expect(second).toHaveLength(2)
    expect(second[1]).toMatchObject({ day: 181, hr: 75 })
    expect(hasCheckedInToday(second, '2026-11-14')).toBe(true)
  })

  it('counts mission days from the start date', () => {
    expect(missionDayOn('2026-11-01', '2026-11-01')).toBe(1)
    expect(missionDayOn('2026-11-01', '2026-11-14')).toBe(14)
    expect(dayNumberFor({ startDate: '2026-11-01' }, [], '2026-11-14')).toBe(14)
  })
})

describe('baseline calibration', () => {
  const checkIns = (count) => Array.from({ length: count }, (_, i) => ({ ...day({ hr: 60 + i }), day: i + 1 }))

  it('is still calibrating before 7 check-ins, so there is no personal baseline yet', () => {
    const result = getBaseline({ baselineSource: 'calibrate', entries: checkIns(3) })
    expect(result.calibrating).toBe(true)
    expect(result.checkInsDone).toBe(3)
    expect(result.values).toEqual({})
  })

  it('averages the first 7 check-ins', () => {
    const result = getBaseline({ baselineSource: 'calibrate', entries: checkIns(10) })
    expect(result.calibrating).toBe(false)
    expect(result.values.hr).toBe(63) // average of 60..66
  })

  it('uses entered pre-flight numbers right away', () => {
    const result = getBaseline({ baselineSource: 'entered', baseline: { hr: 55 }, entries: [] })
    expect(result.values.hr).toBe(55)
  })

  it('a body region with no readings today shows "no data", not normal', () => {
    const result = evaluate([day({ hr: null, sbp: null, dbp: null })], {})
    expect(result.regionStatus.heart).toBe('none')
    expect(result.regionStatus.eyes).toBe('green')
  })

  it('without a baseline, readings are still checked against health limits', () => {
    const result = evaluate([day({ spo2: 88 })], {})
    expect(result.tier.id).toBe('surgeon')
  })
})

describe('report', () => {
  it('lists the assessment, readings and symptoms', () => {
    const entries = history(5, day({ sbp: 140 }, ['headache']))
    const result = evaluate(entries, BASELINE, MISSION_BY_ID.transit)
    const text = buildReport({ baseline: BASELINE, profile: { name: 'Test' } }, result, MISSION_BY_ID.transit)
    expect(text).toContain(result.tier.label.toUpperCase())
    expect(text).toContain('Blood pressure (systolic): 140 mmHg | 118 mmHg | Watch')
    expect(text).toContain('Headache')
  })
})

describe('hazards', () => {
  it('every body region links only to hazards that exist', async () => {
    const { REGIONS } = await import('../data/regions.js')
    const { HAZARD_BY_ID } = await import('../data/hazards.js')
    for (const region of REGIONS) {
      expect(region.hazards.length).toBeGreaterThan(0)
      for (const id of region.hazards) expect(HAZARD_BY_ID[id]).toBeDefined()
    }
  })
})

describe('NASA risks', () => {
  it('every risk links to real hazards, regions and checks, and uncovered risks explain why', async () => {
    const { RISKS } = await import('../data/risks.js')
    const { HAZARD_BY_ID } = await import('../data/hazards.js')
    const { REGION_BY_ID } = await import('../data/regions.js')
    const { SYMPTOM_BY_ID } = await import('../data/indicators.js')
    for (const risk of RISKS) {
      for (const id of risk.hazards) expect(HAZARD_BY_ID[id]).toBeDefined()
      if (risk.region) expect(REGION_BY_ID[risk.region]).toBeDefined()
      for (const id of risk.checkedBy) expect(INDICATOR_BY_ID[id] ?? SYMPTOM_BY_ID[id]).toBeDefined()
      if (risk.checkedBy.length === 0) expect(risk.note).toBeTruthy()
    }
  })

  it('covers 11 of the 17 risks', async () => {
    const { coveredRisks } = await import('./risks.js')
    expect(coveredRisks()).toHaveLength(11)
  })
})

describe('NASA research', () => {
  it('every study points to real body regions', async () => {
    const { RESEARCH } = await import('../data/research.js')
    const { REGION_BY_ID } = await import('../data/regions.js')
    for (const study of RESEARCH) {
      expect(study.regions.length).toBeGreaterThan(0)
      for (const id of study.regions) expect(REGION_BY_ID[id]).toBeDefined()
    }
  })
})

describe('history: saving and deleting past check-ins', () => {
  const entries = [{ day: 1 }, { day: 2 }, { day: 4 }]

  it('adds a missed day in the right place', () => {
    expect(saveEntry(entries, { day: 3 }).map((entry) => entry.day)).toEqual([1, 2, 3, 4])
  })
  it('replaces a day that already exists instead of adding a copy', () => {
    const result = saveEntry(entries, { day: 2, hr: 70 })
    expect(result).toHaveLength(3)
    expect(result[1].hr).toBe(70)
  })
  it('deletes only the chosen day', () => {
    expect(removeEntry(entries, 2).map((entry) => entry.day)).toEqual([1, 4])
  })
})
