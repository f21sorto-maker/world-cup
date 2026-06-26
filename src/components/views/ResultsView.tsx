import { useMemo } from "react";
import { groupLockedResults } from "../../lib/resultsGrouping";
import { useStore } from "../../store";
import { ResultMatchCard } from "../match/ResultMatchCard";

export function ResultsView() {
  const liveMatchesMap = useStore((s) => s.liveMatches);

  const sections = useMemo(() => {
    const matches = Object.values(liveMatchesMap);
    return groupLockedResults(matches);
  }, [liveMatchesMap]);

  const totalResults = useMemo(
    () => sections.reduce((sum, section) => sum + section.matches.length, 0),
    [sections]
  );

  return (
    <div className="results-view dashboard-view">
      <section className="hero-panel hero-panel--compact">
        <div className="eyebrow">Tournament results</div>
        <h1>
          Every <span className="accent">final score.</span>
        </h1>
        <p>Completed matches grouped by round — newest results first within each section.</p>
      </section>

      {totalResults === 0 ? (
        <section className="dashboard-section">
          <p className="view-note">No results yet — check back after matches are played</p>
        </section>
      ) : (
        sections.map((section) => (
          <section key={section.key} className="dashboard-section" aria-label={section.label}>
            <div className="section-heading compact">
              <div>
                <div className="section-kicker">Round</div>
                <h2 className="section-title-text">{section.label}</h2>
              </div>
            </div>
            <div className="results-list">
              {section.matches.map((match) => (
                <ResultMatchCard key={match.id} match={match} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
