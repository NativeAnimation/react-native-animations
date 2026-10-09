# Shimmer Skeleton

A synchronized diagonal sheen for loading placeholders.

## How it works

1. Pass a layout of `SkeletonBlock` shapes through `placeholder`.
2. One UI-thread transform sweeps a wide gradient across the clipped surface.
3. Set `loading={false}` to reveal the supplied content.

## Install

`npx expo install expo-linear-gradient react-native-reanimated`

## Usage

```tsx
<ShimmerSkeleton
  loading={loading}
  placeholder={<SkeletonBlock height={80} />}
>
  <LoadedContent />
</ShimmerSkeleton>
```

## Props

`loading`, `placeholder`, `duration`, `color`, `highlightColor`, `style`, and `accessibilityLabel` control the group. `SkeletonBlock` accepts `width`, `height`, `variant`, and `color`.

## Compatibility

Expo SDK 57, React Native 0.86, Reanimated 4.5; iOS, Android, and web unverified.

## Accessibility

Reports busy state and uses a static highlight when reduced motion is enabled.
