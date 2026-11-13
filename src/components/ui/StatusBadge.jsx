import { STATUS } from '../../lib/ui.js'
import Badge from './Badge.jsx'

export default function StatusBadge({ status, label }) {
  const style = STATUS[status] ?? STATUS.none
  return <Badge tone={style.tone}>{label ?? style.label}</Badge>
}
