# Strelka: onboard health copilot for astronauts

Named after Strelka, one of the two dogs that flew around Earth on Sputnik 5 in 1960 and came home healthy. The mark is a white dog in profile, cut out of a black helmet.
NASA Space Apps 2026 · *Create Health Monitoring Software for Astronauts on Space Missions*

Strelka compares each astronaut to **their own pre-flight baseline** as well as general health limits, and answers one question: **can I handle this myself, should I tell the crew medical officer, or does this need the flight surgeon?** The answer accounts for **Earth communication delay**. On a Mars mission, a reply from the ground takes 8–48 minutes, so the crew has to act on its own.

## How it works for an astronaut
1. **Welcome** explains the app in three steps.
2. **Step 1 · About you**: name, mission (ISS, Moon, Mars…) and mission start date.
3. **Step 2 · Your baseline**: type in pre-flight numbers, or let the app learn them from the first 7 check-ins. While it learns, readings are compared with general health limits.
4. **Step 3 · First check-in**: about 10 readings plus symptoms, each checked as you type.
5. **Today** then shows the verdict (who should act), the top 3 things to do, today's readings, and a **report for the crew medical officer** (download or copy). Each new day starts with a "check-in due" prompt. Checking in twice on the same date updates that day.
6. **Body**: tap a region to see its readings, any open issue, and what you can do.

**NASA's 5 hazards** (radiation, isolation, distance from Earth, gravity, closed environment) appear on the Welcome screen and on each Body region ("Affected by…"). Tapping one explains it and what Strelka does about it, with a link to NASA's Human Research Program. Each hazard also lists its **NASA health risks**: 11 of the 17 are checked by the app, and the other 6 say why they aren't (e.g. decompression sickness is handled by spacewalk procedures). Text is in `src/data/hazards.js` and `src/data/risks.js`.

Everything stays on the device and works offline. "Explore a demo mission" on the Welcome screen loads 180 days of simulated data instead.

## NASA research this builds on
Each Body region has a collapsed **"NASA research on this"** list of related Human Research Program studies (`src/data/research.js`). Three are worth naming in the pitch:
- **ARCHeR (Artemis II)**: wrist actigraphy tracked crew sleep, activity and well-being. Strelka's sleep reading uses the same kind of device.
- **Standard Measures**: NASA collects one consistent set of body and mind measurements from every crew member. That is the idea behind the daily check-in.
- **Tempus Pro**: a telemedicine device that collects health data for remote diagnosis. It is the direction for Strelka's CMO report and future device connections.

## Code layout
```
src/
  data/        plain data (indicators, regions, missions, tiers, advice)
  lib/         logic with no UI: status.js (one reading), triage.js (full assessment),
               entries.js (save check-ins), report.js (CMO report)
  components/  small UI pieces grouped by page, plus shared ui/
  pages/       Today, CheckIn, Body
```

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm test         # triage unit tests
npm run build    # static site in dist/ (deploy to Vercel / GitHub Pages)
```
Deep links: `#today`, `#checkin`, `#body`. Use "Reset demo data" in the footer to restore the seeded mission.

## Demo script (2 min video)
1. Start on **Welcome**, go through setup (name, Mars transit, "learn from my first 7 check-ins") and do the first check-in. Show the "Learning your baseline: 1 of 7" note.
2. Go back, choose **Explore a demo mission** (Reset app → Welcome) to show day 180: verdict "CMO review" from rising blood pressure, headache and a vision change. Open "Why your own baseline?".
3. Click **Download report for CMO** and show the file.
4. **Check-in**: set SpO₂ to 88 (it turns red), save. Today now says "Call flight surgeon".
5. Switch mission to **ISS**: the radio-delay warning changes.

## Before submitting
- Add your own touch: a scanned sketch, a real photo, or results from asking a few people to try a check-in.

## Note
Thresholds are illustrative for a prototype and are not medical advice.
