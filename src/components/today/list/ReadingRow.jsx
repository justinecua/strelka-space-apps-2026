// One reading as a row: name, a tiny 14-day trend, today's value and a status dot.
// Tap the row to open its 30-day chart and note underneath.

import { STATUS, formatValue } from '../../../lib/ui.js'
import Sparkline from '../../charts/Sparkline.jsx'
import Icon from '../../ui/Icon.jsx'
import VitalChart from '../../vitals/VitalChart.jsx'

export default function ReadingRow({ indicator, reading, state, isOpen, onToggle }) {
  const trend = state.entries.slice(-14).map((entry) => entry[indicator.id])

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-white/60"
      >
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS[reading.status].bar}`} aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{indicator.label}</span>
        <span className="hidden text-muted sm:block">
          <Sparkline values={trend} />
        </span>
        <span className="w-28 text-right tabular-nums">
          {reading.value == null ? (
            null
          ) : (
            <>
              <span className="text-xl">{formatValue(indicator, reading.value)}</span>{' '}
              <span className="text-sm text-muted">{indicator.unit}</span>
            </>
          )}
        </span>
        <Icon name="chevron" size={16} className={`shrink-0 text-muted transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="fade-in px-5 pb-5">
          <p className="text-sm text-muted">{reading.reason}</p>
          <div className="mt-3 rounded-[20px] bg-white p-3">
            <VitalChart indicator={indicator} entries={state.entries} baseline={state.baseline} height={200} />
          </div>
        </div>
      )}
    </li>
  )
}
