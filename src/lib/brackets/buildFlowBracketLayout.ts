import { BRACKET_FEED_MAP } from "../bracketTree";
import { R32_VISUAL_ORDER } from "./bracketProgression";
import { resolveBracketHalf, type BracketHalf } from "./buildSplitBracketLayout";
import type { Stage } from "../../types";

export type FlowBracketScope = "left" | "right" | "full";

export const FLOW_BRACKET_METRICS = {
  cardWidth: 168,
  cardHeight: 112,
  colGap: 24,
  rowUnit: 60,
  headerHeight: 28,
  paddingX: 16,
  paddingY: 16,
} as const;

export type FlowBracketNodeLayout = {
  matchId: string;
  stage: Stage;
  half: BracketHalf;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FlowBracketColumnLabel = {
  stage: Stage;
  x: number;
  label: string;
};

export type FlowBracketLayout = {
  nodes: Map<string, FlowBracketNodeLayout>;
  width: number;
  height: number;
  columnLabels: FlowBracketColumnLabel[];
  scope: FlowBracketScope;
};

export type FlowBracketConnector = {
  feederId: string;
  childId: string;
  d: string;
};

const LEFT_R32 = R32_VISUAL_ORDER.slice(0, 8);
const RIGHT_R32 = R32_VISUAL_ORDER.slice(8);

const HALF_STAGE_COL: Partial<Record<Stage, number>> = {
  R32: 0,
  R16: 1,
  QF: 2,
  SF: 3,
};

const FULL_RIGHT_STAGE_COL: Partial<Record<Stage, number>> = {
  SF: 5,
  QF: 6,
  R16: 7,
  R32: 8,
};

const CENTER_FINAL_COL = 4;

function stageFromMatchId(matchId: string): Stage {
  const num = Number(matchId.replace(/^M/, ""));
  if (num >= 73 && num <= 88) return "R32";
  if (num >= 89 && num <= 96) return "R16";
  if (num >= 97 && num <= 100) return "QF";
  if (num === 101 || num === 102) return "SF";
  if (num === 103) return "ThirdPlace";
  return "Final";
}

function flowColX(col: number): number {
  const { cardWidth, colGap, paddingX } = FLOW_BRACKET_METRICS;
  return paddingX + col * (cardWidth + colGap);
}

function matchInScope(matchId: string, scope: FlowBracketScope): boolean {
  const half = resolveBracketHalf(matchId);
  if (scope === "full") return true;
  if (half === "center") return false;
  return half === scope;
}

function flowColumnForMatch(matchId: string, stage: Stage, scope: FlowBracketScope): number {
  const half = resolveBracketHalf(matchId);

  if (half === "center") {
    return CENTER_FINAL_COL;
  }

  if (scope === "left") {
    return HALF_STAGE_COL[stage] ?? 0;
  }

  if (scope === "right") {
    return HALF_STAGE_COL[stage] ?? 0;
  }

  if (half === "left") {
    return HALF_STAGE_COL[stage] ?? 0;
  }

  return FULL_RIGHT_STAGE_COL[stage] ?? 8;
}

function r32OrderForScope(scope: FlowBracketScope): string[] {
  if (scope === "left") return LEFT_R32;
  if (scope === "right") return RIGHT_R32;
  return R32_VISUAL_ORDER;
}

function computeFlowYPositions(matchIdSet: Set<string>, scope: FlowBracketScope): Map<string, number> {
  const yById = new Map<string, number>();
  const { rowUnit, headerHeight, cardHeight } = FLOW_BRACKET_METRICS;
  const r32Order = r32OrderForScope(scope);

  for (const id of r32Order) {
    if (!matchIdSet.has(id)) continue;
    const index = r32Order.indexOf(id);
    yById.set(id, headerHeight + index * 2 * rowUnit);
  }

  const laterStages: Stage[] = ["R16", "QF", "SF", "Final", "ThirdPlace"];
  for (const stage of laterStages) {
    for (const id of matchIdSet) {
      if (stageFromMatchId(id) !== stage || yById.has(id)) continue;
      const feeders = BRACKET_FEED_MAP[id];
      if (!feeders) continue;

      const yA = yById.get(feeders[0]);
      const yB = yById.get(feeders[1]);
      if (yA === undefined || yB === undefined) continue;
      yById.set(id, (yA + yB) / 2);
    }
  }

  if (matchIdSet.has("M103") && yById.has("M104")) {
    yById.set("M103", yById.get("M104")! + cardHeight + rowUnit / 2);
  }

  return yById;
}

export function buildFlowBracketLayout(
  visibleMatchIds: Iterable<string>,
  stageLabels: Record<Stage, string>,
  scope: FlowBracketScope = "full"
): FlowBracketLayout | null {
  const idSet = new Set(
    [...visibleMatchIds].filter(
      (id) =>
        Object.prototype.hasOwnProperty.call(BRACKET_FEED_MAP, id) && matchInScope(id, scope)
    )
  );
  if (idSet.size === 0) return null;

  const yById = computeFlowYPositions(idSet, scope);
  const nodes = new Map<string, FlowBracketNodeLayout>();
  const { cardWidth, cardHeight, paddingY } = FLOW_BRACKET_METRICS;

  let maxY = 0;
  let maxCol = 0;

  for (const matchId of idSet) {
    const y = yById.get(matchId);
    if (y === undefined) continue;

    const stage = stageFromMatchId(matchId);
    const half = resolveBracketHalf(matchId);
    const col = flowColumnForMatch(matchId, stage, scope);
    const x = flowColX(col);

    nodes.set(matchId, {
      matchId,
      stage,
      half,
      x,
      y,
      width: cardWidth,
      height: cardHeight,
    });

    maxY = Math.max(maxY, y + cardHeight);
    maxCol = Math.max(maxCol, col);
  }

  if (nodes.size === 0) return null;

  const height = maxY + paddingY;
  const width = flowColX(maxCol) + cardWidth + paddingY;

  const columnLabels: FlowBracketColumnLabel[] = [];
  const seenCols = new Set<number>();

  for (const node of nodes.values()) {
    const col = flowColumnForMatch(node.matchId, node.stage, scope);
    if (seenCols.has(col)) continue;
    seenCols.add(col);
    columnLabels.push({
      stage: node.stage,
      x: node.x,
      label: stageLabels[node.stage] ?? node.stage,
    });
  }

  columnLabels.sort((a, b) => a.x - b.x);

  return { nodes, width, height, columnLabels, scope };
}

export function buildFlowBracketConnectors(
  layout: FlowBracketLayout,
  visibleMatchIds: Set<string>
): FlowBracketConnector[] {
  const segments: FlowBracketConnector[] = [];

  for (const [childId, feeders] of Object.entries(BRACKET_FEED_MAP)) {
    if (!feeders || !visibleMatchIds.has(childId)) continue;
    if (!visibleMatchIds.has(feeders[0]) || !visibleMatchIds.has(feeders[1])) continue;

    const child = layout.nodes.get(childId);
    const feederA = layout.nodes.get(feeders[0]);
    const feederB = layout.nodes.get(feeders[1]);
    if (!child || !feederA || !feederB) continue;

    const childCy = child.y + child.height / 2;

    if (childId === "M104") {
      for (const feeder of [feederA, feederB]) {
        const fy = feeder.y + feeder.height / 2;
        const feederOnLeft = feeder.x < child.x;
        const fx = feederOnLeft ? feeder.x + feeder.width : feeder.x;
        const cx = feederOnLeft ? child.x : child.x + child.width;
        const mx = feederOnLeft
          ? fx + (cx - fx) * 0.55
          : fx + (cx - fx) * 0.45;
        segments.push({
          feederId: feeder.matchId,
          childId,
          d: feederOnLeft
            ? `M ${fx} ${fy} H ${mx} V ${childCy} H ${cx}`
            : `M ${fx} ${fy} H ${mx} V ${childCy} H ${cx}`,
        });
      }
      continue;
    }

    const childOnRight = child.x > feederA.x;
    const fy1 = feederA.y + feederA.height / 2;
    const fy2 = feederB.y + feederB.height / 2;
    const fMidY = (fy1 + fy2) / 2;

    if (childOnRight) {
      const fx = feederA.x + feederA.width;
      const cx = child.x;
      const mx = fx + (cx - fx) * 0.5;
      segments.push(
        { feederId: feeders[0], childId, d: `M ${fx} ${fy1} H ${mx} V ${fMidY}` },
        { feederId: feeders[1], childId, d: `M ${fx} ${fy2} H ${mx} V ${fMidY}` },
        { feederId: feeders[0], childId, d: `M ${mx} ${fMidY} H ${cx}` }
      );
    } else {
      const fx = feederA.x;
      const cx = child.x + child.width;
      const mx = fx + (cx - fx) * 0.5;
      segments.push(
        { feederId: feeders[0], childId, d: `M ${fx} ${fy1} H ${mx} V ${fMidY}` },
        { feederId: feeders[1], childId, d: `M ${fx} ${fy2} H ${mx} V ${fMidY}` },
        { feederId: feeders[0], childId, d: `M ${mx} ${fMidY} H ${cx}` }
      );
    }
  }

  return segments;
}
