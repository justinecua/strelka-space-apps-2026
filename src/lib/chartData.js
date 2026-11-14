// Turns the last few daily entries into chart points.

export function chartPoints(entries, indicatorId, days) {
  return entries.slice(-days).map((entry) => ({ label: `D${entry.day}`, value: entry[indicatorId] }))
}

// True when any of the entries has a value for any of the given readings.
export function hasAnyValue(entries, indicatorIds) {
  return entries.some((entry) => indicatorIds.some((id) => entry[id] != null))
}
