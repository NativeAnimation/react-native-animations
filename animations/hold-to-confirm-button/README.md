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
| `confirmed` | `boolean` | `undefined` | Controlled completion state. |
| `defaultConfirmed` | `boolean` | `false` | Initial completion state when uncontrolled. |
| `onChange` | `(confirmed: boolean) => void` | `undefined` | Called when the completion state changes. |
| `onConfirm` | `() => void` | `undefined` | Called once a hold completes. |
| `holdMs` | `number` | `1200` | Hold duration in milliseconds. |
| `variant` | `'bar' \| 'ring'` | `'bar'` | Progress presentation. |
| `label` | `string` | `'Hold to confirm'` | Idle instruction. |
| `doneLabel` | `string` | `'Confirmed'` | Completion text. |
| `width` | `number` | `240` | Button width for the bar variant. |
| `height` | `number` | `56` | Button height, and ring diameter. |
| `backgroundColor` | `string` | `undefined` | Base button color. Defaults to a scheme-aware near-black. |
| `backgroundEndColor` | `string` | `undefined` | Nearby end color for the material gradient. |
| `progressColor` | `string` | `'#6D5DFB'` | Progress color. |
| `textColor` | `string` | `'#FFFFFF'` | Text and check color. |
| `fontFamily` | `string` | `undefined` | Font family for the label. |
| `colorScheme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Color treatment, or the device setting when set to auto. |
| `accessibilityLabel` | `string` | `label` | Screen-reader label. |
| `style` | `StyleProp<ViewStyle>` | `undefined` | Style for the outer container. |
| `testID` | `string` | `undefined` | Test identifier for the interactive control. |
| `duration` | `number` | `520` | Post-confirmation success wave duration in milliseconds; holdMs is separate. Spring physics and reduced-motion timing are unchanged. |

## Compatibility

Expo SDK 57, React Native 0.86, Reanimated 4.5, Gesture Handler 2.32, and Worklets 0.10. Supports iOS, Android, and web. Works in Expo Go.

## Accessibility

The control is a labeled button. A screen-reader activation confirms immediately, avoiding a gesture that cannot be reliably held. Reduced Motion keeps the timed affordance but removes the spring and check travel.
