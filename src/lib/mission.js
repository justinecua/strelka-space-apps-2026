// Mission-day helpers. Day 1 is the mission start date.

const ONE_DAY_MS = 24 * 60 * 60 * 1000


export function missionDayOn(startDate, date) {
  return Math.floor((Date.parse(date) - Date.parse(startDate)) / ONE_DAY_MS) + 1
}

// The calendar date ("YYYY-MM-DD") of a mission day. The reverse of missionDayOn.
export function dateOfMissionDay(startDate, day) {
  return new Date(Date.parse(startDate) + (day - 1) * ONE_DAY_MS).toISOString().slice(0, 10)
}
