#!/bin/sh
# Resolves NODE when git hooks run with a minimal PATH (IDE / GUI clients).
if [ -z "${NODE:-}" ]; then
  export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.volta/bin:$HOME/.fnm/aliases/default/bin:$PATH"

  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    # shellcheck disable=SC1090
    . "$HOME/.nvm/nvm.sh" 2>/dev/null || true
  fi

  NODE=$(command -v node 2>/dev/null || true)
  if [ -z "$NODE" ]; then
    for candidate in \
      /opt/homebrew/bin/node \
      /usr/local/bin/node \
      "$HOME/.volta/bin/node" \
      /Applications/Cursor.app/Contents/Resources/app/resources/helpers/node; do
      if [ -x "$candidate" ]; then
        NODE="$candidate"
        break
      fi
    done
  fi

  export NODE
fi

if [ -z "$NODE" ] || [ ! -x "$NODE" ]; then
  echo "git hook: node not found. Install Node.js or add it to PATH." >&2
  exit 1
fi
