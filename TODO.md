# Rubik CFOP Study App — Roadmap

## Practice
- [ ] **Setup scramble on cards** — Add a starting position (scramble) to each algorithm card so users can practice reaching the case from a solved cube.
- [ ] **Practice timer** — Per-case stopwatch to measure recognition + execution speed over time.
- [ ] **SRS (Spaced Repetition)** — Review queue using localStorage: intervals, mastery levels, weak-case surfacing.
- [ ] **Quick mark (no SRS)** — Simple "I know this / Review later" tagging without the full SRS overhead.

## Content
- [ ] **OLL names** — Add canonical names to all 57 OLL cases (e.g. "Dot", "L-shape", "Lightning", "Sune"...).
- [ ] **Trigger labels** — Annotate known sub-sequences inside algorithms: Sexy Move, Sledgehammer, Sune, Anti-Sune, etc.
- [ ] **Algorithm variants** — Many cases have a main alg + backup; let users pick and save their preferred version.
- [ ] **Fingertrick annotations** — Execution notes: grip changes, regrips, efficient trigger suggestions.
- [ ] **F2L multislotting** — New learning section focused on solving multiple F2L slots/blocks at once (planning and pair tracking).
- [ ] **OH (One-Handed)** — Dedicated section for one-handed algorithms and technique.
- [ ] **BLD (Blindfolded)** — Blindfolded methods: M2/OP, commutators, memorisation approach.
- [ ] **Advanced LL subsets** — ZBLL, COLL, OLLCP for users who have outgrown standard CFOP.
- [ ] **Cross planning** — Section on cross solutions and inspection planning.

## Navigation & Discovery
- [ ] **Search & filter** — Filter cases by status (unseen / weak / mastered), search by name or notation substring.
- [ ] **Favourites / bookmarks** — Pin cases for focused review sessions.
- [ ] **Notation reference** — Built-in glossary of moves (M/E/S slices, wide moves, rotations) for beginners.

## Design
- [ ] **Responsive / mobile** — Audit and fix layout on mobile: card grid, modal viewer, sidebar nav.

## Export & Sharing
- [ ] **PDF / cheatsheet export** — Generate a printable PDF of any subset (e.g. "my pending OLLs").

## Infrastructure & Product
- [ ] **Deployment pipeline** — CI/CD setup and hosting decision (Vercel, Netlify, GitHub Pages...).
- [ ] **Analytics (Mixpanel)** — Track navigation, cases viewed, modal usage, and overall funnel.
