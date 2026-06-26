import { useEffect, useState } from "react";
import { getOdds } from "../../services/OddsCache";
import type { EventOdds } from "../../services/OddsIntelligenceClient";

type Props = { espnEventId: string; homeTeam: string; awayTeam: string };

function formatOdds(val: number | null | undefined): string {
  if (val == null) return "—";
  return val > 0 ? `+${val}` : String(val);
}

export function OddsRow({ espnEventId, homeTeam, awayTeam }: Props) {
  const [odds, setOdds] = useState<EventOdds | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getOdds(espnEventId).then((data) => {
      if (!cancelled) setOdds(data);
    });
    return () => {
      cancelled = true;
    };
  }, [espnEventId]);

  if (!odds) return null;

  return (
    <div className="odds-row" aria-label="Sportsbook odds">
      <span className="odds-label">Odds</span>
      <span className="odds-cell odds-cell--home" title={homeTeam}>
        {formatOdds(odds.bestHome)}
      </span>
      <span className="odds-cell odds-cell--draw">Draw {formatOdds(odds.bestDraw)}</span>
      <span className="odds-cell odds-cell--away" title={awayTeam}>
        {formatOdds(odds.bestAway)}
      </span>
    </div>
  );
}
