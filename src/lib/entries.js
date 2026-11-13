// Adds a check-in to the history. A second check-in on the same calendar date replaces the first one
// instead of starting a new mission day.

import { missionDayOn } from './mission.js'

// Today's date as "YYYY-MM-DD" in the user's own time zone (not UTC).
export function todayDate() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function hasCheckedInToday(entries, today = todayDate()) {
  return entries.at(-1)?.loggedOn === today
}

// Real missions count days from the start date. The demo has no start date, so it just counts up.
export function dayNumberFor(profile, entries, today = todayDate()) {
  if (hasCheckedInToday(entries, today)) return entries.at(-1).day
  if (profile?.startDate) return Math.max(1, missionDayOn(profile.startDate, today))
  return (entries.at(-1)?.day ?? 0) + 1
}

export function addOrReplaceEntry(entries, entry, today, dayNumber) {
  const newEntry = { ...entry, day: dayNumber, loggedOn: today }

  if (hasCheckedInToday(entries, today)) {
    return [...entries.slice(0, -1), newEntry]
  }
  return [...entries, newEntry]
}

// Saves a check-in for any mission day (used for editing or adding a missed day).
// It replaces the check-in with the same day number, or adds it, and keeps the list in day order.
export function saveEntry(entries, entry) {
  const others = entries.filter((item) => item.day !== entry.day)
  return [...others, entry].sort((a, b) => a.day - b.day)
}

export function removeEntry(entries, day) {
  return entries.filter((item) => item.day !== day)
}

// Turns "2026-11-14" into a short local date like "Nov 14". Demo check-ins have no date.
export function formatDate(isoDate) {
  if (!isoDate) return null
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
