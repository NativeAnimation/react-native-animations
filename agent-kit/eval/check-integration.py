"""Smoke gate only; observable behavior and source provenance require review."""
import pathlib
import re
import sys

root = pathlib.Path(sys.argv[1]).resolve()
entry = root / "App.tsx"
if entry.read_bytes() == pathlib.Path(sys.argv[2]).read_bytes():
    raise SystemExit("App.tsx was not changed")

visited = set()
pending = [entry]
animation_modules = []
while pending:
    path = pending.pop()
    if path in visited:
        continue
    visited.add(path)
    source = path.read_text()
    if path != entry and re.search(r"from\s+['\"]react-native-(?:reanimated|worklets)['\"]", source):
        animation_modules.append(path.relative_to(root).as_posix())
    for specifier in re.findall(r"(?:from\s+|import\s*)['\"]([^'\"]+)['\"]", source):
        if specifier.startswith("."):
            base = path.parent / specifier
        elif specifier.startswith("@/"):
            base = root / specifier[2:]
        else:
            continue
        for candidate in (base, pathlib.Path(str(base) + ".tsx"), pathlib.Path(str(base) + ".ts"), base / "index.tsx", base / "index.ts"):
            resolved = candidate.resolve()
            if not resolved.is_relative_to(root):
                continue
            relative = resolved.relative_to(root)
            if any(p.startswith(".") or p in ("node_modules", "plugins") for p in relative.parts):
                continue
            if resolved.is_file() and resolved.suffix in (".ts", ".tsx"):
                pending.append(resolved)
                break
if not animation_modules:
    raise SystemExit("No reachable animation source module imported by App.tsx")
print("Reachable animation source:", ", ".join(animation_modules))
print("Visual behavior, accessibility, tool order, and source provenance remain pending review.")
