// Light or dark mode. The choice is saved on this device; the first time, it follows the computer's setting.
// Dark mode works by adding the "dark" class to <html>, which swaps the color values in index.css.
// Switching animates: the new mode spreads over the screen in a circle from the button that was pressed
// (from the microphone when switched by voice). Without browser support, or with reduced motion, it just switches.

import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

const KEY = 'strelka.theme'
const DURATION_MS = 650

// Where the last click or tap was, so the circle starts at the button pressed.
let lastPointer = null
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', (event) => {
    lastPointer = { x: event.clientX, y: event.clientY, at: Date.now() }
  }, true)
}

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

function switchWithAnimation(change) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || reduce) return change()

  // A click in the last second started it; otherwise it was voice, so start from the microphone.
  const clicked = lastPointer && Date.now() - lastPointer.at < 1000
  const x = clicked ? lastPointer.x : window.innerWidth / 2
  const y = clicked ? lastPointer.y : window.innerHeight - 40
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

  const transition = document.startViewTransition(() => flushSync(change))
  transition.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: DURATION_MS, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' },
      )
    })
    .catch(() => {
      // Skipped (e.g. the tab was hidden): the theme has still changed.
    })
}

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
    applyTheme(theme)
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      // Not saved, but the switch still works for this visit.
    }
  }, [theme])

  function change(next) {
    if (next === theme) return
    switchWithAnimation(() => {
      applyTheme(next)
      setTheme(next)
    })
  }

  // Switches between light and dark (used by the round button).
  function toggleTheme() {
    change(theme === 'dark' ? 'light' : 'dark')
  }

  // Sets an exact mode (used by voice: "dark mode" always means dark, even if it is already dark).
  function chooseTheme(next) {
    if (next === 'dark' || next === 'light') change(next)
  }

  return [theme, toggleTheme, chooseTheme]
}