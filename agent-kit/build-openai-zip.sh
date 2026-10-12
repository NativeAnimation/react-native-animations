#!/usr/bin/env bash
set -euo pipefail
kit_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
repo_root=$(cd -- "$kit_root/.." && pwd)
mkdir -p "$kit_root/dist"
# Explicit allowlist: no credentials, eval logs, or unrelated agent manifests.
python3 - "$repo_root/plugins/nativeanimation" "$kit_root/dist/nativeanimation-openai.zip" <<'PY'
import json, pathlib, sys, zipfile
root, output = map(pathlib.Path, sys.argv[1:])
manifest = json.loads((root / '.codex-plugin/plugin.json').read_text())
if json.loads((root / '.mcp.json').read_text()) != json.loads((root / 'mcp.json').read_text()):
    raise SystemExit('Claude/Codex and Cursor MCP configurations must match')
for field in ('logo', 'composerIcon'):
    asset = (root / manifest['interface'][field]).resolve()
    if not asset.is_relative_to(root.resolve()) or not asset.is_file():
        raise SystemExit(f'Missing or invalid {field}')
paths = [root / '.codex-plugin/plugin.json', root / '.mcp.json', root / 'README.md']
for folder in ('skills', 'assets'):
    paths.extend(p for p in (root / folder).rglob('*') if p.is_file())
if any(p.is_symlink() for p in root.rglob('*')):
    raise SystemExit('Package must contain regular files, not symlinks')
with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(paths):
        archive.write(path, path.relative_to(root).as_posix())
print(output)
PY
printf '%s\n' 'Draft only: public MCP submission requires a remote HTTPS endpoint and owner review.' >&2
