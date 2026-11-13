// NASA's five hazards of human spaceflight, summarized in our own words from the NASA Human Research Program.
// "inApp" says honestly what Strelka does about each one.

export const NASA_HAZARDS_URL = 'https://www.nasa.gov/hrp/hazards/'

export const HAZARDS = [
  {
    id: 'radiation',
    name: 'Space radiation',
    icon: 'radiation',
    summary:
      "Outside Earth's magnetic field, cosmic rays and solar storms pass through the spacecraft and the body. You can't see or feel it, but over time it raises the risk of cancer and can affect the heart, brain and immune system.",
    inApp:
      "Strelka does not measure radiation; onboard dosimeters do that. It watches the heart and immune signs radiation can affect, and flags changes early.",
  },
  {
    id: 'isolation',
    name: 'Isolation & confinement',
    icon: 'crew',
    summary:
      'A small crew lives in a small space for months, far from family and friends. Sleep loss, a disrupted body clock and heavy workload add up and can affect mood, teamwork and performance.',
    inApp:
      'Daily mood, stress and sleep check-ins. Poor sleep together with low mood is flagged, and lasting patterns are shared with your crew medic.',
  },
  {
    id: 'distance',
    name: 'Distance from Earth',
    icon: 'earth',
    summary:
      'The further from Earth, the longer messages take and the harder it is to get supplies or medical help. On the way to Mars, a question and answer with the ground can take up to 48 minutes.',
    inApp:
      'Advice changes with radio delay: on deep-space missions it tells you to start the onboard protocol instead of waiting for Earth. Everything works offline.',
  },
  {
    id: 'gravity',
    name: 'Gravity fields',
    icon: 'planet',
    summary:
      'Muscles, bones, the inner ear and the heart all adapt to weightlessness, then have to adapt again on the Moon, Mars or back on Earth. Fluid shifts toward the head, and bone and muscle are lost without exercise.',
    inApp:
      'Tracks blood pressure and heart rate for fluid shift, vision changes for eye problems (SANS), and daily exercise against bone and muscle loss.',
  },
  {
    id: 'environment',
    name: 'Hostile / closed environment',
    icon: 'thermometer',
    summary:
      'The spacecraft is a sealed ecosystem: temperature, air pressure, lighting, noise, CO₂ and shared microbes all have to be managed. These affect sleep, comfort and the immune system.',
    inApp:
      'Tracks temperature, rashes and headaches, and flags combinations that can point to an infection or high cabin CO₂.',
  },
]

export const HAZARD_BY_ID = Object.fromEntries(HAZARDS.map((hazard) => [hazard.id, hazard]))
