// The landing page: what Strelka does, how it works, the story behind the name, and the desktop downloads.
// New visitors get "Get started" and "Try the demo"; with a profile, onContinue gives "Back to Dashboard".
// Inside the desktop app the download section is hidden, since it is already installed.

import { useEffect, useRef, useState } from 'react'
import belkaAndStrelka from '../assets/story/belka-strelka.jpg'
import { DOWNLOADS, FEATURES, REPO_URL, STEPS, STORY, TEAM } from '../data/landing.js'
import LogoMark from '../components/layout/LogoMark.jsx'
import ThemeToggle from '../components/layout/ThemeToggle.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'

const TONES = {
  mint: 'bg-mint',
  cream: 'bg-cream',
  gray: 'bg-field',
  dark: 'bg-ink text-white',
}

// The visitor's computer: "mac", "windows", or null (phones, Linux). The platform value is the most
// reliable, so it wins; the user-agent text is only a fallback for browsers that don't report one.
function detectOs() {
  const source = navigator.userAgentData?.platform || navigator.platform || navigator.userAgent || ''
  if (/mac/i.test(source)) return 'mac'
  if (/win/i.test(source)) return 'windows'
  return null
}

const IN_DESKTOP_APP = typeof navigator !== 'undefined' && /Electron/.test(navigator.userAgent)

