// Shows the check-in streak: the number of days in a row, the best streak, progress to the next
// milestone and the last 7 days as dots. todayDay is null in the demo.

import { getStreak } from '../../lib/streak.js'
import Card from '../ui/Card.jsx'

function Flame({ lit }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-9 w-9 ${lit ? 'text-danger' : 'text-muted'}`} fill="currentColor" aria-hidden="true">
      <path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z" />
    </svg>
  )
}

function message({ current, atRisk, checkedInToday, hasEntries }) {
  if (!hasEntries) return 'Check in today to start your streak.'
  if (atRisk) return `Check in today to keep your ${current}-day streak.`
  if (checkedInToday) return 'Checked in today. See you tomorrow.'
  return 'Your streak ended. Check in today to start a new one.'
}

export default function StreakCard({ entries, todayDay = null }) {
  const streak = getStreak(entries, todayDay)
  const { current, best, doneDays, anchor, checkedInToday, atRisk, next } = streak
  const lastDays = anchor == null ? [] : Array.from({ length: 7 }, (_, i) => anchor - 6 + i).filter((day) => day >= 1)

  return (
    <Card title="Check-in streak">
      <div className="flex items-center gap-4">
        <Flame lit={current > 0} />
        <div>
          <p className="text-5xl leading-none">{current}</p>
          <p className="text-muted">day{current === 1 ? '' : 's'} in a row · best {best}</p>
        </div>
      </div>

      <p className={`mt-4 rounded-2xl px-4 py-2 text-sm ${atRisk ? 'bg-watch-soft text-watch-text' : 'bg-field text-muted'}`}>
        {message({ current, atRisk, checkedInToday, hasEntries: entries.length > 0 })}
      </p>

      {next && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-muted">
            <span>Next milestone</span>
            <span>
              {current} / {next} days
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-field">
            <div className="h-full rounded-full bg-good" style={{ width: `${Math.min(100, (current / next) * 100)}%` }} />
          </div>
        </div>
      )}

      {lastDays.length > 0 && (
        <ul className="mt-4 flex justify-between gap-1" aria-label="Last 7 days">
          {lastDays.map((day) => {
            const done = doneDays.has(day)
            const isToday = day === anchor
            return (
              <li key={day} className="flex flex-col items-center gap-1 text-xs text-muted">
                <span
                  role="img"
                  aria-label={`Day ${day}: ${done ? 'checked in' : isToday ? 'not yet' : 'missed'}`}
                  className={`h-6 w-6 rounded-full ${done ? 'bg-good' : isToday ? 'border-2 border-good' : 'bg-field'}`}
                />
                D{day}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}