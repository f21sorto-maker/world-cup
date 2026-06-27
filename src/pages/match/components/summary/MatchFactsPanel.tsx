import type { MatchEvent } from "../../../../types";

type Props = {
  events: MatchEvent[];
  homeConduct?: number;
  awayConduct?: number;
  homeTeamName: string;
  awayTeamName: string;
};

function cardEvents(events: MatchEvent[]) {
  return events.filter(
    (e) => e.type === "yellow_card" || e.type === "red_card" || e.type === "yellow_red_card"
  );
}

function subEvents(events: MatchEvent[]) {
  return events.filter((e) => e.type === "substitution");
}

export function MatchFactsPanel({
  events,
  homeConduct = 0,
  awayConduct = 0,
  homeTeamName,
  awayTeamName,
}: Props) {
  const cards = cardEvents(events);
  const subs = subEvents(events);

  if (cards.length === 0 && subs.length === 0 && homeConduct === 0 && awayConduct === 0) {
    return null;
  }

  return (
    <section className="match-facts-panel" aria-label="Match facts">
      {cards.length > 0 ? (
        <div className="match-facts-block">
          <h4>Discipline</h4>
          <ul className="match-facts-list">
            {cards.map((e) => (
              <li key={e.providerId}>
                <span className="match-facts-minute">{e.minute}&apos;</span>
                <span className="match-facts-icon">
                  {e.type === "red_card" || e.type === "yellow_red_card" ? "🟥" : "🟨"}
                </span>
                <span>{e.playerName}</span>
              </li>
            ))}
          </ul>
          {(homeConduct !== 0 || awayConduct !== 0) ? (
            <p className="match-facts-note">
              Fair-play score — {homeTeamName}: {homeConduct}, {awayTeamName}: {awayConduct}
              {" "}(yellow −1, red −4, second yellow −5)
            </p>
          ) : null}
        </div>
      ) : null}

      {subs.length > 0 ? (
        <div className="match-facts-block">
          <h4>Substitutions</h4>
          <ul className="match-facts-list">
            {subs.map((e) => (
              <li key={e.providerId}>
                <span className="match-facts-minute">{e.minute}&apos;</span>
                <span>
                  ↑ {e.playerName}
                  {e.assistName ? ` · ↓ ${e.assistName}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
