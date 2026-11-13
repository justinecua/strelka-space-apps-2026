// Explains one NASA hazard: what it is, and what Strelka does about it.

import { NASA_HAZARDS_URL } from '../../data/hazards.js'
import { NASA_RISKS_URL } from '../../data/risks.js'
import { risksForHazard } from '../../lib/risks.js'
import Icon from '../ui/Icon.jsx'
import Modal from '../ui/Modal.jsx'
import RiskList from './RiskList.jsx'

export default function HazardDialog({ hazard, onClose }) {
  return (
    <Modal title={hazard.name} onClose={onClose}>
      <span className="mt-4 grid h-14 w-14 place-items-center rounded-full bg-mint">
        <Icon name={hazard.icon} size={28} />
      </span>
      <p className="mt-4">{hazard.summary}</p>

      <div className="mt-5 rounded-[20px] bg-field p-4">
        <p className="text-sm text-muted">What Strelka does</p>
        <p className="mt-1">{hazard.inApp}</p>
      </div>

      <p className="mb-2 mt-6">NASA health risks linked to this hazard</p>
      <RiskList risks={risksForHazard(hazard.id)} />

      <div className="mt-5 flex flex-col gap-2">
        <a href={NASA_HAZARDS_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 underline hover:text-muted">
          NASA: 5 Hazards of Human Spaceflight
          <Icon name="external" size={16} />
        </a>
        <a href={NASA_RISKS_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 underline hover:text-muted">
          NASA: Risks of Human Spaceflight
          <Icon name="external" size={16} />
        </a>
      </div>
    </Modal>
  )
}
