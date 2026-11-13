// Rounded bars, each colored by its status (green normal, yellow watch).

import { Bar, BarChart, Cell, ResponsiveContainer, YAxis } from 'recharts'
import { STATUS } from '../../lib/ui.js'

export default function StatusBars({ data }) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }} barCategoryGap="18%">
        <YAxis hide domain={[0, 'dataMax']} />
        <Bar dataKey="value" radius={[14, 14, 14, 14]} isAnimationActive={false}>
          {data.map((point) => (
            <Cell key={point.day} fill={STATUS[point.status].hex} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
