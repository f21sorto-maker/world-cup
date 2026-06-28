import { useEffect, type ReactNode } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from "@clerk/clerk-react";
import { isAdminTokenConfigured, isClerkEnabled, registerClerkTokenGetter } from "../lib/adminApi";

interface Props {
  children: ReactNode;
}

function ClerkAuthBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    registerClerkTokenGetter(() => getToken());
  }, [getToken]);
  return null;
}

export function AdminShell({ children }: Props) {
  const clerk = isClerkEnabled();

  return (
    <div className="admin-shell">
      {clerk ? <ClerkAuthBridge /> : null}
      <header className="admin-shell__header">
        <h1>WC2026 Admin</h1>
        <span className="admin-shell__badge">Slate console</span>
        {clerk ? (
          <div className="admin-shell__auth">
            <SignedOut>
              <SignInButton mode="modal" />
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/admin" />
            </SignedIn>
          </div>
        ) : null}
      </header>
      {!isAdminTokenConfigured() ? (
        <p className="admin-shell__warn" role="status">
          Set <code>VITE_CLERK_PUBLISHABLE_KEY</code> or <code>VITE_DEV_ADMIN_TOKEN</code> in{" "}
          <code>apps/admin/.env.local</code> to enable write APIs.
        </p>
      ) : null}
      <main className="admin-shell__main">{children}</main>
    </div>
  );
}
