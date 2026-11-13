// Decides what "normal" means for this astronaut: the pre-flight numbers they entered,
// or, if they chose to calibrate, the average of their first 7 check-ins.

import { INDICATORS } from '../data/indicators.js'

export const CALIBRATION_DAYS = 7

function average(values, decimals) {
  const sum = values.reduce((total, value) => total + value, 0)
  return Number((sum / values.length).toFixed(decimals))
}

export function getBaseline(state) {
  if (state.baselineSource === 'entered') {
    return { values: state.baseline, calibrating: false, checkInsDone: state.entries.length }
  }

  const firstCheckIns = state.entries.slice(0, CALIBRATION_DAYS)
  if (firstCheckIns.length < CALIBRATION_DAYS) {
    // Not enough data yet: compare readings with general health limits only.
    return { values: {}, calibrating: true, checkInsDone: firstCheckIns.length }
  }

  const values = {}
  for (const indicator of INDICATORS) {
    const readings = firstCheckIns.map((entry) => entry[indicator.id]).filter((value) => value != null)
    if (readings.length > 0) values[indicator.id] = average(readings, indicator.decimals)
  }
  return { values, calibrating: false, checkInsDone: firstCheckIns.length }
}