// Scroll reveal: marks every [data-reveal] element with data-visible once it scrolls into view.
// Without IntersectionObserver everything is shown straight away.
function useReveal() {
  useEffect(() => {
    const items = document.querySelectorAll('[data-reveal]')
    if (!('IntersectionObserver' in window)) {
      items.forEach((item) => item.setAttribute('data-visible', ''))
      return undefined
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-visible', '')
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.15 },
    )
    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [])
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// badge: a small label beside the title, like the team's name.
function SectionTitle({ eyebrow, title, text, badge, center = false }) {
  return (
    <div data-reveal className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <p className="text-sm tracking-wide text-muted uppercase">{eyebrow}</p>
      <div className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 ${center ? 'justify-center' : ''}`}>
        <h2 className="text-4xl leading-tight sm:text-5xl">{title}</h2>
        {badge && <span className="rounded-full bg-field px-3.5 py-1.5 text-sm text-muted ring-1 ring-ink/10">{badge}</span>}
      </div>
      {text && <p className="mt-4 text-lg text-muted">{text}</p>}
    </div>
  )
}

// showCta: the top bar's button only appears once the hero's own buttons have scrolled away.
function TopBar({ links, primaryLabel, onPrimary, theme, onToggleTheme, showCta }) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3">
          <LogoMark className="h-10 w-10" />
          <span className="text-xl">Strelka</span>
        </button>

        <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <button key={link.id} type="button" onClick={() => scrollToSection(link.id)} className="rounded-full px-4 py-2 text-muted transition hover:bg-field hover:text-ink">
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Strelka on GitHub"
            className="flex h-12 items-center gap-2 rounded-full bg-field px-4 transition hover:bg-ink hover:text-white"
          >
            <Icon name="github" size={20} />
            <span className="hidden text-sm lg:inline">GitHub</span>
          </a>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          {/* Collapses to zero width while hidden, so it leaves no gap; slides open when it appears. */}
          <div
            className={`hidden transition-[grid-template-columns,opacity] duration-300 sm:grid ${showCta ? 'grid-cols-[1fr] opacity-100' : 'pointer-events-none grid-cols-[0fr] opacity-0'}`}
            aria-hidden={!showCta}
            data-cta
          >
            <div className="min-w-0 overflow-hidden">
              <Button onClick={onPrimary} className={`whitespace-nowrap ${showCta ? '' : 'invisible'}`}>
                {primaryLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

// Fixed star positions from a tiny seeded random generator, so the sky looks the same on every visit.
function makeStars(count, seed = 7) {
  let value = seed
  const random = () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
  return Array.from({ length: count }, () => ({
    x: random() * 100,
    y: random() * 100,
    size: random() < 0.8 ? 2 : 3,
    bright: 0.55 + random() * 0.45,
    speed: 3 + random() * 5,
    delay: -random() * 8,
  }))
}

const STARS = makeStars(130)

function Starfield() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="star-drift absolute inset-x-0 top-0 -bottom-12">
      {STARS.map((star, index) => (
        <span
          key={index}
          className="star absolute rounded-full bg-ink"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            '--star-bright': star.bright,
            '--star-speed': `${star.speed}s`,
            '--star-delay': `${star.delay}s`,
          }}
        />
      ))}
      </div>
      {/* Fades the stars out toward the edges of the hero. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,var(--color-white)_95%)]" />
    </div>
  )
}

function Hero({ primaryLabel, onPrimary, onDemo, os, showDownloads, buttonsRef }) {
  const ordered = [...DOWNLOADS].sort((a, b) => (a.id === os ? -1 : b.id === os ? 1 : 0))

  return (
    <section className="relative isolate overflow-hidden">
      <Starfield />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-5 pt-16 pb-24 text-center sm:px-8 sm:pt-20">
        <LogoMark className="logo-land h-28 w-28 sm:h-36 sm:w-36" />

        <h1 className="mt-10 text-6xl leading-[0.98] tracking-tight sm:text-8xl lg:text-[7.5rem]">
          <span className="hero-in block" style={{ '--d': '150ms' }}>
            Stay healthy
          </span>
          <span className="hero-in block" style={{ '--d': '300ms' }}>
            in space
          </span>
        </h1>
        <p className="hero-in mt-6 max-w-md text-xl text-muted" style={{ '--d': '480ms' }}>A daily health check for astronauts.</p>

        <div ref={buttonsRef} className="hero-in mt-10 flex flex-wrap justify-center gap-3" style={{ '--d': '620ms' }}>
          <Button onClick={onPrimary} className="px-8 py-3.5 text-lg">
            {primaryLabel}
          </Button>
          {onDemo && (
            <Button onClick={onDemo} variant="outline" className="bg-white/60 px-8 py-3.5 text-lg backdrop-blur">
              Try the demo
            </Button>
          )}
        </div>

        {showDownloads && (
          <p className="hero-in mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted" style={{ '--d': '760ms' }}>
            <span>Desktop app:</span>
            {ordered.map((item) => (
              <a key={item.id} href={item.url} className="flex items-center gap-1.5 text-ink underline-offset-4 hover:underline">
                <Icon name={item.icon} size={16} />
                {item.os}
              </a>
            ))}
          </p>
        )}
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8">
      <SectionTitle eyebrow="Features" title="Everything you need, nothing you don't" text="Built for long missions, where the nearest doctor can be minutes or hours away." />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <article
            key={feature.title}
            data-reveal
            style={{ '--i': index % 3 }}
            className={`group flex flex-col gap-10 rounded-[28px] p-7 hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgba(0,0,0,0.35)] ${TONES[feature.tone]}`}
          >
            <span className={`grid h-12 w-12 place-items-center rounded-full transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 ${feature.tone === 'dark' ? 'bg-white/15' : 'bg-white'}`}>
              <Icon name={feature.icon} size={22} />
            </span>
            <div>
              <h3 className="text-xl">{feature.title}</h3>
              <p className={`mt-2 ${feature.tone === 'dark' ? 'opacity-70' : 'text-muted'}`}>{feature.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <SectionTitle eyebrow="How it works" title="Three steps, every day" />
      <ol className="mt-12 grid gap-8 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title} data-reveal style={{ '--i': index }} className="draw-line pt-6">
            <span className="text-5xl font-light text-muted tabular-nums">0{index + 1}</span>
            <h3 className="mt-4 text-xl">{step.title}</h3>
            <p className="mt-2 text-muted">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Story() {
  return (
    <section id="story" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8">
      {/* The picture leads, with the title on a dark fade at the bottom. Colors are fixed so they read on the photo in both themes. */}
      <figure data-reveal="zoom" className="relative overflow-hidden rounded-[40px] bg-[#0b0c0d]">
        <img
          src={belkaAndStrelka}
          alt="Illustration of two dogs in space helmets and suits: a white dog on the left and a brown and white dog on the right"
          width="738"
          height="416"
          loading="lazy"
          className="aspect-[4/3] w-full object-cover sm:aspect-[16/8] lg:aspect-[21/9]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c0d]/90 via-[#0b0c0d]/20 to-transparent" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-7 sm:p-10">
          <div>
            <p className="text-sm tracking-wide text-[#f1f1ee]/70 uppercase">The name</p>
            <h2 className="mt-2 text-4xl leading-tight text-[#f1f1ee] sm:text-6xl">Why Strelka?</h2>
          </div>
          <figcaption className="text-xs text-[#f1f1ee]/60">Belka (left) and Strelka (right). Illustration.</figcaption>
        </div>
      </figure>

      <div data-reveal className="mt-14 max-w-4xl">
        <p className="text-3xl leading-snug sm:text-4xl">
          Strelka (Стрелка) means <span className="text-good-dark">“little arrow”</span> in Russian.
        </p>
        <p className="mt-5 text-lg text-muted sm:text-xl">
          In 1960 she flew into orbit to prove a living body could survive spaceflight, and came home healthy. That is the whole idea
          behind this app.
        </p>
      </div>

      <ol className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {STORY.map((moment, index) => (
          <li key={moment.when} data-reveal style={{ '--i': index }} className="draw-line relative pt-6">
            <span className="absolute -top-[4.5px] left-0 h-2.5 w-2.5 rounded-full bg-good" aria-hidden="true" />
            <p className="text-sm text-muted">{moment.when}</p>
            <p className="mt-2 leading-relaxed">{moment.text}</p>
          </li>
        ))}
      </ol>

      <p className="mt-10 text-sm text-muted">Today Strelka and Belka are on display at the Museum of Cosmonautics in Moscow.</p>
    </section>
  )
}

function Team() {
  return (
    <section id="team" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionTitle eyebrow="About" title="The team" badge="Team 404 Vision" text="Strelka is open source, built for NASA Space Apps 2026 by four developers." />
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-ink/30 px-5 py-2.5 transition hover:border-ink"
        >
          <Icon name="github" size={18} />
          View the code
        </a>
      </div>

      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TEAM.map((person, index) => (
          <li key={person.login} data-reveal style={{ '--i': index }}>
            <a
              href={`https://github.com/${person.login}`}
              target="_blank"
              rel="noreferrer"
              className="group flex h-full flex-col items-start gap-8 rounded-[28px] bg-field p-6 transition duration-300 hover:-translate-y-1 hover:bg-mint"
            >
              <img src={person.avatar} alt="" width="64" height="64" loading="lazy" className="h-16 w-16 rounded-full object-cover transition-transform duration-300 group-hover:scale-110" />
              <span className="min-w-0">
                <span className="block truncate text-lg">{person.name}</span>
                <span className="flex items-center gap-1.5 truncate text-sm text-muted group-hover:text-ink">
                  <Icon name="github" size={14} />@{person.login}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Download({ os, primaryLabel, onPrimary }) {
  // One big button for this computer. Unknown systems (phones, Linux) get macOS as the main one.
  const main = DOWNLOADS.find((item) => item.id === os) ?? DOWNLOADS[0]
  const others = DOWNLOADS.filter((item) => item.id !== main.id)

  return (
    <section id="download" data-reveal className="mx-auto max-w-6xl scroll-mt-24 px-5 py-24 text-center sm:px-8">
      <LogoMark className="mx-auto h-16 w-16" />
      <h2 className="mt-6 text-4xl leading-tight sm:text-5xl">Get the desktop app</h2>
      <p className="mt-4 text-lg text-muted">The same Strelka, in its own window. Works offline.</p>

      <a
        href={main.url}
        aria-label={`Download Strelka for ${main.os}`}
        className="mt-10 inline-flex items-center gap-3 rounded-full bg-ink px-9 py-5 text-xl text-white transition duration-300 hover:scale-[1.03] hover:opacity-90 active:scale-[0.98]"
      >
        <Icon name={main.icon} size={24} />
        Download for {main.os}
      </a>
      <p className="mt-4 text-sm text-muted">
        {main.file} · {main.needs}
      </p>

      <p className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-muted">
        {others.map((item) => (
          <a key={item.id} href={item.url} className="flex items-center gap-1.5 text-ink underline-offset-4 hover:underline">
            <Icon name={item.icon} size={16} />
            Also on {item.os}
          </a>
        ))}
        <span aria-hidden="true">·</span>
        <button type="button" onClick={onPrimary} className="text-ink underline-offset-4 hover:underline">
          {primaryLabel} on the web
        </button>
      </p>
    </section>
  )
}

function Footer({ links }) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-muted sm:px-8">
        <div className="flex items-center gap-3">
          <LogoMark className="h-8 w-8" />
          <span>© {new Date().getFullYear()} Strelka Space</span>
        </div>
        <nav aria-label="Footer" className="flex gap-4">
          {links.map((link) => (
            <button key={link.id} type="button" onClick={() => scrollToSection(link.id)} className="hover:text-ink">
              {link.label}
            </button>
          ))}
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-ink">
            <Icon name="github" size={14} />
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  )
}

