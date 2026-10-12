# Bump Badge

A springy notification counter with a compact bell icon.

## How it works

1. Update its controlled `value` or call `setCount` on the ref.
2. The badge pops and the bell gives a small physical shake on increments.
3. Counts above 99 are compacted to `99+`.

## Install

`npx expo install react-native-reanimated`

## Usage

```tsx
<BumpBadge defaultValue={3} onChange={setCount} />
```

## Props

`value`, `defaultValue`, `onChange`, `color`, `size`, `accessibilityLabel`, and `style` customize the badge.

## Compatibility

Expo SDK 57, React Native 0.86, Reanimated 4.5; iOS, Android, and web unverified.

## Accessibility

Uses a labeled button and removes the spring motion when reduced motion is enabled.
