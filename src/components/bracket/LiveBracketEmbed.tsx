import { BracketBento } from "../bentos/BracketBento";
import { BentoErrorBoundary } from "../shared/ErrorBoundary";
import { APP_COPY } from "../../lib/appCopy";
import { BracketModeToggle } from "./BracketModeToggle";

export function LiveBracketEmbed() {
  const copy = APP_COPY.live;

  return (
    <section className="dashboard-section live-bracket-embed" aria-label={copy.bracketAriaLabel}>
      <div className="section-heading compact">
        <div>
          <div className="section-kicker">{copy.bracketKicker}</div>
          <h2 className="section-title-text">{copy.bracketTitle}</h2>
          <p className="section-note">{copy.bracketLead}</p>
        </div>
      </div>

      <div className="bracket-view live-bracket-embed__panel">
        <BracketModeToggle />
        <BentoErrorBoundary bento="BracketBento">
          <BracketBento embedded />
        </BentoErrorBoundary>
      </div>
    </section>
  );
}
