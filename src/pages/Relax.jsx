// The Relax page: a guided breathing break. Opened from the Relax tab in the navigation.

import StressBreak from '../components/today/StressBreak.jsx'

export default function Relax({ highStress }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-5xl sm:text-6xl">Relax</h1>
        <p className="mt-2 text-muted">
          {highStress
            ? 'Your last stress reading was high. Take a short break to settle.'
            : 'Take a short breathing break whenever you need one.'}
        </p>
      </div>
      <StressBreak />
    </div>
  )
}