// Round button that switches between light and dark mode. It shows the mode you will switch to.

import Icon from '../ui/Icon.jsx'

export default function ThemeToggle({ theme, onToggle }) {
  const next = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className="grid h-12 w-12 place-items-center rounded-full bg-field transition hover:scale-105"
    >
      <Icon name={next === 'dark' ? 'moon' : 'sun'} size={22} />
    </button>
  )
}
