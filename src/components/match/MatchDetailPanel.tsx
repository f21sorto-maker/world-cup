import { useEffect, useState } from "react";
import {
  fetchCommentary,
  fetchLineups,
  fetchStats,
  isWc2026LiveDisabled,
  type WcCommentaryEntry,
  type WcLineup,
  type WcStats,
} from "../../services/WorldCup2026LiveClient";
import { isApiEnabled } from "../../config/apiFlags";
import type { MergedMatch } from "../../types";

type Props = {
  match: MergedMatch;
  wcMatchId?: string | number;
  onClose: () => void;
};

type DetailTab = "commentary" | "lineups" | "stats";

function useMathDetail(wcMatchId: string | number | undefined) {
  const [commentary, setCommentary] = useState<WcCommentaryEntry[]>([]);
  const [lineups, setLineups] = useState<WcLineup | null>(null);
  const [stats, setStats] = useState<WcStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!wcMatchId || !isApiEnabled("wc2026Live") || isWc2026LiveDisabled()) return;

    setLoading(true);
    void Promise.allSettled([
      fetchCommentary(wcMatchId),
      fetchLineups(wcMatchId),
      fetchStats(wcMatchId),
    ]).then(([c, l, s]) => {
      if (c.status === "fulfilled") setCommentary(c.value);
      if (l.status === "fulfilled") setLineups(l.value);
      if (s.status === "fulfilled") setStats(s.value);
      setLoading(false);
    });
  }, [wcMatchId]);

  return { commentary, lineups, stats, loading };
}

export function MatchDetailPanel({ match, wcMatchId, onClose }: Props) {
  const [tab, setTab] = useState<DetailTab>("commentary");
  const { commentary, lineups, stats, loading } = useMathDetail(wcMatchId);

  const homeTeam = match.homeTeamId;
  const awayTeam = match.awayTeamId;

  return (
    <div className="match-detail-backdrop" role="presentation" onClick={onClose}>
      <div
        className="match-detail-panel"
        role="dialog"
        aria-label="Match detail"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="match-detail-header">
          <h2 className="match-detail-title">
            {homeTeam} {match.homeScore ?? "–"} : {match.awayScore ?? "–"} {awayTeam}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="match-detail-close">
            ×
          </button>
        </header>

        {wcMatchId ? (
          <>
            <div className="match-detail-tabs">
              {(["commentary", "lineups", "stats"] as DetailTab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={tab === t ? "active" : ""}
                  onClick={() => setTab(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div className="match-detail-body">
              {loading ? (
                <p className="match-detail-loading">Loading…</p>
              ) : (
                <>
                  {tab === "commentary" ? (
                    <ul className="match-commentary-list">
                      {commentary.length === 0 ? (
                        <li className="match-commentary-empty">No commentary available</li>
                      ) : (
                        commentary.map((entry, i) => (
                          <li key={i} className="match-commentary-entry">
                            {entry.minute != null ? (
                              <span className="commentary-minute">{entry.minute}'</span>
                            ) : null}
                            <span className="commentary-text">{entry.text}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  ) : null}

                  {tab === "lineups" ? (
                    <div className="match-lineups">
                      {!lineups ? (
                        <p>Lineups not available</p>
                      ) : (
                        <div className="lineups-grid">
                          <div className="lineup-col">
                            <h3>{homeTeam}</h3>
                            <ul>
                              {(lineups.homeTeam?.startingXI ?? []).map((p, i) => (
                                <li key={i}>{JSON.stringify(p)}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="lineup-col">
                            <h3>{awayTeam}</h3>
                            <ul>
                              {(lineups.awayTeam?.startingXI ?? []).map((p, i) => (
                                <li key={i}>{JSON.stringify(p)}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {tab === "stats" ? (
                    <div className="match-stats">
                      {!stats ? (
                        <p>Stats not available</p>
                      ) : (
                        <table className="stats-table">
                          <thead>
                            <tr>
                              <th>{homeTeam}</th>
                              <th>Stat</th>
                              <th>{awayTeam}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.keys(stats.homeTeam ?? {}).map((key) => (
                              <tr key={key}>
                                <td>{stats.homeTeam?.[key]}</td>
                                <td className="stat-label">{key}</td>
                                <td>{stats.awayTeam?.[key]}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </>
        ) : (
          <p className="match-detail-no-wc">Live detail not available for this match.</p>
        )}
      </div>
    </div>
  );
}
