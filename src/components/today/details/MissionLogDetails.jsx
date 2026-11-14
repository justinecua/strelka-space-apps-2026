// Full-screen detail for the mission log: the day grid, plus a list of every flagged day and what was found.

import DotGrid from '../../charts/DotGrid.jsx'
import Card from '../../ui/Card.jsx'

export default function MissionLogDetails({ days }) {
  const flagged = days.filter((day) => !day.ok && !day.empty).reverse()
  const hasMeasured = days.some((day) => !day.empty)

  return (
    <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
      <Card title={`Last ${days.length} days`} tone="dark">
        <DotGrid days={days} />
        <p className="mt-4 text-sm opacity-60">Each square is one check-in. Gray means no readings that day. Hover a square to see its day.</p>
      </Card>

      <Card title={`Flagged days (${flagged.length})`}>
        {flagged.length === 0 && (
          <p className="text-muted">
            {hasMeasured ? 'No flagged days. Every check-in with readings looked fine.' : 'Nothing to flag yet. Your check-ins so far had no readings.'}
          </p>
        )}
        <ul className="space-y-2">
          {flagged.map((day) => (
            <li key={day.day} className="flex items-start gap-4 rounded-[20px] bg-white p-4">
              <span className="mt-1 h-4 w-4 shrink-0 rounded-[5px] border-[3px]" style={{ borderColor: day.color }} />
              <div>
                <p>
                  Day {day.day} · {day.tierLabel}
                </p>
                <p className="text-sm text-muted">{day.notes.join(', ')}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
