// The Relax page: a guided breathing break. Opened from the Relax tab in the navigation.

import StressBreak from '../components/today/StressBreak.jsx'

export default function Relax({ highStress = false }) {
  return (
    // Same outer width as the History page, so the heading stays in the same place when you switch tabs.
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-5xl sm:text-6xl">Relax</h1>
        <p className="mt-2 text-muted">
          {highStress
            ? 'Your last stress reading was high. Take a short break to settle.'
            : 'Take a short breathing break whenever you need one.'}
        </p>
      </div>
      <div className="max-w-2xl">
        <StressBreak />
      </div>
    </div>
  )
}