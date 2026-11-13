// Fades out the logo loading screen from index.html once the app is ready.
// It stays at least minMs after page load so it doesn't just flash.

export function hideSplash(minMs) {
  const splash = document.getElementById('splash')
  if (!splash) return

  const wait = Math.max(0, minMs - performance.now())
  setTimeout(() => {
    splash.classList.add('splash-hide')
    setTimeout(() => splash.remove(), 400)
  }, wait)
}
