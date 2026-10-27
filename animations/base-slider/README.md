# Base Slider

A value or range slider with spring-following thumbs and configurable bounds, step, and theme.

## How it works

1. The track measures its own width so it works inside cards and narrow forms.
2. Pan and tap are combined exclusively, and positions snap to `step` values.
3. Thumbs follow with the slider spring and stretch slightly while pressed.
4. Change callbacks fire once per step; commit fires when the gesture settles.
5. Range thumbs clamp against one another and expose adjustable semantics.

## Install

```bash
npx nativeanimation add base-slider
```

```bash
npx expo install react-native-gesture-handler react-native-reanimated react-native-worklets
```

## Usage

```tsx
<BaseSlider value={volume} onValueChange={setVolume} accessibilityLabel="Volume" />
```

```tsx
<BaseSlider value={range} min={0} max={100} step={5} onValueChange={setRange} onValueCommit={saveRange} />
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `number \| [number, number]` | — | Controlled value or range. |
| `defaultValue` | `number \| [number, number]` | 0 | Initial uncontrolled value. |
| `onValueChange` | `(value) => void` | — | Called when a snapped step changes. |
| `onValueCommit` | `(value) => void` | — | Called when a gesture ends. |
| `min` | `number` | 0 | Minimum value. |
| `max` | `number` | 100 | Maximum value. |
| `step` | `number` | 1 | Increment between values. |
| `disabled` | `boolean` | false | Disables gestures and dims the control. |
| `accessibilityLabel` | `string` | Slider | Accessible name. |
| `theme` | `BaseTheme` | provider | Overrides the family theme. |
| `testID` | `string` | — | Stable root and thumb identifiers. |

## Compatibility

Expo SDK 58 · React Native 0.88 · Reanimated 4.7 · react-native-worklets 0.13. Runs on iOS, Android, and web in Expo Go or a development build.

## Accessibility

The control exposes an adjustable role with increment and decrement actions, min/max/current values, and a 44pt interaction area. Reduced motion removes spring settling while retaining step snapping.
