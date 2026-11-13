// Line chart of one reading. The dashed line is the astronaut's normal, once they have one.
// A small legend above the chart names both lines, so no label sits on top of the data.

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { chartPoints } from '../../lib/chartData.js'

const TICK = { fill: '#8c8c8c', fontSize: 12 }

export default function VitalChart({ indicator, entries, baseline, days = 30, height = 220 }) {
  const points = chartPoints(entries, indicator.id, days)
  const baselineValue = baseline[indicator.id]

  // Leave some room above and below the data, so the lines never touch the edges.
  const pad = indicator.tolerance / 2
  const round = (value) => Number(value.toFixed(indicator.decimals))
  const domain = [(lowest) => round(lowest - pad), (highest) => round(highest + pad)]

  return (
    <div className="text-ink">
      <div className="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-2">
          <span className="h-[3px] w-5 rounded-full bg-good" aria-hidden="true" />
          Readings
        </span>
        {baselineValue != null && (
          <span className="flex items-center gap-2">
            <span className="w-5 border-t-2 border-dashed border-current text-ink" aria-hidden="true" />
            Your normal: {baselineValue} {indicator.unit}
          </span>
        )}
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 10, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid vertical={false} stroke="rgba(140, 140, 140, 0.3)" strokeDasharray="4 6" />
            <XAxis dataKey="label" tick={TICK} tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis domain={domain} allowDecimals={indicator.decimals > 0} tick={TICK} tickLine={false} axisLine={false} />
            {baselineValue != null && (
              <ReferenceLine
                y={baselineValue}
                stroke="currentColor"
                strokeDasharray="4 4"
                ifOverflow="extendDomain"
              />
            )}
            <Tooltip
              contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', background: 'var(--color-white)', color: 'var(--color-ink)' }}
              formatter={(value) => [`${value} ${indicator.unit}`, indicator.label]}
              labelFormatter={(label) => `Mission day ${label.slice(1)}`}
            />
            <Line type="monotone" dataKey="value" stroke="#52c07c" strokeWidth={3} dot={false} activeDot={{ r: 5 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
