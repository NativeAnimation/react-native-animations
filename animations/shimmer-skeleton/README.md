# Shimmer Skeleton

A synchronized diagonal loading shimmer with configurable placeholder content, base color, highlight color, and duration.

## How it works

1. Pass a layout of `SkeletonBlock` shapes through `placeholder`.
2. One UI-thread transform sweeps a wide gradient across the clipped surface.
3. Set `loading={false}` to reveal the supplied content.

## Install

`npx expo install expo-linear-gradient react-native-reanimated react-native-worklets`

## Usage

```tsx
<ShimmerSkeleton loading={loading} placeholder={<SkeletonBlock height={80} />}>
  <LoadedContent />
</ShimmerSkeleton>
```

## Props

| Prop                 | Type                   | Default                    | Description                                                                                                                                  |
| -------------------- | ---------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `testID`             | `string`               | `undefined`                | Root ID; `${testID}-placeholder` and `${testID}-content` identify loading and revealed layers. Suffix IDs are omitted when testID is absent. |
| `loading`            | `boolean`              | `true`                     | Shows placeholders while true.                                                                                                               |
| `children`           | `React.ReactNode`      | `undefined`                | Content revealed after loading.                                                                                                              |
| `placeholder`        | `React.ReactNode`      | `undefined`                | Placeholder layout that receives the shared shimmer.                                                                                         |
| `duration`           | `number`               | `1400`                     | Sweep cycle duration.                                                                                                                        |
| `color`              | `string`               | `'#E7E8EE'`                | Surface color.                                                                                                                               |
| `highlightColor`     | `string`               | `'rgba(255,255,255,0.88)'` | Highlight color.                                                                                                                             |
| `style`              | `StyleProp<ViewStyle>` | `undefined`                | Container style.                                                                                                                             |
| `accessibilityLabel` | `string`               | `'Loading content'`        | Accessible loading label.                                                                                                                    |

`loading`, `placeholder`, `duration`, `color`, `highlightColor`, `style`, and `accessibilityLabel` control the group. `SkeletonBlock` accepts `width`, `height`, `variant`, and `color`.

## Compatibility

Expo SDK 58, React Native 0.88, Reanimated 4.7. Supports iOS, Android, and web.

## Accessibility

Reports busy state and uses a static highlight when reduced motion is enabled.
