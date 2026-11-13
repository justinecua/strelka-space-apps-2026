// The body regions as pills, like the filter chips in the design. The selected one is filled.

import { REGIONS } from '../../data/regions.js'
import Icon from '../ui/Icon.jsx'
import StatusDot from '../ui/StatusDot.jsx'

export default function RegionChips({ regionStatus, selectedId, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {REGIONS.map((region) => {
        const isSelected = region.id === selectedId
        return (
          <button
            key={region.id}
            type="button"
            onClick={() => onSelect(region.id)}
            aria-pressed={isSelected}
            className={`flex items-center gap-2 rounded-full border px-4 py-2.5 transition ${
              isSelected ? 'border-transparent bg-mint' : 'border-ink/30 hover:border-ink'
            }`}
          >
            <Icon name={region.icon} size={18} />
            {region.name}
            <StatusDot status={regionStatus[region.id]} />
          </button>
        )
      })}
    </div>
  )
}
