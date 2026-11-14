// Every past check-in, newest first. Tap one to see all its values, then edit, export or delete it,
// or add a check-in for a day you missed.
// Voice: "show day 5", "show more", "add a missed day", "export PDF", "export all".

import { useMemo, useState } from 'react'
import { printReports, reportForDay } from '../lib/exportReport.js'
import { evaluate } from '../lib/triage.js'
import { useVoiceEvent } from '../lib/voiceEvents.js'
import AddMissedDay from '../components/history/AddMissedDay.jsx'
import HistoryRow from '../components/history/HistoryRow.jsx'

const PAGE_SIZE = 30

function notify(message) {
  window.dispatchEvent(new CustomEvent('strelka:notice', { detail: { message } }))
}

function scrollToId(id) {
  // Wait a moment so a row that was just shown or opened is on the page.
  setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
}

export default function History({ state, mission, onEdit, onAdd, onDelete }) {
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

  // App asks "Delete day 5?" first, by click or voice.
  function handleDelete(day) {
    onDelete(day)
  }

  function exportDay(day) {
    const report = reportForDay(state, mission, day)
    if (!report) return notify(`There is no check-in for day ${day}.`)
    printReports(`Strelka report, day ${day}`, [report])
  }

  function exportAll() {
    if (rows.length === 0) return notify('No check-ins to export yet.')
    printReports('Strelka reports', state.entries.map((entry) => reportForDay(state, mission, entry.day)))
  }

  function showDay(day) {
    const index = rows.findIndex((row) => row.entry.day === day)
    if (index < 0) return notify(`There is no check-in for day ${day}.`)
    if (index >= shown) setShown(index + 1)
    setOpenDay(day)
    scrollToId(`day-${day}`)
  }

  useVoiceEvent('show-day', ({ day }) => showDay(day))
  useVoiceEvent('show-more', () => {
    if (shown >= rows.length) return notify('That is every check-in.')
    setShown(shown + PAGE_SIZE)
  })
  useVoiceEvent('add-missed', () => {
    if (!state.profile.startDate) return notify('Adding past days needs a mission start date.')
    scrollToId('missed-date')
    setTimeout(() => document.getElementById('missed-date')?.focus(), 300)
  })
  // "export PDF": the day said, else the open day, else the latest. "export all": every day.
  useVoiceEvent('export', ({ scope, day }) => {
    if (scope === 'all') return exportAll()
    const target = day ?? openDay ?? rows[0]?.entry.day
    if (target == null) return notify('No check-ins to export yet.')
    exportDay(target)
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl sm:text-6xl">History</h1>
          <p className="mt-2 text-muted">
            {rows.length} check-in{rows.length === 1 ? '' : 's'} so far. Tap one to see everything, or to fix a mistake.
          </p>
        </div>
        {rows.length > 1 && (
          <button type="button" onClick={exportAll} className="rounded-full border border-ink/30 px-5 py-2.5 transition hover:border-ink">
            Export all as PDF
          </button>
        )}
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
            onExport={() => exportDay(entry.day)}
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
