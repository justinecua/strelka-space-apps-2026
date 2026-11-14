// Blood oxygen and glucose. The expand button opens oxygen, glucose and temperature in full screen.

import { useState } from 'react'
import { INDICATOR_BY_ID } from '../../data/indicators.js'
import { hasAnyValue } from '../../lib/chartData.js'
import { formatValue } from '../../lib/ui.js'
import SoftAreaChart from '../charts/SoftAreaChart.jsx'
import FullScreen from '../ui/FullScreen.jsx'
import VitalDetails from './details/VitalDetails.jsx'
import StatCard from './StatCard.jsx'

export default function BloodCard({ state, result }) {
  const [open, setOpen] = useState(false)
  const { spo2, glucose } = result.readings

  return (
    <>
      <StatCard
        title="Blood"
        tone="cream"
        onExpand={() => setOpen(true)}
        chart={<SoftAreaChart data={state.entries.slice(-14)} dataKey="glucose" />}
        emptyText={hasAnyValue(state.entries.slice(-14), ['glucose']) ? null : 'No glucose readings yet'}
        left={{ label: 'Oxygen', value: formatValue(INDICATOR_BY_ID.spo2, spo2.value), unit: '%', status: spo2.status }}
        right={{ label: 'Glucose', value: formatValue(INDICATOR_BY_ID.glucose, glucose.value), unit: 'mg/dL', status: glucose.status }}
      />
      {open && (
        <FullScreen title="Blood" subtitle="Oxygen, glucose and body temperature over the last 60 days." onClose={() => setOpen(false)}>
          <VitalDetails indicatorIds={['spo2', 'glucose', 'temp']} state={state} result={result} />
        </FullScreen>
      )}
    </>
  )
}
