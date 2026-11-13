// Explains the dot colors on the body figure.

import { STATUS } from '../../lib/ui.js'
import StatusDot from '../ui/StatusDot.jsx'

const SHOWN = ['green', 'yellow', 'red', 'none']

export default function StatusLegend() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
      {SHOWN.map((status) => (
        <li key={status} className="flex items-center gap-2">
          <StatusDot status={status} />
          {STATUS[status].label}
        </li>
      ))}
    </ul>
  )
}
