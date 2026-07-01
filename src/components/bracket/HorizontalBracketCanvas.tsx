import { useEffect, useMemo, useState } from "react";
import type { QualificationMatchContext } from "../../lib/qualification";
import {
  buildFlowBracketConnectors,
  buildFlowBracketLayout,
  FLOW_BRACKET_METRICS,
  type FlowBracketLayout,
  type FlowBracketScope,
} from "../../lib/brackets/buildFlowBracketLayout";
import { isConnectorSegmentHighlighted } from "../../lib/brackets/bracketPathHighlight";
import { BRACKET_STAGE_SHORT_LABELS } from "../../lib/brackets/bracketStageLabels";
import { isDesktopBracketViewport } from "../../lib/bracketLayoutPreference";
import { APP_COPY } from "../../lib/appCopy";
import type { BracketMatch, GroupStanding, MergedMatch, Team } from "../../types";
import connectorStyles from "../bentos/BracketConnectorOverlay.module.css";
import { BracketCard } from "./BracketCard";
import styles from "./HorizontalBracketCanvas.module.css";

type Props = {
  embedded?: boolean;
  visibleMatchIds: Set<string>;
  matchesById: Map<string, BracketMatch>;
  teamsById: Record<string, Team>;
  mode: "confirmed" | "projected";
  standings: GroupStanding[];
  liveMatches: Record<string, MergedMatch>;
  qualContext: QualificationMatchContext;
  confirmedWinners: Set<string>;
  liveProvisionalFeeders: Set<string>;
  pathHighlight: Set<string> | null;
  showPathHighlight: boolean;
  onTeamSelect: (teamId: string) => void;
  onMatchSelect: (matchId: string) => void;
  onTeamPathHoverStart: (matchId: string) => void;
  onTeamPathHoverEnd: () => void;
};

function connectorClassName(
  feederId: string,
  childId: string,
  confirmedWinners: Set<string>,
  liveProvisionalFeeders: Set<string>,
  pathHighlight: Set<string> | null
): string {
  const base = (() => {
    if (confirmedWinners.has(feederId)) return connectorStyles.pathConfirmed;
    if (liveProvisionalFeeders.has(feederId)) return connectorStyles.pathLiveProvisional;
    return connectorStyles.pathPending;
  })();

  if (!pathHighlight?.size) return base;

  return isConnectorSegmentHighlighted(feederId, childId, pathHighlight)
    ? `${base} ${connectorStyles.pathHighlighted}`
    : `${base} ${connectorStyles.pathDimmed}`;
}

function renderConnectors(
  layout: FlowBracketLayout,
  visibleMatchIds: Set<string>,
  confirmedWinners: Set<string>,
  liveProvisionalFeeders: Set<string>,
  pathHighlight: Set<string> | null
) {
  const segments = buildFlowBracketConnectors(layout, visibleMatchIds);
  return segments.map((segment, index) => (
    <path
      key={`${segment.feederId}-${segment.childId}-${index}`}
      className={connectorClassName(
        segment.feederId,
        segment.childId,
        confirmedWinners,
        liveProvisionalFeeders,
        pathHighlight
      )}
      d={segment.d}
      fill="none"
    />
  ));
}

export function HorizontalBracketCanvas({
  embedded = false,
  visibleMatchIds,
  matchesById,
  teamsById,
  mode,
  standings,
  liveMatches,
  qualContext,
  confirmedWinners,
  liveProvisionalFeeders,
  pathHighlight,
  showPathHighlight,
  onTeamSelect,
  onMatchSelect,
  onTeamPathHoverStart,
  onTeamPathHoverEnd,
}: Props) {
  const copy = APP_COPY.bracket;
  const liveCopy = APP_COPY.live;
  const [isDesktop, setIsDesktop] = useState(isDesktopBracketViewport);
  const [halfScope, setHalfScope] = useState<FlowBracketScope>(() =>
    isDesktopBracketViewport() ? "full" : "left"
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const layoutScope: FlowBracketScope = isDesktop ? "full" : halfScope;

  const layout = useMemo(
    () => buildFlowBracketLayout(visibleMatchIds, BRACKET_STAGE_SHORT_LABELS, layoutScope),
    [visibleMatchIds, layoutScope]
  );

  if (!layout) return null;

  const sortedNodes = [...layout.nodes.values()].sort((a, b) => a.y - b.y || a.x - b.x);
  const showHalfToggle = !isDesktop;
  const hint = embedded ? liveCopy.bracketFlowNote : copy.flowSwipeHint;

  return (
    <div className={`${styles.shell}${embedded ? ` ${styles.shellEmbedded}` : ""}`}>
      <div className={styles.toolbar}>
        <p className={styles.hint}>{hint}</p>
        {showHalfToggle ? (
          <div className={styles.halfToggle} role="tablist" aria-label={copy.flowHalfLabel}>
            <button
              type="button"
              role="tab"
              className={halfScope === "left" ? styles.halfBtnActive : styles.halfBtn}
              aria-selected={halfScope === "left"}
              onClick={() => setHalfScope("left")}
            >
              {copy.flowHalfLeft}
            </button>
            <button
              type="button"
              role="tab"
              className={halfScope === "right" ? styles.halfBtnActive : styles.halfBtn}
              aria-selected={halfScope === "right"}
              onClick={() => setHalfScope("right")}
            >
              {copy.flowHalfRight}
            </button>
          </div>
        ) : null}
      </div>

      <div className={styles.scroll} tabIndex={0}>
        <div
          className={styles.canvas}
          style={{ width: layout.width, height: layout.height }}
        >
          <div className={styles.headers} aria-hidden="true">
            {layout.columnLabels.map((column) => (
              <span
                key={`${column.stage}:${column.x}`}
                className={styles.header}
                style={{ left: column.x, width: FLOW_BRACKET_METRICS.cardWidth }}
              >
                {column.label}
              </span>
            ))}
          </div>

          <svg
            aria-hidden="true"
            className={styles.connectors}
            width={layout.width}
            height={layout.height}
          >
            {renderConnectors(
              layout,
              visibleMatchIds,
              confirmedWinners,
              liveProvisionalFeeders,
              showPathHighlight ? pathHighlight : null
            )}
          </svg>

          {sortedNodes.map((node) => {
            const match = matchesById.get(node.matchId);
            if (!match) return null;

            return (
              <div
                key={node.matchId}
                className={styles.node}
                data-match-id={node.matchId}
                style={{
                  left: node.x,
                  top: node.y,
                  width: node.width,
                }}
              >
                <BracketCard
                  match={match}
                  teamsById={teamsById}
                  mode={mode}
                  variant="tree"
                  standings={standings}
                  liveMatches={liveMatches}
                  qualContext={qualContext}
                  onTeamSelect={onTeamSelect}
                  onMatchSelect={onMatchSelect}
                  pathHighlighted={showPathHighlight && Boolean(pathHighlight?.has(node.matchId))}
                  pathDimmed={showPathHighlight && !pathHighlight?.has(node.matchId)}
                  onTeamPathHoverStart={onTeamPathHoverStart}
                  onTeamPathHoverEnd={onTeamPathHoverEnd}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
