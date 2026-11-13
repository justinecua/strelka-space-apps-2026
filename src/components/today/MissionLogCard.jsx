// One dot per recent day: green when the day was fine, yellow or red when it needed attention.
// The expand button lists every flagged day and what was found.

import { useState } from 'react'
import { recentDays } from '../../lib/missionLog.js'
import DotGrid from '../charts/DotGrid.jsx'
import FullScreen from '../ui/FullScreen.jsx'
import MissionLogDetails from './details/MissionLogDetails.jsx'
import StatCard from './StatCard.jsx'

export default function MissionLogCard({ state }) {
  const [open, setOpen] = useState(false)
  const days = recentDays(state.entries, state.baseline)
  const goodDays = days.filter((day) => day.ok).length
  const flaggedDays = days.length - goodDays
  const goodPercent = Math.round((goodDays / days.length) * 100)

  return (
    <>
      <StatCard
        title={days.length === 1 ? 'Last day' : `Last ${days.length} days`}
        tone="dark"
        onExpand={() => setOpen(true)}
        chart={<DotGrid days={days} />}
        left={{ label: 'Good days', value: `${goodPercent}%`, status: goodPercent >= 80 ? 'green' : 'yellow' }}
        right={{ label: 'Flagged', value: flaggedDays, status: flaggedDays > 0 ? 'yellow' : 'green' }}
      />
      {open && (
        <FullScreen title="Mission log" subtitle={`${goodPercent}% good days · ${flaggedDays} flagged`} onClose={() => setOpen(false)}>
          <MissionLogDetails days={days} />
        </FullScreen>
      )}
    </>
  )
}
