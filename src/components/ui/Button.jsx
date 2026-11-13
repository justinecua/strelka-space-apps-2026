import Icon from './Icon.jsx'

const VARIANTS = {
  dark: 'bg-ink text-white hover:opacity-85',
  outline: 'border border-ink/70 hover:bg-field',
  light: 'bg-white hover:bg-field',
  ghost: 'border border-white/40 text-white hover:bg-white/10',
}

export default function Button({ onClick, icon, type = 'button', variant = 'dark', className = '', children }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 transition ${VARIANTS[variant]} ${className}`}
    >
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  )
}
