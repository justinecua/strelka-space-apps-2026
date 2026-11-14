// How voice commands reach the page. The voice assistant sends a named action ("open-card", "close", ...);
// whichever part of the page can do it listens and marks it handled, so the assistant can tell the person
// when nothing on screen could do what they asked.

import { useEffect, useRef } from 'react'

// Sends an action to the page. Returns true when something on the page handled it.
export function sendVoice(name, detail = {}) {
  const payload = { ...detail, handled: false }
  window.dispatchEvent(new CustomEvent(`strelka:${name}`, { detail: payload }))
  return payload.handled
}

// Listens for one action. The handler can return false to say "not for me", so another listener can take it.
export function useVoiceEvent(name, handler) {
  const latest = useRef(handler)
  useEffect(() => {
    latest.current = handler
  })
  useEffect(() => {
    function listen(event) {
      const detail = event.detail ?? {}
      if (detail.handled) return
      if (latest.current(detail) !== false) detail.handled = true
    }
    window.addEventListener(`strelka:${name}`, listen)
    return () => window.removeEventListener(`strelka:${name}`, listen)
  }, [name])
}

// "close" closes only the top-most open layer (a pop-up over a full-screen card closes first).
const openLayers = []

export function useCloseOnVoice(onClose) {
  const latest = useRef(onClose)
  useEffect(() => {
    latest.current = onClose
  })
  useEffect(() => {
    const layer = () => latest.current()
    openLayers.push(layer)
    return () => {
      const index = openLayers.lastIndexOf(layer)
      if (index >= 0) openLayers.splice(index, 1)
    }
  }, [])
}

if (typeof window !== 'undefined') {
  window.addEventListener('strelka:close', (event) => {
    const top = openLayers.at(-1)
    if (top && event.detail) {
      event.detail.handled = true
      top()
    }
  })
}
