/** Runtime hints for API credential setup (browser-safe — only checks VITE_* vars). */

const ZAFRONIX_SIGNUP_URL = "https://api.zafronix.com/signup";

export function hasRapidApiKey(): boolean {
  const key = import.meta.env.VITE_RAPIDAPI_KEY;
  return Boolean(key && key !== "FILL_ME_IN" && key.length > 8);
}

export function hasZafronixKey(): boolean {
  const key = import.meta.env.VITE_ZAFRONIX_API_KEY;
  return Boolean(key && key !== "FILL_ME_IN" && key.length > 8);
}

export function zafronixSignupUrl(): string {
  return ZAFRONIX_SIGNUP_URL;
}

export type ApiSetupIssue = {
  id: "rapidapi" | "zafronix";
  message: string;
  actionLabel?: string;
  actionUrl?: string;
};

/** Issues visible in production when env vars were not set at build time. */
export function listApiSetupIssues(): ApiSetupIssue[] {
  const issues: ApiSetupIssue[] = [];
  if (!hasRapidApiKey()) {
    issues.push({
      id: "rapidapi",
      message: "RapidAPI key missing — live scores, weather, and odds may not load.",
    });
  }
  if (!hasZafronixKey()) {
    issues.push({
      id: "zafronix",
      message: "Zafronix key missing — head-to-head history and team profiles are limited.",
      actionLabel: "Get free key",
      actionUrl: ZAFRONIX_SIGNUP_URL,
    });
  }
  return issues;
}
