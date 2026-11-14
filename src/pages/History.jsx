// Every past check-in, newest first. Tap one to see all its values, then edit or delete it,
// or add a check-in for a day you missed.

import { useMemo, useState } from 'react'
import { evaluate } from '../lib/triage.js'
import AddMissedDay from '../components/history/AddMissedDay.jsx'
import HistoryRow from '../components/history/HistoryRow.jsx'

const PAGE_SIZE = 30

export default function History({ state, onEdit, onAdd, onDelete }) {
  const [openDay, setOpenDay] = useState(null)
  const [shown, setShown] = useState(PAGE_SIZE)

  // The result each check-in got on its own day, newest first.
  const rows = useMemo(
    () =>
      state.entries
        .map((entry, index) => ({ entry, tier: evaluate(state.entries.slice(0, index + 1), state.baseline).tier }))
        .reverse(),
    [state.entries, state.baseline],
  )

  function handleDelete(day) {
    if (window.confirm(`Delete the check-in for day ${day}? This can't be undone.`)) {
      onDelete(day)
      setOpenDay(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-5xl sm:text-6xl">History</h1>
        <p className="mt-2 text-muted">
          {rows.length} check-in{rows.length === 1 ? '' : 's'} so far. Tap one to see everything, or to fix a mistake.
        </p>
      </div>

      {state.profile.startDate && <AddMissedDay startDate={state.profile.startDate} entries={state.entries} onAdd={onAdd} />}

      {rows.length === 0 && <p className="rounded-[24px] bg-field p-5 text-muted">No check-ins yet. Your first one will show up here.</p>}

      <ul className="divide-y divide-line overflow-hidden rounded-[24px] bg-field">
        {rows.slice(0, shown).map(({ entry, tier }) => (
          <HistoryRow
            key={entry.day}
            entry={entry}
            records={(state.records ?? []).filter((record) => record.day === entry.day)}
            tier={tier}
            isOpen={openDay === entry.day}
            onToggle={() => setOpenDay(openDay === entry.day ? null : entry.day)}
            onEdit={() => onEdit(entry.day)}
            onDelete={() => handleDelete(entry.day)}
          />
        ))}
      </ul>

      {shown < rows.length && (
        <div className="flex justify-center">
          <button type="button" onClick={() => setShown(shown + PAGE_SIZE)} className="underline hover:text-muted">
            Show {Math.min(PAGE_SIZE, rows.length - shown)} older check-ins
          </button>
        </div>
      )}
    </div>
  )
}
