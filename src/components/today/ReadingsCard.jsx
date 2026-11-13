// All readings as pills. The chosen one is shown big, with its last 30 days.

import { useState } from 'react'
import { INDICATORS, INDICATOR_BY_ID } from '../../data/indicators.js'
import { formatValue } from '../../lib/ui.js'
import BigStat from '../ui/BigStat.jsx'
import Card from '../ui/Card.jsx'
import FullScreen from '../ui/FullScreen.jsx'
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
      <Card title="Readings" onExpand={() => setOpen(true)}>
        <div className="flex flex-wrap gap-2">
          {INDICATORS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-pressed={item.id === selectedId}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                item.id === selectedId ? 'border-ink bg-ink text-white' : 'border-ink/30 hover:border-ink'
              }`}
            >
              <StatusDot status={result.readings[item.id].status} />
              {item.short} {formatValue(item, result.readings[item.id].value)}
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-end justify-between gap-3">
          <BigStat label={indicator.label} value={formatValue(indicator, reading.value)} unit={indicator.unit} status={reading.status} />
          <IconTip icon="info" size="sm" title={indicator.label} text={reading.reason} align="right" className="bg-white" />
        </div>
        <div className="mt-4">
          <VitalChart indicator={indicator} entries={state.entries} baseline={state.baseline} />
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
