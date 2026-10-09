# Copy Confirm Button

A dimensional copy action that rotates into a check, flashes a success halo, and raises a polished confirmation bubble.

## How it works

1. The button calls the supplied `onCopy` callback and never imports a clipboard API.
2. One shared transition crossfades the two View-built icons while rotating and briefly compressing them.
3. Success triggers a short halo and specular sweep while a second shared value raises and fades the confirmation bubble.
4. A close-tone gradient, light edge, and layered shadow create the surface depth in either color scheme.
5. Uncontrolled feedback resets with a cleaned-up timer; controlled consumers decide when to reset.

## Install

```bash
npx expo install expo-linear-gradient react-native-reanimated
```

## Usage

```tsx
<CopyConfirmButton onCopy={() => copyText(value)} />

<CopyConfirmButton
  size={48}
  backgroundColor="#23232A"
  colorScheme="dark"
  iconColor="#F1F1F4"
  successColor="#53D894"
  resetMs={2000}
  onCopy={copyText}
/>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `copied` | `boolean` | — | Controlled feedback state. |
| `defaultCopied` | `boolean` | `false` | Initial uncontrolled state. |
| `onCopy` | `() => void` | Required | Performs the product's copy operation. |
| `onChange` | `(copied: boolean) => void` | — | Receives feedback state changes. |
| `resetMs` | `number` | `1600` | Feedback duration. |
| `size` | `number` | `40` | Square button size. |
| `backgroundColor` | `string` | Scheme-aware | Button color. |
| `surfaceEndColor` | `string` | Scheme-aware | Bottom material color. |
| `iconColor` | `string` | `'#3D3D46'` | Copy icon and bubble color. |
| `successColor` | `string` | `'#169B62'` | Check color. |
| `copiedLabel` | `string` | `'Copied'` | Bubble text. |
| `fontFamily` | `string` | System font | Bubble font. |
| `colorScheme` | `'light' \| 'dark' \| 'auto'` | `'auto'` | Surface color treatment. |
| `accessibilityLabel` | `string` | `'Copy'` | Screen-reader label. |
| `style` | `StyleProp<ViewStyle>` | — | Button style. |
| `testID` | `string` | — | Test identifier. |

## Compatibility

Expo SDK 57, React Native 0.86, and Reanimated 4.5. iOS and Android are supported but device-unverified; web is verified by the project gate. Works in Expo Go.

## Accessibility

The component exposes a labeled button and selected feedback state. Reduced Motion crossfades the icons and shows the bubble in place without rotation or travel.
