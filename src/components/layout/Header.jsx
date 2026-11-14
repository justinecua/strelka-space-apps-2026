import { MISSIONS } from '../../data/missions.js'
import Icon from '../ui/Icon.jsx'
import HeaderStatus from './HeaderStatus.jsx'
import Logo from './Logo.jsx'
import ProfileMenu from './ProfileMenu.jsx'
import ThemeToggle from './ThemeToggle.jsx'

// The top bar: logo, mission picker, theme and profile. The tabs live in the bottom navigation.

export default function Header({ day, mission, onMissionChange, name, isDemo, onReset, onLogoClick, theme, onToggleTheme }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 lg:flex-nowrap lg:gap-6">
      <button type="button" onClick={onLogoClick} aria-label="Go to the start page" className="rounded-full transition hover:opacity-70">
        <Logo inverted={theme === 'dark'} />
      </button>

      <HeaderStatus name={name} day={day} mission={mission} />

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