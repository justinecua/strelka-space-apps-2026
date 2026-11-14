// Shows the check-in streak: the number of days in a row, a short status line, this week as dots
// and progress to the next milestone. The best streak sits in the header. todayDay is null in the demo.

import { getStreak } from '../../lib/streak.js'
import Card from '../ui/Card.jsx'

const WEEK = 7

function Flame({ lit }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-8 w-8 ${lit ? 'text-danger' : 'opacity-30'}`} fill="currentColor" aria-hidden="true">
      <path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z" />
    </svg>
  )
}

function statusLine({ current, atRisk, checkedInToday, hasEntries }) {
  if (!hasEntries) return { text: 'Check in today to start your streak.', tone: 'opacity-60' }
  if (atRisk) return { text: `Check in today to keep your ${current}-day streak.`, tone: 'text-watch-text' }
  if (checkedInToday) return { text: 'Checked in today. See you tomorrow.', tone: 'opacity-60' }
  return { text: 'Your streak ended. Check in today to start a new one.', tone: 'opacity-60' }
}

// Seven days ending today. Early in the mission the row starts at day 1 and shows the days still to come.
function weekDays(anchor) {
  if (anchor == null) return []
  const first = Math.max(1, anchor - (WEEK - 1))
  return Array.from({ length: WEEK }, (_, index) => first + index)
}

function dayStyle({ done, isToday, isFuture }) {
  if (done) return 'bg-good'
  if (isToday) return 'border-2 border-good'
  if (isFuture) return 'border border-dashed border-current opacity-20'
  return 'bg-current opacity-10'
}

export default function StreakCard({ entries, todayDay = null }) {
  const { current, best, doneDays, anchor, checkedInToday, atRisk, next } = getStreak(entries, todayDay)
  const status = statusLine({ current, atRisk, checkedInToday, hasEntries: entries.length > 0 })
  const days = weekDays(anchor)

  return (
    <Card title="Check-in streak" action={best > 0 && <span className="text-sm opacity-60">Best {best}</span>} padding="p-7 sm:p-9" className="flex flex-col">
      <div className="flex items-end gap-3">
        <Flame lit={current > 0} />
        <p className="text-6xl leading-none font-light tabular-nums">{current}</p>
        <p className="pb-1 opacity-60">day{current === 1 ? '' : 's'} in a row</p>
      </div>
      <p className={`mt-5 text-sm ${status.tone}`}>{status.text}</p>

      <div className="mt-auto space-y-8 pt-12">
        {days.length > 0 && (
          <ul className="flex justify-between gap-1" aria-label="This week">
            {days.map((day) => {
              const done = doneDays.has(day)
              const isToday = day === anchor
              const isFuture = day > anchor
              const label = done ? 'checked in' : isToday ? 'not yet' : isFuture ? 'coming up' : 'missed'
              return (
                <li key={day} className="flex flex-col items-center gap-2 text-xs">
                  <span role="img" aria-label={`Day ${day}: ${label}`} className={`h-7 w-7 rounded-full ${dayStyle({ done, isToday, isFuture })}`} />
                  <span className={isToday ? '' : 'opacity-50'}>D{day}</span>
                </li>
              )
            })}
          </ul>
        )}

        {next && (
          <div>
            <div className="flex justify-between text-sm">
              <span className="opacity-60">Next milestone</span>
              <span className="tabular-nums opacity-60">
                {current} / {next} days
              </span>
            </div>
            <div className="relative mt-2 h-1.5 overflow-hidden rounded-full">
              <div className="absolute inset-0 bg-current opacity-10" />
              <div className="relative h-full rounded-full bg-good" style={{ width: `${Math.min(100, (current / next) * 100)}%` }} />
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
