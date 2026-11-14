// One reading at a time, picked from a dropdown in the header. The chosen one is shown big, with its last 30 days.

import { useState } from 'react'
import { INDICATORS, INDICATOR_BY_ID } from '../../data/indicators.js'
import { formatValue } from '../../lib/ui.js'
import BigStat from '../ui/BigStat.jsx'
import Card from '../ui/Card.jsx'
import FullScreen from '../ui/FullScreen.jsx'
import Icon from '../ui/Icon.jsx'
import IconTip from '../ui/IconTip.jsx'
import StatusDot from '../ui/StatusDot.jsx'
import VitalChart from '../vitals/VitalChart.jsx'
import ReadingsDetails from './details/ReadingsDetails.jsx'

export default function ReadingsCard({ state, result, selectedId, onSelect }) {
  const [open, setOpen] = useState(false)
  const indicator = INDICATOR_BY_ID[selectedId]
  const reading = result.readings[selectedId]

  return (
    <>
      <Card
        title="Readings"
        onExpand={() => setOpen(true)}
        action={
          <label className="relative flex items-center gap-2 rounded-full border border-ink/30 py-1.5 pr-9 pl-3 text-sm transition focus-within:border-ink hover:border-ink">
            <StatusDot status={reading.status} />
            <span className="sr-only">Choose a reading</span>
            <select
              value={selectedId}
              onChange={(event) => onSelect(event.target.value)}
              className="absolute inset-0 cursor-pointer appearance-none rounded-full opacity-0"
            >
              {INDICATORS.map((item) => {
                const value = result.readings[item.id].value
                return (
                  <option key={item.id} value={item.id} className="bg-white text-ink">
                    {value != null ? `${item.label} · ${formatValue(item, value)} ${item.unit}` : item.label}
                  </option>
                )
              })}
            </select>
            <span className="pointer-events-none">{indicator.label}</span>
            <Icon name="chevron" size={14} className="pointer-events-none absolute right-3 opacity-60" />
          </label>
        }
      >
        {reading.value != null && (
          <div className="mt-2 flex items-end justify-between gap-3">
            <BigStat label={indicator.label} value={formatValue(indicator, reading.value)} unit={indicator.unit} status={reading.status} />
            <IconTip icon="info" size="sm" title={indicator.label} text={reading.reason} align="right" className="bg-white" />
          </div>
        )}
        <div className={reading.value != null ? 'mt-4' : 'mt-2'}>
          <VitalChart indicator={indicator} entries={state.entries} baseline={state.baseline} emptyHeight={120} />
        </div>
      </Card>
      {open && (
        <FullScreen title="Readings" subtitle="All of today's readings next to your normal. Click a row to see its chart." onClose={() => setOpen(false)}>
          <ReadingsDetails state={state} result={result} selectedId={selectedId} onSelect={onSelect} />
        </FullScreen>
      )}
    </>
  )
}
