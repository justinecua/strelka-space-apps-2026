// The simple "list" layout of Today: a checklist, one row per reading, and a one-line mission log.
// Rows open in place, so there are no extra cards to read.

import { useState } from 'react'
import { INDICATORS } from '../../../data/indicators.js'
import { dayNumberFor } from '../../../lib/entries.js'
import { recentDays, summarizeDays } from '../../../lib/missionLog.js'
import StreakCard from '../StreakCard.jsx'
import ReadingRow from './ReadingRow.jsx'
import TodoList from './TodoList.jsx'

export default function ListView({ state, result, onToggleDone }) {
  const [openId, setOpenId] = useState(null)
  const days = recentDays(state.entries, state.baseline)
  const { goodPercent } = summarizeDays(days)
  // The demo has no calendar date, so its streak counts from the latest entry.
  const todayDay = state.isDemo ? null : dayNumberFor(state.profile, state.entries)

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <TodoList findings={result.findings} hasReadings={result.hasReadings} doneIds={state.doneIds} onToggle={onToggleDone} />

      <StreakCard entries={state.entries} todayDay={todayDay} />

      <section>
        <h2 className="mb-3 text-2xl">Readings</h2>
        <ul className="divide-y divide-line overflow-hidden rounded-[24px] bg-field">
          {INDICATORS.map((indicator) => (
            <ReadingRow
              key={indicator.id}
              indicator={indicator}
              reading={result.readings[indicator.id]}
              state={state}
              isOpen={openId === indicator.id}
              onToggle={() => setOpenId(openId === indicator.id ? null : indicator.id)}
            />
          ))}
        </ul>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-2xl">Last {days.length} days</h2>
          <span className="text-sm text-muted">{goodPercent === null ? 'No readings yet' : `${goodPercent}% good days`}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 rounded-[24px] bg-field p-5">
          {days.map((day) => (
            <span key={day.day} title={`Day ${day.day} · ${day.tierLabel}`} className="h-3 w-3 rounded-full" style={{ background: day.color }} />
          ))}
        </div>
      </section>
    </div>
  )
}