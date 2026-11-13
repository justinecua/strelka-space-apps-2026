import { CALIBRATION_DAYS } from '../../lib/baseline.js'
import Card from '../ui/Card.jsx'

export default function CalibrationNotice({ checkInsDone }) {
  const percent = (checkInsDone / CALIBRATION_DAYS) * 100

  return (
    <Card tone="cream">
      <p className="text-lg">
        Getting to know your normal: {checkInsDone} of {CALIBRATION_DAYS} check-ins
      </p>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-good" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-3 text-sm text-muted">
        Until then, we compare your readings with general healthy ranges. After {CALIBRATION_DAYS} check-ins, we'll
        compare them with what's normal for you.
      </p>
    </Card>
  )
}
