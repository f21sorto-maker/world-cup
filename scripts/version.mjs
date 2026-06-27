#!/usr/bin/env node
/**
 * Version & build manager for Road to the World Cup Final 2026.
 *
 * Usage:
 *   node scripts/version.mjs build [--message "what changed"]
 *   node scripts/version.mjs patch|minor|major [--message "release notes"]
 *   node scripts/version.mjs log --message "note without bumping"
 *   node scripts/version.mjs record-commit
 *   node scripts/version.mjs deploy [--url "https://..."] [--message "..."]
 *   node scripts/version.mjs sync-canvas
 *   node scripts/version.mjs show
 *
 * Every `build` increments build number and updates VERSION_LOG, CHANGELOG [Unreleased],
 * build-manifest.json, and the release dashboard canvas.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, runBuildBump, runRecordCommit, runRecordDeploy, runSemverBump, syncReleaseCanvas, appendVersionLog } from "./lib/version-core.mjs";
import { VERSION_FILE } from "./lib/version-artifacts.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function resolveDeployUrl(explicitUrl) {
  if (explicitUrl) return explicitUrl;

  const vercelAlias = process.env.VERCEL_URL ?? process.env.VERCEL_ALIAS ?? "";
  if (vercelAlias) {
    return vercelAlias.startsWith("http") ? vercelAlias : `https://${vercelAlias}`;
  }

  try {
    const cfgPath = path.join(ROOT, ".vercel/output/config.json");
    const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
    const alias = cfg.alias?.[0] ?? cfg.alias;
    if (typeof alias === "string" && alias.length > 0) {
      return alias.startsWith("http") ? alias : `https://${alias}`;
    }
  } catch {
    /* no local Vercel output */
  }

  return "";
}

function parseArgs(argv) {
  const command = argv[0] ?? "show";
  let message = "";
  let url = "";
  let environment = "production";
  for (let i = 1; i < argv.length; i += 1) {
    if (argv[i] === "--message" || argv[i] === "-m") {
      message = argv[i + 1] ?? "";
      i += 1;
    } else if (argv[i] === "--url") {
      url = argv[i + 1] ?? "";
      i += 1;
    } else if (argv[i] === "--env") {
      environment = argv[i + 1] ?? "production";
      i += 1;
    }
  }
  return { command, message, url, environment };
}

function main() {
  const { command, message, url, environment } = parseArgs(process.argv.slice(2));
  const meta = readJson(VERSION_FILE);

  if (command === "show") {
    console.log(`${meta.version} (build ${meta.build}) [${meta.channel}]`);
    return;
  }

  if (command === "sync-canvas") {
    syncReleaseCanvas();
    return;
  }

  if (command === "log") {
    if (!message) {
      console.error("log requires --message");
      process.exit(1);
    }
    appendVersionLog({
      version: meta.version,
      build: meta.build,
      message,
      kind: "note",
    });
    console.log(`Logged note for v${meta.version} build ${meta.build}`);
    return;
  }

  if (command === "build") {
    const next = runBuildBump(message);
    console.log(`Build bumped → v${next.version} build ${next.build}`);
    return;
  }

  if (command === "patch" || command === "minor" || command === "major") {
    const next = runSemverBump(command, message);
    console.log(`Version bumped → v${next.version} build ${next.build}`);
    return;
  }

  if (command === "record-commit") {
    const recorded = runRecordCommit();
    if (recorded) {
      console.log(
        `Recorded commit ${recorded.shortHash} @ v${recorded.version} build ${recorded.build}`
      );
    }
    return;
  }

  if (command === "deploy") {
    const resolvedUrl = resolveDeployUrl(url);
    const next = runRecordDeploy({
      url: resolvedUrl,
      environment,
      message: message || "Production deploy",
    });
    console.log(`Recorded deploy → v${next.version} build ${next.build}${resolvedUrl ? ` @ ${resolvedUrl}` : ""}`);
    return;
  }

  console.error(`Unknown command: ${command}`);
  console.error(
    "Commands: build | patch | minor | major | log | record-commit | deploy | sync-canvas | show"
  );
  process.exit(1);
}

main();
