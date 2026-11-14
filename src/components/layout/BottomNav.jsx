// The main navigation, docked at the bottom of the screen: the five tabs in one pill, with the
// voice microphone at its right end. Labels show from small tablets up; phones get icons only.

import { useLayoutEffect, useRef, useState } from 'react'
import { TABS } from '../../data/navigation.js'
import Icon from '../ui/Icon.jsx'

export default function BottomNav({ activeTab, onTabChange, highStress, voice }) {
  // One highlight pill sits behind the tabs and slides to the active one.
  const listRef = useRef(null)
  const [pill, setPill] = useState(null)

  useLayoutEffect(() => {
    function measure() {
      const button = listRef.current?.querySelector('[aria-current="page"]')
      setPill(button ? { left: button.offsetLeft, width: button.offsetWidth } : null)
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (listRef.current) observer.observe(listRef.current)
    return () => observer.disconnect()
  }, [activeTab])

  return (
    <nav
      aria-label="Main"
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-3"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-white/55 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.18)] ring-1 ring-ink/10 backdrop-blur-2xl backdrop-saturate-150">
        <ul ref={listRef} className="relative flex gap-1">
          {pill && (
            <li
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 rounded-full bg-ink shadow-sm transition-[left,width] duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)] motion-reduce:transition-none"
              style={{ left: pill.left, width: pill.width }}
            />
          )}
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
                  className={`relative z-10 flex h-11 items-center gap-2 whitespace-nowrap rounded-full px-3.5 transition duration-300 active:scale-95 sm:h-12 sm:px-5 ${
                    active ? 'text-white' : 'text-ink/60 hover:bg-ink/5 hover:text-ink'
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
