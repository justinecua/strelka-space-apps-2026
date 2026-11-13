// Full-screen detail for a group of readings: today's value, your normal, a 60-day chart, and why it matters in space.

import { INDICATOR_BY_ID } from '../../../data/indicators.js'
import { formatValue } from '../../../lib/ui.js'
import BigStat from '../../ui/BigStat.jsx'
import Card from '../../ui/Card.jsx'
import StatusBadge from '../../ui/StatusBadge.jsx'
import VitalChart from '../../vitals/VitalChart.jsx'

export default function VitalDetails({ indicatorIds, state, result }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {indicatorIds.map((id) => {
        const indicator = INDICATOR_BY_ID[id]
        const reading = result.readings[id]
        const baselineValue = state.baseline[id]

        return (
          <Card key={id} title={indicator.label} action={<StatusBadge status={reading.status} />}>
            <div className="flex flex-wrap items-end gap-x-10 gap-y-3">
              <BigStat label="Today" value={formatValue(indicator, reading.value)} unit={indicator.unit} status={reading.status} />
              <BigStat label="Your normal" value={formatValue(indicator, baselineValue)} unit={indicator.unit} />
            </div>
            <p className="mt-3 text-sm text-muted">{reading.reason}</p>

            <div className="mt-4">
              <VitalChart indicator={indicator} entries={state.entries} baseline={state.baseline} days={60} height={220} />
            </div>

            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted">Why it matters</p>
                <p className="mt-1">{indicator.why}</p>
              </div>
              <div>
                <p className="text-muted">In space</p>
                <p className="mt-1">{indicator.spaceEffect}</p>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
