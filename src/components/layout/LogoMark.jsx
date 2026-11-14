// The Strelka mark: a dog in a space helmet. It is the same file as the favicon and the loading screen
// (public/favicon.svg), so the logo looks the same everywhere. It reads well on light and dark pages,
// so `inverted` is accepted for older callers but no longer changes anything.

const LOGO_URL = `${import.meta.env.BASE_URL}favicon.svg`

export default function LogoMark({ className = 'h-12 w-12' }) {
  return <img src={LOGO_URL} alt="" aria-hidden="true" draggable="false" className={`${className} select-none`} />
}
