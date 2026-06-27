import { listApiSetupIssues } from "../../lib/apiSetup";

/** Shown in production when required VITE_* keys were not set at build time. */
export function ApiSetupBanner() {
  if (import.meta.env.DEV) return null;

  const issues = listApiSetupIssues();
  if (issues.length === 0) return null;

  return (
    <div
      role="status"
      style={{
        background: "rgba(234, 179, 8, 0.12)",
        borderBottom: "1px solid rgba(234, 179, 8, 0.35)",
        color: "var(--ss-text)",
        fontSize: 12,
        padding: "8px 16px",
        textAlign: "center",
        lineHeight: 1.5,
      }}
    >
      {issues.map((issue) => (
        <span key={issue.id} style={{ display: "inline", marginInline: 8 }}>
          {issue.message}
          {issue.actionUrl ? (
            <>
              {" "}
              <a href={issue.actionUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--ss-brand)" }}>
                {issue.actionLabel}
              </a>
            </>
          ) : null}
        </span>
      ))}
    </div>
  );
}
