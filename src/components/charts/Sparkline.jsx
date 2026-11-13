// A tiny trend line with no axes, drawn as plain SVG. Used in the list layout rows.

export default function Sparkline({ values, width = 96, height = 28, color = 'currentColor' }) {
  const points = values.filter((value) => value !== null && value !== undefined)
  if (points.length < 2) return <svg width={width} height={height} aria-hidden="true" />

  const lowest = Math.min(...points)
  const highest = Math.max(...points)
  const range = highest - lowest || 1
  const coords = points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * width
      const y = height - 3 - ((value - lowest) / range) * (height - 6)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} aria-hidden="true">
      <polyline points={coords} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
