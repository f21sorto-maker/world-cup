# Match detail tab stability

Fix match-detail drawer tab freezes/crashes on mobile.

## Phase 0 — Baseline (done)

- [x] Dev logging: `logMatchDetailTabSwitch` / `logMatchDetailFetch` (`src/lib/matchDetailDebug.ts`)
- [x] Enable in dev, or `?matchdebug` / `localStorage wc-match-detail-debug=1`
- [ ] Manual matrix: tab × freeze × console (run on device)

| Tab | Freezes? | Console / Network notes |
|-----|----------|-------------------------|
| Summary | | |
| Statistics | | |
| Lineups | | |
| Commentary | | |
| H2H | | |
| Watch | | |
| Highlights | | |

## Phase 1 — Hook stability + tab gating (done)

- [x] Stabilize `useMatchDetailBundle` deps (match id/status, not object ref)
- [x] Stabilize `useLiveStreamForMatch` + `enabled` flag
- [x] Stabilize `useYouTubeMatchVideos` deps
- [x] Split sync vs async in `useGoalScorerProfiles`; read store inside effects
- [x] Dedupe `useGoalScorerProfiles` — single call in `MatchDetailView`
- [x] Gate Highlightly + live stream by `activeMatchTab`
- [x] Unit test: `countGoalEventsInStore`

## Phase 2 — Safe media tabs (done)

- [x] Tap-to-play iframes (Watch, Highlights) via `TapToPlayEmbed`
- [x] Remove `dangerouslySetInnerHTML` on Watch — `extractIframeSrc` + link fallback
- [x] Lighter YouTube resolution: Google search first, channel crawl fallback, in-flight dedup

## Phase 3 — Lineups perf (done)

- [x] Replace `PitchDiagram` SVG `foreignObject` with div/CSS overlay + pitch-only SVG markings
- [x] Unit tests: `pitchDiagramLayout` coordinate parity with legacy SVG math

## Phase 4 — Resilience (done)

- [x] `PanelErrorBoundary` on Statistics, Lineups, Commentary, H2H (Watch + Highlights already wrapped)

## Verify

```bash
npm test
npm run build
```

Manual: open completed match → tap each tab → no freeze; Network tab quiet on Summary for 60s.
