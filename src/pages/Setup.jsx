// The first-run setup: step 1 (about you) then step 2 (baseline). Step 3 is the first check-in.

import { useState } from 'react'
import BaselineStep from '../components/setup/BaselineStep.jsx'
import ProfileStep from '../components/setup/ProfileStep.jsx'

// onCancel goes back to the landing page; the desktop app has none, so it passes onDemo instead.
export default function Setup({ onCancel, onDemo, onFinish }) {
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState(null)

  function handleProfile(details) {
    setProfile(details)
    setStep(2)
  }

  function handleBaseline(baselineChoice) {
    onFinish({ ...profile, ...baselineChoice })
  }

  return (
    <div className="w-full max-w-2xl">
      {step === 1 && <ProfileStep onBack={onCancel} onDemo={onDemo} onNext={handleProfile} />}
      {step === 2 && <BaselineStep onBack={() => setStep(1)} onNext={handleBaseline} />}
    </div>
  )
}
