// Full-screen detail for the mission log. Left: the day grid with a color key; it stays in view while you scroll.
// Right: the flagged days, filterable by how serious they were. Clicking a square jumps to that day.

import { useEffect, useRef, useState } from 'react'
import { STATUS } from '../../../lib/ui.js'
import DotGrid from '../../charts/DotGrid.jsx'
import Card from '../../ui/Card.jsx'

// Notes can repeat the same finding (for example once for today and once as a trend). Show each once.
function uniqueNotes(notes) {
  return [...new Set(notes)]
}

export default function MissionLogDetails({ days }) {
  const flagged = days.filter((day) => !day.ok && !day.empty).reverse()
  const hasMeasured = days.some((day) => !day.empty)
  const [filter, setFilter] = useState('all')
  const [selectedDay, setSelectedDay] = useState(null)
  const rowRefs = useRef({})

  // The color key, with how many days fall in each group.
  const groups = [
    { id: 'good', label: 'Good', color: STATUS.green.hex, count: days.filter((day) => day.ok).length },
    ...[...new Set(flagged.map((day) => day.tierLabel))].map((label) => ({
      id: label,
      label,
      color: flagged.find((day) => day.tierLabel === label).color,
      count: flagged.filter((day) => day.tierLabel === label).length,
    })),
    { id: 'empty', label: 'No readings', color: STATUS.none.hex, count: days.filter((day) => day.empty).length },
  ].filter((group) => group.count > 0)

  const filters = [{ id: 'all', label: 'All', count: flagged.length }, ...groups.filter((group) => group.id !== 'good' && group.id !== 'empty')]
  const shown = filter === 'all' ? flagged : flagged.filter((day) => day.tierLabel === filter)

  function selectDay(day) {
    setSelectedDay(day)
    if (!shown.some((item) => item.day === day)) setFilter('all')
  }

  // Scroll the chosen day into view once it is rendered.
  useEffect(() => {
    if (selectedDay !== null) rowRefs.current[selectedDay]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [selectedDay, filter])

  const selected = days.find((day) => day.day === selectedDay)

  return (
    <div className="grid items-start gap-5 pb-28 lg:grid-cols-[auto_1fr]">
      <Card title={`Last ${days.length} days`} tone="dark" className="lg:sticky lg:top-6">
        <DotGrid days={days} onSelect={selectDay} selectedDay={selectedDay} />

        <ul className="stagger mt-5 space-y-2 text-sm">
          {groups.map((group, index) => (
            <li key={group.id} style={{ '--i': index + 4 }} className="flex items-center gap-3">
              <span className="h-3.5 w-3.5 rounded-[4px] border-[3px]" style={{ borderColor: group.color }} />
              <span className="flex-1">{group.label}</span>
              <span className="tabular-nums opacity-60">{group.count}</span>
            </li>
          ))}
        </ul>

        <p className="mt-5 max-w-[16rem] text-sm opacity-60">
          {selected
            ? selected.empty
              ? `Day ${selected.day} had no readings.`
              : selected.ok
                ? `Day ${selected.day} looked fine.`
                : `Day ${selected.day} is highlighted in the list.`
            : 'Click a square to jump to that day.'}
        </p>
      </Card>

      <Card title={`Flagged days (${flagged.length})`}>
        {flagged.length === 0 ? (
          <p className="text-muted">
            {hasMeasured ? 'No flagged days. Every check-in with readings looked fine.' : 'Nothing to flag yet. Your check-ins so far had no readings.'}
          </p>
        ) : (
          <>
            {filters.length > 2 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {filters.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilter(item.id)}
                    aria-pressed={filter === item.id}
                    className={`rounded-full px-4 py-1.5 text-sm transition ${
                      filter === item.id ? 'bg-ink text-white' : 'border border-ink/20 hover:border-ink'
                    }`}
                  >
                    {item.label} <span className="tabular-nums opacity-60">{item.count}</span>
                  </button>
                ))}
              </div>
            )}

            <ul key={filter} className="stagger divide-y divide-ink/10 overflow-hidden rounded-[20px] bg-white">
              {shown.map((day, index) => (
                <li
                  key={day.day}
                  style={{ '--i': index }}
                  ref={(node) => {
                    rowRefs.current[day.day] = node
                  }}
                  className={`flex items-start gap-4 px-4 py-3 transition-colors ${day.day === selectedDay ? 'bg-field' : ''}`}
                >
                  <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded-[4px] border-[3px]" style={{ borderColor: day.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-x-2">
                      <span>Day {day.day}</span>
                      <span className="text-sm text-muted">{day.tierLabel}</span>
                    </p>
                    <p className="mt-0.5 text-sm text-muted">{uniqueNotes(day.notes).join(' · ')}</p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  )
}
