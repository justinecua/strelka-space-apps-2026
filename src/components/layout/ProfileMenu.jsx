// The initials button in the header. It opens a small menu with the profile name and the reset option.

import { useEffect, useRef, useState } from 'react'

function initialsOf(name) {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function ProfileMenu({ name, isDemo, onReset }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  // Close the menu when clicking outside it or pressing Escape.
  useEffect(() => {
    if (!open) return
    function handleClick(event) {
      if (!menuRef.current.contains(event.target)) setOpen(false)
    }
    function handleKey(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  function handleReset() {
    setOpen(false)
    onReset()
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Profile menu"
        className="grid h-12 w-12 place-items-center rounded-full bg-ink text-white outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
      >
        {initialsOf(name)}
      </button>

      {open && (
        <div className="fade-in absolute right-0 z-20 mt-2 w-64 rounded-[20px] bg-white p-2 shadow-lg ring-1 ring-line">
          <div className="px-3 py-2">
            <p>{name}</p>
            <p className="text-sm text-muted">
              {isDemo ? 'Demo with simulated data' : 'Saved on this device'} · Not medical advice
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="w-full rounded-[14px] px-3 py-2.5 text-left text-danger hover:bg-danger-soft"
          >
            {isDemo ? 'Exit demo' : 'Reset app'}
          </button>
        </div>
      )}
    </div>
  )
}
