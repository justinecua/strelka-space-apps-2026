# Strelka

A daily health check-in for astronauts. Built for NASA Space Apps 2026, challenge: *Create Health Monitoring Software for Astronauts on Space Missions*.

The name comes from Strelka, one of the two dogs that orbited Earth on Sputnik 5 in 1960 and came back healthy.

## The idea

On a long mission, help from the ground can be 20+ minutes away. So the crew has to notice problems early and decide for themselves what to do.

Strelka asks for a two-minute check-in each day: heart rate, blood pressure, oxygen, temperature, glucose, sleep, mood, stress, exercise and any symptoms. It compares those numbers with **what's normal for that astronaut**, not just textbook ranges. Bodies change in space, and a drift from your own normal often shows up before anything leaves the "healthy" range.

After each check-in you get one of four answers:

- **All good**
- **Keep an eye on it**: try the tips and check again tomorrow
- **Tell your crew medic**: something has been building for a few days
- **Get help now**: a reading needs the ground doctor right away

It also takes the distance to Earth into account. On the ISS you can call the ground almost instantly; on the way to Mars a reply can take up to 48 minutes, so the app tells you to start the onboard steps first.

## What's in the app

- **Today**: the result, what to do next, and your main readings. Every card opens full screen with charts and details. You can switch between a grid view and a simpler list view.
- **Check-in**: the daily form. Each field shows right away if a value looks off, and there's a "how do I measure this?" guide for each one.
- **Body**: tap a part of the body to see its readings, which of NASA's 5 spaceflight hazards affect it, and related NASA research.
- **History**: every past check-in. Open one to see all its values, edit it, delete it, or add a day you missed.
- A report you can download or copy to share with the crew medic.
- Light and dark mode.

Your normal comes from pre-flight numbers you type in, or the app learns it from your first 7 check-ins.

Everything is saved in the browser, so it works offline. There's also a demo with 180 days of made-up data from a Mars transit.

## Running it

```bash
npm install
npm run dev     # opens on http://localhost:5173
npm test        # tests for the health logic
npm run build   # static files in dist/
```

## Where things are

```
src/
  data/        the content: readings and their limits, body parts, missions, hazards, advice
  lib/         the logic: how a reading is judged, the daily result, saving check-ins, the report
  components/  small UI pieces, grouped by page
  pages/       Welcome, Setup, Today, CheckIn, Body, History
```

If you want to change a limit or a piece of advice, start in `src/data/`. The decision logic is in `src/lib/status.js` (one reading) and `src/lib/triage.js` (the whole day).

## NASA sources

The hazards and risks follow NASA's Human Research Program (the 5 hazards of human spaceflight and the list of human health risks). Studies like ARCHeR on Artemis II and NASA's Standard Measures, which collect the same set of health data from every crew member, are the closest real-world versions of what this app does.

## Disclaimer

The limits in this app are for a prototype. It is not a medical device and not medical advice.

## Running and building

| Command | What it does |
|---|---|
| `npm run dev` | Runs the website locally |
| `npm run build` | Builds the website into `dist/` (upload this folder, or point Vercel/Netlify at the repo) |
| `npm run desktop` | Opens the app in a desktop window |
| `npm run dist:win` | Builds `release/Strelka.exe` for Windows (no install needed, just run it) |
| `npm run dist:mac` | Builds `release/Strelka.dmg` for Mac |

The desktop app is the same website wrapped with Electron (see `electron/main.cjs`). It works fully offline.

## Hosting on strelka.health (Docker)

`docker compose` runs one container: nginx serving the built site on `127.0.0.1:8110`. The server's existing Cloudflare Tunnel connects strelka.health to that port, and Cloudflare handles HTTPS.

1. In the Cloudflare tunnel, add public hostnames `strelka.health` and `www.strelka.health`, both with service **HTTP** and URL `localhost:8110`.
2. On the server:

```bash
docker compose up -d --build
curl -I http://localhost:8110   # should say 200 OK
```

To deploy a new version: `git pull && docker compose up -d --build`.
