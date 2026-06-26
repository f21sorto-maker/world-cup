import { useEffect, useMemo, useState } from "react";
import { formatKickoffDate } from "../../lib/formatKickoff";
import { useStore } from "../../store";
import { getTeamElo } from "../../services/ClubEloClient";
import {
  getHistoricalMatchesForTeam,
  type ZafronixMatch,
} from "../../services/ZafronixClient";
import { TeamThemeRoot } from "../team/TeamThemeRoot";
import type { MergedMatch } from "../../types";

type Tab = "now" | "path" | "odds";
type MatchOutcome = "W" | "D" | "L";

function outcomeForTeam(match: MergedMatch, teamId: string): MatchOutcome {
  const isHome = match.homeTeamId === teamId;
  const teamScore = isHome ? (match.homeScore ?? 0) : (match.awayScore ?? 0);
  const oppScore = isHome ? (match.awayScore ?? 0) : (match.homeScore ?? 0);
  if (teamScore > oppScore) return "W";
  if (teamScore < oppScore) return "L";
  return "D";
}

function outcomeClass(outcome: MatchOutcome): string {
  switch (outcome) {
    case "W":
      return "team-history-outcome--win";
    case "D":
      return "team-history-outcome--draw";
    case "L":
      return "team-history-outcome--loss";
    default: {
      const _exhaustive: never = outcome;
      return _exhaustive;
    }
  }
}

export function TeamDetailSheet() {
  const open = useStore((s) => s.teamSheetOpen);
  const teamId = useStore((s) => s.activeTeamId);
  const close = useStore((s) => s.closeTeamSheet);
  const teams = useStore((s) => s.teams);
  const liveMatches = useStore((s) => s.liveMatches);
  const simulationRunning = useStore((s) => s.simulationRunning);
  const [tab, setTab] = useState<Tab>("now");
  const [elo, setElo] = useState<number | null>(null);
  const [recentForm, setRecentForm] = useState<ZafronixMatch[]>([]);
  const [recentFormLoading, setRecentFormLoading] = useState(false);

  const team = teamId ? teams[teamId] : null;

  const matchHistory = useMemo(() => {
    if (!teamId) return [];
    return Object.values(liveMatches)
      .filter(
        (match) =>
          match.locked &&
          (match.homeTeamId === teamId || match.awayTeamId === teamId)
      )
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  }, [liveMatches, teamId]);

  useEffect(() => {
    if (!team) return;
    void getTeamElo(team.name).then(setElo);
  }, [team]);

  useEffect(() => {
    if (!team || tab !== "now") return;
    setRecentFormLoading(true);
    void getHistoricalMatchesForTeam(team.name, 7).then((matches) => {
      setRecentForm(matches);
      setRecentFormLoading(false);
    });
  }, [team, tab]);

  if (!open || !team) return null;

  return (
    <div className="team-sheet-backdrop" role="presentation" onClick={close}>
      <div
        className="team-sheet"
        role="dialog"
        aria-label={`${team.shortName} details`}
        onClick={(e) => e.stopPropagation()}
      >
        <TeamThemeRoot teamId={team.id} className="team-sheet-header-themed">
          <div className="team-accent-bar" aria-hidden />
          <header className="team-sheet-header">
            <div className="team-sheet-header-main">
              {team.logo ? <img src={team.logo} alt="" width={40} height={40} /> : null}
              <h2>{team.name}</h2>
            </div>
            <button type="button" onClick={close} aria-label="Close">
              ×
            </button>
          </header>
        </TeamThemeRoot>

        <div className="team-sheet-tabs">
          {(["now", "path", "odds"] as Tab[]).map((t) => (
            <button key={t} type="button" className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="team-sheet-body">
          {tab === "now" ? (
            <>
              <p>
                Group {team.group} · FIFA rank {team.fifaRank ?? "—"} · Title market{" "}
                {team.titleProbability ? `${(team.titleProbability * 100).toFixed(1)}%` : "—"}
              </p>

              {recentForm.length > 0 || recentFormLoading ? (
                <section className="team-recent-form" aria-label="Recent form">
                  <h3 className="team-match-history-title">Recent Form</h3>
                  {recentFormLoading ? (
                    <p className="team-match-history-empty">Loading…</p>
                  ) : (
                    <div className="recent-form-pills">
                      {recentForm.map((m) => {
                        const isHome = m.homeTeam.toLowerCase() === team.name.toLowerCase();
                        const teamScore = isHome ? m.homeScore : m.awayScore;
                        const oppScore = isHome ? m.awayScore : m.homeScore;
                        const opponent = isHome ? m.awayTeam : m.homeTeam;
                        const result = teamScore > oppScore ? "W" : teamScore < oppScore ? "L" : "D";
                        const pillClass = `recent-form-pill recent-form-pill--${result.toLowerCase()}${m.isWorldCup ? " recent-form-pill--wc" : ""}`;
                        return (
                          <span key={m.id} className={pillClass} title={`${m.competition ?? ""} · ${m.date}`}>
                            <span className="rfp-result">{result}</span>
                            <span className="rfp-opp">{opponent}</span>
                            <span className="rfp-score">{teamScore}–{oppScore}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </section>
              ) : null}

              <section className="team-match-history" aria-label="Match history">
                <h3 className="team-match-history-title">Match History</h3>
                {matchHistory.length === 0 ? (
                  <p className="team-match-history-empty">No completed matches yet</p>
                ) : (
                  <ul className="team-match-history-list">
                    {matchHistory.map((match) => {
                      const isHome = match.homeTeamId === team.id;
                      const opponentId = isHome ? match.awayTeamId : match.homeTeamId;
                      const opponent = teams[opponentId];
                      const teamScore = isHome ? (match.homeScore ?? 0) : (match.awayScore ?? 0);
                      const oppScore = isHome ? (match.awayScore ?? 0) : (match.homeScore ?? 0);
                      const outcome = outcomeForTeam(match, team.id);

                      return (
                        <li key={match.id} className="team-match-history-row">
                          <span className="team-match-history-opponent">
                            {opponent?.logo ? (
                              <img src={opponent.logo} alt="" width={18} height={18} />
                            ) : null}
                            <span>{opponent?.shortName ?? opponentId}</span>
                          </span>
                          <span className="team-match-history-score">
                            {teamScore}–{oppScore}
                          </span>
                          <span className={`team-match-history-outcome ${outcomeClass(outcome)}`}>
                            {outcome}
                          </span>
                          <time className="team-match-history-date" dateTime={match.date}>
                            {formatKickoffDate(match.date)}
                          </time>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </>
          ) : null}
          {tab === "path" ? (
            <p>
              ClubElo rating: {elo ?? "Loading…"} · Bracket path updates with live goals.
            </p>
          ) : null}
          {tab === "odds" ? (
            <div>
              <p>Polymarket / model odds from simulation.</p>
              {simulationRunning ? <p className="odds-recalc">Recalculating…</p> : null}
              <p className="odds-stub">
                Sportsbook consensus available on upcoming match cards (Sports Odds Intelligence).
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
