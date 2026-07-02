import { useState } from "react";
import styles from "./TapToPlayEmbed.module.css";

type Props = {
  embedUrl: string;
  title: string;
  posterUrl?: string;
  posterLabel?: string;
  openUrl?: string;
  allow?: string;
  className?: string;
};

export function TapToPlayEmbed({
  embedUrl,
  title,
  posterUrl,
  posterLabel = "Tap to load player",
  openUrl,
  allow = "autoplay; encrypted-media; picture-in-picture; fullscreen",
  className,
}: Props) {
  const [activated, setActivated] = useState(false);

  const rootClass = className ? `${styles.wrap} ${className}` : styles.wrap;

  if (!activated) {
    return (
      <>
        <div className={rootClass}>
          <button
            type="button"
            className={styles.poster}
            onClick={() => setActivated(true)}
            aria-label={`${posterLabel}: ${title}`}
          >
            {posterUrl ? (
              <img src={posterUrl} alt="" className={styles.posterImage} loading="lazy" decoding="async" />
            ) : null}
            <span className={styles.posterContent}>
              <span className={styles.playIcon} aria-hidden>
                ▶
              </span>
              <span className={styles.posterLabel}>{posterLabel}</span>
              <span className={styles.posterHint}>Loads embedded video on this page</span>
            </span>
          </button>
        </div>
        {openUrl ? (
          <div className={styles.footer}>
            <a href={openUrl} target="_blank" rel="noopener noreferrer" className={styles.externalLink}>
              Open in browser instead
            </a>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <div className={rootClass}>
      <iframe
        src={embedUrl}
        title={title}
        className={styles.player}
        allow={allow}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-fullscreen allow-popups"
      />
    </div>
  );
}
