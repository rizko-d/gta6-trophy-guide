# Leonida Platinum — GTA VI Trophy Guide & Tracker

[![make.fun bounty](https://make.fun/bounty/gta6-trophy-guide-01/badge.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![make.fun entry](https://make.fun/bounty/gta6-trophy-guide-01/entry.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline web app that is the best guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI: the official list with a guide to each trophy in our own words that cites its sources, a roadmap to the platinum, the missable trophies flagged, and a checklist that saves your progress in the browser.

Built for the make.fun bounty [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01) — "Build the best GTA 6 trophy guide".

## What it is

- **All 55 trophies** — 1 platinum, 2 gold, 6 silver, 46 bronze (28 hidden on PlayStation until earned), each with its official name, description and grade as PlayStation publishes them, plus a guide, steps and sources.
- **Tracker** — tick trophies off; progress is saved in the browser (localStorage), with export to a JSON file and import back. Filters by kind (story, side strands, collectibles, activities, combat & crime, exploration), grade, missable only, hide earned, and search.
- **Spoiler setting** — hides the names, descriptions and guides of story trophies you have not earned yet, until you earn them.
- **Roadmap to the platinum** — five stages in order, built from the official descriptions: story, stranger strands, exploration & collectibles, activities & combat, money & 100%.
- **Missables flagged** — 7 trophies flagged as possibly missable, each with why, and the advice to finish them before the final story mission.
- **Cited, honest guidance** — every guide is written from the official description and names its sources (the official list on Exophase, PSNProfiles for PSN's counts). Where a place or step cannot be verified from the description, the guide says plainly what is still to confirm instead of inventing a location.
- **Offline** — static files under `app/`, no build step, no network requests at run time. Open `app/index.html` from any static server.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library (`vendor/makefun-frontend.ts`, the kit's copy, unchanged).

## Files

- `app/index.html`, `app/style.css`, `app/app.js` — the guide (own look, system fonts only).
- `app/data/trophies.json` — all 55 trophies: official name, description, grade, hidden flag, kind, missable flag, PSN count where one exists, roadmap stage, guide, steps, sources and what is still to confirm.
- `screenshots/` — 4 real renders of the guide in a browser.
- `main.ts` — the hand-in program (Node 22, stdlib only).
- `serve.ts` — local static server for testing.
- `shots.json` — which views the screenshots were taken of.
- `BUILD_REPORT.md` — concept, verification and known weaknesses.

## License

MIT — see `LICENSE`. Unofficial fan guide, not affiliated with Rockstar Games, Take-Two Interactive or Sony Interactive Entertainment. No Rockstar logo or official artwork is used.
