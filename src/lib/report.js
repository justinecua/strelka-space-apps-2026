// Builds a plain-text health report the astronaut can download or copy and send to the crew medical officer.

import { INDICATORS, SYMPTOM_BY_ID } from '../data/indicators.js'
import { STATUS, formatValue } from './ui.js'

export function buildReport(state, result, mission) {
  const { latest, tier, findings, readings } = result
  const symptoms = latest?.symptoms ?? []
  const lines = []

  lines.push(`STRELKA HEALTH REPORT`)
  lines.push(`${state.profile.name} · Mission day ${latest?.day} · ${mission.name}`)
  lines.push(`Assessment: ${tier.label.toUpperCase()} (action owner: ${tier.who})`)
  lines.push('')

  lines.push('READINGS (today | your baseline | status)')
  for (const indicator of INDICATORS) {
    const reading = readings[indicator.id]
    const today = `${formatValue(indicator, reading.value)} ${indicator.unit}`
    const baselineValue = state.baseline[indicator.id]
    const baseline = baselineValue != null ? `${baselineValue} ${indicator.unit}` : 'not set yet'
    lines.push(`- ${indicator.label}: ${today} | ${baseline} | ${STATUS[reading.status].label} (${indicator.source})`)
  }
  lines.push('')

  lines.push('FINDINGS')
  if (findings.length === 0) lines.push('- None')
  for (const finding of findings) {
    lines.push(`- [${STATUS[finding.status].label}] ${finding.title}: ${finding.message}`)
  }
  lines.push('')

  lines.push('SYMPTOMS')
  lines.push(symptoms.length > 0 ? `- ${symptoms.map((id) => SYMPTOM_BY_ID[id].label).join(', ')}` : '- None')

  return lines.join('\n')
}
