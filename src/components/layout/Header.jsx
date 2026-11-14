import { TABS } from '../../data/navigation.js'
import { MISSIONS } from '../../data/missions.js'
import Icon from '../ui/Icon.jsx'
import Logo from './Logo.jsx'
import ProfileMenu from './ProfileMenu.jsx'
import ThemeToggle from './ThemeToggle.jsx'

export default function Header({ activeTab, onTabChange, mission, onMissionChange, name, isDemo, onReset, onLogoClick, theme, onToggleTheme, highStress }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <button type="button" onClick={onLogoClick} aria-label="Go to the start page" className="rounded-full transition hover:opacity-70">
        <Logo inverted={theme === 'dark'} />
      </button>

      <nav aria-label="Main" className="order-last w-full overflow-x-auto lg:order-none lg:w-auto">
        <ul className="flex gap-1 rounded-full bg-field p-1.5">
          {TABS.map((tab) => {
            const showDot = tab.id === 'relax' && highStress
            return (
              <li key={tab.id}>
                <button
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  aria-label={showDot ? `${tab.label}, high stress` : tab.label}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                  className={`relative flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 transition ${
                    activeTab === tab.id ? 'bg-white shadow-sm' : 'text-muted hover:text-ink'
                  }`}
                >
                  <Icon name={tab.icon} size={20} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {showDot && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-white" aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

           <div className="flex w-full items-center gap-3 sm:w-auto">
        <div className="relative min-w-0 flex-1 sm:flex-none">
          <select
            aria-label="Mission"
            value={mission.id}
            onChange={(event) => onMissionChange(event.target.value)}
            className="min-w-0 w-full appearance-none rounded-full bg-field px-5 py-3 pr-10 outline-none focus:ring-2 focus:ring-ink sm:w-auto"
          >
            {MISSIONS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <Icon
            name="chevron"
            size={16}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
          />
        </div>

        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <ProfileMenu name={name} isDemo={isDemo} onReset={onReset} />
      </div>
    </header>
  )
}