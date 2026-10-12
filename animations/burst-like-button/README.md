# Burst Like Button

A tactile Skia heart with a spring explosion, physical particles, a rolling count, and a hold-to-charge super-like.

## How it works

1. Pressing immediately compresses the Skia heart to `0.8`, then a spring sends it through a `1.25` celebration peak.
2. One burst progress value drives an expanding wave and 16 particles with launch velocity, gravity, spin, and fade.
3. Alternating dots and miniature Skia hearts reuse a close coral gradient palette for a cohesive explosion.
4. The count rolls inside a clipped, intrinsically measured window in the same state transition.
5. Holding fills a soft glow for 720 ms, then releases a larger super-like burst without blocking normal taps.

## Install

```bash
npx expo install @shopify/react-native-skia expo-linear-gradient react-native-reanimated react-native-worklets
```

## Usage

```tsx
<BurstLikeButton count={128} onChange={(liked) => saveLike(liked)} />

<BurstLikeButton
  size={36}
  color="#7C5CFC"
  particleColors={['#7C5CFC', '#22C55E', '#FACC15']}
  colorScheme="dark"
  superLikeDuration={800}
  showCount={false}
/>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `liked` | `boolean` | — | Controlled like state. |
| `defaultLiked` | `boolean` | `false` | Initial uncontrolled state. |
| `onChange` | `(liked: boolean) => void` | — | Receives state requests. |
| `size` | `number` | `28` | Heart size. |
| `color` | `string` | `'#FF3F68'` | Active heart and wave color. |
| `particleColors` | `readonly string[]` | Coral gradient palette | Dot and mini-heart palette. |
| `burstDuration` | `number` | `680` | Wave and particle duration in milliseconds. |
| `superLikeDuration` | `number` | `720` | Hold duration before the super-like activates. |
| `count` | `number` | — | Base count before the local like. |
| `showCount` | `boolean` | When count exists | Shows the rolling count. |
| `inactiveColor` | `string` | `'#686573'` | Inactive outline color. |
| `accessibilityLabel` | `string` | `'Like this post'` | Screen-reader label. |
| `fontFamily` | `string` | System font | Count font. |
| `colorScheme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Surface color treatment. |
| `surfaceColor` | `string` | Scheme-aware | Top surface color. |
| `surfaceEndColor` | `string` | Scheme-aware | Bottom surface color. |
| `style` | `StyleProp<ViewStyle>` | — | Outer style. |
| `testID` | `string` | — | Test identifier. |

## Compatibility

Expo SDK 57, React Native 0.86, Reanimated 4.5, and Skia 2.6. iOS and Android are supported but device-unverified; web is verified by the project gate. Works in Expo Go.

## Accessibility

The control exposes a labeled button with checked state and describes the hold gesture. A regular tap remains the complete alternative to holding. Reduced Motion uses a short count fade, applies the heart state immediately, and suppresses the wave, charge glow, and particles.

## Why this one

Most burst buttons stop at a scale bounce and a ring of identical dots. This version combines a drawn Skia heart, mixed-shape particles with individual physics, an intrinsically sized number roller, and a discoverable super-like charge state while keeping the interaction interruptible and copy-ready.
