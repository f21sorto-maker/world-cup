import type { Lineup, LineupPlayer } from "../../../../types";
import { resolveLineupPlayerPhoto } from "../../../../lib/resolveLineupPlayerPhoto";
import {
  PITCH_LAYOUT,
  pitchLeftPercent,
  pitchTopPercentAway,
  pitchTopPercentHome,
} from "../../../../lib/pitchDiagramLayout";
import { PlayerPhoto } from "../../../../components/player/PlayerPhoto";
import styles from "./PitchDiagram.module.css";

type Props = {
  homeLineup: Lineup;
  awayLineup: Lineup;
};

type PlayerTokenProps = {
  player: LineupPlayer;
  leftPercent: number;
  topPercent: number;
  side: "home" | "away";
};

function PlayerToken({ player, leftPercent, topPercent, side }: PlayerTokenProps) {
  const photoUrl = resolveLineupPlayerPhoto(player.player);
  const surname = player.player.displayName.split(" ").pop() ?? player.player.displayName;
  const jersey = player.player.jerseyNumber;
  const label = jersey != null ? `${jersey} ${surname}` : surname;

  return (
    <div
      className={`${styles.playerToken} ${side === "home" ? styles.playerTokenHome : styles.playerTokenAway}`}
      style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
      title={player.player.displayName}
    >
      {player.isCaptain ? <span className={styles.captainBadge}>(C)</span> : null}
      <div className={styles.photoRing}>
        <PlayerPhoto name={player.player.displayName} photoUrl={photoUrl} size="sm" />
      </div>
      <span className={styles.playerLabel}>{label}</span>
    </div>
  );
}

function PitchMarkings() {
  const { width: WIDTH, height: HEIGHT, padding: PADDING } = PITCH_LAYOUT;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={styles.pitchSvg}
      aria-hidden
      focusable="false"
    >
      <rect width={WIDTH} height={HEIGHT} fill="#1a3a1a" rx={8} />
      <rect
        x={PADDING}
        y={PADDING}
        width={WIDTH - PADDING * 2}
        height={HEIGHT - PADDING * 2}
        fill="none"
        stroke="var(--ss-pitch-line, rgba(255,255,255,0.25))"
        strokeWidth={1}
      />
      <line
        x1={PADDING}
        y1={HEIGHT / 2}
        x2={WIDTH - PADDING}
        y2={HEIGHT / 2}
        stroke="var(--ss-pitch-line, rgba(255,255,255,0.25))"
        strokeWidth={1}
      />
      <circle
        cx={WIDTH / 2}
        cy={HEIGHT / 2}
        r={36}
        fill="none"
        stroke="var(--ss-pitch-line, rgba(255,255,255,0.2))"
        strokeWidth={1}
      />
      <rect
        x={WIDTH / 2 - 60}
        y={PADDING}
        width={120}
        height={56}
        fill="none"
        stroke="var(--ss-pitch-line, rgba(255,255,255,0.2))"
        strokeWidth={1}
      />
      <rect
        x={WIDTH / 2 - 60}
        y={HEIGHT - PADDING - 56}
        width={120}
        height={56}
        fill="none"
        stroke="var(--ss-pitch-line, rgba(255,255,255,0.2))"
        strokeWidth={1}
      />
    </svg>
  );
}

export function PitchDiagram({ homeLineup, awayLineup }: Props) {
  return (
    <div className={styles.wrap}>
      <div className={styles.pitch} aria-label="Pitch diagram with player positions">
        <PitchMarkings />
        <div className={styles.playersLayer}>
          {awayLineup.startingXI.map((player, i) => {
            const pos = player.gridPosition ?? { x: 50, y: i * 9 };
            return (
              <PlayerToken
                key={player.player.id}
                player={player}
                leftPercent={pitchLeftPercent(pos.x)}
                topPercent={pitchTopPercentAway(pos.y)}
                side="away"
              />
            );
          })}
          {homeLineup.startingXI.map((player, i) => {
            const pos = player.gridPosition ?? { x: 50, y: i * 9 };
            return (
              <PlayerToken
                key={player.player.id}
                player={player}
                leftPercent={pitchLeftPercent(pos.x)}
                topPercent={pitchTopPercentHome(pos.y)}
                side="home"
              />
            );
          })}
        </div>
      </div>

      <div className={styles.legend}>
        <span>
          <span className={`${styles.legendDot} ${styles.legendHome}`} />
          Home
        </span>
        <span>
          <span className={`${styles.legendDot} ${styles.legendAway}`} />
          Away
        </span>
      </div>
    </div>
  );
}
