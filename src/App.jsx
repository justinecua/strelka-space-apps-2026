// Root component. New users see Welcome → Setup → first check-in; after that, the tabs
// (Today, Check-in, Body, Relax, History) with a floating voice assistant on every page.
// The tab is kept in the URL hash (#today, #checkin, #body, #relax, #history) so pages can be linked directly.

import { useMemo, useState } from 'react'
import { TABS } from './data/navigation.js'
import { MISSIONS, MISSION_BY_ID } from './data/missions.js'
import { REGIONS } from './data/regions.js'
import { getBaseline } from './lib/baseline.js'
import { isHighStress } from './lib/stress.js'
import { useStore } from './lib/store.js'
import { useTheme } from './lib/theme.js'
import { evaluate } from './lib/triage.js'
import AppFrame from './components/layout/AppFrame.jsx'
import Header from './components/layout/Header.jsx'
import Logo from './components/layout/Logo.jsx'
import VoiceAssistant from './components/voice/VoiceAssistant.jsx'
import Body from './pages/Body.jsx'
import CheckIn from './pages/CheckIn.jsx'
import History from './pages/History.jsx'
import Relax from './pages/Relax.jsx'
import Setup from './pages/Setup.jsx'
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

  function goTo(nextTab) {
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

  // Open the check-in form for a past day, from the History page or by voice.
  function editDay(target) {
    goTo('checkin')
    setEditing(target)
  }

  // "edit day 5" by voice: opens the same form as the Edit button on History.
  function voiceEditDay(day) {
    const entry = state.entries.find((item) => item.day === day)
    if (!entry) {
      window.alert(`There is no check-in for day ${day} yet. Use "add missed day" on the History page.`)
      return
    }
    editDay({ day, loggedOn: entry.loggedOn })
  }

  // "delete day 5" by voice: goes to History and asks for confirmation before deleting.
  function voiceDeleteDay(day) {
    if (!state.entries.some((item) => item.day === day)) {
      window.alert(`There is no check-in for day ${day}.`)
      return
    }
    goTo('history')
    if (window.confirm(`Delete the check-in for day ${day}? This can't be undone.`)) {
      actions.deleteEntry(day)
    }
  }

  // "show brain" or "go to eyes" by voice: opens the Body page on that region.
  function voiceRegion(key) {
    const region = REGIONS.find((item) => [item.id, item.label, item.name].filter(Boolean).join(' ').toLowerCase().includes(key))
    if (!region) {
      window.alert(`Body region not found: ${key}`)
      return
    }
    setRegionId(region.id)
    goTo('body')
  }

  // "switch to Mars surface" by voice: changes the mission, the same as the header dropdown.
  function voiceMission(key) {
    const next = MISSIONS.find((item) => item.name.toLowerCase().includes(key))
    if (!next) {
      window.alert(`Mission not found: ${key}`)
      return
    }
    actions.setMission(next.id)
  }

  // "dark mode" or "light mode" by voice: sets that exact mode.
  function voiceTheme(wanted) {
    chooseTheme(wanted)
  }

  function handleReset() {
    const question = state.isDemo
      ? 'Leave the demo and go back to the start screen?'
      : 'Delete your profile and all check-ins on this device?'
    if (window.confirm(question)) actions.resetApp()
  }

  // First run: no profile yet.
  // The Welcome page fills the whole window, without the white frame.
  if (!state.profile && !showSetup) {
    return <Welcome onStart={() => setShowSetup(true)} onDemo={handleDemo} theme={theme} onToggleTheme={toggleTheme} />
  }

  if (!state.profile) {
    return (
      <AppFrame>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-2">
          <Logo inverted={theme === 'dark'} />
          <Setup onCancel={() => setShowSetup(false)} onFinish={handleSetupDone} />
        </div>
      </AppFrame>
    )
  }

  // The logo in the header opens the landing page again, without touching saved data.
  if (showLanding) {
    return (
      <Welcome
        onContinue={() => {
          setShowLanding(false)
          goTo('today')
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    )
  }

  return (
    <AppFrame>
      <Header
        activeTab={tab}
        onTabChange={goTo}
        mission={mission}
        onMissionChange={actions.setMission}
        name={state.profile.name}
        isDemo={state.isDemo}
        onReset={handleReset}
        onLogoClick={() => setShowLanding(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        highStress={highStress}
      />

      <main className="mt-10 flex-1 pb-4">
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
        {tab === 'checkin' && (
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
            onDelete={actions.deleteEntry}
          />
        )}
      </main>

      <VoiceAssistant
        tab={tab}
        onNavigate={goTo}
        onEditDay={voiceEditDay}
        onDeleteDay={voiceDeleteDay}
        onRegion={voiceRegion}
        onMission={voiceMission}
        onTheme={voiceTheme}
      />
      <Footer />
    </AppFrame>
  )
}