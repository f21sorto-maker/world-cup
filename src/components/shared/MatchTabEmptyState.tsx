import styles from "../../pages/match/MatchDetailView.module.css";

type Props = {
  title: string;
  detail?: string;
  actionLabel?: string;
  actionUrl?: string;
  onAction?: () => void;
};

export function MatchTabEmptyState({ title, detail, actionLabel, actionUrl, onAction }: Props) {
  return (
    <div className={styles.emptyState}>
      <p>{title}</p>
      {detail ? (
        <p style={{ marginTop: 8, fontSize: 12, color: "var(--ss-muted)", maxWidth: 320, marginInline: "auto" }}>
          {detail}
        </p>
      ) : null}
      {actionLabel && actionUrl ? (
        <a
          href={actionUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            marginTop: 12,
            fontSize: 12,
            color: "var(--ss-brand)",
          }}
        >
          {actionLabel}
        </a>
      ) : null}
      {actionLabel && onAction && !actionUrl ? (
        <button
          type="button"
          style={{
            background: "var(--ss-elevated)",
            border: "1px solid var(--ss-border)",
            color: "var(--ss-text)",
            padding: "6px 14px",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
            marginTop: 12,
          }}
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
