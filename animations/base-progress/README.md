# Base Progress

A determinate or indeterminate progress bar with animated updates and configurable value, height, and theme.

## How it works

1. The track uses primary at 20% opacity and a full corner radius.
2. Values clamp to 0–100 and animate with the 300/35 progress spring, mass 1.
3. A small relative energy threshold lets the bar settle precisely in Reanimated 4.
4. Indeterminate mode moves a 40% segment across the measured track in a 1.4 second in-out loop.

## Install

```bash
npx nativeanimation add base-progress
```

The CLI also copies `base-theme`. Dependencies, if you copy by hand:

```bash
npx expo install react-native-reanimated react-native-worklets
```

## Usage

```tsx
import { BaseProgress } from './base-progress';

<BaseProgress value={uploadPercent} accessibilityLabel="File upload" />
```

```tsx
<BaseProgress value={75} height={6} accessibilityLabel="Workspace setup" />
<BaseProgress indeterminate accessibilityLabel="Preparing export" />
```

The component measures its own width, so it works within cards, forms, and narrow containers. It applies no safe-area padding. Supply a label describing the task.

Wrap your app in `BaseThemeProvider` (from `base-theme`) to choose light/dark and an accent; without it, pieces use the light neutral theme. The `theme` prop overrides the provider. Load the font families declared in your theme once in the host app.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `number` | 0 | Progress from 0 to 100, clamped to that range. |
| `indeterminate` | `boolean` | false | Shows a looping segment instead of a percentage. |
| `height` | `number` | 8 | Track height in pt. |
| `accessibilityLabel` | `string` | — | Accessible description of the task. |
| `theme` | `BaseTheme` | provider | Overrides the shared family theme. |
| `style` | `StyleProp<ViewStyle>` | — | Container style. |
| `testID` | `string` | — | Stable test identifier. |

## Compatibility

Expo SDK 57 · React Native 0.86 · Reanimated 4.5 · react-native-worklets 0.10. Runs on iOS, Android and web, in Expo Go and development builds. Part of **Native Animation Base**, a free family that shares one theme.

## Accessibility

Exposes a progressbar role with min, max, and current values. Indeterminate mode exposes a busy state instead of a fabricated percentage. Reduce Motion updates determinate progress immediately and holds the indeterminate segment still.
