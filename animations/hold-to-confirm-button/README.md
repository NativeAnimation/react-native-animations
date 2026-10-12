# Hold to Confirm Button

A deliberate confirmation control with a dimensional progress surface, tactile press response, and a luminous success finish.

## How it works

1. A long-press gesture begins a linear shared-value animation on contact.
2. Releasing before the duration springs progress back to zero.
3. Completion swaps the label, draws a proportioned round-cap check from a fixed vertex, and sends a short glow and light sweep across the surface.
4. The bar scales from its left edge; the ring reveals evenly spaced perimeter segments.
5. Scheme-aware close-tone gradients, a light edge, and layered shadow give both variants material depth.

## Install

```bash
npx expo install expo-linear-gradient react-native-gesture-handler react-native-reanimated react-native-worklets
```

## Usage

```tsx
<HoldToConfirmButton onConfirm={() => submit()} />

<HoldToConfirmButton
  variant="ring"
  holdMs={900}
  height={80}
  progressColor="#5B4CF0"
  colorScheme="light"
/>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `confirmed` | `boolean` | — | Controlled completion state. |
| `defaultConfirmed` | `boolean` | `false` | Initial uncontrolled state. |
| `onChange` | `(confirmed: boolean) => void` | — | Receives state changes. |
| `onConfirm` | `() => void` | — | Runs when confirmation completes. |
| `holdMs` | `number` | `1200` | Required hold duration. |
| `variant` | `'bar' \| 'ring'` | `'bar'` | Progress presentation. |
| `label` | `string` | `'Hold to confirm'` | Idle text. |
| `doneLabel` | `string` | `'Confirmed'` | Completed text. |
| `width` | `number` | `240` | Bar width. |
| `height` | `number` | `56` | Height or ring diameter. |
| `backgroundColor` | `string` | Scheme-aware | Base color. |
| `backgroundEndColor` | `string` | Scheme-aware | End color for the material gradient. |
| `progressColor` | `string` | `'#6D5DFB'` | Progress color. |
| `textColor` | `string` | `'#FFFFFF'` | Content color. |
| `fontFamily` | `string` | System font | Label font. |
| `colorScheme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Surface color treatment. |
| `accessibilityLabel` | `string` | Uses `label` | Screen-reader label. |
| `style` | `StyleProp<ViewStyle>` | — | Outer style. |
| `testID` | `string` | — | Test identifier. |

## Compatibility

Expo SDK 57, React Native 0.86, Reanimated 4.5, Gesture Handler 2.32, and Worklets 0.10. iOS and Android are supported but device-unverified; web is verified by the project gate. Works in Expo Go.

## Accessibility

The control is a labeled button. A screen-reader activation confirms immediately, avoiding a gesture that cannot be reliably held. Reduced Motion keeps the timed affordance but removes the spring and check travel.
