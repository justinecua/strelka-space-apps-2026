// The body figure with a clickable dot for each region.

import { REGIONS } from '../../data/regions.js'
import BodySilhouette from './BodySilhouette.jsx'
import Hotspot from './Hotspot.jsx'

export default function BodyFigure({ regionStatus, selectedId, onSelect }) {
  return (
    <svg viewBox="0 0 200 420" className="mx-auto h-[520px] max-w-full" role="group" aria-label="Body regions">
      <BodySilhouette />
      {REGIONS.map((region) => (
        <Hotspot
          key={region.id}
          region={region}
          status={regionStatus[region.id]}
          isSelected={region.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </svg>
  )
}
