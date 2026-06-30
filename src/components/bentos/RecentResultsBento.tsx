import { useMemo } from "react";
import { localDateKey, formatTimeAgo, yesterdayDateKey } from "../../lib/localDate";
import {
  flagTeamIdForMatch,
  resolveMatchTeam,
  scheduleNameHintForMatch,
  teamDisplayNameForMatch,
} from "../../lib/matchTeamDisplay";
import { derivePenaltyShootout } from "../../lib/derivePenaltyShootout";
import { resolveDisplayMatch } from "../../lib/resolveDisplayMatch";
import { isAdvancingTeam } from "../../lib/resolveMatchWinner";
import { APP_COPY } from "../../lib/appCopy";
import type { MergedMatch, Team } from "../../types";
import { useStore } from "../../store";
import { useMaterializedMatchIndex } from "../../hooks/useMaterializedMatchIndex";
import { TeamFlag } from "../team/TeamFlag";
import { VenueLabel } from "../venue/VenueLabel";
import { PenaltyShootoutBar } from "../match/PenaltyShootoutBar";
import { resolveEventsForMatch } from "../../lib/resolveMatchEvents";

type ResultRowProps = {
  match: MergedMatch;
  home?: Team;
  away?: Team;
  onSelect: (teamId: string) => void;
};

function ResultRow({ match, home, away, onSelect }: ResultRowProps) {
  const teams = useStore((s) => s.teams);
  const matchEvents = useStore((s) => s.matchEvents);
  const resolvedHome = home ?? resolveMatchTeam(match, "home", teams);
  const resolvedAway = away ?? resolveMatchTeam(match, "away", teams);
  const homeName = teamDisplayNameForMatch(match, "home", teams);
  const awayName = teamDisplayNameForMatch(match, "away", teams);
  const ago = formatTimeAgo(match.date);

  const events = useMemo(
    () => resolveEventsForMatch(match, matchEvents, teams),
    [match, matchEvents, teams]
  );

  const penaltyShootout = useMemo(
    () =>
      derivePenaltyShootout({
        events,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        period: match.period,
        existing: match.penaltyShootout,
      }),
    [events, match]
  );

  const homeAdvancing = isAdvancingTeam(match, match.homeTeamId, teams, penaltyShootout);
  const awayAdvancing = isAdvancingTeam(match, match.awayTeamId, teams, penaltyShootout);

  return (
    <div className="recent-result-item">
      <button type="button" className="recent-result-row" onClick={() => onSelect(match.homeTeamId)}>
        <span
          className={`recent-result-team recent-result-team--home${homeAdvancing ? " recent-result-team--advancing" : ""}`}
        >
          <TeamFlag
            team={resolvedHome}
            teamId={flagTeamIdForMatch(match, "home", teams)}
            nameHint={scheduleNameHintForMatch(match, "home")}
            size="sm"
            compact
          />
          <span className="team-name-text">{homeName}</span>
        </span>
        <span className="recent-result-score">
          {match.homeScore ?? 0} – {match.awayScore ?? 0}
        </span>
        <span
          className={`recent-result-team recent-result-team--away${awayAdvancing ? " recent-result-team--advancing" : ""}`}
        >
          <TeamFlag
            team={resolvedAway}
            teamId={flagTeamIdForMatch(match, "away", teams)}
            nameHint={scheduleNameHintForMatch(match, "away")}
            size="sm"
            compact
          />
          <span className="team-name-text">{awayName}</span>
        </span>
        <span className="recent-result-meta">
          <span className="final-pill">{APP_COPY.match.final}</span>
          {ago ? <span className="recent-result-ago">{ago}</span> : null}
        </span>
      </button>
      <div className="recent-result-extra">
        {match.matchId || match.venue ? (
          <VenueLabel matchId={match.matchId} venueString={match.venue} inline />
        ) : null}
        {penaltyShootout ? (
          <PenaltyShootoutBar match={match} shootout={penaltyShootout} compact />
        ) : null}
      </div>
    </div>
  );
}

export function RecentResultsBento() {
  const liveMatches = useStore((s) => s.liveMatches);
  const teams = useStore((s) => s.teams);
  const openTeamSheet = useStore((s) => s.openTeamSheet);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const materializedIndex = useMaterializedMatchIndex();

  const { sections, total } = useMemo(() => {
    const now = new Date();
    const todayKey = localDateKey(now);
    const yKey = yesterdayDateKey(now);

    const completed = Object.values(liveMatches)
      .filter((m) => m.status === "completed" && m.homeScore !== undefined)
      .map((m) => resolveDisplayMatch(m, materializedIndex))
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

    const todayMatches = completed.filter((m) => localDateKey(new Date(m.date)) === todayKey);
    const yesterdayMatches = completed.filter((m) => localDateKey(new Date(m.date)) === yKey);

    const result: { label: string; matches: MergedMatch[] }[] = [];
    let remaining = 8;

    const res = APP_COPY.results;

    if (todayMatches.length > 0) {
      const slice = todayMatches.slice(0, remaining);
      result.push({ label: `${res.today} (${todayMatches.length})`, matches: slice });
      remaining -= slice.length;
    }
    if (remaining > 0 && yesterdayMatches.length > 0) {
      result.push({
        label: `${res.yesterday} (${yesterdayMatches.length})`,
        matches: yesterdayMatches.slice(0, remaining)
      });
    }

    return { sections: result, total: todayMatches.length + yesterdayMatches.length };
  }, [liveMatches, materializedIndex]);

  if (sections.length === 0) return null;

  const live = APP_COPY.live;

  return (
    <section className="recent-results-bento" aria-label={live.recentResultsTitle}>
      <div className="section-heading compact">
        <div>
          <div className="section-kicker">{live.recentResultsKicker}</div>
          <h2 className="section-title-text">{live.recentResultsTitle}</h2>
        </div>
        {total > 8 ? (
          <button type="button" className="recent-results-link" onClick={() => setActiveTab("results")}>
            {live.seeAllResults} →
          </button>
        ) : null}
      </div>
      <div className="recent-results-list">
        {sections.map((section) => (
          <div key={section.label} className="recent-results-group">
            <h3 className="recent-results-group-label">{section.label}</h3>
            {section.matches.map((match) => (
              <ResultRow
                key={match.id}
                match={match}
                home={teams[match.homeTeamId]}
                away={teams[match.awayTeamId]}
                onSelect={openTeamSheet}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
