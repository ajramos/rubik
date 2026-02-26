# Rubik Knowledge Atlas

A personal CFOP study app — visual algorithm catalog with 3D interactive viewer and spaced-repetition drills.

**Stack:** Vite · React 18 · TypeScript · [cubing.js](https://github.com/cubing/cubing.js) twisty-player · No backend

---

## Features

### Study
- **OLL** — all 57 cases grouped by shape, with canonical visual names and recognition thumbnails
- **PLL** — all 21 cases grouped by recognition pattern
- **F2L** — canonical 30-case starter catalog (Free / Disconnected / Connected / Corner-in-Slot)
- **4LLL guided path** — 14 curated cases for beginners (2-Look OLL + 2-Look PLL)
- 3D case viewer with `twisty-player` animation (click any card)
- Named trigger tokens with hover tooltips ([SEXY], [SLEDGEHAMMER]…)

### Practice
- **Recognition Drills** — OLL and PLL sets, one case at a time
- **SM-2 SRS** — 4-button Anki-style rating (Again / Hard / Good / Easy)
- Session queue: up to 20 cards, due cards first then new
- Persistent progress via `localStorage` key `rubik-srs-v1`

---

## Run locally

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # tsc + vite build → dist/
npm run preview    # preview production build
```

---

## Project structure

```
src/
├── App.tsx                  # Main component — all state + data constants (~2100 lines)
├── types.ts                 # AlgItem, AlgSet
├── data/
│   └── algs.json            # Canonical OLL/PLL algorithm data
├── utils/
│   ├── alg.ts               # formatAlg, invertAlg, detectTriggers, renderAlgBlock…
│   └── srs.ts               # SM-2 engine + localStorage helpers
└── components/
    ├── AppHero.tsx           # Top header
    ├── AppRail.tsx           # Left sidebar nav + roadmap
    ├── DrillModal.tsx        # SRS drill overlay
    ├── MiniTwisty.tsx        # Thumbnail renderer (screenshot from twisty-player)
    ├── Twisty.tsx            # Full 3D case viewer
    └── WorkspaceScaffold.tsx # Practice / Progress / Reference sections
```

---

## Algorithm data format

Edit `src/data/algs.json`:

```json
{
  "id": "oll_27",
  "set": "OLL",
  "name": "Sune",
  "alg": "R U R' U R U2 R'",
  "thumb": "/thumbs/oll/oll_27.png"
}
```

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Unique — `oll_N`, `pll_xx` |
| `set` | `"OLL" \| "PLL" \| "F2L"` | |
| `name` | `string` | Display name |
| `alg` | `string` | Standard notation |
| `thumb` | `string?` | Path in `/public` — auto-generated at runtime if omitted |

---

## Roadmap

- [ ] Today Queue — show SRS due count, launch drill from Practice tile
- [ ] SRS badge on catalog cards (new / due / learned)
- [ ] Progress section — coverage %, interval distribution, never-seen vs learned
- [ ] Complete F2L canonical to 41 cases
- [ ] OH (One-Handed) alg variants
- [ ] BLD support
