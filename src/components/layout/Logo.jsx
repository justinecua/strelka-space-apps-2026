// The app logo for headers: the mark next to the name.

import ChalkText from '../ui/ChalkText.jsx'
import LogoMark from './LogoMark.jsx'

// inverted gives the white-circle version, for dark backgrounds.
export default function Logo({ inverted = false }) {
  return (
    <div className="flex items-center gap-3">
      <LogoMark inverted={inverted} />
      <ChalkText word="strelka" label="Strelka" className="text-2xl" />
    </div>
  )
}
