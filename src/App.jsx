// Root component. New users see Welcome → Setup → first check-in; after that, the three tabs.
// The tab is kept in the URL hash (#today, #checkin, #body) so pages can be linked directly.

import { useMemo, useState } from 'react'
import { TABS } from './data/navigation.js'
import { MISSIONS, MISSION_BY_ID } from './data/missions.js'
import { getBaseline } from './lib/baseline.js'
import { useStore } from './lib/store.js'
import { useTheme } from './lib/theme.js'
import { evaluate } from './lib/triage.js'
import AppFrame from './components/layout/AppFrame.jsx'
import Header from './components/layout/Header.jsx'
import Logo from './components/layout/Logo.jsx'
import Body from './pages/Body.jsx'
import CheckIn from './pages/CheckIn.jsx'
import History from './pages/History.jsx'
import Setup from './pages/Setup.jsx'
import Today from './pages/Today.jsx'
import Welcome from './pages/Welcome.jsx'

function tabFromUrl() {
  const hash = window.location.hash.replace('#', '')
  return TABS.some((tab) => tab.id === hash) ? hash : 'today'
}

export default function App() {
  const [savedState, actions] = useStore()
  const [theme, toggleTheme] = useTheme()
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

  // Open the check-in form for a past day, from the History page.
  function editDay(target) {
    goTo('checkin')
    setEditing(target)
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
        {tab === 'history' && (
          <History
            state={state}
            onEdit={(day) => editDay({ day, loggedOn: state.entries.find((entry) => entry.day === day)?.loggedOn })}
            onAdd={editDay}
            onDelete={actions.deleteEntry}
          />
        )}
      </main>
    </AppFrame>
  )
}
