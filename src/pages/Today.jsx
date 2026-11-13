import { useState } from 'react'
import { INDICATORS } from '../data/indicators.js'
import { dayNumberFor, hasCheckedInToday } from '../lib/entries.js'
import { useLayout } from '../lib/layout.js'
import { isFlagged } from '../lib/status.js'
import BloodCard from '../components/today/BloodCard.jsx'
import CalibrationNotice from '../components/today/CalibrationNotice.jsx'
import CheckInDueCard from '../components/today/CheckInDueCard.jsx'
import DoNextCard from '../components/today/DoNextCard.jsx'
import HeartCard from '../components/today/HeartCard.jsx'
import MissionLogCard from '../components/today/MissionLogCard.jsx'
import ReadingsCard from '../components/today/ReadingsCard.jsx'
import SleepMoodCard from '../components/today/SleepMoodCard.jsx'
import StreakCard from '../components/today/StreakCard.jsx'
import TodayHeader from '../components/today/TodayHeader.jsx'
import ListView from '../components/today/list/ListView.jsx'

export default function Today({ state, result, mission, calibration, onToggleDone, onStartCheckIn }) {
  const hasEntries = state.entries.length > 0
  const checkInDue = !state.isDemo && !hasCheckedInToday(state.entries)

  // Show the chart for the first reading that needs attention.
  const firstFlagged = hasEntries && INDICATORS.find((indicator) => isFlagged(result.readings[indicator.id].status))
  const [indicatorId, setIndicatorId] = useState(firstFlagged?.id ?? 'hr')
  const [layout, setLayout] = useLayout()

  // The demo has no calendar date, so its streak counts from the latest entry.
  const todayDay = state.isDemo ? null : dayNumberFor(state.profile, state.entries)

  const heart = <HeartCard state={state} result={result} />
  const sleepMood = <SleepMoodCard state={state} result={result} />
  const blood = <BloodCard state={state} result={result} />
  const missionLog = <MissionLogCard state={state} />
  const streak = <StreakCard entries={state.entries} todayDay={todayDay} />
  const doNext = <DoNextCard result={result} doneIds={state.doneIds} onToggle={onToggleDone} />
  const readings = <ReadingsCard state={state} result={result} selectedId={indicatorId} onSelect={setIndicatorId} />

  return (
    <div className="space-y-5">
      {checkInDue && <CheckInDueCard isFirst={!hasEntries} name={state.profile.name} onStart={onStartCheckIn} />}
      {hasEntries && calibration.calibrating && <CalibrationNotice checkInsDone={calibration.checkInsDone} />}

      {hasEntries && (
        <>
          <TodayHeader state={state} result={result} mission={mission} layout={layout} onLayoutChange={setLayout} />

          {layout === 'grid' ? (
            <>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                {heart}
                {sleepMood}
                {blood}
                {missionLog}
              </div>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {doNext}
                {readings}
                {streak}
              </div>
            </>
          ) : (
            <ListView state={state} result={result} onToggleDone={onToggleDone} />
          )}
        </>
      )}
    </div>
  )
}