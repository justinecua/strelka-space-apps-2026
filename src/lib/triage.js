// Turns the check-in history into findings and decides who should act on them.
// Its result feeds every page: reading colors, the action list and the body map.

import { INDICATORS, INDICATOR_BY_ID, SYMPTOM_BY_ID } from '../data/indicators.js'
import { REGIONS } from '../data/regions.js'
import { TIERS } from '../data/tiers.js'
import { ACTIONS } from '../data/actions.js'
import { SEVERITY, isFlagged, statusOf, worst } from './status.js'
import { getComboFindings } from './combos.js'

// Exercise uses a 7-day average so one rest day doesn't raise a flag.
function currentValue(indicator, entries) {
  const days = indicator.id === 'exercise' ? 7 : 1
  const values = entries
    .slice(-days)
    .map((entry) => entry[indicator.id])
    .filter((value) => value !== null && value !== undefined)

  if (values.length === 0) return null
  const sum = values.reduce((total, value) => total + value, 0)
  return sum / values.length
}

function getReadings(entries, baseline) {
  const latest = entries.at(-1)
  const readings = {}

  for (const indicator of INDICATORS) {
    const value = currentValue(indicator, entries)
    const result = statusOf(indicator, value, baseline[indicator.id])
    readings[indicator.id] = { value: latest[indicator.id] ?? null, ...result }

    if (indicator.id === 'exercise' && value !== null) {
      readings.exercise.reason = `7-day average ${Math.round(value)} min · ${result.reason}`
    }
  }
  return readings
}

function getReadingFindings(readings) {
  return INDICATORS.filter((indicator) => isFlagged(readings[indicator.id].status)).map((indicator) => {
    const reading = readings[indicator.id]
    return {
      id: indicator.id,
      status: reading.status,
      region: indicator.region,
      title: indicator.label,
      message: reading.reason,
      action: ACTIONS[`${indicator.id}_${reading.dir}`],
    }
  })
}

// Indicators that were out of range on each of the last 3 check-ins.
function getTrendingIds(entries, baseline) {
  if (entries.length < 3) return []
  const lastThree = entries.slice(-3)

  return INDICATORS.filter((indicator) => indicator.id !== 'exercise')
    .filter((indicator) =>
      lastThree.every((entry) => isFlagged(statusOf(indicator, entry[indicator.id], baseline[indicator.id]).status)),
    )
    .map((indicator) => indicator.id)
}

function getTrendFindings(trendingIds) {
  return trendingIds.map((id) => {
    const indicator = INDICATOR_BY_ID[id]
    return {
      id: `${id}_trend`,
      status: 'yellow',
      region: indicator.region,
      title: `${indicator.label}: 3-day trend`,
      message: 'Out of your normal range for 3 check-ins in a row.',
      action: 'Share the trend chart with your crew medical officer.',
      escalate: 'cmo',
    }
  })
}

function getSymptomFindings(symptoms) {
  return symptoms.map((id) => {
    const symptom = SYMPTOM_BY_ID[id]
    const isWarningSign = id === 'chestpain' || id === 'breath'
    return {
      id: `symptom_${id}`,
      status: isWarningSign ? 'red' : 'yellow',
      region: symptom.region,
      title: symptom.label,
      message: isWarningSign ? 'Warning symptom reported.' : 'Symptom reported today.',
      action: isWarningSign
        ? 'Stop activity, take vitals again now and alert the crew medical officer.'
        : 'Note when it started and how strong it is. Re-check tomorrow.',
      escalate: isWarningSign ? 'surgeon' : undefined,
    }
  })
}

function pickTier(findings) {
  let tier = TIERS.nominal
  const raiseTo = (tierId) => {
    if (TIERS[tierId].rank > tier.rank) tier = TIERS[tierId]
  }

  const yellowCount = findings.filter((finding) => finding.status === 'yellow').length
  if (yellowCount >= 1) raiseTo('self')
  if (yellowCount >= 3) raiseTo('cmo')
  for (const finding of findings) {
    if (finding.escalate) raiseTo(finding.escalate)
  }
  if (findings.some((finding) => finding.status === 'red')) raiseTo('surgeon')

  return tier
}

function getCommNote(tier, mission) {
  if (!mission || tier.rank < 2) return null
  if (mission.delayMin < 1) {
    return 'You can reach the ground doctor almost instantly. Ask for a private medical call.'
  }
  return `Messages to Earth take ${mission.delayLabel} each way, so a reply can take ${mission.roundTrip}. Start the onboard steps now, don't wait for an answer.`
}

// A region with readings but none measured today is "none" (no data), not green.
// Regions without readings (eyes, inner ear) are only checked through symptoms, so they start green.
function getRegionStatus(readings, findings) {
  const regionStatus = {}
  for (const region of REGIONS) {
    let status = region.indicators.length === 0 ? 'green' : 'none'
    for (const id of region.indicators) status = worst(status, readings[id].status)
    for (const finding of findings) {
      if (finding.region === region.id) status = worst(status, finding.status)
    }
    regionStatus[region.id] = status
  }
  return regionStatus
}

export function evaluate(entries, baseline = {}, mission = null) {
  if (entries.length === 0) {
    return { latest: null, readings: {}, findings: [], tier: TIERS.nominal, regionStatus: {}, commNote: null }
  }

  const latest = entries.at(-1)
  const symptoms = latest.symptoms ?? []
  const readings = getReadings(entries, baseline)
  const trendingIds = getTrendingIds(entries, baseline)

  const findings = [
    ...getComboFindings(readings, symptoms, trendingIds),
    ...getReadingFindings(readings),
    ...getTrendFindings(trendingIds),
    ...getSymptomFindings(symptoms),
  ]
  findings.sort((a, b) => SEVERITY[b.status] - SEVERITY[a.status])

  const tier = pickTier(findings)

  return {
    latest,
    readings,
    findings,
    tier,
    regionStatus: getRegionStatus(readings, findings),
    commNote: getCommNote(tier, mission),
  }
}
