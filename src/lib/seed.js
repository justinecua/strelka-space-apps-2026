// Simulates a 180-day Mars-transit astronaut for the demo.
// It uses a seeded random generator, so the charts look the same on every load.

import { DEMO_BASELINE as BASELINE } from '../data/astronaut.js'

function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const round = (v, d = 0) => Math.round(v * 10 ** d) / 10 ** d

export function generateMission(days = 180) {
  const rand = mulberry32(2026)
  const noise = (amp) => (rand() - 0.5) * 2 * amp
  const entries = []

  for (let day = 1; day <= days; day++) {
    // Early fluid shift: lower HR and DBP, headaches and congestion the first week.
    const fluidShift = Math.exp(-day / 10)
    // Sleep and mood slump in the "third quarter" of isolation.
    const slump = day >= 84 && day <= 100 ? Math.sin(((day - 84) / 16) * Math.PI) : 0
    // Late-mission rise in blood pressure, which triggers the SANS flag.
    const late = day > days - 6 ? (day - (days - 6)) / 6 : 0
    // Slow cardio deconditioning.
    const decond = day / days

    const symptoms = []
    if (day <= 3 && rand() < 0.8) symptoms.push('nausea')
    if (day <= 7 && rand() < 0.6) symptoms.push('congestion')
    if (day <= 10 && rand() < 0.4) symptoms.push('backpain')
    if (day >= 63 && day <= 65) symptoms.push('headache')
    if (slump > 0.6 && rand() < 0.5) symptoms.push('headache')
    if (day >= days - 2) symptoms.push('headache')
    if (day === days) symptoms.push('vision')

    entries.push({
      day,
      hr: round(clamp(BASELINE.hr - 5 * fluidShift + 4 * decond + 6 * slump + noise(3), 40, 130)),
      sbp: round(clamp(BASELINE.sbp - 4 * fluidShift + 18 * late + noise(4), 80, 170)),
      dbp: round(clamp(BASELINE.dbp - 5 * fluidShift + 8 * late + noise(3), 45, 110)),
      spo2: round(clamp(BASELINE.spo2 + noise(1) - (day === 30 || day === 120 ? 2 : 0), 85, 100)),
      temp: round(clamp(BASELINE.temp + noise(0.2) + (day >= 140 && day <= 142 ? 0.9 : 0), 35, 40), 1),
      glucose: round(clamp(BASELINE.glucose + 6 * decond + noise(7), 60, 160)),
      sleep: round(clamp(BASELINE.sleep - 2 * slump - 0.6 * fluidShift + noise(0.5), 3, 10) * 4) / 4,
      mood: round(clamp(BASELINE.mood - 2 * slump + noise(0.6), 1, 5)),
      stress: round(clamp(BASELINE.stress + 2 * slump + 1.2 * late + (day >= 63 && day <= 65 ? 2 : 0) + noise(0.6), 1, 5)),
      exercise: round(clamp(BASELINE.exercise - 45 * slump + (day <= 5 ? -60 : 0) + noise(15), 0, 180) / 5) * 5,
      symptoms,
    })
  }
  return entries
}
