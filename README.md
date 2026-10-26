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
| [Hold to Confirm Button](animations/hold-to-confirm-button) | <a href="https://nativeanimation.com/animations/hold-to-confirm-button"><img src="media/hold-to-confirm-button.gif" width="120" alt="hold to confirm button React Native animation preview"></a> | A **hold to confirm button** for destructive or payment actions: a dimensional progress fill and a luminous success finish. |
| [Sliding Segmented Control](animations/sliding-segmented-control) | <a href="https://nativeanimation.com/animations/sliding-segmented-control"><img src="media/sliding-segmented-control.gif" width="120" alt="sliding segmented control React Native animation preview"></a> | An **animated segmented control** (tabs) with a spring indicator, layered light and a quick selection sweep. |
| [Floating Label Input](animations/floating-label-input) | <a href="https://nativeanimation.com/animations/floating-label-input"><img src="media/floating-label-input.gif" width="120" alt="floating label input React Native animation preview"></a> | A React Native **floating label text input** with a spring label, focus light, validation feedback and drawn status icons. |
| [Quantity Stepper](animations/quantity-stepper) | <a href="https://nativeanimation.com/animations/quantity-stepper"><img src="media/quantity-stepper.gif" width="120" alt="quantity stepper React Native animation preview"></a> | An **Add to cart button** that expands into a rolling **quantity stepper** and collapses again at zero. |
| [Bump Badge](animations/bump-badge) | <a href="https://nativeanimation.com/animations/bump-badge"><img src="media/bump-badge.gif" width="120" alt="bump badge React Native animation preview"></a> | An animated **notification badge** counter that bumps with a spring when the count changes. |
| [Auto Height Accordion](animations/auto-height-accordion) | <a href="https://nativeanimation.com/animations/auto-height-accordion"><img src="media/auto-height-accordion.gif" width="120" alt="auto height accordion React Native animation preview"></a> | An **animated accordion** (FAQ / collapsible) that measures and animates to any content height. |

## Install

Each folder is self-contained. Two ways to add one:

```sh
# With the CLI (free account; copies the source into src/components/<id>/)
npx nativeanimation login
npx nativeanimation add shimmer-skeleton

# Or by hand: copy animations/<id>/ into your project and install its dependencies
npx expo install react-native-reanimated react-native-worklets expo-linear-gradient
```

Dependencies for each piece are listed in its `piece.json` and README.

## Use with your AI coding agent

The Native Animation plugin bundles one shared skill and the MCP server. Your agent can search, compare dependencies,
read real props, and add an animation to the requested Expo screen.

**Claude Code** (2.1.275 or later), inside a session:

```text
/plugin install nativeanimation --marketplace NativeAnimation/react-native-animations
```

You can also register the repository with `/plugin marketplace add NativeAnimation/react-native-animations`, then
install `nativeanimation@nativeanimation` from the plugin panel.

**Codex**, in your terminal:

```sh
codex plugin marketplace add NativeAnimation/react-native-animations && codex plugin add nativeanimation@nativeanimation
```

**Cursor**, from a checkout of this repository:

```sh
bash agent-kit/install-cursor.sh
```

Reload Cursor and confirm the local plugin in Customize; local plugin imports must be enabled. Directory listings
require review. [Package formats and current limitations](agent-kit/FORMATS.md) include the OpenAI submission draft.
For an MCP-only connection, [Add to Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=nativeanimation&config=eyJuYXRpdmVhbmltYXRpb24iOnsiY29tbWFuZCI6Im5weCIsImFyZ3MiOlsiLXkiLCJuYXRpdmVhbmltYXRpb25AbGF0ZXN0IiwibWNwIl19fQ%3D%3D);
that link does not install the skill.

Ask: *"Add a skeleton loader to the feed while it loads."* Public discovery needs no account. To add through MCP,
run `npx nativeanimation login` yourself; your agent can also use the free source folders without a session.
Paid pieces cost **$9 each or $299 once for All-access (launch price)**.

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
