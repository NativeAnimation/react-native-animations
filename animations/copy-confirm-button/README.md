# Copy Confirm Button

A tactile copy action that turns into a drawn check, emits a brief accent glow, and lifts a glass confirmation pill above the control.

## How it works

1. A single shared progress value crossfades the two outlined copy rectangles into a check whose Skia path draws from start to finish.
2. The same progress tints the button with the success accent, keeping the icon, surface, and confirmation state perfectly synchronized.
3. A 1.4-second feedback timeline keeps the concise glass `Copied` pill 10 points clear of the button, then drifts it upward as it fades.
4. Press-in scales immediately to `0.94`; release returns to `1` with a damped spring for a visual haptic response.
5. The component calls `onCopy` instead of owning a clipboard dependency, so consumers can use `expo-clipboard`, a native bridge, or a simulated demo.

## Why this one

Most copy buttons stop at an icon swap or a detached toast. This version keeps every response at the point of action: the two rectangles resolve into a genuinely drawn check, the material itself takes on the accent, and a compact glass label appears above the button without covering nearby content. The result confirms the action without shifting layout or making the user hunt for feedback.

## Install

```bash
npx expo install @shopify/react-native-skia expo-blur expo-linear-gradient react-native-reanimated
```

## Usage

```tsx
import * as Clipboard from 'expo-clipboard';
import { CopyConfirmButton } from './CopyConfirmButton';

<CopyConfirmButton onCopy={() => Clipboard.setStringAsync(value)} />;

<CopyConfirmButton
  size={56}
  backgroundColor="#292735"
  colorScheme="dark"
  iconColor="#F4F4F8"
  successColor="#765EFF"
  copiedLabel="Copied"
  resetMs={1400}
  onCopy={() => Clipboard.setStringAsync(value)}
/>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `copied` | `boolean` | — | Controls the confirmation state externally. |
| `defaultCopied` | `boolean` | `false` | Sets the initial uncontrolled state. |
| `onCopy` | `() => void` | Required | Performs the application's copy operation. |
| `onChange` | `(copied: boolean) => void` | — | Receives requested confirmation-state changes. |
| `resetMs` | `number` | `1400` | Time before uncontrolled feedback resets. |
| `size` | `number` | `52` | Square button size in points. |
| `backgroundColor` | `string` | Scheme-aware | Resting button color. |
| `surfaceEndColor` | `string` | Same as `backgroundColor` | Alternate resting surface color retained for API compatibility. |
| `iconColor` | `string` | Scheme-aware | Resting copy icon color. |
| `successColor` | `string` | `'#6E56FF'` | Success surface, dot, and glow color. |
| `copiedLabel` | `string` | `'Copied'` | Confirmation-pill text. |
| `fontFamily` | `string` | System font | Confirmation-pill font family. |
| `colorScheme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Surface and glass treatment. |
| `accessibilityLabel` | `string` | `'Copy value'` | Screen-reader action label. |
| `style` | `StyleProp<ViewStyle>` | — | Button-container style. |
| `testID` | `string` | — | Test identifier. |

The forwarded ref exposes `copy()` and `reset()` for guided demos and external controls.

## Compatibility

Built for Expo SDK 57, React Native 0.86, Reanimated 4.5, and React Native Skia 2.6. iOS and Android are supported but device-unverified; web is verified by the project gate. The included dependencies work in Expo Go for SDK 57.

## Accessibility

The control exposes a labeled button and a selected confirmation state. The label updates to announce success. With Reduce Motion enabled, the icon and surface crossfade without travel, the glow and text shimmer are removed, and the confirmation pill remains stationary with a 10-point gap above the button.
