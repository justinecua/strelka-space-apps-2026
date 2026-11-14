// Everything about the selected body region: its readings as big numbers, any issue, and what to do.

import { INDICATOR_BY_ID } from '../../data/indicators.js'
import { risksForRegion } from '../../lib/risks.js'
import { STATUS, formatValue } from '../../lib/ui.js'
import HazardChips from '../hazards/HazardChips.jsx'
import BigStat from '../ui/BigStat.jsx'
import ResearchList from './ResearchList.jsx'
import Card from '../ui/Card.jsx'
import Icon from '../ui/Icon.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'

function SectionTitle({ icon, children }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-sm text-muted">
      <Icon name={icon} size={18} />
      {children}
    </h3>
  )
}

export default function RegionDetail({ region, status, result }) {
  const findings = result.findings.filter((finding) => finding.region === region.id)
  const risks = risksForRegion(region.id)

  const stats = region.indicators.filter((id) => result.readings[id]?.value != null)

  return (
    <Card className="swap-in flex flex-col gap-7">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white">
            <Icon name={region.icon} size={24} />
          </span>
          <div>
            <h2 className="text-3xl">{region.name}</h2>
            <p className="text-muted">{region.func}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {stats.length > 0 ? (
        <div>
          <SectionTitle icon="pulse">Today's readings</SectionTitle>
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 rounded-[20px] bg-white p-5 sm:grid-cols-3">
            {stats.map((id) => {
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
        </div>
      ) : (
        <p className="text-muted">
          {region.indicators.length > 0
            ? 'Not measured today. Add these readings at your next check-in.'
            : 'No daily reading for this region. It is checked through the symptoms you report.'}
        </p>
      )}

      {findings.length > 0 ? (
        <div className="space-y-2">
          {findings.slice(0, 2).map((finding) => (
            <div
              key={finding.id}
              className={`flex gap-3 rounded-[20px] p-4 ${STATUS[finding.status]?.soft ?? 'bg-watch-soft'}`}
            >
              <Icon
                name="warning"
                size={22}
                weight="regular"
                className={`shrink-0 ${STATUS[finding.status]?.text ?? ''}`}
              />
              <div>
                <p>{finding.title}</p>
                <p className="text-sm text-muted">{finding.action ?? finding.message}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        status !== 'none' && (
          <p className="flex items-center gap-3 rounded-[20px] bg-good-soft p-4">
            <Icon name="checkCircle" size={22} weight="regular" className="text-good-dark" />
            No issues today.
          </p>
        )
      )}

      <div>
        <SectionTitle icon="tasks">What you can do</SectionTitle>
        <ol className="stagger divide-y divide-ink/10">
          {region.countermeasures.map((item, index) => (
            <li key={item} style={{ '--i': index }} className="flex items-start gap-3 py-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-xs tabular-nums">
                {index + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      </div>

      <div className="border-t border-ink/10 pt-5">
        <SectionTitle icon="planet">Spaceflight hazards</SectionTitle>
        <HazardChips hazardIds={region.hazards} />
        {risks.length > 0 && (
          <p className="mt-3 text-sm text-muted">
            NASA risks checked here: {risks.map((risk) => risk.name).join(', ')}
          </p>
        )}
      </div>

      <ResearchList key={region.id} regionId={region.id} />
    </Card>
  )
}
