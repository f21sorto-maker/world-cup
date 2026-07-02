/** Pulls the first iframe `src` from provider HTML — avoids `dangerouslySetInnerHTML`. */
export function extractIframeSrc(html: string): string | undefined {
  const trimmed = html.trim();
  if (!trimmed) return undefined;

  const iframeMatch = trimmed.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeMatch?.[1]) return iframeMatch[1];

  const bareUrl = trimmed.match(/^https?:\/\/\S+/i)?.[0];
  return bareUrl;
}
