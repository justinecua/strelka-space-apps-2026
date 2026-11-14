// Works out the result of each recent day, for the mission log dot grid on Today.
// Days without any readings are gray and left out of the good/flagged counts.

import { STATUS } from './ui.js'
import { evaluate } from './triage.js'

const OK_TIERS = ['nominal', 'self']

export function recentDays(entries, baseline, count = 40) {
  const startIndex = Math.max(0, entries.length - count)
  const days = []

  for (let index = startIndex; index < entries.length; index++) {
    const { tier, findings } = evaluate(entries.slice(0, index + 1), baseline)
    const empty = tier.id === 'nodata'
    const ok = OK_TIERS.includes(tier.id)
    const color = empty ? STATUS.none.hex : ok ? STATUS.green.hex : STATUS[tier.color].hex
    const notes = findings.map((finding) => finding.title)
    days.push({ day: entries[index].day, ok, empty, color, tierLabel: tier.label, notes })
  }
  return days
}

// Good and flagged counts over the days that had readings. goodPercent is null when no day had any.
export function summarizeDays(days) {
  const measured = days.filter((day) => !day.empty)
  const good = measured.filter((day) => day.ok).length
  const flagged = measured.length - good
  const goodPercent = measured.length > 0 ? Math.round((good / measured.length) * 100) : null
  return { measuredCount: measured.length, good, flagged, goodPercent }
}
