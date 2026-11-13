// Explains the main idea of the app: the same heart rate passes a textbook check but is flagged against your own normal.

import { DEMO_BASELINE as BASELINE } from '../../data/astronaut.js'
import { INDICATOR_BY_ID } from '../../data/indicators.js'
import { SOURCES } from '../../data/sources.js'
import Button from '../ui/Button.jsx'
import Modal from '../ui/Modal.jsx'
import RangeBar from './RangeBar.jsx'

const EXAMPLE_HR = 80

export default function WhyBaselineDialog({ onClose }) {
  const heartRate = INDICATOR_BY_ID.hr
  const personalLow = BASELINE.hr - heartRate.tolerance
  const personalHigh = BASELINE.hr + heartRate.tolerance

  return (
    <Modal title="Why compare with your normal?" onClose={onClose}>
        <p className="mt-2 text-sm text-muted">
          Textbook ranges are based on people on Earth. In space, every body changes in its own way, so a change from
          what's normal for you is often the first sign something is off.
        </p>

        <p className="mt-5 text-sm font-medium">
          For example: an astronaut whose usual heart rate is {BASELINE.hr} bpm measures {EXAMPLE_HR} bpm
        </p>

        <div className="mt-3 flex justify-between text-sm">
          <span>Textbook range {heartRate.yellowLow}–{heartRate.yellowHigh}</span>
          <span className="text-good-dark">Looks fine</span>
        </div>
        <RangeBar min={40} max={120} bandLow={heartRate.yellowLow} bandHigh={heartRate.yellowHigh} value={EXAMPLE_HR} />

        <div className="mt-3 flex justify-between text-sm">
          <span>
            Their normal range {personalLow}–{personalHigh}
          </span>
          <span className="text-danger">Worth a look (+{EXAMPLE_HR - BASELINE.hr})</span>
        </div>
        <RangeBar min={40} max={120} bandLow={personalLow} bandHigh={personalHigh} value={EXAMPLE_HR} flagged />

        <p className="mt-5 text-xs text-muted">
          Sources:{' '}
          {SOURCES.map((source, index) => (
            <span key={source.url}>
              {index > 0 && ' · '}
              <a href={source.url} target="_blank" rel="noreferrer" className="underline">
                {source.label}
              </a>
            </span>
          ))}
        </p>

        <Button onClick={onClose} className="mt-5 w-full">
          Got it
        </Button>
    </Modal>
  )
}
