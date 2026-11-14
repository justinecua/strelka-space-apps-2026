// Root component. New users see Welcome → Setup → first check-in; after that, the tabs
// (Today, Check-in, Body, Relax, History) with a floating voice assistant on every page.
// The tab is kept in the URL hash (#today, #checkin, #body, #relax, #history) so pages can be linked directly.

import { useMemo, useRef, useState } from 'react'
import { TABS } from './data/navigation.js'
import { HAZARD_BY_ID } from './data/hazards.js'
import { MISSIONS, MISSION_BY_ID } from './data/missions.js'
import { REGIONS } from './data/regions.js'
import { getBaseline } from './lib/baseline.js'
import { dayNumberFor, todayDate } from './lib/entries.js'
import { dateOfMissionDay } from './lib/mission.js'
import { isHighStress } from './lib/stress.js'
import { useStore } from './lib/store.js'
import { useTheme } from './lib/theme.js'
import { evaluate } from './lib/triage.js'
import AppFrame from './components/layout/AppFrame.jsx'
import BottomNav from './components/layout/BottomNav.jsx'
import Header from './components/layout/Header.jsx'
import Logo from './components/layout/Logo.jsx'
import HazardDialog from './components/hazards/HazardDialog.jsx'
import ConfirmDialog from './components/ui/ConfirmDialog.jsx'
import VoiceAssistant from './components/voice/VoiceAssistant.jsx'
import Body from './pages/Body.jsx'
import CheckIn from './pages/CheckIn.jsx'
import CheckInHub from './pages/CheckInHub.jsx'
import History from './pages/History.jsx'
import Relax from './pages/Relax.jsx'
import Setup from './pages/Setup.jsx'
import { IS_DESKTOP } from './lib/platform.js'
import Today from './pages/Today.jsx'
import Welcome from './pages/Welcome.jsx'
import Footer from './components/layout/Footer.jsx'


function tabFromUrl() {
  const hash = window.location.hash.replace('#', '')
  return TABS.some((tab) => tab.id === hash) ? hash : 'today'
}

