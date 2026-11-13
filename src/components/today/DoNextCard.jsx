// The top 3 things to do today: just the titles, with the how-to in the icon's bubble.
// Ticks are saved, and reset when a new day's check-in comes in.

import { useState } from 'react'
import { REGION_BY_ID } from '../../data/regions.js'
import { STATUS } from '../../lib/ui.js'
import Card from '../ui/Card.jsx'
import CheckCircle from '../ui/CheckCircle.jsx'
import FullScreen from '../ui/FullScreen.jsx'
import IconTip from '../ui/IconTip.jsx'
import DoNextDetails from './details/DoNextDetails.jsx'

const MAX_ITEMS = 3

export default function DoNextCard({ result, doneIds, onToggle }) {
  const [open, setOpen] = useState(false)
  const items = result.findings.slice(0, MAX_ITEMS)
  const hiddenCount = result.findings.length - items.length
  const doneCount = items.filter((item) => doneIds.includes(item.id)).length

  return (
    <>
      <Card
        title="Do next"
        tone="dark"
        onExpand={() => setOpen(true)}
        action={
          items.length > 0 && (
            <span className="text-sm opacity-60">
              {doneCount} of {items.length} done
            </span>
          )
        }
      >
        {items.length === 0 && <p className="opacity-60">Nothing to do. All readings look normal.</p>}

        <ul className="space-y-2">
          {items.map((finding) => {
            const done = doneIds.includes(finding.id)
            return (
              <li key={finding.id} className="flex items-center gap-3 rounded-[20px] bg-white/10 p-3 pl-4">
                <IconTip
                  icon={REGION_BY_ID[finding.region].icon}
                  title={finding.title}
                  text={finding.action ?? finding.message}
                  light
                  align="left"
                  className={`${STATUS[finding.status].bar} text-black`}
                />
                <button
                  type="button"
                  onClick={() => onToggle(finding.id)}
                  aria-pressed={done}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-[14px] p-1 text-left"
                >
                  <span className={`min-w-0 flex-1 ${done ? 'line-through opacity-50' : ''}`}>{finding.title}</span>
                  <CheckCircle checked={done} />
                </button>
              </li>
            )
          })}
        </ul>

        {hiddenCount > 0 && <p className="mt-3 text-sm opacity-60">+{hiddenCount} more. Open full screen to see all.</p>}
      </Card>
      {open && (
        <FullScreen title="Do next" subtitle="Everything today's check-in found, with what to do." onClose={() => setOpen(false)}>
          <DoNextDetails findings={result.findings} doneIds={doneIds} onToggle={onToggle} />
        </FullScreen>
      )}
    </>
  )
}
