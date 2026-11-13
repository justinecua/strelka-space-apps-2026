// Heart rate and blood pressure. The expand button opens every heart reading in full screen.

import { useState } from 'react'
import { INDICATOR_BY_ID } from '../../data/indicators.js'
import { formatValue } from '../../lib/ui.js'
import TwoLineChart from '../charts/TwoLineChart.jsx'
import FullScreen from '../ui/FullScreen.jsx'
import VitalDetails from './details/VitalDetails.jsx'
import StatCard from './StatCard.jsx'

export default function HeartCard({ state, result }) {
  const [open, setOpen] = useState(false)
  const recent = state.entries.slice(-14)
  const { hr, sbp } = result.readings

  return (
    <>
      <StatCard
        title="Heart"
        tone="mint"
        onExpand={() => setOpen(true)}
        chart={<TwoLineChart data={recent} firstKey="hr" secondKey="sbp" />}
        left={{ label: 'Heart rate', value: formatValue(INDICATOR_BY_ID.hr, hr.value), unit: 'bpm', status: hr.status }}
        right={{ label: 'Blood pressure', value: formatValue(INDICATOR_BY_ID.sbp, sbp.value), unit: 'mmHg', status: sbp.status }}
      />
      {open && (
        <FullScreen title="Heart" subtitle="Heart rate and blood pressure over the last 60 days." onClose={() => setOpen(false)}>
          <VitalDetails indicatorIds={['hr', 'sbp', 'dbp']} state={state} result={result} />
        </FullScreen>
      )}
    </>
  )
}
