// A soft green area with a dark line on top, like the third card in the design.
// The line uses the text color (currentColor), so it flips with light and dark mode.

import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts'

export default function SoftAreaChart({ data, dataKey }) {
  return (
    <div className="text-ink">
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="soft-green" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#52c07c" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#52c07c" stopOpacity={0.15} />
            </linearGradient>
          </defs>
          <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
          <Area type="monotone" dataKey={dataKey} stroke="currentColor" strokeWidth={1.5} fill="url(#soft-green)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
