// Two lines with no axes, like the small chart on the first card. Each line is scaled to fit on its own.
// The dark line uses the text color (currentColor), so it flips with light and dark mode.

import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts'

export default function TwoLineChart({ data, firstKey, secondKey }) {
  return (
    <div className="text-ink">
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 8, right: 4, bottom: 8, left: 4 }}>
          <YAxis yAxisId="first" hide domain={['dataMin - 2', 'dataMax + 2']} />
          <YAxis yAxisId="second" hide domain={['dataMin - 2', 'dataMax + 2']} />
          <Line type="basis" yAxisId="first" dataKey={firstKey} stroke="#52c07c" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="basis" yAxisId="second" dataKey={secondKey} stroke="currentColor" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
