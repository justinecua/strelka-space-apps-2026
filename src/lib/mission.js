// Mission-day helpers. Day 1 is the mission start date.

const ONE_DAY_MS = 24 * 60 * 60 * 1000


export function missionDayOn(startDate, date) {
  return Math.floor((Date.parse(date) - Date.parse(startDate)) / ONE_DAY_MS) + 1
}
