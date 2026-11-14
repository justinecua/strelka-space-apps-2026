// "To do today" as a plain checklist. Tap a row to tick it; ticks are shared with the Do next card.

import { STATUS } from '../../../lib/ui.js'
import CheckCircle from '../../ui/CheckCircle.jsx'

export default function TodoList({ findings, hasReadings = true, doneIds, onToggle }) {
  const doneCount = findings.filter((finding) => doneIds.includes(finding.id)).length

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-2xl">To do today</h2>
        {findings.length > 0 && (
          <span className="text-sm text-muted">
            {doneCount} of {findings.length} done
          </span>
        )}
      </div>

      {findings.length === 0 && (
        <p className="rounded-[20px] bg-field p-5 text-muted">
          {hasReadings ? 'Nothing to do. All readings look normal.' : 'Nothing to check yet. Your tips will show here once your check-in has readings.'}
        </p>
      )}

      <ul className="divide-y divide-line overflow-hidden rounded-[24px] bg-field">
        {findings.map((finding) => {
          const done = doneIds.includes(finding.id)
          return (
            <li key={finding.id}>
              <button
                type="button"
                onClick={() => onToggle(finding.id)}
                aria-pressed={done}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-white/60"
              >
                <CheckCircle checked={done} />
                <span className={`flex-1 ${done ? 'line-through opacity-50' : ''}`}>{finding.title}</span>
                <span className={`h-2.5 w-2.5 rounded-full ${STATUS[finding.status].bar}`} aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
