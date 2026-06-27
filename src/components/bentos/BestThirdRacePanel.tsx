import { useMemo } from "react";
import { buildQualificationContext, computeQualificationStatus } from "../../lib/qualification";
import { rankAliveBestThirds } from "../../lib/bestThirds";
import { formatLiveClock } from "../../lib/formatMatchClock";
import { resolveQualificationDisplay } from "../../lib/qualificationDisplay";
import type { GroupStanding, MergedMatch, TeamRecord } from "../../types";
import { teamDisplayName } from "../../lib/teamIdentity";
import { useStore } from "../../store";
import { TeamFlag } from "../team/TeamFlag";

function statusLabel(
  rank: number,
  teamId: string,
  standings: GroupStanding[],
  qualContext: ReturnType<typeof buildQualificationContext>
): { text: string; className: string } {
  const qual = computeQualificationStatus(teamId, standings, qualContext);
  const display = resolveQualificationDisplay(qual);
  if (display.variant === "confirmed-eliminated") {
    return { text: "Eliminated ✕", className: "best-third-status--out" };
  }
  if (display.variant === "projected-eliminated") {
    return { text: "Proj. Out", className: "best-third-status--warn" };
  }
  if (display.variant === "projected-qualified" || display.variant === "confirmed-qualified") {
    if (rank <= 8) return { text: rank === 8 ? "Cut line" : "Proj. Qualify", className: rank === 8 ? "best-third-status--cut" : "best-third-status--in" };
  }
  return { text: "In contention", className: "best-third-status--warn" };
}

export function BestThirdRacePanel() {
  const standings = useStore((s) => s.groupStandings);
  const teams = useStore((s) => s.teams);
  const liveMatches = useStore((s) => s.liveMatches);

  const qualContext = useMemo(
    () => buildQualificationContext(Object.values(liveMatches), Object.values(teams)),
    [liveMatches, teams]
  );

  const ranked = useMemo(() => rankAliveBestThirds(standings, qualContext), [standings, qualContext]);
  const thirdIds = useMemo(() => new Set(ranked.map((r) => r.teamId)), [ranked]);

  const liveCallouts = useMemo(() => {
    const live = Object.values(liveMatches).filter((m) => m.status === "live" && m.group);
    const callouts: { type: "live" | "watch"; match: MergedMatch; label: string }[] = [];

    for (const match of live) {
      const involvesThird =
        thirdIds.has(match.homeTeamId) || thirdIds.has(match.awayTeamId);
      const homeRank = ranked.findIndex((r) => r.teamId === match.homeTeamId);
      const awayRank = ranked.findIndex((r) => r.teamId === match.awayTeamId);
      const nearCut =
        (homeRank >= 5 && homeRank <= 10) || (awayRank >= 5 && awayRank <= 10);

      const home = teamDisplayName(teams[match.homeTeamId], match.homeTeamId);
      const away = teamDisplayName(teams[match.awayTeamId], match.awayTeamId);
      const score = `${match.homeScore ?? 0}–${match.awayScore ?? 0}`;
      const clock = formatLiveClock(match);

      if (involvesThird) {
        callouts.push({
          type: "live",
          match,
          label: `Group ${match.group} — ${home} vs ${away}  ${score}  ${clock}`
        });
      } else if (nearCut) {
        callouts.push({
          type: "watch",
          match,
          label: `${home} vs ${away}  ${score}  ${clock}`
        });
      }
      if (callouts.length >= 3) break;
    }

    return callouts;
  }, [liveMatches, ranked, thirdIds, teams]);

  if (ranked.length === 0) return null;

  return (
    <section className="best-third-race-panel dashboard-section" aria-label="Race for best third">
      <header className="best-third-race-head">
        <div>
          <h2 className="section-title-text">🏁 Race for Best Third</h2>
          <p className="best-third-race-lead">Top 8 advance to the Round of 32</p>
        </div>
        <span className="best-third-race-live-dot" aria-hidden>
          Live ●
        </span>
      </header>

      <div className="group-table-scroll">
        <table className="group-table best-third-race-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>Pts</th>
              <th>GD</th>
              <th>GF</th>
              <th>Group</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((row: TeamRecord, index) => {
              const team = teams[row.teamId];
              const status = statusLabel(index + 1, row.teamId, standings, qualContext);
              const isCutLine = index === 7;
              const dimmed = index >= 8;
              return (
                <tr
                  key={row.teamId}
                  className={`${isCutLine ? "best-third-race-cut" : ""} ${dimmed ? "best-third-race-dim" : ""}`}
                >
                  <td>{index + 1}</td>
                  <td className="group-table-team">
                    <TeamFlag team={team} teamId={row.teamId} />
                    <span className="team-name-text qual-team-name">{teamDisplayName(team, row.teamId)}</span>
                  </td>
                  <td>
                    <strong>{row.points}</strong>
                  </td>
                  <td>
                    {row.goalDifference >= 0 ? "+" : ""}
                    {row.goalDifference}
                  </td>
                  <td>{row.goalsFor}</td>
                  <td>{row.group}</td>
                  <td>
                    <span className={`best-third-status ${status.className}`}>{status.text}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {liveCallouts.length > 0 ? (
        <div className="best-third-race-callouts">
          {liveCallouts.map((c) => (
            <p key={c.match.id} className={`best-third-race-callout best-third-race-callout--${c.type}`}>
              {c.type === "live" ? "🔴 LIVE: " : "👁 Watch: "}
              {c.label}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
