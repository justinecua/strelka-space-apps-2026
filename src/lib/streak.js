export const MILESTONES = [3, 7, 14, 30, 60, 100]

export function getStreak(entries, todayDay = null) {
  const days = [...new Set(entries.map((entry) => entry.day))].sort((a, b) => a - b)

  if (days.length === 0) {
    return { current: 0, best: 0, doneDays: new Set(), anchor: todayDay, checkedInToday: false, atRisk: false, next: MILESTONES[0] }
  }

  // Longest run of consecutive days ever.
  let best = 1
  let run = 1
  for (let index = 1; index < days.length; index++) {
    run = days[index] === days[index - 1] + 1 ? run + 1 : 1
    best = Math.max(best, run)
  }

  // Run that ends on the latest check-in.
  let endingNow = 1
  for (let index = days.length - 1; index > 0 && days[index] - days[index - 1] === 1; index--) endingNow++

  const latest = days.at(-1)
  const anchor = todayDay ?? latest
  const alive = anchor - latest <= 1
  const current = alive ? endingNow : 0
  const checkedInToday = latest === anchor

  return {
    current,
    best,
    doneDays: new Set(days),
    anchor,
    checkedInToday,
    atRisk: alive && !checkedInToday,
    next: MILESTONES.find((milestone) => milestone > current) ?? null,
  }
}