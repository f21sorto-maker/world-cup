# World Cup Lab

Interactive simulator for the 2026 FIFA World Cup.

The app combines live group-stage results, Polymarket match probabilities, FIFA ranking points, host advantage and Monte Carlo simulations to help explore the 48-team format, especially the eight best third-placed teams and the knockout paths that follow.

## Features

- Live group-stage results from ESPN's public scoreboard.
- Polymarket 1X2 markets for upcoming fixtures.
- FIFA `DecimalTotalPoints` as the main team-strength baseline.
- Soft title prior from Polymarket outright-winner odds.
- Host bonus for the United States, Mexico and Canada.
- Editable deterministic scenario: change future group scores and bracket winners.
- Official 2026 Round-of-32 bracket with the 495-combination third-place mapping.
- Monte Carlo title odds and conditional opponent paths for any team.
- Score model based on Negative Binomial marginals with a small Dixon-Coles adjustment.

## Model Summary

Team strength starts from:

```text
baseRating = 0.75 * FIFA DecimalTotalPoints
           + 0.25 * Polymarket title prior
           + host bonus
```

where:

```text
titlePrior = 1500 + 125 * ln(p_title / 0.012)
```

Future Polymarket match markets then reweight teams via:

```text
E = P(win) + 0.5 * P(draw)
target rating gap = 180 * logit(E)
```

Completed matches apply a small capped Elo-like result adjustment. The rating itself is not bounded; only market/result adjustments and match probabilities are regularized.

For matches without a Polymarket market, the adjusted rating drives 1X2 or knockout-advance probabilities. When a real Polymarket market exists for a known knockout match, the app uses it before falling back to the rating model.

The methodology page inside the app contains the detailed version.

## Data Sources

- ESPN public soccer scoreboard for World Cup fixtures, scores and cards.
- Polymarket Gamma API for match and tournament markets.
- FIFA public rankings API for `DecimalTotalPoints` and rank.

All APIs are free and keyless at the time this app was built.

## Local Development

```bash
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

Build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Deployment

Vercel is the recommended deployment target because the app needs same-origin rewrites for the external data APIs. The included `vercel.json` proxies:

- `/espn/*` to `https://site.api.espn.com/*`
- `/poly/*` to `https://gamma-api.polymarket.com/*`
- `/fifa-api/*` to `https://api.fifa.com/*`
- `/fifa/*` to `https://inside.fifa.com/*`

GitHub Pages alone is not ideal unless you add a separate proxy service.

## Notes

This is a hobby/analytics simulator, not betting advice. The model is intentionally simple and transparent, with Polymarket used as an input and as a benchmark rather than a black-box source of final answers.
