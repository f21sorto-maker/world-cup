/**
 * Syncs sweep output into the UI Debug Canvas (embedded snapshot + sidecar logs).
 * Called automatically at the end of ui-debug-sweep.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CURSOR_PROJECT = path.join(
  process.env.HOME ?? "",
  ".cursor/projects/Users-RonalSorto-Developer-world-cup"
);
const GAP_PATH = path.join(ROOT, ".cursor/ui-debug-gap-list.json");
const LOG_PATH = path.join(ROOT, ".cursor/ui-debug-last-run.log");
const CANVAS_PATH = path.join(CURSOR_PROJECT, "canvases/ui-debug-dashboard.canvas.tsx");
const SIDECAR_PATH = path.join(CURSOR_PROJECT, "canvases/ui-debug-dashboard.canvas.data.json");

const START = "// <<UI_DEBUG_SNAPSHOT_START>>";
const END = "// <<UI_DEBUG_SNAPSHOT_END>>";

function summarize(report) {
  const byKind = {};
  const byRoute = {};
  const byViewport = {};
  let total = 0;

  for (const entry of report) {
    byViewport[entry.viewport] = (byViewport[entry.viewport] ?? 0) + entry.issues.length;
    byRoute[entry.route] = (byRoute[entry.route] ?? 0) + entry.issues.length;
    total += entry.issues.length;
    for (const issue of entry.issues) {
      byKind[issue.kind] = (byKind[issue.kind] ?? 0) + 1;
    }
  }

  return { total, byKind, byRoute, byViewport };
}

export function syncUiDebugCanvas({ logs = "" } = {}) {
  if (!fs.existsSync(GAP_PATH)) {
    console.warn("sync-ui-debug-canvas: gap list missing — run ui-debug-sweep first");
    return false;
  }

  const gap = JSON.parse(fs.readFileSync(GAP_PATH, "utf8"));
  const summary = summarize(gap.report ?? []);
  const snapshot = {
    scannedAt: gap.scannedAt ?? new Date().toISOString(),
    base: gap.base ?? "http://127.0.0.1:5173",
    summary,
    report: gap.report ?? [],
  };

  const logText =
    logs ||
    (fs.existsSync(LOG_PATH) ? fs.readFileSync(LOG_PATH, "utf8") : "");

  if (!fs.existsSync(CANVAS_PATH)) {
    console.warn("sync-ui-debug-canvas: canvas file not found at", CANVAS_PATH);
    return false;
  }

  const canvasSrc = fs.readFileSync(CANVAS_PATH, "utf8");
  const block = `${START}\nconst SCAN_SNAPSHOT = ${JSON.stringify(snapshot, null, 2)} as const;\n${END}`;

  if (!canvasSrc.includes(START) || !canvasSrc.includes(END)) {
    console.warn("sync-ui-debug-canvas: snapshot markers missing in canvas");
    return false;
  }

  const nextCanvas = canvasSrc.replace(
    new RegExp(`${START}[\\s\\S]*?${END}`),
    block
  );
  fs.writeFileSync(CANVAS_PATH, nextCanvas);

  fs.writeFileSync(
    SIDECAR_PATH,
    JSON.stringify(
      {
        logs: logText,
        lastRunAt: snapshot.scannedAt,
        lastRunStatus: "success",
        lastTotalIssues: summary.total,
      },
      null,
      2
    )
  );

  console.log(`Canvas synced → ${summary.total} issues (${snapshot.scannedAt})`);
  return true;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  syncUiDebugCanvas();
}
