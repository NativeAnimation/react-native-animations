# Native Animation agent plugin

One shared skill helps Claude Code, Cursor, and Codex choose and integrate Native Animation components in an Expo app. The bundled MCP launches `npx -y nativeanimation@latest mcp` locally.

In Claude Code 2.1.275 or later:

```text
/plugin install nativeanimation --marketplace NativeAnimation/react-native-animations
```

Ask: “Add a skeleton loader to the feed while it loads.” Public discovery needs no account. Adding through MCP requires `npx nativeanimation login`, run by the user; the agent can copy a suitable free component from the public repository instead. Pricing is $9 per piece or $149 for the catalog.

Install commands and the Cursor MCP link are in the [repository README](https://github.com/NativeAnimation/react-native-animations#use-with-your-ai-coding-agent). Source layouts and submission limitations are in [FORMATS.md](https://github.com/NativeAnimation/react-native-animations/blob/main/agent-kit/FORMATS.md). The OpenAI ZIP is a local Codex package and submission draft; the public directory requires a remote HTTPS MCP endpoint.

### Codex startup troubleshooting

`codex mcp list` checks configuration; it does not prove the server starts. Ask Codex to call `search_pieces` with query `toggle` and check that it uses a native MCP tool. The evaluation runner tests MCP + the bundled skill, rather than marketplace installation, and stops before the task if this call fails.

If tools are missing, inspect the server startup error. A cold `npx` cache can take longer than Codex's optional-server startup grace period. For an explicitly registered server, these Codex settings wait for initialization and report startup failures:

```toml
[mcp_servers.nativeanimation]
command = "npx"
args = ["-y", "nativeanimation@latest", "mcp"]
required = true
startup_timeout_sec = 60
```

If npm reports `EROFS` or `EACCES`, add `env = { npm_config_cache = "/absolute/writable/npm-cache" }` to that server table, using a directory your host can write. Increasing the timeout cannot fix a read-only cache. These settings are Codex-specific; the shared `.mcp.json` keeps the portable command and arguments. See [Codex MCP configuration](https://developers.openai.com/codex/mcp). A successful public search with `signed_in=false` means the tools are connected but the server has no Native Animation session; it is a separate access issue.
