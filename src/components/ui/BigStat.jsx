// A label with a big number underneath. The colored bar in front shows the status.
// With no value (null or "—") it renders nothing, so empty cards stay quiet.

import { STATUS } from '../../lib/ui.js'

export function isMissing(value) {
  return value === null || value === undefined || value === '—'
}

export default function BigStat({ label, value, unit, status = 'none', align = 'left' }) {
  if (isMissing(value)) return <div aria-hidden="true" />

  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      <p className="text-sm opacity-60">{label}</p>
      <p className={`mt-1 flex items-center gap-2 ${align === 'right' ? 'justify-end' : ''}`}>
        <span className={`h-9 w-1.5 rounded-full ${STATUS[status].bar}`} />
        <span className="text-3xl font-light tabular-nums 2xl:text-4xl">{value}</span>
        {unit && <span className="self-end pb-1 text-sm opacity-60">{unit}</span>}
      </p>
    </div>
  )
}
