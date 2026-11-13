// Remembers how the Today page is laid out: "grid" (cards side by side) or "list" (one card per row).
// The choice is saved on this device.

import { useState } from 'react'

const KEY = 'strelka.layout'

function savedLayout() {
  try {
    return localStorage.getItem(KEY) === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

export function useLayout() {
  const [layout, setLayout] = useState(savedLayout)

  function changeLayout(next) {
    setLayout(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // Not saved, but the switch still works for this visit.
    }
  }

  return [layout, changeLayout]
}
