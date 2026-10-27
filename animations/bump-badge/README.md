# Bump Badge

A notification counter with a spring-driven bump and configurable count, badge color, size, and font.

## How it works

1. Update its controlled `value` or call `setCount` on the ref.
2. The badge pops and the bell gives a small physical shake on increments.
3. Counts above 99 are compacted to `99+`.

## Install

`npx expo install react-native-reanimated react-native-worklets`

## Usage

```tsx
<BumpBadge defaultValue={3} onChange={setCount} />
```

## Props

| Prop                 | Type                      | Default           | Description                                                                                                                                                            |
| -------------------- | ------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fontFamily`         | `string`                  | `undefined`       | Font family for component text. Omit to preserve the existing font.                                                                                                    |
| `testID`             | `string`                  | `undefined`       | Root ID; `${testID}-increment` identifies the increment button and `${testID}-count` identifies the visible count badge. Suffix IDs are omitted when testID is absent. |
| `value`              | `number`                  | `undefined`       | Controlled count.                                                                                                                                                      |
| `defaultValue`       | `number`                  | `3`               | Initial uncontrolled count.                                                                                                                                            |
| `onChange`           | `(count: number) => void` | `undefined`       | Called after a count request.                                                                                                                                          |
| `color`              | `string`                  | `'#6D5DFB'`       | Accent color.                                                                                                                                                          |
| `size`               | `number`                  | `42`              | Icon size.                                                                                                                                                             |
| `accessibilityLabel` | `string`                  | `'Notifications'` | Accessible label.                                                                                                                                                      |
| `style`              | `StyleProp<ViewStyle>`    | `undefined`       | Container style.                                                                                                                                                       |

`value`, `defaultValue`, `onChange`, `color`, `size`, `accessibilityLabel`, and `style` customize the badge.

## Compatibility

Expo SDK 58, React Native 0.88, Reanimated 4.7. Supports iOS, Android, and web.

## Accessibility

Uses a labeled button and removes the spring motion when reduced motion is enabled.

## Customization notes

Movement follows gestures, scroll position, or interruptible spring physics. A global duration is not exposed; reduced-motion fades retain their short fixed timing.
