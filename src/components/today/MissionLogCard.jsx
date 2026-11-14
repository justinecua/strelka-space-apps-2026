// One dot per recent day: green when the day was fine, yellow or red when it needed attention,
// gray when the check-in had no readings. The expand button lists every flagged day and what was found.

import { useState } from 'react'
import { useVoiceEvent } from '../../lib/voiceEvents.js'
import { recentDays, summarizeDays } from '../../lib/missionLog.js'
import DotGrid from '../charts/DotGrid.jsx'
import FullScreen from '../ui/FullScreen.jsx'
import MissionLogDetails from './details/MissionLogDetails.jsx'
import StatCard from './StatCard.jsx'

export default function MissionLogCard({ state }) {
  const [open, setOpen] = useState(false)
  // "open the missionLog card" by voice opens it full screen.
  useVoiceEvent('open-card', ({ card }) => (card === 'missionLog' ? setOpen(true) : false))
  const days = recentDays(state.entries, state.baseline)
  const { flagged, goodPercent } = summarizeDays(days)
  const noData = goodPercent === null

  return (
    <>
      <StatCard
        title={days.length === 1 ? 'Last day' : `Last ${days.length} days`}
        tone="dark"
        onExpand={() => setOpen(true)}
        chart={<DotGrid days={days} />}
        emptyText={noData ? 'No readings to score yet' : null}
        emptyShape="dots"
        left={{ label: 'Good days', value: noData ? null : `${goodPercent}%`, status: noData ? 'none' : goodPercent >= 80 ? 'green' : 'yellow' }}
        right={{ label: 'Flagged', value: noData ? null : flagged, status: noData ? 'none' : flagged > 0 ? 'yellow' : 'green' }}
      />
      {open && (
        <FullScreen
          title="Mission log"
          subtitle={noData ? 'No check-ins with readings yet.' : `${goodPercent}% good days · ${flagged} flagged`}
          onClose={() => setOpen(false)}
        >
          <MissionLogDetails days={days} />
        </FullScreen>
      )}
    </>
  )
}