export default function App() {
  const [savedState, actions] = useStore()
  const [theme, toggleTheme, chooseTheme] = useTheme()
  const [tab, setTab] = useState(tabFromUrl)
  const [showSetup, setShowSetup] = useState(false)
  const [showLanding, setShowLanding] = useState(false)
  const [regionId, setRegionId] = useState('heart')
  // A past check-in being edited or added from History: { day, loggedOn }. null means today's check-in.
  const [editing, setEditing] = useState(null)
  // A yes/no question on screen ({ title, text, confirmLabel, danger, onYes }), answerable by click or voice.
  const [question, setQuestion] = useState(null)
  // A NASA hazard opened by voice from any page.
  const [hazardId, setHazardId] = useState(null)
  // Tabs visited, for "go back".
  const visited = useRef([])

  // Every page compares readings with this baseline (entered, or learned from the first check-ins).
  const calibration = useMemo(() => getBaseline(savedState), [savedState])
  const state = { ...savedState, baseline: calibration.values }

  const mission = MISSION_BY_ID[state.missionId] ?? MISSIONS[0]
  const result = useMemo(
    () => evaluate(savedState.entries, calibration.values, mission),
    [savedState.entries, calibration.values, mission],
  )

  // The red dot on the Relax tab and the Relax page message use the latest stress reading (4 or 5 = high).
  const highStress = isHighStress(state.entries.at(-1)?.stress)

  function goTo(nextTab, { remember = true } = {}) {
    if (remember && nextTab !== tab) visited.current = [...visited.current, tab].slice(-20)
    setEditing(null)
    setTab(nextTab)
    window.history.replaceState(null, '', `#${nextTab}`)
    window.scrollTo({ top: 0 })
  }

  function handleSetupDone(setup) {
    actions.startOwnMission(setup)
    setShowSetup(false)
    goTo('checkin')
  }

  function handleDemo() {
    actions.loadDemo()
    goTo('today')
  }

  function handleCheckIn(entry) {
    if (editing) {
      actions.saveEntryForDay({ ...entry, day: editing.day, loggedOn: editing.loggedOn })
      goTo('history')
      return
    }
    actions.addEntry(entry)
    goTo('today')
  }

  // One of the four check-ins (morning, post-exercise, before sleep, symptom report).
  function handleRecord(record) {
    actions.addRecord(record)
    goTo('today')
  }

  // Open the check-in form for a past day, from the History page or by voice.
  function editDay(target) {
    goTo('checkin')
    setEditing(target)
  }

  // Short messages for the line above the microphone.
  function notify(message) {
    window.dispatchEvent(new CustomEvent('strelka:notice', { detail: { message } }))
  }

  // "go back": the previous tab, or nothing to go back to.
  function goBack() {
    const previous = visited.current.at(-1)
    if (!previous) return notify('Nothing to go back to.')
    visited.current = visited.current.slice(0, -1)
    goTo(previous, { remember: false })
  }

  // "edit day 5" by voice: opens the same form as the Edit button on History.
  function voiceEditDay(day) {
    const entry = state.entries.find((item) => item.day === day)
    if (!entry) return notify(`No check-in for day ${day} yet. Say “add day ${day}” to fill it in.`)
    editDay({ day, loggedOn: entry.loggedOn })
  }

  // "add day 5" by voice: opens an empty form for a missed day, like "Missed a day?" on History.
  function voiceAddDay(day) {
    if (state.entries.some((item) => item.day === day)) return notify(`Day ${day} already has a check-in. Say “edit day ${day}”.`)
    if (!state.profile.startDate) return notify('Adding past days needs a mission start date, so it is not available in the demo.')
    const loggedOn = dateOfMissionDay(state.profile.startDate, day)
    if (day < 1 || loggedOn > todayDate()) return notify(`Day ${day} hasn't happened yet.`)
    editDay({ day, loggedOn })
  }

  // Delete a past day, by the Delete button or "delete day 5". Always asks first.
  function askDeleteDay(day) {
    if (!state.entries.some((item) => item.day === day)) return notify(`There is no check-in for day ${day}.`)
    setQuestion({
      title: `Delete day ${day}?`,
      text: "This check-in will be removed from your history. This can't be undone.",
      confirmLabel: 'Delete',
      danger: true,
      onYes: () => actions.deleteEntry(day),
    })
  }

  // "show brain" or "go to eyes" by voice: opens the Body page on that region.
  function voiceRegion(key) {
    const region = REGIONS.find((item) => [item.id, item.label, item.name].filter(Boolean).join(' ').toLowerCase().includes(key))
    if (!region) return notify(`Body region not found: ${key}`)
    setRegionId(region.id)
    goTo('body')
  }

  // "switch to Mars surface" by voice: changes the mission, the same as the header dropdown.
  function voiceMission(key) {
    const next = MISSIONS.find((item) => item.name.toLowerCase().includes(key))
    if (!next) return notify(`Mission not found: ${key}`)
    actions.setMission(next.id)
  }

  // "dark mode", "light mode" or "toggle theme" by voice.
  function voiceTheme(wanted) {
    if (wanted === 'toggle') toggleTheme()
    else chooseTheme(wanted)
  }

  // Reset app / exit demo, from the profile menu or by voice ("log out"). Always asks first.
  function handleReset() {
    setQuestion(
      state.isDemo
        ? { title: 'Exit the demo?', text: 'You will go back to the start screen.', confirmLabel: 'Exit demo', onYes: actions.resetApp }
        : {
            title: 'Reset the app?',
            text: 'This deletes your profile and every check-in on this device.',
            confirmLabel: 'Delete everything',
            danger: true,
            onYes: actions.resetApp,
          },
    )
  }

  const voiceActions = {
    navigate: goTo,
    back: goBack,
    editDay: voiceEditDay,
    addDay: voiceAddDay,
    deleteDay: (day) => {
      goTo('history')
      askDeleteDay(day)
    },
    region: voiceRegion,
    mission: voiceMission,
    theme: voiceTheme,
    logout: handleReset,
    // The desktop app has no landing page: "home page" goes to Today instead.
    landing: () => (IS_DESKTOP ? goTo('today') : setShowLanding(true)),
    hazard: (id) => (HAZARD_BY_ID[id] ? setHazardId(id) : notify('Hazard not found.')),
  }

  // First run: no profile yet.
  // The Welcome page fills the whole window, without the white frame.
  // The desktop app skips the landing page (it is for the website) and opens straight to setup.
  if (!state.profile && !showSetup && !IS_DESKTOP) {
    return <Welcome onStart={() => setShowSetup(true)} onDemo={handleDemo} theme={theme} onToggleTheme={toggleTheme} />
  }

  if (!state.profile) {
    return (
      <AppFrame>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-2">
          <Logo inverted={theme === 'dark'} />
          <Setup
            onCancel={IS_DESKTOP ? null : () => setShowSetup(false)}
            onDemo={IS_DESKTOP ? handleDemo : null}
            onFinish={handleSetupDone}
          />
        </div>
      </AppFrame>
    )
  }

  // The logo in the header (or "go to the home page") opens the landing page again, without touching saved data.
  // A small microphone stays in the corner, so voice can bring you back ("go to today", "go back").
  if (showLanding && !IS_DESKTOP) {
    const leaveLanding = (nextTab = tab) => {
      setShowLanding(false)
      goTo(nextTab, { remember: false })
    }
    return (
      <>
        <Welcome onContinue={() => leaveLanding('today')} theme={theme} onToggleTheme={toggleTheme} />
        <div className="fixed right-5 bottom-5 z-50 rounded-full bg-white/70 p-1.5 shadow-2xl ring-1 ring-ink/10 backdrop-blur-xl">
          <VoiceAssistant
            tab="landing"
            compact
            actions={{
              ...voiceActions,
              navigate: leaveLanding,
              back: () => leaveLanding(),
              landing: () => {},
              region: (key) => {
                setShowLanding(false)
                voiceRegion(key)
              },
            }}
          />
        </div>
      </>
    )
  }

  return (
    <AppFrame withDock>
      <Header
        day={state.isDemo ? (state.entries.at(-1)?.day ?? null) : dayNumberFor(state.profile, state.entries)}
        mission={mission}
        onMissionChange={actions.setMission}
        name={state.profile.name}
        isDemo={state.isDemo}
        onReset={handleReset}
        onLogoClick={() => (IS_DESKTOP ? goTo('today') : setShowLanding(true))}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="mt-10 flex-1 pb-8">
        <div key={`${tab}-${editing ? 'edit' : 'view'}`} className="page-enter">
        {tab === 'today' && (
          <Today
            state={state}
            result={result}
            mission={mission}
            calibration={calibration}
            onToggleDone={actions.toggleDone}
            onStartCheckIn={() => goTo('checkin')}
          />
        )}
        {tab === 'checkin' && !editing && <CheckInHub state={state} onSubmit={handleRecord} />}
        {tab === 'checkin' && editing && (
          <CheckIn
            key={editing ? `edit-${editing.day}` : 'today'}
            state={state}
            editing={editing}
            onSubmit={handleCheckIn}
            onCancel={() => goTo('history')}
          />
        )}
        {tab === 'body' && (
          <Body result={result} regionId={regionId} onSelectRegion={setRegionId} onStartCheckIn={() => goTo('checkin')} />
        )}
        {tab === 'relax' && <Relax highStress={highStress} />}
        {tab === 'history' && (
          <History
            state={state}
            mission={mission}
            onEdit={(day) => editDay({ day, loggedOn: state.entries.find((entry) => entry.day === day)?.loggedOn })}
            onAdd={editDay}
            onDelete={askDeleteDay}
          />
        )}
        </div>
      </main>

      <BottomNav
        activeTab={tab}
        onTabChange={goTo}
        highStress={highStress}
        voice={
<VoiceAssistant tab={tab} actions={voiceActions} />
        }
      />
      <Footer />

      {hazardId && <HazardDialog hazard={HAZARD_BY_ID[hazardId]} onClose={() => setHazardId(null)} />}
      {question && (
        <ConfirmDialog
          title={question.title}
          text={question.text}
          confirmLabel={question.confirmLabel}
          danger={question.danger}
          onConfirm={() => {
            setQuestion(null)
            question.onYes()
          }}
          onCancel={() => setQuestion(null)}
        />
      )}
    </AppFrame>
  )
}