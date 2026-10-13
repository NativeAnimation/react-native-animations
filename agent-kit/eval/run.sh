#!/usr/bin/env bash
set -euo pipefail
if [[ $# != 2 || ! "$1" =~ ^(claude|cursor|codex)$ || ! "$2" =~ ^([1-9]|10)$ ]]; then
  printf 'Usage: %s <claude|cursor|codex> <1-10>\n' "$0" >&2
  exit 2
fi
agent_name=$1
task_number=$2
kit_root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
repo_root=$(cd -- "$kit_root/.." && pwd)
results_root=${EVAL_RESULTS_DIR:-$kit_root/eval/results}
start_seconds=$SECONDS
ok=0
stage=prerequisites
run_root=
finish() {
  status=$?
  trap - EXIT
  elapsed=$((SECONDS - start_seconds))
  error=
  if (( status != 0 )); then error="$stage (exit $status)"; fi
  csv_line="$agent_name,$task_number,$ok,$elapsed,$error"
  printf '%s\n' "$csv_line"
  if [[ -d "$results_root" ]]; then
    printf '%s\n' "$csv_line" >> "$results_root/results.csv"
  fi
  if [[ -n "$run_root" ]]; then printf 'Retained run: %s\n' "$run_root" >&2; fi
}
trap finish EXIT
for binary in python3 node npm npx git timeout; do command -v "$binary" >/dev/null; done
case "$agent_name" in
  claude) agent_binary=$(command -v claude) ;;
  codex) agent_binary=$(command -v codex) ;;
  cursor)
    agent_binary=$(command -v agent || command -v cursor-agent)
    ;;
esac
mkdir -p "$results_root"
run_root=$(mktemp -d "${TMPDIR:-/tmp}/nativeanimation-${agent_name}-${task_number}.XXXXXX")
app_root="$run_root/app"
plugin_root="$run_root/plugin"
cp -R "$repo_root/plugins/nativeanimation" "$plugin_root"
if [[ ${EVAL_ACCESS:-existing} == free ]]; then
  mkdir -p "$run_root/mcp-config"
  python3 - "$plugin_root" "$run_root/mcp-config" <<'PY'
import json, pathlib, sys
root = pathlib.Path(sys.argv[1])
for name in ('.mcp.json', 'mcp.json'):
    path = root / name
    value = json.loads(path.read_text())
    value['mcpServers']['nativeanimation']['env'] = {'XDG_CONFIG_HOME': sys.argv[2]}
    path.write_text(json.dumps(value, indent=2) + '\n')
PY
fi
stage=fixture
timeout 300 npx -y create-expo-app@latest "$app_root" \
  --template expo-template-blank-typescript@57.0.30 --yes --no-install \
  > "$run_root/setup.log" 2>&1
python3 - "$app_root/package.json" >> "$run_root/setup.log" <<'PY'
import json, re, sys
deps = json.load(open(sys.argv[1]))['dependencies']
if not re.match(r'^[~^]?57\.', deps.get('expo', '')):
    raise SystemExit('Fixture must use Expo SDK 57; refusing to install dependencies')
if not re.match(r'^[~^]?0\.86\.', deps.get('react-native', '')):
    raise SystemExit('Fixture must use React Native 0.86')
print('Verified fixture:', deps['expo'], deps['react-native'])
PY
cd -- "$app_root"
stage=fixture-dependencies
timeout 300 npm install --no-audit --no-fund >> "$run_root/setup.log" 2>&1
git init -q >> "$run_root/setup.log" 2>&1
cp App.tsx "$run_root/App.before.tsx"
mkdir -p .nativeanimation-free
cp -R "$repo_root/animations" .nativeanimation-free/animations
python3 - "$kit_root/eval/tasks.md" "$task_number" "$run_root/prompt.txt" <<'PY'
import pathlib, re, sys
text = pathlib.Path(sys.argv[1]).read_text()
section = re.search(r'^### ' + sys.argv[2] + r'\. .*?\n(.*?)(?=^### |^## |\Z)', text, re.M | re.S)
if not section:
    raise SystemExit('Task not found')
prompt = re.search(r'^\*\*Prompt:\*\* (.+)$', section[1], re.M)[1]
prompt += '\nUse the installed react-native-animations skill and Native Animation MCP. '
prompt += 'Inspect package.json before choosing a piece, read its documentation, and install app dependencies with npx expo install. '
prompt += 'If login or access is unavailable, free source folders are in .nativeanimation-free/animations/. '
prompt += 'Integrate into App.tsx, run npx tsc --noEmit, and explain reduced motion and any development-build requirement. '
prompt += 'Do not log in, purchase, commit, push, or publish. Complete the requested implementation; do not stop at a plan.\n'
pathlib.Path(sys.argv[3]).write_text(prompt)
PY
{
  "$agent_binary" --version
  node --version
  npm --version
  cat package.json
} > "$run_root/environment.txt" 2>&1
printf '%s\n' '# Reviewer result: pending' 'Record pass/fail/blocked and each observable task criterion here.' > "$run_root/review.md"
prompt=$(cat "$run_root/prompt.txt")
stage=agent
agent_status=0
case "$agent_name" in
  claude)
    timeout "${EVAL_TIMEOUT_SECONDS:-900}" "$agent_binary" -p "$prompt" \
      --plugin-dir "$plugin_root" --output-format stream-json --verbose \
      --permission-mode acceptEdits \
      --allowedTools 'Read,Write,Edit,Glob,Grep,Bash(cp *),Bash(mkdir *),Bash(npx expo install *),Bash(npx tsc --noEmit),mcp__plugin_nativeanimation_nativeanimation__*' \
      > "$run_root/agent.log" 2>&1 || agent_status=$?
    ;;
  cursor)
    "$agent_binary" --help > "$run_root/cursor-help.txt" 2>&1
    python3 - "$run_root/cursor-help.txt" <<'PY'
