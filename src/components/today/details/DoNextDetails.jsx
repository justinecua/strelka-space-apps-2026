// Full-screen detail for "Do next": every finding, not just the top 3, with the full instructions and a tick box.

import { REGION_BY_ID } from '../../../data/regions.js'
import { STATUS } from '../../../lib/ui.js'
import CheckCircle from '../../ui/CheckCircle.jsx'
import Icon from '../../ui/Icon.jsx'
import StatusBadge from '../../ui/StatusBadge.jsx'

export default function DoNextDetails({ findings, doneIds, onToggle }) {
  if (findings.length === 0) return <p className="text-muted">Nothing to do. All readings look normal.</p>

  return (
    <ul className="space-y-3">
      {findings.map((finding) => {
        const done = doneIds.includes(finding.id)
        return (
          <li key={finding.id}>
            <button
              type="button"
              onClick={() => onToggle(finding.id)}
              aria-pressed={done}
              className="flex w-full items-start gap-4 rounded-[24px] bg-field p-5 text-left transition hover:opacity-90"
            >
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-black ${STATUS[finding.status].bar}`}>
                <Icon name={REGION_BY_ID[finding.region].icon} size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className={`text-lg ${done ? 'line-through opacity-50' : ''}`}>{finding.title}</span>
                  <StatusBadge status={finding.status} />
                </span>
                <span className="mt-1 block text-sm text-muted">
                  {REGION_BY_ID[finding.region].name} · {finding.message}
                </span>
                {finding.action && <span className="mt-2 block">{finding.action}</span>}
              </span>
              <CheckCircle checked={done} />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
