// Pick a past date to add a check-in you missed. Only dates between the mission start and today are allowed.

import { useState } from 'react'
import { todayDate } from '../../lib/entries.js'
import { missionDayOn } from '../../lib/mission.js'
import Button from '../ui/Button.jsx'

export default function AddMissedDay({ startDate, entries, onAdd }) {
  const today = todayDate()
  const [date, setDate] = useState(today)
  const [message, setMessage] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const day = missionDayOn(startDate, date)
    if (entries.some((entry) => entry.day === day)) {
      setMessage(`You already have a check-in for day ${day}. Open it in the list to edit it.`)
      return
    }
    setMessage('')
    onAdd({ day, loggedOn: date })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[24px] bg-mint p-5">
      <p className="text-lg">Missed a day?</p>
      <p className="text-sm text-muted">Pick the date and fill in what you measured.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="date"
          required
          value={date}
          min={startDate}
          max={today}
          onChange={(event) => setDate(event.target.value)}
          aria-label="Check-in date"
          className="rounded-full bg-white px-5 py-2.5 outline-none focus:ring-2 focus:ring-ink"
        />
        <Button type="submit" icon="plus">
          Add check-in
        </Button>
      </div>
      {message && (
        <p className="mt-2 text-sm text-danger" role="status">
          {message}
        </p>
      )}
    </form>
  )
}
