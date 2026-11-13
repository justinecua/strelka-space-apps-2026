// A horizontal scale with a shaded "normal" band and a marker for one reading.

export default function RangeBar({ min, max, bandLow, bandHigh, value, flagged }) {
  const toPercent = (number) => ((number - min) / (max - min)) * 100

  return (
    <div className="relative h-8">
      <div className="absolute inset-x-0 top-3 h-2 rounded-full bg-field" />
      <div
        className="absolute top-3 h-2 rounded-full bg-good"
        style={{ left: `${toPercent(bandLow)}%`, width: `${toPercent(bandHigh) - toPercent(bandLow)}%` }}
      />
      <div className="absolute top-0 h-8 w-1.5 rounded-full" style={{ left: `${toPercent(value)}%`, background: flagged ? '#e5674f' : 'var(--color-ink)' }} />
    </div>
  )
}
