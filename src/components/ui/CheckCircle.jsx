import Icon from './Icon.jsx'

export default function CheckCircle({ checked }) {
  if (checked) {
    return (
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-good text-white">
        <Icon name="check" size={14} weight="bold" />
      </span>
    )
  }
  return <span className="block h-7 w-7 shrink-0 rounded-full border-2 border-current opacity-30" />
}
