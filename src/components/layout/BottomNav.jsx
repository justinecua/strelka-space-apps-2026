// The main navigation, docked at the bottom of the screen: the five tabs in one pill, with the
// voice microphone at its right end. Labels show from small tablets up; phones get icons only.

import { TABS } from '../../data/navigation.js'
import Icon from '../ui/Icon.jsx'

export default function BottomNav({ activeTab, onTabChange, highStress, voice }) {
  return (
    <nav
      aria-label="Main"
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-3"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-white/55 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.18)] ring-1 ring-ink/10 backdrop-blur-2xl backdrop-saturate-150">
        <ul className="flex gap-1">
          {TABS.map((tab) => {
            const active = activeTab === tab.id
            const showDot = tab.id === 'relax' && highStress
            return (
              <li key={tab.id}>
                <button
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  aria-label={showDot ? `${tab.label}, high stress` : tab.label}
                  aria-current={active ? 'page' : undefined}
                  title={tab.label}
                  className={`relative flex h-11 items-center gap-2 whitespace-nowrap rounded-full px-3.5 transition sm:h-12 sm:px-5 ${
                    active ? 'bg-ink text-white shadow-sm' : 'text-ink/60 hover:bg-ink/5 hover:text-ink'
                  }`}
                >
                  <Icon name={tab.icon} size={20} />
                  <span className="hidden md:inline">{tab.label}</span>
                  {showDot && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-white" aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ul>
        {voice}
      </div>
    </nav>
  )
}
