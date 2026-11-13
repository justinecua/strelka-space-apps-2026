// Some problems only show up when signs appear together, like headache plus a vision change.
// Each rule below checks one pattern and adds a finding when it matches.

import { isFlagged } from './status.js'

export function getComboFindings(readings, symptoms, trendingIds) {
  const has = (symptomId) => symptoms.includes(symptomId)
  const bloodPressureHigh = readings.sbp.dir === 'high'
  const findings = []

  const sansSigns =
    (has('headache') && has('vision')) ||
    (has('vision') && bloodPressureHigh) ||
    (has('headache') && bloodPressureHigh && trendingIds.includes('sbp'))

  if (sansSigns) {
    findings.push({
      id: 'combo_sans',
      status: 'yellow',
      region: 'eyes',
      title: 'Possible pressure on your eyes',
      message: 'Headache, vision change or rising blood pressure together can point to raised pressure in the head.',
      action: 'Do a quick vision check today (the Amsler grid), then ask your crew medic for an eye exam.',
      escalate: 'cmo',
    })
  }

  if (readings.temp.dir === 'high' && has('rash')) {
    findings.push({
      id: 'combo_immune',
      status: 'yellow',
      region: 'immune',
      title: 'A sleeping virus may be waking up',
      message: 'Fever with a rash or cold sores is a common sign of an old virus becoming active again in space.',
      action: 'Limit shared surfaces, photograph the rash and tell your crew medic.',
      escalate: 'cmo',
    })
  }

  if (isFlagged(readings.sleep.status) && isFlagged(readings.mood.status)) {
    const lastingDays = trendingIds.includes('sleep') || trendingIds.includes('mood')
    findings.push({
      id: 'combo_behavior',
      status: 'yellow',
      region: 'brain',
      title: 'Sleep and mood both down',
      message: 'Poor sleep and low mood feed each other on long missions.',
      action: 'Protect your sleep window tonight and book a private call with the behavioral health team.',
      escalate: lastingDays ? 'cmo' : undefined,
    })
  }

  if (has('headache') && isFlagged(readings.spo2.status)) {
    findings.push({
      id: 'combo_co2',
      status: 'yellow',
      region: 'lungs',
      title: 'Check cabin air',
      message: 'Headache with lower blood oxygen can come from high cabin CO₂ or low O₂.',
      action: 'Ask the crew to check the CO₂ scrubber and O₂ readings.',
      escalate: 'cmo',
    })
  }

  return findings
}
