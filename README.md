# Free React Native animations for Expo

Production-ready animation components for **React Native and Expo**, built with **Reanimated 4**, **Gesture Handler**
and **Skia**. Copy a folder into your project and own the code: no runtime dependency on this repo.

These are the free pieces of [Native Animation](https://nativeanimation.com), a catalog of premium React Native
animations: onboarding screens, carousels, paywalls, loaders, liquid glass tab bars and micro-interactions.

| Animation | Preview | What it is |
|---|---|---|
| [Shimmer Skeleton](animations/shimmer-skeleton) | <a href="https://nativeanimation.com/animations/shimmer-skeleton"><img src="media/shimmer-skeleton.gif" width="120" alt="shimmer skeleton React Native animation preview"></a> | A React Native **skeleton loader** with a synchronized diagonal shimmer for loading placeholders. |
| [Copy Confirm Button](animations/copy-confirm-button) | <a href="https://nativeanimation.com/animations/copy-confirm-button"><img src="media/copy-confirm-button.gif" width="120" alt="copy confirm button React Native animation preview"></a> | An **animated button** that morphs a copy icon into a check with a success halo and a confirmation bubble. |
| [Drawn Checkbox](animations/drawn-checkbox) | <a href="https://nativeanimation.com/animations/drawn-checkbox"><img src="media/drawn-checkbox.gif" width="120" alt="drawn checkbox React Native animation preview"></a> | An **animated checkbox** with a spring fill, a hand-drawn check mark and a label strike-through, built with Skia. |
| [Spring Toggle](animations/spring-toggle) | <a href="https://nativeanimation.com/animations/spring-toggle"><img src="media/spring-toggle.gif" width="120" alt="spring toggle React Native animation preview"></a> | An **animated toggle switch** you can drag: the thumb stretches, glows and settles with a spring. |
| [Burst Like Button](animations/burst-like-button) | <a href="https://nativeanimation.com/animations/burst-like-button"><img src="media/burst-like-button.gif" width="120" alt="burst like button React Native animation preview"></a> | An **animated like button** in Skia: a spring burst, physical particles, a rolling count and a hold-to-charge super-like. |
| [Toast Stack](animations/toast-stack) | <a href="https://nativeanimation.com/animations/toast-stack"><img src="media/toast-stack.gif" width="120" alt="toast stack React Native animation preview"></a> | A React Native **toast notification** stack that fans open with depth and dismisses with physical swipes. |

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

Built for **Expo SDK 57**, React Native 0.86, Reanimated 4.5 and react-native-worklets 0.10. Every animation runs on
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
