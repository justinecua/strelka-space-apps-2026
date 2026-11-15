// Light or dark mode. The choice is saved on this device; the first time, it follows the computer's setting.
// Dark mode works by adding the "dark" class to <html>, which swaps the color values in index.css.
// Switching animates: the new mode spreads over the screen in a circle from the button that was pressed
// (from the microphone when switched by voice). Without browser support, or with reduced motion, it just switches.

import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

const KEY = 'strelka.theme'
// The switch running now, if any, so a quick second click finishes it first instead of cutting it off.
let running = null

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
  running?.skipTransition()

  // A click in the last second started it; otherwise it was voice, so start from the microphone.
  const clicked = lastPointer && Date.now() - lastPointer.at < 1000
  const x = clicked ? lastPointer.x : window.innerWidth / 2
  const y = clicked ? lastPointer.y : window.innerHeight - 40
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

  // The circle is a CSS animation (index.css, "theme-reveal") that reads these, so it is in place from the
  // very first frame. Starting it from script after the switch showed the new mode for a frame: a blink.
  const root = document.documentElement
  root.style.setProperty('--theme-x', `${x}px`)
  root.style.setProperty('--theme-y', `${y}px`)
  root.style.setProperty('--theme-r', `${radius}px`)
  // Colour fades on buttons and cards would be caught halfway in the new picture, so they pause meanwhile.
  root.classList.add('theme-switching')

  const transition = document.startViewTransition(() => flushSync(change))
  running = transition
  transition.finished.finally(() => {
    if (running !== transition) return
    running = null
    root.classList.remove('theme-switching')
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