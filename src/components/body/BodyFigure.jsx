// The body model with a clickable dot for each region.
// The image and the dots share one 200 × 484 canvas, so the dots stay in place at any size.

import { REGIONS } from '../../data/regions.js'
import bodyModel from '../../assets/body-model.webp'
import Hotspot from './Hotspot.jsx'

export default function BodyFigure({ regionStatus, selectedId, onSelect }) {
  return (
    <svg viewBox="0 0 200 484" className="mx-auto h-[560px] max-w-full overflow-visible sm:h-[680px]" role="group" aria-label="Body regions">
      <image href={bodyModel} x="0" y="0" width="200" height="484" preserveAspectRatio="xMidYMid meet" />
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
