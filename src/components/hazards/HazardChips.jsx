// A row of NASA hazard pills. Clicking one opens a short explanation.

import { useState } from 'react'
import { HAZARD_BY_ID } from '../../data/hazards.js'
import Icon from '../ui/Icon.jsx'
import HazardDialog from './HazardDialog.jsx'

export default function HazardChips({ hazardIds, className = '' }) {
  const [openId, setOpenId] = useState(null)

  return (
    <>
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {hazardIds.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setOpenId(id)}
            className="flex items-center gap-2 rounded-full border border-ink/30 bg-white px-4 py-2 text-sm transition hover:border-ink"
          >
            <Icon name={HAZARD_BY_ID[id].icon} size={18} />
            {HAZARD_BY_ID[id].name}
          </button>
        ))}
      </div>

      {openId && <HazardDialog hazard={HAZARD_BY_ID[openId]} onClose={() => setOpenId(null)} />}
    </>
  )
}
