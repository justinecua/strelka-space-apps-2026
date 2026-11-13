// Light or dark mode. The choice is saved on this device; the first time, it follows the computer's setting.
// Dark mode works by adding the "dark" class to <html>, which swaps the color values in index.css.

import { useEffect, useState } from 'react'

const KEY = 'strelka.theme'

function startingTheme() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // Storage can be blocked; fall back to the computer's setting.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState(startingTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      // Not saved, but the switch still works for this visit.
    }
  }, [theme])

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return [theme, toggleTheme]
}
