// Whether Strelka is running as the desktop app (.exe / .dmg). The desktop app serves its pages from
// app://strelka/ (see electron/main.cjs); the website runs on http(s).
export const IS_DESKTOP = typeof window !== 'undefined' && window.location.protocol === 'app:'
