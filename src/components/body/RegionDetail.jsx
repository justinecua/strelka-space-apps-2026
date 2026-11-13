// Everything about the selected body region: its readings as big numbers, any issue, and what to do.

import { INDICATOR_BY_ID } from '../../data/indicators.js'
import { risksForRegion } from '../../lib/risks.js'
import { formatValue } from '../../lib/ui.js'
import HazardChips from '../hazards/HazardChips.jsx'
import BigStat from '../ui/BigStat.jsx'
import ResearchList from './ResearchList.jsx'
import Card from '../ui/Card.jsx'
import Icon from '../ui/Icon.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'

export default function RegionDetail({ region, status, result }) {
  const findings = result.findings.filter((finding) => finding.region === region.id)
  const risks = risksForRegion(region.id)

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white">
            <Icon name={region.icon} size={28} />
          </span>
          <div>
            <h2 className="text-3xl">{region.name}</h2>
            <p className="text-muted">{region.func}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div>
        <p className="mb-2 text-sm text-muted">Affected by these spaceflight hazards</p>
        <HazardChips hazardIds={region.hazards} />
        {risks.length > 0 && (
          <p className="mt-3 text-sm text-muted">NASA risks checked here: {risks.map((risk) => risk.name).join(', ')}</p>
        )}
      </div>

      {region.indicators.length > 0 ? (
        <div className="grid grid-cols-2 gap-5">
          {region.indicators.map((id) => {
            const indicator = INDICATOR_BY_ID[id]
            const reading = result.readings[id]
            return (
              <BigStat
                key={id}
                label={indicator.label}
                value={formatValue(indicator, reading.value)}
                unit={indicator.unit}
                status={reading.status}
              />
            )
          })}
        </div>
      ) : (
        <p className="text-muted">No daily reading for this region. It is checked through the symptoms you report.</p>
      )}

      {findings.length > 0 ? (
        <div className="space-y-2">
          {findings.slice(0, 2).map((finding) => (
            <div key={finding.id} className="rounded-[20px] bg-watch-soft p-4">
              <p>{finding.title}</p>
              <p className="text-sm text-muted">{finding.action ?? finding.message}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-[20px] bg-white p-4">
          {status === 'none' ? 'Not measured today. Add these readings at your next check-in.' : 'No issues today.'}
        </p>
      )}

      <div>
        <p className="mb-2">What you can do</p>
        <ol className="space-y-2">
          {region.countermeasures.map((item, index) => (
            <li key={item} className="flex gap-3 rounded-[20px] bg-white p-4 text-sm">
              <span className="text-muted">{index + 1}</span>
              {item}
            </li>
          ))}
        </ol>
      </div>

      <ResearchList key={region.id} regionId={region.id} />
    </Card>
  )
}
