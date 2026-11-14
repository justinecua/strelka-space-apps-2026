
// One check-in row: the input, a live status badge and an optional "how to measure" guide.

import { useState } from 'react'
import { isFlagged, statusOf } from '../../lib/status.js'
import { STATUS } from '../../lib/ui.js'
import StatusBadge from '../ui/StatusBadge.jsx'
import MeasureGuide from './MeasureGuide.jsx'
import ScaleInput from './ScaleInput.jsx'

export default function IndicatorField({ indicator, value, baselineValue, onChange }) {
  const [showGuide, setShowGuide] = useState(false)
  const { status, reason } = statusOf(indicator, value, baselineValue)
  const inputId = `field-${indicator.id}`

  // Duration values are stored as total minutes.
  const isDuration = indicator.inputType === 'duration'
  const hours = isDuration && value != null ? Math.floor(value / 60) : ''
  const minutes = isDuration && value != null ? value % 60 : ''

  function handleInput(event) {
    const text = event.target.value
    onChange(text === '' ? null : Number(text))
  }

  function handleDurationChange(unit, text) {
    if (text === '') {
      onChange(null)
      return
    }

    const currentHours = hours === '' ? 0 : hours
    const currentMinutes = minutes === '' ? 0 : minutes

    const nextHours = unit === 'hours' ? Number(text) : currentHours
    const nextMinutes = unit === 'minutes' ? Number(text) : currentMinutes

    if (
      !Number.isInteger(nextHours) ||
      !Number.isInteger(nextMinutes) ||
      nextHours < 0 ||
      nextMinutes < 0 ||
      nextMinutes > 59
    ) return

    onChange(nextHours * 60 + nextMinutes)
  }

  return (
    <div className="rounded-[20px] bg-white p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-40 flex-1">
          <label htmlFor={inputId}>{indicator.label}</label>
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            aria-expanded={showGuide}
            className="block text-sm text-muted underline hover:text-ink"
          >
            {showGuide ? 'Hide guide' : 'How do I measure this?'}
          </button>
        </div>

        {indicator.scaleLabels ? (
          <ScaleInput indicator={indicator} value={value} onChange={onChange} />
        ) : isDuration ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <input
                id={inputId}
                type="number"
                inputMode="numeric"
                min="0"
                max={indicator.maxHours ?? 24}
                step="1"
                value={hours}
                onChange={(event) => handleDurationChange('hours', event.target.value)}
                className="w-20 rounded-full bg-field px-3 pl-7 py-2.5 text-center text-lg tabular-nums outline-none focus:ring-2 focus:ring-ink"
                aria-label={`${indicator.label} hours`}
              />
              <span className="text-sm text-muted">h</span>
            </div>

            <div className="flex items-center gap-1">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                max="59"
                step="1"
                value={minutes}
                onChange={(event) => handleDurationChange('minutes', event.target.value)}
                className="w-20 rounded-full bg-field px-3 pl-7 py-2.5 text-center text-lg tabular-nums outline-none focus:ring-2 focus:ring-ink"
                aria-label={`${indicator.label} minutes`}
              />
              <span className="text-sm text-muted">min</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              id={inputId}
              type="number"
              inputMode="decimal"
              step={indicator.step}
              min={indicator.min}
              max={indicator.max}
              value={value ?? ''}
              onChange={handleInput}
              className="w-28 rounded-full bg-field px-4 py-2.5 text-right text-lg tabular-nums outline-none focus:ring-2 focus:ring-ink"
            />
            <span className="w-12 text-sm text-muted">{indicator.unit}</span>
          </div>
        )}

        <div className="w-20 text-right">
          <StatusBadge status={status} />
        </div>
      </div>

      {isFlagged(status) && (
        <p className={`mt-2 text-sm ${STATUS[status].text}`}>{reason}</p>
      )}

      {showGuide && <MeasureGuide indicator={indicator} />}
    </div>
  )
}
