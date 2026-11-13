// The first screen: the logo, the headline and the start buttons, centered on a full-width page that follows light or dark mode.
// onContinue is set when a profile already exists: then one "Back to Dashboard" button replaces the start buttons.

import LogoMark from '../components/layout/LogoMark.jsx'
import ThemeToggle from '../components/layout/ThemeToggle.jsx'
import Button from '../components/ui/Button.jsx'

export default function Welcome({ onStart, onDemo, onContinue, theme, onToggleTheme }) {
  return (
    <section className="relative flex min-h-dvh w-full items-center justify-center bg-white p-8 text-center sm:p-16">
      <div className="absolute right-5 top-5 sm:right-8 sm:top-8">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <div className="flex flex-col items-center">
        <LogoMark inverted={theme === 'dark'} className="h-28 w-28 sm:h-36 sm:w-36" />
        <span className="mb-10 mt-3 text-2xl">Strelka</span>

        <h1 className="text-5xl leading-[1.05] sm:text-7xl">
          Stay healthy
          <br />
          in space
        </h1>
        <p className="mt-5 max-w-md text-xl text-muted">Check in for 2 minutes a day. We'll let you know if something changes, and what to do next.</p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {onContinue ? (
            <Button onClick={onContinue} className="px-8 py-3.5 text-lg">
              Back to Dashboard
            </Button>
          ) : (
            <>
              <Button onClick={onStart} className="px-8 py-3.5 text-lg">
                Get started
              </Button>
              <Button onClick={onDemo} variant="outline" className="px-8 py-3.5 text-lg">
                Try the demo
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
