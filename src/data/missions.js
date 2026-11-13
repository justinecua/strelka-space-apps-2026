// Mission environments the astronaut can pick from.
// delayMin is the one-way radio delay to Earth in minutes.

export const MISSIONS = [
  {
    id: 'iss',
    name: 'Space station (LEO)',
    delayMin: 0,
    delayLabel: '< 1 s',
  },
  {
    id: 'gateway',
    name: 'Lunar orbit (Gateway)',
    delayMin: 0.02,
    delayLabel: '1.3 s',
  },
  {
    id: 'moon',
    name: 'Lunar surface base',
    delayMin: 0.02,
    delayLabel: '1.3 s',
  },
  {
    id: 'transit',
    name: 'Mars transit',
    delayMin: 12,
    delayLabel: '4–24 min',
    roundTrip: '8–48 minutes',
  },
  {
    id: 'mars',
    name: 'Mars surface base',
    delayMin: 12,
    delayLabel: '4–24 min',
    roundTrip: '8–48 minutes',
  },
]

export const MISSION_BY_ID = Object.fromEntries(MISSIONS.map((mission) => [mission.id, mission]))
