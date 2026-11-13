// Keeps the app state in localStorage so it works offline, like on a spacecraft.
// A new user starts with no profile and goes through setup; the demo mission is optional.

import { useEffect, useState } from 'react'
import { DEMO_BASELINE, DEMO_PROFILE } from '../data/astronaut.js'
import { addOrReplaceEntry, dayNumberFor, hasCheckedInToday, removeEntry, saveEntry, todayDate } from './entries.js'
import { generateMission } from './seed.js'

const STORAGE_KEY = 'baseline.v3'

const EMPTY_STATE = {
  profile: null,
  isDemo: false,
  missionId: 'transit',
  baselineSource: 'calibrate',
  baseline: {},
  entries: [],
  doneIds: [],
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {
    // Storage is blocked or broken, so start fresh.
  }
  return EMPTY_STATE
}

export function useStore() {
  const [state, setState] = useState(loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Saving is optional; the app still works without it.
    }
  }, [state])

  // setup = { name, missionId, startDate, baselineSource, baseline }
  function startOwnMission(setup) {
    setState({
      ...EMPTY_STATE,
      profile: { name: setup.name, startDate: setup.startDate },
      missionId: setup.missionId,
      baselineSource: setup.baselineSource,
      baseline: setup.baseline,
    })
  }

  function loadDemo() {
    setState({
      ...EMPTY_STATE,
      profile: DEMO_PROFILE,
      isDemo: true,
      baselineSource: 'entered',
      baseline: DEMO_BASELINE,
      entries: generateMission(),
    })
  }

  function resetApp() {
    setState(EMPTY_STATE)
  }

  function setMission(missionId) {
    setState((current) => ({ ...current, missionId }))
  }

  function addEntry(entry) {
    setState((current) => {
      const today = todayDate()
      const isNewDay = !hasCheckedInToday(current.entries, today)
      const dayNumber = dayNumberFor(current.profile, current.entries, today)
      return {
        ...current,
        entries: addOrReplaceEntry(current.entries, entry, today, dayNumber),
        doneIds: isNewDay ? [] : current.doneIds,
      }
    })
  }

  // entry must include its day (and loggedOn date for real missions).
  function saveEntryForDay(entry) {
    setState((current) => ({ ...current, entries: saveEntry(current.entries, entry) }))
  }

  function deleteEntry(day) {
    setState((current) => ({ ...current, entries: removeEntry(current.entries, day) }))
  }

  function toggleDone(id) {
    setState((current) => {
      const doneIds = current.doneIds.includes(id)
        ? current.doneIds.filter((doneId) => doneId !== id)
        : [...current.doneIds, id]
      return { ...current, doneIds }
    })
  }

  return [state, { startOwnMission, loadDemo, resetApp, setMission, addEntry, saveEntryForDay, deleteEntry, toggleDone }]
}
