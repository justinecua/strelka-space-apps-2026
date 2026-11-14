// The middle of the top bar: a greeting, then small status chips for the mission day, Eastern and
// Philippine time, and how long a message takes to reach Earth.
// Wide screens only; phones keep the top bar short.

import { greetingFor, useNow } from '../../lib/useNow.js'
import Icon from '../ui/Icon.jsx'

// Two ground clocks: US Eastern time and Philippine time.
const CLOCKS = [
  { zone: 'America/New_York', short: 'ET', name: 'Eastern time' },
  { zone: 'Asia/Manila', short: 'PH', name: 'Philippine time' },
]

function timeIn(now, timeZone) {
  return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone })
}

function Chip({ icon, label, children }) {
  return (
    <span className="flex items-center gap-2 rounded-full bg-field px-3.5 py-2 text-sm whitespace-nowrap" title={label}>
      {icon}
      <span className="sr-only">{label}: </span>
      {children}
    </span>
  )
}

export default function HeaderStatus({ name, day, mission }) {
  const now = useNow(30_000)
  const firstName = name?.split(' ')[0]

  return (
    <div className="hidden min-w-0 flex-1 items-center gap-6 lg:flex">
      <span className="h-8 w-px bg-line" aria-hidden="true" />
      <p className="truncate text-muted">
        {greetingFor(now)}
        {firstName && <span className="text-ink">, {firstName}</span>}
      </p>

      <div className="ml-auto hidden items-center gap-2 xl:flex">
        {day != null && (
          <Chip label="Mission day" icon={<Icon name="planet" size={16} className="text-muted" />}>
            Day {day}
          </Chip>
        )}
        {CLOCKS.map((clock) => (
          <Chip key={clock.zone} label={clock.name}>
            <span className="text-muted">{clock.short}</span>
            <span className="tabular-nums">{timeIn(now, clock.zone)}</span>
          </Chip>
        ))}
        <Chip label="Signal delay to Earth" icon={<Icon name="earth" size={16} className="text-muted" />}>
          <span className="text-muted">Earth</span> {mission.delayLabel}
        </Chip>
      </div>
    </div>
  )
}
