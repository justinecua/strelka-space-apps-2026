import { STATUS } from '../../lib/ui.js'

export default function StatusDot({ status }) {
  const style = STATUS[status] ?? STATUS.none
  return <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${style.bar}`} />
}
