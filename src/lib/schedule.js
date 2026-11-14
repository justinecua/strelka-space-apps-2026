// Works out which check-in fits the current time of day, and which daily ones are still due.
// Morning runs from 4:00 to noon. "Before sleep" counts from 18:00, and until 4:00 the next morning
// it still belongs to the day that just ended.

import { todayDate } from './entries.js'

export const MORNING_START = 4
export const AFTERNOON_START = 12
export const EVENING_START = 18

function isoDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function partOfDay(now = new Date()) {
  const hour = now.getHours()
  if (hour >= MORNING_START && hour < AFTERNOON_START) return 'morning'
  if (hour >= AFTERNOON_START && hour < EVENING_START) return 'afternoon'
  return 'evening'
}

// The calendar date a check-in counts for. A before-sleep check-in after midnight belongs to yesterday.
export function checkInDate(typeId, now = new Date()) {
  if (typeId === 'evening' && now.getHours() < MORNING_START) {
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    return isoDate(yesterday)
  }
  return isoDate(now)
}

export function lastRecord(records, typeId, date) {
  return records.filter((record) => record.type === typeId && record.loggedOn === date).at(-1) ?? null
}

// The status of the two required check-ins right now.
export function dailyStatus(records = [], entries = [], now = new Date()) {
  const today = todayDate()
  const part = partOfDay(now)
  const morning = lastRecord(records, 'morning', today)
  const evening = lastRecord(records, 'evening', checkInDate('evening', now))
  // A day saved with the older all-in-one form counts as both done.
  const legacy = entries.at(-1)?.loggedOn === today && !records.some((record) => record.loggedOn === today)

  return {
    part,
    morning: { done: legacy || Boolean(morning), at: morning?.at ?? null, due: now.getHours() >= MORNING_START },
    evening: { done: legacy || Boolean(evening), at: evening?.at ?? null, due: part === 'evening' },
  }
}

// The check-in to open by default for this time of day.
export function suggestedType(records = [], entries = [], now = new Date()) {
  const status = dailyStatus(records, entries, now)
  if (status.part === 'evening') return 'evening'
  return status.morning.done ? 'exercise' : 'morning'
}

// The required check-in that is due and not done yet, or null.
export function dueType(records = [], entries = [], now = new Date()) {
  const status = dailyStatus(records, entries, now)
  if (status.evening.due && !status.evening.done) return 'evening'
  if (status.morning.due && !status.morning.done && status.part !== 'evening') return 'morning'
  return null
}

export function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}
