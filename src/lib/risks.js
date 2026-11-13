// Small helpers to look up NASA risks for a hazard or body region, and to name what checks each one.

import { INDICATOR_BY_ID, SYMPTOM_BY_ID } from '../data/indicators.js'
import { RISKS } from '../data/risks.js'

export function risksForHazard(hazardId) {
  return RISKS.filter((risk) => risk.hazards.includes(hazardId))
}

export function risksForRegion(regionId) {
  return RISKS.filter((risk) => risk.region === regionId)
}

export function coveredRisks() {
  return RISKS.filter((risk) => risk.checkedBy.length > 0)
}

// Turns ids like ['hr', 'rash'] into readable names like "Heart rate, Skin rash or cold sores".
export function checkedByText(risk) {
  return risk.checkedBy
    .map((id) => INDICATOR_BY_ID[id]?.label ?? SYMPTOM_BY_ID[id]?.label)
    .join(', ')
}
