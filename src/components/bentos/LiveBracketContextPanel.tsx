import { knockoutSchedule } from "../../data/knockoutSchedule";
import { formatKickoffLabel, resolveOfficialMatchKickoff } from "../../services/ScheduleLinker";
import { teamDisplayNameFromId } from "../../lib/matchTeamDisplay";
import { teamDisplayName } from "../../lib/teamIdentity";
import {
  findChildBracketMatchId,
  lookupBracketLiveMatch,
  siblingFeederMatchId,
} from "../../lib/bracketTree";
import type { BracketMatch, BracketSlotCertainty, MergedMatch, Team } from "../../types";
import { TeamFlag } from "../team/TeamFlag";
import { CertaintyBadge } from "../shared/CertaintyBadge";
import { CompactMatchScore } from "../match/CompactMatchScore";
import styles from "./LiveBracketContextPanel.module.css";

type Props = {
  liveMatch: MergedMatch;
  bracket: BracketMatch[];
  teamsById: Record<string, Team>;
  liveMatches: Record<string, MergedMatch>;
};

const STAGE_LABELS: Record<string, string> = {
  R16: "Round of 16",
  QF: "Quarter-final",
  SF: "Semi-final",
  Final: "Final",
};

function bracketById(bracket: BracketMatch[]): Map<string, BracketMatch> {
  return new Map(bracket.map((match) => [match.id, match]));
}

function CtxMatchNode({
  match,
  live,
  teamsById,
  label,
  isLive,
}: {
  match: BracketMatch | MergedMatch;
  live?: MergedMatch;
  teamsById: Record<string, Team>;
  label: string;
  isLive?: boolean;
}) {
  const homeId = match.homeTeamId;
  const awayId = match.awayTeamId;
  const home = homeId ? teamsById[homeId] : undefined;
  const away = awayId ? teamsById[awayId] : undefined;
  const scoreMatch = live ?? (match.homeScore !== undefined ? (match as MergedMatch) : undefined);

  return (
    <article className={`${styles.node} ${isLive ? styles.nodeLive : ""}`.trim()}>
      <header className={styles.nodeHead}>
        {isLive ? <span className={styles.livePill}>LIVE</span> : null}
        <span className={styles.nodeLabel}>{label}</span>
      </header>
      <div className={styles.nodeTeams}>
        <div className={styles.nodeTeam}>
          {homeId ? <TeamFlag team={home} teamId={homeId} size="sm" compact /> : <span className={styles.dot} />}
          <span>{teamDisplayName(home, "TBD", undefined)}</span>
        </div>
        <div className={styles.nodeTeam}>
          {awayId ? <TeamFlag team={away} teamId={awayId} size="sm" compact /> : <span className={styles.dot} />}
          <span>{teamDisplayName(away, "TBD", undefined)}</span>
        </div>
      </div>
      {scoreMatch && scoreMatch.homeScore !== undefined ? (
        <div className={styles.nodeScore}>
          <CompactMatchScore match={scoreMatch} perspective="home" />
        </div>
      ) : null}
    </article>
  );
}

function CtxRoundNode({
  match,
  teamsById,
  roundLabel,
}: {
  match: BracketMatch;
  teamsById: Record<string, Team>;
  roundLabel: string;
}) {
  const home = match.homeTeamId ? teamsById[match.homeTeamId] : undefined;
  const away = match.awayTeamId ? teamsById[match.awayTeamId] : undefined;
  const homeCertainty: BracketSlotCertainty = match.homeCertainty ?? (match.homeTeamId ? "projected" : "tbd");
  const awayCertainty: BracketSlotCertainty = match.awayCertainty ?? (match.awayTeamId ? "projected" : "tbd");

  return (
    <article className={styles.roundNode}>
      <header className={styles.nodeHead}>
        <span className={styles.nodeLabel}>{roundLabel}</span>
        <span className={styles.nodeMatchId}>{match.id}</span>
      </header>
      <div className={styles.nodeTeams}>
        <div className={`${styles.nodeTeam} ${homeCertainty === "confirmed" ? styles.nodeTeamConfirmed : ""}`.trim()}>
          {match.homeTeamId ? (
            <TeamFlag team={home} teamId={match.homeTeamId} size="sm" compact />
          ) : (
            <span className={styles.dot} />
          )}
          <span>{teamDisplayName(home, match.homeSeedLabel ?? "TBD", match.homeSeedLabel)}</span>
          <CertaintyBadge certainty={homeCertainty} size="xs" />
        </div>
        <div className={`${styles.nodeTeam} ${awayCertainty === "confirmed" ? styles.nodeTeamConfirmed : ""}`.trim()}>
          {match.awayTeamId ? (
            <TeamFlag team={away} teamId={match.awayTeamId} size="sm" compact />
          ) : (
            <span className={styles.dot} />
          )}
          <span>{teamDisplayName(away, match.awaySeedLabel ?? "TBD", match.awaySeedLabel)}</span>
          <CertaintyBadge certainty={awayCertainty} size="xs" />
        </div>
      </div>
    </article>
  );
}

export function LiveBracketContextPanel({ liveMatch, bracket, teamsById, liveMatches }: Props) {
  const liveMatchId = liveMatch.matchId ?? liveMatch.id;
  const childId = findChildBracketMatchId(liveMatchId);
  if (!childId) return null;

  const byId = bracketById(bracket);
  const r16Match = byId.get(childId);
  const siblingId = siblingFeederMatchId(childId, liveMatchId);
  if (!r16Match || !siblingId) return null;

  const siblingBracket = byId.get(siblingId);
  const siblingLive = lookupBracketLiveMatch(liveMatches, siblingId);
  const roundLabel = STAGE_LABELS[r16Match.stage] ?? r16Match.stage;
  const siblingInfo = knockoutSchedule[siblingId];
  const siblingKickoff = siblingInfo
    ? formatKickoffLabel(resolveOfficialMatchKickoff({ matchId: siblingId, date: siblingInfo.date }))
    : siblingId;

  return (
    <section className={styles.panel} aria-label="Knockout path context">
      <div className={styles.flow}>
        <CtxMatchNode
          match={liveMatch}
          live={liveMatch}
          teamsById={teamsById}
          label="This match"
          isLive={liveMatch.status === "live"}
        />
        <div className={styles.arrow} aria-hidden>
          →
        </div>
        <CtxRoundNode match={r16Match} teamsById={teamsById} roundLabel={roundLabel} />
      </div>

      <div className={styles.sibling}>
        <span className={styles.siblingLabel}>Opponent determined by</span>
        {siblingBracket ? (
          <CtxMatchNode
            match={siblingBracket}
            live={siblingLive}
            teamsById={teamsById}
            label={siblingKickoff}
            isLive={siblingLive?.status === "live"}
          />
        ) : (
          <p className={styles.siblingFallback}>
            {siblingLive?.homeTeamId
              ? teamDisplayNameFromId(siblingLive.homeTeamId, teamsById)
              : "TBD"}{" "}
            vs{" "}
            {siblingLive?.awayTeamId
              ? teamDisplayNameFromId(siblingLive.awayTeamId, teamsById)
              : "TBD"}{" "}
            ({siblingKickoff})
          </p>
        )}
      </div>
    </section>
  );
}
