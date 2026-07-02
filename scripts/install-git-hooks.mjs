#!/usr/bin/env node
/**
 * Point this repo at .githooks/ for pre-commit build bumps and post-commit tracking.
 */
import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOOKS_DIR = join(ROOT, ".githooks");

const HOOK_ENV = `#!/bin/sh
# Resolves NODE when git hooks run with a minimal PATH (IDE / GUI clients).
if [ -z "\${NODE:-}" ]; then
  export PATH="/opt/homebrew/bin:/usr/local/bin:\$HOME/.volta/bin:\$HOME/.fnm/aliases/default/bin:\$PATH"

  if [ -s "\$HOME/.nvm/nvm.sh" ]; then
    # shellcheck disable=SC1090
    . "\$HOME/.nvm/nvm.sh" 2>/dev/null || true
  fi

  NODE=\$(command -v node 2>/dev/null || true)
  if [ -z "\$NODE" ]; then
    for candidate in \\
      /opt/homebrew/bin/node \\
      /usr/local/bin/node \\
      "\$HOME/.volta/bin/node" \\
      /Applications/Cursor.app/Contents/Resources/app/resources/helpers/node; do
      if [ -x "\$candidate" ]; then
        NODE="\$candidate"
        break
      fi
    done
  fi

  export NODE
fi

if [ -z "\$NODE" ] || [ ! -x "\$NODE" ]; then
  echo "git hook: node not found. Install Node.js or add it to PATH." >&2
  exit 1
fi
`;

const PRE_COMMIT = `#!/bin/sh
# Auto-increment build when substantive files are staged.
set -e
HOOK_DIR="\$(CDPATH= cd "\$(dirname "\$0")" && pwd)"
. "\$HOOK_DIR/hook-env.sh"
exec "\$NODE" scripts/version-auto-bump.mjs
`;

const POST_COMMIT = `#!/bin/sh
# Record commit hash + sync release canvas.
set -e
HOOK_DIR="\$(CDPATH= cd "\$(dirname "\$0")" && pwd)"
. "\$HOOK_DIR/hook-env.sh"
exec "\$NODE" scripts/version.mjs record-commit
`;

function writeHook(name, body) {
  const path = join(HOOKS_DIR, name);
  writeFileSync(path, body, { mode: 0o755 });
  chmodSync(path, 0o755);
}

mkdirSync(HOOKS_DIR, { recursive: true });
writeHook("hook-env.sh", HOOK_ENV);
writeHook("pre-commit", PRE_COMMIT);
writeHook("post-commit", POST_COMMIT);

try {
  execSync("git rev-parse --git-dir", { cwd: ROOT, stdio: "ignore" });
  execSync(`git config core.hooksPath ${JSON.stringify(".githooks")}`, { cwd: ROOT });
  console.log("Git hooks installed → .githooks (pre-commit build bump, post-commit tracking)");
} catch {
  console.warn("install-git-hooks: not a git repo — hooks written but not configured");
}
