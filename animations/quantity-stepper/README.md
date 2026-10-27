# Quantity Stepper

An add button that expands into a rolling quantity stepper, with configurable label, width, accent color, and font.

## How it works

1. A shared progress value springs the control width and crossfades its two modes.
2. Value changes commit outgoing and incoming numbers together before the roll begins.
3. Press-and-hold starts after 420 ms and repeats every 110 ms.
4. The first expansion triggers a short accent halo and clipped light sweep across the surface.
5. Controlled and uncontrolled modes clamp every request to the configured range.

## Install

```bash
npx expo install expo-linear-gradient react-native-reanimated react-native-worklets
```

## Usage

```tsx
import QuantityStepper from './QuantityStepper';

<QuantityStepper onChange={(quantity) => updateCart(quantity)} />;
<QuantityStepper
  defaultValue={2}
  min={0}
  max={12}
  accentColor="#137D68"
  colorScheme="dark"
/>;
```

## Props

| Prop                          | Type                          | Default               | Description                                            |
| ----------------------------- | ----------------------------- | --------------------- | ------------------------------------------------------ |
| `value`                       | `number`                      | `undefined`           | Controlled quantity.                                   |
| `defaultValue`                | `number`                      | `0`                   | Initial uncontrolled quantity.                         |
| `onChange`                    | `(value: number) => void`     | `undefined`           | Receives clamped quantity requests.                    |
| `min`                         | `number`                      | `0`                   | Minimum quantity; the control collapses at this value. |
| `max`                         | `number`                      | `99`                  | Maximum quantity.                                      |
| `accentColor`                 | `string`                      | `'#6757E8'`           | Main control color.                                    |
| `textColor`                   | `string`                      | `'#FFFFFF'`           | Expanded text color.                                   |
| `addLabel`                    | `string`                      | `'Add'`               | Collapsed label.                                       |
| `width`                       | `number`                      | `142`                 | Expanded width in points.                              |
| `collapsedWidth`              | `number`                      | `88`                  | Collapsed width in points.                             |
| `height`                      | `number`                      | `46`                  | Control height in points.                              |
| `duration`                    | `number`                      | `240`                 | Expand/collapse duration in milliseconds.              |
| `fontFamily`                  | `string`                      | System font           | Label and number typeface.                             |
| `colorScheme`                 | `'light' \| 'dark' \| 'auto'` | `'auto'`              | Surface appearance; auto follows the system.           |
| `repeatOnHold`                | `boolean`                     | `true`                | Enable press-and-hold repeat.                          |
| `addAccessibilityLabel`       | `string`                      | `'Add item'`          | Screen-reader name for Add.                            |
| `incrementAccessibilityLabel` | `string`                      | `'Increase quantity'` | Screen-reader name for plus.                           |
| `decrementAccessibilityLabel` | `string`                      | `'Decrease quantity'` | Screen-reader name for minus.                          |
| `style`                       | `StyleProp<ViewStyle>`        | `undefined`           | Outer control style.                                   |
| `testID`                      | `string`                      | `undefined`           | Outer control test identifier.                         |

The ref exposes `increment()`, `decrement()`, `setValue(value)`, and `reset()`.

## Compatibility

- Expo SDK 58, React Native 0.88, and Reanimated 4.7
- iOS, Android, and web supported.
- Works in Expo Go

## Accessibility

Each action is a labeled button and plus/minus controls announce disabled bounds. Reduced Motion removes expansion, scale, and rolling travel while retaining a short number crossfade.
