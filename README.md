# cube-alg-catalog

A tiny, visual OLL/PLL catalog (Vite + React + TypeScript) using cubing.js `twisty-player`.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Add / edit algorithms

Edit: `src/data/algs.json`

Schema:
- `id`: unique string
- `set`: "OLL" or "PLL"
- `name`: display name (e.g. "T-perm")
- `alg`: algorithm string (e.g. "R U R' ...")
- `thumb` (optional): image path in `/public`, e.g. `"/thumbs/pll/t-perm.png"`

Notes:
- The viewer uses `experimental-setup-anchor="end"` so the cube starts from the case and ends solved.
- Cards include a mini viewer, lazy-loaded via IntersectionObserver to keep the app snappy.
