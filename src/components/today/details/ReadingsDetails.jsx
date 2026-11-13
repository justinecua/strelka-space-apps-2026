// Full-screen detail for readings: a 60-day chart of the chosen reading, and a table of all readings.
// Click a row to chart it.

import { INDICATORS, INDICATOR_BY_ID } from '../../../data/indicators.js'
import { formatValue } from '../../../lib/ui.js'
import Card from '../../ui/Card.jsx'
import StatusBadge from '../../ui/StatusBadge.jsx'
import VitalChart from '../../vitals/VitalChart.jsx'

export default function ReadingsDetails({ state, result, selectedId, onSelect }) {
  const indicator = INDICATOR_BY_ID[selectedId]

  return (
    <div className="space-y-5">
      <Card title={`${indicator.label} · last 60 days`}>
        <VitalChart indicator={indicator} entries={state.entries} baseline={state.baseline} days={60} height={280} />
      </Card>

      <div className="overflow-x-auto rounded-[28px] bg-field p-2">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="px-4 py-3 font-normal">Reading</th>
              <th className="px-4 py-3 font-normal">Today</th>
              <th className="px-4 py-3 font-normal">Your normal</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal">Note</th>
            </tr>
          </thead>
          <tbody>
            {INDICATORS.map((item) => {
              const reading = result.readings[item.id]
              const isSelected = item.id === selectedId
              return (
                <tr
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  className={`cursor-pointer transition ${isSelected ? 'bg-white' : 'hover:bg-white/60'}`}
                >
                  <td className="rounded-l-[16px] px-4 py-3">{item.label}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatValue(item, reading.value)} {item.unit}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted">
                    {formatValue(item, state.baseline[item.id])} {item.unit}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={reading.status} />
                  </td>
                  <td className="rounded-r-[16px] px-4 py-3 text-muted">{reading.reason}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
