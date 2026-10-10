# Free React Native animations for Expo

Production-ready animation components for **React Native and Expo**, built with **Reanimated 4**, **Gesture Handler**
and **Skia**. Copy a folder into your project and own the code: no runtime dependency on this repo.

These are the free pieces of [Native Animation](https://nativeanimation.com), a catalog of premium React Native
animations: onboarding screens, carousels, paywalls, loaders, liquid glass tab bars and micro-interactions.

| Animation | Preview | What it is |
|---|---|---|
| [Shimmer Skeleton](animations/shimmer-skeleton) | [▶ Live preview](https://nativeanimation.com/animations/shimmer-skeleton) | A React Native **skeleton loader** with a synchronized diagonal shimmer for loading placeholders. |
| [Copy Confirm Button](animations/copy-confirm-button) | [▶ Live preview](https://nativeanimation.com/animations/copy-confirm-button) | An **animated button** that morphs a copy icon into a check with a success halo and a confirmation bubble. |

## Install

Each folder is self-contained. Two ways to add one:

```sh
# With the CLI (free account; copies the source into src/components/<id>/)
npx nativeanimation login
npx nativeanimation add shimmer-skeleton

# Or by hand: copy animations/<id>/ into your project and install its dependencies
npx expo install react-native-reanimated expo-linear-gradient
```

Dependencies for each piece are listed in its `piece.json` and README.

### Or ask your AI coding agent

The CLI ships an [MCP](https://modelcontextprotocol.io) server, so Claude Code, Codex, Cursor or VS Code can search the
catalog, read each animation's props and add it to your project for you:

```sh
npx nativeanimation login
claude mcp add nativeanimation -- npx -y nativeanimation@latest mcp   # Claude Code
codex mcp add nativeanimation -- npx -y nativeanimation@latest mcp    # Codex
```

Then ask: *"Add the shimmer skeleton to the feed while it loads."* Setup for other clients:
[CLI docs](https://www.npmjs.com/package/nativeanimation#use-with-ai-coding-agents-mcp).

## Compatibility

Tested with **Expo SDK 57**, React Native 0.86, Reanimated 4.5 and react-native-worklets 0.10. Every animation runs on
the UI thread from a single shared value, so gestures stay interruptible and there is no React state per frame.

## More animations

The full catalog lives at [nativeanimation.com/animations](https://nativeanimation.com/animations): OTP code input,
wheel picker, confetti, swipe to delete, liquid glass tab bar, animated bar chart, loaders, 3D carousels and more.
One piece costs $9, or get [every current and future animation](https://nativeanimation.com/pricing) with a
one-time payment.

## License

Free to use in unlimited personal and commercial apps under the
[Native Animation License](https://nativeanimation.com/license). Please don't republish the source as a library,
template or UI kit.
