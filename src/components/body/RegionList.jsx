// The body regions as a list beside the figure. Each row shows the region's status in words,
// so the list also explains the marker colors. The selected row is filled.

import { REGIONS } from '../../data/regions.js'
import { STATUS } from '../../lib/ui.js'
import Icon from '../ui/Icon.jsx'

export default function RegionList({ regionStatus, selectedId, onSelect }) {
  return (
    <ul className="stagger space-y-1">
      {REGIONS.map((region, index) => {
        const isSelected = region.id === selectedId
        const status = regionStatus[region.id] ?? 'none'
        const style = STATUS[status]
        return (
          <li key={region.id} style={{ '--i': index }}>
            <button
              type="button"
              onClick={() => onSelect(region.id)}
              aria-pressed={isSelected}
              className={`flex w-full items-center gap-3 rounded-2xl p-1.5 pr-3 text-left transition ${
                isSelected ? 'bg-white' : 'hover:bg-white/50'
              }`}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 transition-colors duration-300 ${
                  isSelected ? 'bg-ink text-white' : 'bg-white'
                }`}
                style={{ borderColor: style.hex }}
              >
                <Icon name={region.icon} size={18} weight="regular" />
              </span>
              <span className="flex-1 truncate">{region.name}</span>
              <span className={`text-sm ${status === 'green' ? 'text-muted' : style.text}`}>{style.label}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
