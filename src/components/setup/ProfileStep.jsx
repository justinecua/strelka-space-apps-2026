import { useState } from 'react'
import { MISSIONS } from '../../data/missions.js'
import { todayDate } from '../../lib/entries.js'
import Button from '../ui/Button.jsx'
import StepHeader from './StepHeader.jsx'

const FIELD = 'mt-2 w-full rounded-full bg-field px-5 py-3 outline-none focus:ring-2 focus:ring-ink'

export default function ProfileStep({ onBack, onNext }) {
  const [name, setName] = useState('')
  const [missionId, setMissionId] = useState('transit')
  const [startDate, setStartDate] = useState(todayDate())

  function handleSubmit(event) {
    event.preventDefault()
    onNext({ name: name.trim(), missionId, startDate })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <StepHeader step={1} title="About you" text="This is only stored on this device." />

      <label className="block">
        <span>Your name</span>
        <input required value={name} onChange={(event) => setName(event.target.value)} className={FIELD} />
      </label>

      <label className="block">
        <span>Where are you?</span>
        <select value={missionId} onChange={(event) => setMissionId(event.target.value)} className={FIELD}>
          {MISSIONS.map((mission) => (
            <option key={mission.id} value={mission.id}>
              {mission.name}
            </option>
          ))}
        </select>
        <span className="mt-1 block pl-5 text-sm text-muted">Used to warn you when ground support is far away.</span>
      </label>

      <label className="block">
        <span>Mission start date</span>
        <input
          type="date"
          required
          max={todayDate()}
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          className={FIELD}
        />
        <span className="mt-1 block pl-5 text-sm text-muted">Mission days are counted from this date.</span>
      </label>

      <div className="flex justify-between">
        <button type="button" onClick={onBack} className="underline">
          Back
        </button>
        <Button type="submit">Next</Button>
      </div>
    </form>
  )
}