export default function Welcome({ onStart, onDemo, onContinue, theme, onToggleTheme }) {
  useReveal()
  const os = detectOs()
  const showDownloads = !IN_DESKTOP_APP
  const primaryLabel = onContinue ? 'Back to Dashboard' : 'Get started'
  const onPrimary = onContinue ?? onStart
  // Watch the hero buttons: while they are on screen, the top bar doesn't repeat them.
  const heroButtons = useRef(null)
  const [heroButtonsVisible, setHeroButtonsVisible] = useState(true)
  useEffect(() => {
    // The buttons count as gone once they have scrolled up behind the sticky top bar (about 72px tall).
    function check() {
      const target = heroButtons.current
      if (target) setHeroButtonsVisible(target.getBoundingClientRect().bottom > 72)
    }
    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [])

  const links = [
    { id: 'features', label: 'Features' },
    { id: 'story', label: 'Story' },
    { id: 'team', label: 'Team' },
    ...(showDownloads ? [{ id: 'download', label: 'Download' }] : []),
  ]

  return (
    <div className="min-h-dvh bg-white">
      <TopBar links={links} primaryLabel={primaryLabel} onPrimary={onPrimary} theme={theme} onToggleTheme={onToggleTheme} showCta={!heroButtonsVisible} />
      <main>
        <Hero primaryLabel={primaryLabel} onPrimary={onPrimary} onDemo={onContinue ? null : onDemo} os={os} showDownloads={showDownloads} buttonsRef={heroButtons} />
        <Features />
        <HowItWorks />
        <Story />
        <Team />
        {showDownloads && <Download os={os} primaryLabel={onContinue ? 'Open Strelka' : 'Use Strelka'} onPrimary={onPrimary} />}
      </main>
      <Footer links={links} />
    </div>
  )
}
