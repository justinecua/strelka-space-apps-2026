import { useEffect, useRef, useState } from 'react'
import { INDICATORS } from '../data/indicators.js'
import { dayNumberFor, hasCheckedInToday } from '../lib/entries.js'
import { dueType } from '../lib/schedule.js'
import { useLayout } from '../lib/layout.js'
import { isFlagged } from '../lib/status.js'
import { sendVoice, useVoiceEvent } from '../lib/voiceEvents.js'
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
  // Which daily check-in is due right now (morning or before sleep), going by the clock.
  const due = state.isDemo ? null : hasEntries ? dueType(state.records, state.entries) : 'first'
  const emptyCheckIn = hasEntries && !due && hasCheckedInToday(state.entries) && !result.hasReadings

  // Show the chart for the first reading that needs attention, else the first one that was logged.
  const firstFlagged = hasEntries && INDICATORS.find((indicator) => isFlagged(result.readings[indicator.id].status))
  const firstLogged = hasEntries && INDICATORS.find((indicator) => result.readings[indicator.id].value != null)
  const [indicatorId, setIndicatorId] = useState(firstFlagged?.id ?? firstLogged?.id ?? 'hr')
  const [layout, setLayout] = useLayout()

  // Voice: "list view" / "grid view".
  useVoiceEvent('layout', ({ layout: next }) => {
    if (!hasEntries) return false
    setLayout(next)
  })

  // Voice: "open the heart card" while in list view. The cards only exist in grid view, so switch first,
  // then ask again once they are on the page. (In grid view the card itself answers first.)
  const pendingCard = useRef(null)
  useVoiceEvent('open-card', ({ card }) => {
    if (!hasEntries || layout === 'grid') return false
    pendingCard.current = card
    setLayout('grid')
  })
  useEffect(() => {
    if (layout !== 'grid' || !pendingCard.current) return
    const card = pendingCard.current
    pendingCard.current = null
    setTimeout(() => sendVoice('open-card', { card }), 50)
  }, [layout])

  // Voice: "show the glucose chart". The list view opens its own row; in grid view the Readings card switches.
  useVoiceEvent('reading', ({ id }) => {
    if (!hasEntries || layout !== 'grid') return false
    setIndicatorId(id)
    setTimeout(() => document.getElementById('readings-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
  })

  // Voice: "mark 1 done", "mark all done" for the Do next list.
  useVoiceEvent('todo', ({ which }) => {
    const items = result.findings
    if (items.length === 0) return false
    const notify = (message) => window.dispatchEvent(new CustomEvent('strelka:notice', { detail: { message } }))
    if (which === 'all') {
      items.filter((item) => !state.doneIds.includes(item.id)).forEach((item) => onToggleDone(item.id))
      return notify('All done.')
    }
    const item = items[which - 1]
    if (!item) return notify(`There are only ${items.length} items.`)
    if (state.doneIds.includes(item.id)) return notify(`“${item.title}” is already done.`)
    onToggleDone(item.id)
    notify(`Done: ${item.title}`)
  })

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
      {due && <CheckInDueCard isFirst={!hasEntries} variant={due} name={state.profile.name} onStart={onStartCheckIn} />}
      {emptyCheckIn && <CheckInDueCard variant="empty" onStart={onStartCheckIn} />}
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