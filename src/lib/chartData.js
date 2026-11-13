// Turns the last few daily entries into chart points.

export function chartPoints(entries, indicatorId, days) {
  return entries.slice(-days).map((entry) => ({ label: `D${entry.day}`, value: entry[indicatorId] }))
}
