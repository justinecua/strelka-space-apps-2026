// The simple "list" layout of Today: a checklist, one row per reading, and a one-line mission log.
// Rows open in place, so there are no extra cards to read.

import { useState } from 'react'
import { INDICATORS } from '../../../data/indicators.js'
import { recentDays } from '../../../lib/missionLog.js'
import ReadingRow from './ReadingRow.jsx'
import TodoList from './TodoList.jsx'

export default function ListView({ state, result, onToggleDone }) {
  const [openId, setOpenId] = useState(null)
  const days = recentDays(state.entries, state.baseline)
  const goodPercent = Math.round((days.filter((day) => day.ok).length / days.length) * 100)

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <TodoList findings={result.findings} doneIds={state.doneIds} onToggle={onToggleDone} />

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
          <span className="text-sm text-muted">{goodPercent}% good days</span>
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
