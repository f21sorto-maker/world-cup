import { useMemo } from "react";
import type { LiveStreamMatchBundle } from "../../../../types/liveStream";
import { extractIframeSrc } from "../../../../lib/extractIframeSrc";
import { TapToPlayEmbed } from "../../../../components/shared/TapToPlayEmbed";
import styles from "./MatchWatchTab.module.css";

type Props = {
  bundle: LiveStreamMatchBundle & { loading?: boolean };
  homeTeamName: string;
  awayTeamName: string;
  onOpenStream?: (url: string) => void;
};

function isEmbedUrl(url: string): boolean {
  return /embed|iframe|player/i.test(url) || url.includes("#");
}

export function MatchWatchTab({
  bundle,
  homeTeamName,
  awayTeamName,
  onOpenStream,
}: Props) {
  const { loading, scheduleMatch, play, scheduleError, streamMatchId, iptv } = bundle;

  const iframeHtmlSrc = useMemo(
    () => (play?.iframeHtml ? extractIframeSrc(play.iframeHtml) : undefined),
    [play?.iframeHtml]
  );

  if (loading && !play && !scheduleMatch) {
    return (
      <div className={styles.panel}>
        <p className={styles.muted}>Checking live stream availability…</p>
      </div>
    );
  }

  if (scheduleError) {
    return (
      <div className={styles.panel}>
        <p className={styles.emptyTitle}>Schedule temporarily unavailable</p>
        <p className={styles.muted}>
          The stream provider returned: <strong>{scheduleError}</strong>. This is an upstream
          API issue (GraphQL persisted query). Play Stream still works when you have a stream id.
        </p>
      </div>
    );
  }

  if (!scheduleMatch && !play?.available) {
    return (
      <div className={styles.panel}>
        <p className={styles.emptyTitle}>No stream listed for this fixture</p>
        <p className={styles.muted}>
          {homeTeamName} vs {awayTeamName} is not in today&apos;s football stream schedule, or the
          match has not started yet. Streams usually appear closer to kickoff.
        </p>
        {iptv?.available ? (
          <IptvFallbackSection iptv={iptv} onOpenStream={onOpenStream} />
        ) : iptv?.error ? (
          <p className={styles.muted}>IPTV fallback: {iptv.error}</p>
        ) : null}
      </div>
    );
  }

  const embedUrl = play?.embedUrl ?? play?.streamUrl;
  const servers = play?.servers ?? [];
  const streamTitle = `Live stream: ${homeTeamName} vs ${awayTeamName}`;
  const playableEmbedUrl =
    embedUrl && isEmbedUrl(embedUrl) ? embedUrl : iframeHtmlSrc && isEmbedUrl(iframeHtmlSrc) ? iframeHtmlSrc : undefined;

  return (
    <div className={styles.panel}>
      {scheduleMatch ? (
        <div className={styles.meta}>
          <span className={styles.badge}>{scheduleMatch.isLive ? "LIVE" : "Scheduled"}</span>
          {scheduleMatch.league ? <span className={styles.league}>{scheduleMatch.league}</span> : null}
          {streamMatchId ? (
            <span className={styles.id}>Stream id {streamMatchId}</span>
          ) : null}
        </div>
      ) : null}

      {!play?.available ? (
        <div className={styles.unavailable}>
          <p className={styles.emptyTitle}>Stream not available yet</p>
          <p className={styles.muted}>
            {play?.error ?? "The provider has not published a playable link for this match."}
          </p>
        </div>
      ) : (
        <>
          {playableEmbedUrl ? (
            <TapToPlayEmbed
              embedUrl={playableEmbedUrl}
              title={streamTitle}
              posterLabel="Tap to load live stream"
              openUrl={embedUrl && !isEmbedUrl(embedUrl) ? embedUrl : undefined}
              className={styles.playerWrapMargin}
            />
          ) : null}

          {servers.length > 0 ? (
            <ul className={styles.serverList}>
              {servers.map((server, i) => (
                <li key={`${server.url}-${i}`}>
                  <a
                    href={server.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.serverLink}
                    onClick={(e) => {
                      if (onOpenStream) {
                        e.preventDefault();
                        onOpenStream(server.url);
                      }
                    }}
                  >
                    {server.name ?? `Server ${i + 1}`}
                    {server.type ? ` · ${server.type}` : ""}
                  </a>
                </li>
              ))}
            </ul>
          ) : embedUrl && !isEmbedUrl(embedUrl) && !playableEmbedUrl ? (
            <a
              href={embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.openBtn}
            >
              Open stream
            </a>
          ) : play?.iframeHtml && !iframeHtmlSrc ? (
            <p className={styles.muted}>
              Embedded player markup could not be loaded safely. Use a server link below or open the
              stream in an external player.
            </p>
          ) : null}

          {iptv?.available && !play?.available ? (
            <IptvFallbackSection iptv={iptv} onOpenStream={onOpenStream} />
          ) : null}
        </>
      )}
    </div>
  );
}

type IptvProps = {
  iptv: NonNullable<LiveStreamMatchBundle["iptv"]>;
  onOpenStream?: (url: string) => void;
};

function IptvFallbackSection({ iptv, onOpenStream }: IptvProps) {
  return (
    <div className={styles.iptvSection}>
      <p className={styles.iptvTitle}>IPTV options</p>
      <p className={styles.muted}>
        Supplemental streams from Xtream / M3U providers ({iptv.sources.join(", ")}). Open in VLC,
        IPTV Smarters, or another player.
      </p>
      <ul className={styles.serverList}>
        {iptv.servers.map((server, i) => (
          <li key={`${server.url}-${i}`}>
            <a
              href={server.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.serverLink}
              onClick={(e) => {
                if (onOpenStream) {
                  e.preventDefault();
                  onOpenStream(server.url);
                }
              }}
            >
              {server.name ?? `IPTV source ${i + 1}`}
              {server.type ? ` · ${server.type}` : ""}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
