// Sleep bars for the last week, with sleep and mood numbers. The expand button opens sleep, mood, stress and exercise in full screen.

import { useState } from 'react'
import { INDICATOR_BY_ID } from '../../data/indicators.js'
import { statusOf } from '../../lib/status.js'
import { formatValue } from '../../lib/ui.js'
import StatusBars from '../charts/StatusBars.jsx'
import FullScreen from '../ui/FullScreen.jsx'
import VitalDetails from './details/VitalDetails.jsx'
import StatCard from './StatCard.jsx'

export default function SleepMoodCard({ state, result }) {
  const [open, setOpen] = useState(false)
  const sleepIndicator = INDICATOR_BY_ID.sleep
  const bars = state.entries.slice(-7).map((entry) => ({
    day: entry.day,
    value: entry.sleep ?? 0,
    status: statusOf(sleepIndicator, entry.sleep, state.baseline.sleep).status,
  }))
  const { sleep, mood } = result.readings

  return (
    <>
      <StatCard
        title="Sleep & mood"
        tone="gray"
        onExpand={() => setOpen(true)}
        chart={<StatusBars data={bars} />}
        left={{ label: 'Sleep', value: formatValue(sleepIndicator, sleep.value), unit: 'h', status: sleep.status }}
        right={{ label: 'Mood', value: formatValue(INDICATOR_BY_ID.mood, mood.value), unit: '/5', status: mood.status }}
      />
      {open && (
        <FullScreen title="Sleep & mood" subtitle="Sleep, mood, stress and exercise over the last 60 days." onClose={() => setOpen(false)}>
          <VitalDetails indicatorIds={['sleep', 'mood', 'stress', 'exercise']} state={state} result={result} />
        </FullScreen>
      )}
    </>
  )
}
