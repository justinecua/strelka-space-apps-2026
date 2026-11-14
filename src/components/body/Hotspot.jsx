// A clickable marker on the body figure: the region's icon in a circle, edged in its status color.
// The selected marker is filled. Markers that need attention pulse.

import { isFlagged } from '../../lib/status.js'
import { STATUS } from '../../lib/ui.js'
import Icon from '../ui/Icon.jsx'

const R = 9
const ICON = 10

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
      aria-label={`${region.name}: ${STATUS[status].label}`}
      aria-pressed={isSelected}
      onClick={() => onSelect(region.id)}
      onKeyDown={handleKeyDown}
      className="hotspot group cursor-pointer outline-none"
    >
      <title>{`${region.name} · ${STATUS[status].label}`}</title>
      {isFlagged(status) && <circle cx={x} cy={y} r={R} fill={color} className="pulse-ring" />}
      <g className="hotspot-marker">
        <circle
          cx={x}
          cy={y}
          r={R}
          strokeWidth="2"
          stroke={color}
          style={{
            fill: isSelected ? 'var(--color-ink)' : 'var(--color-white)',
          }}
          className="transition-[fill]"
        />
        <circle
          cx={x}
          cy={y}
          r={R + 3}
          fill="none"
          strokeWidth="1"
          className="opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-100"
          style={{ stroke: 'var(--color-ink)' }}
        />
        <g
          transform={`translate(${x - ICON / 2} ${y - ICON / 2})`}
          style={{
            color: isSelected ? 'var(--color-white)' : 'var(--color-ink)',
          }}
        >
          <Icon name={region.icon} size={ICON} weight="regular" />
        </g>
      </g>
    </g>
  )
}
