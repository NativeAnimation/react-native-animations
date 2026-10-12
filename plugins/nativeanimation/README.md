# Native Animation agent plugin

One shared skill helps Claude Code, Cursor, and Codex choose and integrate Native Animation components in an Expo app. The bundled MCP launches `npx -y nativeanimation@latest mcp` locally.

In Claude Code 2.1.275 or later:

```text
/plugin install nativeanimation --marketplace NativeAnimation/react-native-animations
```

Ask: “Add a skeleton loader to the feed while it loads.” Public discovery needs no account. Adding through MCP requires `npx nativeanimation login`, run by the user; the agent can copy a suitable free component from the public repository instead. Pricing is $9 per piece or $149 for the catalog.

Install commands and the Cursor MCP link are in the [repository README](https://github.com/NativeAnimation/react-native-animations#use-with-your-ai-coding-agent). Source layouts and submission limitations are in [FORMATS.md](https://github.com/NativeAnimation/react-native-animations/blob/main/agent-kit/FORMATS.md). The OpenAI ZIP is a local Codex package and submission draft; the public directory requires a remote HTTPS MCP endpoint.
