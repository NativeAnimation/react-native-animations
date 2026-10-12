#!/usr/bin/env bash
set -euo pipefail
kit_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
plugin_source="$kit_root/../plugins/nativeanimation"
plugin_target="${CURSOR_LOCAL_PLUGINS_DIR:-$HOME/.cursor/plugins/local}/nativeanimation"
if [[ -e "$plugin_target" || -L "$plugin_target" ]]; then
  printf 'Already exists: %s. Review or remove the existing copy before reinstalling.\n' "$plugin_target" >&2
  exit 1
fi
mkdir -p "$(dirname -- "$plugin_target")"
cp -R "$plugin_source" "$plugin_target"
printf 'Installed local plugin at %s. Reload Cursor and check Customize.\n' "$plugin_target"
printf '%s\n' 'Local plugin imports must be allowed by your administrator.'
