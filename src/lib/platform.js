// Whether Strelka is running as the desktop app (.exe / .dmg).
// The desktop builds use `vite build --mode desktop`, so this is fixed at build time and the landing page
// (only for the website) is left out of the app entirely. The app:// check is a fallback for other builds:
// the desktop app serves its pages from app://strelka/ (see electron/main.cjs); the website runs on http(s).
export const IS_DESKTOP =
  import.meta.env.MODE === 'desktop' || (typeof window !== 'undefined' && window.location.protocol === 'app:')
