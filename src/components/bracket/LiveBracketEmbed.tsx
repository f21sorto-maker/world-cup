import { BracketBento } from "../bentos/BracketBento";
import { BracketModeToggle } from "./BracketModeToggle";
import { BentoErrorBoundary } from "../shared/ErrorBoundary";
import { APP_COPY } from "../../lib/appCopy";
import { useStore } from "../../store";
import { usePreferConfirmedBracketDuringKnockout } from "../../hooks/usePreferConfirmedBracketDuringKnockout";
import { usePreferBracketTreeDuringKnockout } from "../../hooks/usePreferBracketTreeDuringKnockout";
import { useTournamentPhase } from "../../hooks/useTournamentPhase";
import {
  resolveFullBracketTabLayoutMode,
  useLiveEmbedBracketLayoutMode,
} from "../../hooks/useLiveEmbedBracketLayoutMode";

export function LiveBracketEmbed() {
  const copy = APP_COPY.live;
  const embedLayoutMode = useLiveEmbedBracketLayoutMode();
  const { isKnockoutActive } = useTournamentPhase();
  usePreferConfirmedBracketDuringKnockout();
  usePreferBracketTreeDuringKnockout();
  const setActiveTab = useStore((s) => s.setActiveTab);
  const setBracketLayoutMode = useStore((s) => s.setBracketLayoutMode);

  const openFullBracketTree = () => {
    setBracketLayoutMode(resolveFullBracketTabLayoutMode(isKnockoutActive));
    setActiveTab("bracket");
  };

  const layoutNote =
    embedLayoutMode === "flow" ? copy.bracketFlowNote : copy.bracketTreeNote;

  return (
    <section className="dashboard-section live-bracket-embed" aria-label={copy.bracketAriaLabel}>
      <div className="section-heading compact">
        <div>
          <div className="section-kicker">{copy.bracketKicker}</div>
          <h2 className="section-title-text">{copy.bracketTitle}</h2>
          <p className="section-note">{copy.bracketLead}</p>
          <p className="section-note live-bracket-embed__tree-note">{layoutNote}</p>
          <button
            type="button"
            className="live-bracket-embed__tree-link"
            onClick={openFullBracketTree}
          >
            {copy.openFullBracketTree} →
          </button>
        </div>
      </div>

      <div className="bracket-view live-bracket-embed__panel">
        <div className="bracket-controls bracket-controls--embed">
          <BracketModeToggle />
        </div>
        <BentoErrorBoundary bento="BracketBento">
          <BracketBento embedded forceLayoutMode={embedLayoutMode} />
        </BentoErrorBoundary>
      </div>
    </section>
  );
}