import pathlib, sys
if '--plugin-dir' not in pathlib.Path(sys.argv[1]).read_text():
    raise SystemExit('Upgrade Cursor CLI: --plugin-dir is required')
PY
    timeout "${EVAL_TIMEOUT_SECONDS:-900}" "$agent_binary" -p "$prompt" \
      --workspace "$app_root" --plugin-dir "$plugin_root" \
      --output-format stream-json --approve-mcps --trust --force \
      > "$run_root/agent.log" 2>&1 || agent_status=$?
    ;;
  codex)
    mkdir -p .agents/plugins plugins
    cp -R "$plugin_root" plugins/nativeanimation
    cat > .agents/plugins/marketplace.json <<'JSON'
{
  "name": "nativeanimation-eval",
  "plugins": [{
    "name": "nativeanimation",
    "source": { "source": "local", "path": "./plugins/nativeanimation" },
    "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" },
    "category": "Developer Tools"
  }]
}
JSON
    # This mode tests MCP + skill integration, not plugin marketplace loading.
    mcp_config_args=(
      -c 'mcp_servers.nativeanimation.command="npx"'
      -c 'mcp_servers.nativeanimation.args=["-y","nativeanimation@latest","mcp"]'
      -c 'mcp_servers.nativeanimation.enabled=true'
      -c 'mcp_servers.nativeanimation.required=true'
      -c 'mcp_servers.nativeanimation.startup_timeout_sec=60'
      # Codex does not pass the caller's environment to MCP servers: forward the eval token (signed_in=false otherwise).
      -c 'mcp_servers.nativeanimation.env_vars=["NATIVEANIMATION_TOKEN"]'
      -c 'plugins."nativeanimation@nativeanimation-eval".enabled=false'
    )
    # npx must not write to a read-only user cache in the evaluation host.
    mkdir -p "$run_root/npm-cache"
    mcp_cache_config=$(python3 - "$run_root/npm-cache" <<'PYCACHE'
import json, sys
print('mcp_servers.nativeanimation.env.npm_config_cache=' + json.dumps(sys.argv[1]))
PYCACHE
)
    mcp_config_args+=(-c "$mcp_cache_config")
    if [[ ${EVAL_ACCESS:-existing} == free ]]; then
      mcp_env_config=$(python3 - "$run_root/mcp-config" <<'PYENV'
import json, sys
print('mcp_servers.nativeanimation.env.XDG_CONFIG_HOME=' + json.dumps(sys.argv[1]))
PYENV
)
      mcp_config_args+=(-c "$mcp_env_config")
    fi
    prompt+=$'\nRead the bundled skill at '
    prompt+="$plugin_root/skills/react-native-animations/SKILL.md."
    printf '%s\n' "$prompt" > "$run_root/prompt.txt"
    stage=mcp-preflight
    timeout 120 "$agent_binary" \
      -a never -s workspace-write exec --ignore-user-config --ephemeral --json \
      "${mcp_config_args[@]}" \
      -c 'sandbox_workspace_write.network_access=true' \
      'Call the nativeanimation MCP search_pieces tool once with query "toggle". Use only the native MCP tool; no shell, web, files, custom clients, login, or purchases. If unavailable, say unavailable and stop.' \
      < /dev/null > "$run_root/mcp-preflight.jsonl" 2> "$run_root/mcp-preflight.log"
    python3 - "$run_root/mcp-preflight.jsonl" <<'PYCHECK'
import json, sys
events = [json.loads(line) for line in open(sys.argv[1]) if line.strip()]
calls = []
for event in events:
    item = event.get('item', {})
    if event.get('type') == 'item.completed' and item.get('type') == 'mcp_tool_call':
        result = item.get('result') or {}
        if (item.get('server') == 'nativeanimation'
                and item.get('tool') == 'search_pieces'
                and item.get('arguments') == {'query': 'toggle'}
                and item.get('status') == 'completed'
                and not item.get('error') and not result.get('isError')
                and result.get('content')):
            calls.append(item)
if (len(calls) != 1
        or not any(event.get('type') == 'turn.completed' for event in events)
        or any(event.get('type') in ('error', 'turn.failed')
               or event.get('item', {}).get('type') == 'command_execution' for event in events)):
    raise SystemExit('MCP preflight failed: a successful native search_pieces call is required; see mcp-preflight.jsonl and mcp-preflight.log')
PYCHECK
    stage=agent
    timeout "${EVAL_TIMEOUT_SECONDS:-900}" "$agent_binary" \
      -a never -s workspace-write exec --ignore-user-config --ephemeral --json \
      "${mcp_config_args[@]}" \
      -c 'sandbox_workspace_write.network_access=true' "$prompt" \
      > "$run_root/agent.log" 2>&1 || agent_status=$?
    ;;
esac
# Always retain the final type check, even if the agent failed or timed out.
stage=typecheck
typecheck_status=0
timeout 120 npx --no-install tsc --noEmit > "$run_root/tsc.log" 2>&1 || typecheck_status=$?
if (( agent_status != 0 )); then stage=agent; exit "$agent_status"; fi
if (( typecheck_status != 0 )); then exit "$typecheck_status"; fi
stage=integration-smoke
python3 "$kit_root/eval/check-integration.py" "$app_root" "$run_root/App.before.tsx" \
  > "$run_root/integration.log" 2>&1
ok=1
stage=complete
