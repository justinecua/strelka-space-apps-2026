// One past check-in: day, date, result and a few key numbers. Tap it to see every value, then edit, export or delete it.

import { INDICATORS, INDICATOR_BY_ID, SYMPTOM_BY_ID } from '../../data/indicators.js'
import { formatDate } from '../../lib/entries.js'
import { STATUS, formatValue } from '../../lib/ui.js'
import Button from '../ui/Button.jsx'
import Icon from '../ui/Icon.jsx'

function summary(entry) {
  const show = (id) => formatValue(INDICATOR_BY_ID[id], entry[id])
  return `HR ${show('hr')} · BP ${show('sbp')}/${show('dbp')} · Sleep ${show('sleep')} h`
}

export default function HistoryRow({ entry, tier, isOpen, onToggle, onEdit, onExport, onDelete }) {
  const date = formatDate(entry.loggedOn)
  const symptoms = entry.symptoms ?? []

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-white/60"
      >
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS[tier.color].bar}`} aria-hidden="true" />
        <span className="w-16 shrink-0 sm:w-28">
          <span className="block">Day {entry.day}</span>
          {date && <span className="block text-sm text-muted">{date}</span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate">{tier.label}</span>
          <span className="block truncate text-sm text-muted">{summary(entry)}</span>
        </span>
        {symptoms.length > 0 && (
          <span className="hidden shrink-0 rounded-full bg-white px-3 py-1 text-xs text-muted sm:block">
            {symptoms.length} symptom{symptoms.length > 1 ? 's' : ''}
          </span>
        )}
        <Icon name="chevron" size={16} className={`shrink-0 text-muted transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="fade-in space-y-4 px-5 pt-4 pb-5">
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {INDICATORS.map((indicator) => (
              <div key={indicator.id} className="rounded-[16px] bg-white p-3">
                <dt className="truncate text-xs text-muted">{indicator.label}</dt>
                <dd className="mt-1 tabular-nums">
                  {formatValue(indicator, entry[indicator.id])} <span className="text-xs text-muted">{indicator.unit}</span>
                </dd>
              </div>
            ))}
          </dl>

          <p className="text-sm">
            <span className="text-muted">Symptoms: </span>
            {symptoms.length > 0 ? symptoms.map((id) => SYMPTOM_BY_ID[id]?.label ?? id).join(', ') : 'None'}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button icon="edit" onClick={onEdit}>
              Edit
            </Button>
            <Button variant="light" onClick={onExport}>
              Export PDF
            </Button>
            <Button icon="trash" variant="outline" onClick={onDelete} className="text-danger">
              Delete
            </Button>
          </div>
        </div>
      )}
    </li>
  )
}