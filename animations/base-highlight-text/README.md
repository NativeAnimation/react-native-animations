# Base Highlight Text

A left-to-right highlight sweep behind each wrapped text line, with configurable text, highlight color, duration, delay, trigger, typography, and theme.

## How it works

1. Native text reports line rectangles through `onTextLayout`. A web-only range observer measures the actual line wrapping and remeasures when fonts or width change.
2. Each measured line gets a separate rounded background, painted behind the text without clipping descenders.
3. One shared value expands every line's background from 0% to 100% with `Easing.inOut(Easing.ease)` over `duration` milliseconds.
4. Set `trigger` to `false` to reset, then `true` when your viewport observer reports that the text is visible. Viewport detection belongs to the host app.

For a fuller editorial treatment, explore `marker-highlight-quote`.

## Install

```bash
npx nativeanimation add base-highlight-text
```

The CLI also copies `base-theme`. Dependencies, if you copy by hand:

```bash
npx expo install react-native-reanimated react-native-worklets
```

Free forever. MIT.

## Usage

```tsx
import { BaseHighlightText } from './base-highlight-text';

<BaseHighlightText
  text="Give your best ideas room to grow."
  duration={2000}
  trigger={isVisible}
  style={{ fontSize: 24, lineHeight: 34 }}
/>
```

Wrap your app in `BaseThemeProvider` (from `base-theme`) to choose light/dark and an accent; without it, pieces use the light neutral theme. The `theme` prop overrides the provider. `style` customizes the text. Set layout spacing on the parent; use this as a standalone text block rather than nesting it inside another `Text`.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `text` | `string` | — | Text to highlight. |
| `highlightColor` | `string` | primary at 18% light / 30% dark | Background color behind the text. |
| `duration` | `number` | `2000` | Sweep duration in milliseconds. |
| `delay` | `number` | `0` | Delay before the sweep in milliseconds. |
| `trigger` | `boolean` | `true` | Starts on true, resets on false. |
| `style` | `StyleProp<TextStyle>` | — | Font, color, line height, and alignment. |
| `theme` | `BaseTheme` | provider | Theme override. |
| `testID` | `string` | — | Identifier on the container. |

## Compatibility

Expo SDK 58 · React Native 0.88 · Reanimated 4.7 · react-native-worklets 0.13. Targets iOS, Android, and web, in Expo Go and development builds. Part of **Native Animation Base**, a free family sharing one theme. Web measurement lives in a `.web.ts` file and never enters the native bundle. No safe-area padding is applied. All lines sweep together; the component does not scroll or observe the viewport itself.

## Accessibility

The full text remains selectable by assistive technology through one accessible text element; backgrounds are decorative and ignore touches. Reduce Motion paints the complete highlight immediately, without a sweep or delay. Keep custom foreground and highlight colors at an accessible contrast ratio.
