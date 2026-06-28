import type { ReactNode } from "react";
import { isAdminTokenConfigured } from "../lib/adminApi";

interface Props {
  children: ReactNode;
}

export function AdminShell({ children }: Props) {
  return (
    <div className="admin-shell">
      <header className="admin-shell__header">
        <h1>WC2026 Admin</h1>
        <span className="admin-shell__badge">Slate console</span>
      </header>
      {!isAdminTokenConfigured() ? (
        <p className="admin-shell__warn" role="status">
          Set <code>VITE_DEV_ADMIN_TOKEN</code> in <code>apps/admin/.env.local</code> to enable write APIs.
        </p>
      ) : null}
      <main className="admin-shell__main">{children}</main>
    </div>
  );
}
