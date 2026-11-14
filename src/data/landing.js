// Words and links for the landing page: features, how it works, downloads and the story behind the name.

import danielcandole from '../assets/team/danielcandole.jpg'
import genbarry from '../assets/team/genbarryalamagvillasan-png.jpg'
import joreese from '../assets/team/joreese-clyde.jpg'
import justinecua from '../assets/team/justinecua.jpg'

export const REPO_URL = 'https://github.com/justinecua/strelka-space-apps-2026'

// The people behind Strelka: the GitHub contributors of the repo, with their public GitHub names.
// Avatars are saved in src/assets/team so the page also works offline.
export const TEAM = [
  { login: 'justinecua', name: 'Justine Cua', avatar: justinecua },
  { login: 'joreese-clyde', name: 'joreeseclyde', avatar: joreese },
  { login: 'danielcandole', name: 'Daniel Candole', avatar: danielcandole },
  { login: 'genbarryalamagvillasan-png', name: 'blu', avatar: genbarry },
]

// The desktop builds are uploaded to GitHub Releases. electron-builder names them Strelka.exe and Strelka.dmg
// (see "build" in package.json), so these links always point at the newest release.
const RELEASES = 'https://github.com/justinecua/strelka-space-apps-2026/releases/latest/download'

export const DOWNLOADS = [
  {
    id: 'mac',
    os: 'macOS',
    icon: 'apple',
    file: 'Strelka.dmg',
    url: `${RELEASES}/Strelka.dmg`,
    needs: 'macOS 12 or later',
  },
  {
    id: 'windows',
    os: 'Windows',
    icon: 'windows',
    file: 'Strelka.exe',
    url: `${RELEASES}/Strelka.exe`,
    needs: 'Windows 10 or later, 64-bit',
  },
]

export const FEATURES = [
  {
    icon: 'checkin',
    tone: 'mint',
    title: 'Check-ins that know the time',
    text: 'Morning and before-sleep check-ins open on their own. Log a workout or a symptom any time.',
  },
  {
    icon: 'target',
    tone: 'cream',
    title: 'Compared with your normal',
    text: 'After 7 check-ins, Strelka learns what is normal for you, not for a textbook.',
  },
  {
    icon: 'crew',
    tone: 'gray',
    title: 'Clear next steps',
    text: 'Every result says what to do and who to tell, with the signal delay to Earth.',
  },
  {
    icon: 'mic',
    tone: 'dark',
    title: 'Hands-free voice',
    text: 'Say “heart rate 62” or “symptom report”. Made for gloves and floating.',
  },
  {
    icon: 'body',
    tone: 'gray',
    title: 'Body map',
    text: 'See how spaceflight affects each part of the body, with NASA research behind it.',
  },
  {
    icon: 'offline',
    tone: 'mint',
    title: 'Private and offline',
    text: 'No account. Your check-ins stay on your device and work without internet.',
  },
]

export const STEPS = [
  { title: 'Set up your mission', text: 'Your name, where you are, and your usual numbers if you know them.' },
  { title: 'Check in', text: 'Two minutes after waking up and before sleep. Type or just talk.' },
  { title: 'Know what to do', text: 'A clear status, simple next steps, and a report to share with your crew medic.' },
]

// Strelka's flight, kept to well-documented facts and short enough for four columns.
export const STORY = [
  { when: '19 August 1960', text: 'Strelka and Belka, two former Moscow street dogs, launch aboard Sputnik 5.' },
  { when: 'A day in orbit', text: 'They circle the Earth 17 times while sensors track their heartbeat and breathing.' },
  { when: '20 August 1960', text: 'Both land safely, the first animals to orbit the Earth and come home alive.' },
  { when: '1961', text: 'Yuri Gagarin follows them into orbit. Strelka has six puppies back on Earth.' },
]
