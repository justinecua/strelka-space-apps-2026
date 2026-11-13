// A clickable dot on the body figure, colored by status. Dots that need attention pulse.

import { isFlagged } from '../../lib/status.js'
import { STATUS } from '../../lib/ui.js'

export default function Hotspot({ region, status = 'green', isSelected, onSelect }) {
  const [x, y] = region.spot
  const color = STATUS[status].hex

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(region.id)
    }
  }

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={region.name}
      onClick={() => onSelect(region.id)}
      onKeyDown={handleKeyDown}
      className="cursor-pointer outline-none"
    >
      {isFlagged(status) && <circle cx={x} cy={y} r="7" fill={color} className="pulse-ring" />}
      <circle cx={x} cy={y} r="14" fill="transparent" />
      {isSelected && <circle cx={x} cy={y} r="12" fill="none" style={{ stroke: 'var(--color-ink)' }} strokeWidth="2" />}
      <circle cx={x} cy={y} r="6.5" fill={color} style={{ stroke: 'var(--color-ink)' }} strokeWidth="1.5" />
    </g>
  )
}
