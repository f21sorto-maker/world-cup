import { useCallback, useMemo, useState } from "react";
import {
  buildCompletedResultsViewModel,
  buildRecentResultsSections,
  matchResultStableId,
  type RecentResultsSectionKey,
  type ResultsStageSectionLabels,
} from "../../lib/buildCompletedResultsViewModel";
import { APP_COPY } from "../../lib/appCopy";
import { useStore } from "../../store";
import { useMaterializedMatchIndex } from "../../hooks/useMaterializedMatchIndex";
import { useTournamentPhase } from "../../hooks/useTournamentPhase";
import { VenueLabel } from "../venue/VenueLabel";
import { PenaltyResultRow } from "./RecentResultRow";

const DEFAULT_VISIBLE_PER_SECTION = 4;

function stageLabelsFromCopy(): ResultsStageSectionLabels {
  const copy = APP_COPY.results;
  return {
    group: copy.stageGroup,
    round_of_32: copy.stageR32,
    round_of_16: copy.stageR16,
    quarterfinal: copy.stageQF,
    semifinal: copy.stageSF,
    third_place: copy.stageThirdPlace,
    final: copy.stageFinal,
    knockout: copy.stageKnockout,
  };
}

export function RecentResultsBento() {
  const liveMatches = useStore((s) => s.liveMatches);
  const teams = useStore((s) => s.teams);
  const openTeamSheet = useStore((s) => s.openTeamSheet);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const materializedIndex = useMaterializedMatchIndex();
  const { isKnockoutActive } = useTournamentPhase();
  const [expandedSections, setExpandedSections] = useState<Set<RecentResultsSectionKey>>(
    () => new Set()
  );

  const toggleSection = useCallback((key: RecentResultsSectionKey) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const { sections, total } = useMemo(() => {
    const completed = buildCompletedResultsViewModel(liveMatches, teams, {
      sort: "recent",
      materializedIndex,
    });

    return buildRecentResultsSections(completed, {
      isKnockoutActive,
      timeLabels: {
        today: APP_COPY.results.today,
        yesterday: APP_COPY.results.yesterday,
      },
      stageLabels: stageLabelsFromCopy(),
    });
  }, [liveMatches, materializedIndex, teams, isKnockoutActive]);

  if (sections.length === 0) return null;

  const live = APP_COPY.live;
  const resultsCopy = APP_COPY.results;

  return (
    <section className="recent-results-bento" aria-label={live.recentResultsTitle}>
      <div className="section-heading compact">
        <div>
          <div className="section-kicker">{live.recentResultsKicker}</div>
          <h2 className="section-title-text">{live.recentResultsTitle}</h2>
        </div>
        {total > DEFAULT_VISIBLE_PER_SECTION ? (
          <button type="button" className="recent-results-link" onClick={() => setActiveTab("results")}>
            {live.seeAllResults} →
          </button>
        ) : null}
      </div>
      <div className="recent-results-list">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.key);
          const hiddenCount = Math.max(0, section.total - DEFAULT_VISIBLE_PER_SECTION);
          const visibleMatches = isExpanded
            ? section.matches
            : section.matches.slice(0, DEFAULT_VISIBLE_PER_SECTION);

          return (
            <div key={section.key} className="recent-results-group">
              <h3 className="recent-results-group-label">{section.label}</h3>
              {visibleMatches.map((match) => (
                <div key={matchResultStableId(match)} className="recent-result-item">
                  <PenaltyResultRow match={match} onSelect={openTeamSheet} />
                  {match.matchId || match.venue ? (
                    <div className="recent-result-extra">
                      <VenueLabel matchId={match.matchId} venueString={match.venue} inline />
                    </div>
                  ) : null}
                </div>
              ))}
              {hiddenCount > 0 ? (
                <button
                  type="button"
                  className="recent-results-see-more"
                  onClick={() => toggleSection(section.key)}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? resultsCopy.showLess : resultsCopy.seeMore(hiddenCount)}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
