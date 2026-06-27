import { useMatchOdds } from "../../hooks/useMatchOdds";
import type { MergedMatch, OddsSnapshot } from "../../types";

type Props = {
  match: MergedMatch;
  homeTeam: string;
  awayTeam: string;
  compact?: boolean;
};

const POLYMARKET_EVENT_BASE = "https://polymarket.com/event";

function formatOdds(val: number | null | undefined): string {
  if (val == null || val === 0) return "—";
  return val > 0 ? `+${val}` : String(val);
}

function sourceLabel(source: OddsSnapshot["source"]): string {
  if (source === "polymarket") return "Polymarket";
  if (source === "sportsbook") return "Sportsbook";
  return "Odds";
}

export function OddsRow({ match, homeTeam, awayTeam, compact }: Props) {
  const { odds, loading } = useMatchOdds(match, homeTeam, awayTeam);

  if (loading) {
    return (
      <div className={`odds-row odds-row--loading ${compact ? "odds-row--compact" : ""}`.trim()}>
        <span className="odds-label">Odds</span>
        <span className="odds-loading">Loading…</span>
      </div>
    );
  }

  if (!odds) return null;

  const marketUrl =
    odds.source === "polymarket" && odds.marketSlug
      ? `${POLYMARKET_EVENT_BASE}/${odds.marketSlug}`
      : undefined;

  const label = sourceLabel(odds.source);

  return (
    <div className={`odds-row ${compact ? "odds-row--compact" : ""}`.trim()} aria-label={`${label} betting odds`}>
      <span className="odds-label">
        {marketUrl ? (
          <a href={marketUrl} target="_blank" rel="noopener noreferrer" className="odds-source-link">
            {label}
          </a>
        ) : (
          label
        )}
      </span>
      <span className="odds-cell odds-cell--home" title={homeTeam}>
        {formatOdds(odds.homeWin)}
      </span>
      {odds.twoWay ? (
        <span className="odds-cell odds-cell--draw odds-cell--na">To advance</span>
      ) : (
        <span className="odds-cell odds-cell--draw">Draw {formatOdds(odds.draw)}</span>
      )}
      <span className="odds-cell odds-cell--away" title={awayTeam}>
        {formatOdds(odds.awayWin)}
      </span>
    </div>
  );
}
