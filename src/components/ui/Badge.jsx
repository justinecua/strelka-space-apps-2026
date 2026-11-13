import { TONES } from '../../lib/ui.js'

export default function Badge({ tone = 'gray', children }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-xs ${TONES[tone]}`}>
      {children}
    </span>
  )
}
