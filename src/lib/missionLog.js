// Works out the result of each recent day, for the mission log dot grid on Today.

import { STATUS } from './ui.js'
import { evaluate } from './triage.js'

const OK_TIERS = ['nominal', 'self']

export function recentDays(entries, baseline, count = 40) {
  const startIndex = Math.max(0, entries.length - count)
  const days = []

  for (let index = startIndex; index < entries.length; index++) {
    const { tier, findings } = evaluate(entries.slice(0, index + 1), baseline)
    const ok = OK_TIERS.includes(tier.id)
    const color = ok ? STATUS.green.hex : STATUS[tier.color].hex
    const notes = findings.map((finding) => finding.title)
    days.push({ day: entries[index].day, ok, color, tierLabel: tier.label, notes })
  }
  return days
}
