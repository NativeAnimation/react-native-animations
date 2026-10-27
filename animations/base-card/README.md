# Base Card

A composable card with optional press feedback and configurable content and theme.

## How it works

1. The card uses the shared card surface, xl radius, border, and small shadow, with 24 pt vertical padding and gaps.
2. Header and content parts provide consistent 24 pt horizontal insets. A direct `BaseCardAction` child is laid out beside the title and description.
3. With `onPress`, a Gesture Handler tap compresses the card to the theme choice scale (0.985) and returns it using the press spring (550/30, mass 1). Pressure has its own shared value.

## Install

```bash
npx nativeanimation add base-card
```

The CLI also copies `base-theme`. Dependencies, if you copy by hand:

```bash
npx expo install react-native-gesture-handler react-native-reanimated react-native-worklets
```

Load the Geist regular and medium fonts used by the theme once in your app, or supply your own font names in a custom theme. Interactive pieces need a `GestureHandlerRootView` at the app root. The usage examples with buttons or switches assume those Base pieces are installed separately.

## Usage

```tsx
import { BaseCard, BaseCardHeader, BaseCardTitle, BaseCardDescription,
  BaseCardContent, BaseCardFooter } from './base-card';
import { BaseButton } from './base-button';

<BaseCard>
  <BaseCardHeader>
    <BaseCardTitle>Create project</BaseCardTitle>
    <BaseCardDescription>Ship your next idea with Nimbus.</BaseCardDescription>
  </BaseCardHeader>
  <BaseCardContent>{/* Your form fields */}</BaseCardContent>
  <BaseCardFooter>
    <BaseButton variant="outline">Cancel</BaseButton>
    <BaseButton onPress={deploy}>Deploy</BaseButton>
  </BaseCardFooter>
</BaseCard>
```

Wrap your app in `BaseThemeProvider` (from `base-theme`) to choose light/dark and an accent; without it, pieces use the light neutral theme. Every piece also takes a `theme` prop that wins over the provider.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `BaseCard: children` | `ReactNode` | `—` | Card contents, usually composed from the exported parts. |
| `onPress` | `() => void` | `—` | Makes the card a button. Use a clear accessibilityLabel; keep interactive controls outside a pressable card. |
| `theme` | `BaseTheme` | `provider` | Theme override, inherited by card parts and nested Base components. |
| `style` | `StyleProp<ViewStyle>` | `—` | Root layout and visual overrides; also supported by each part. |
| `testID` | `string` | `—` | Identifier on the card root. |
| `accessibilityLabel` | `string` | `—` | Accessible name for a pressable card. |
| `BaseCardHeader / BaseCardAction` | `ViewProps & { theme?: BaseTheme }` | `—` | Place Action directly inside Header to put it at the top right. |
| `BaseCardTitle / BaseCardDescription` | `TextProps & { theme?: BaseTheme }` | `—` | Title and supporting copy; accept text styles and native text props. |
| `BaseCardContent / BaseCardFooter` | `ViewProps & { theme?: BaseTheme }` | `—` | Content region and horizontal action row. |

## Compatibility

Expo SDK 57 · React Native 0.86 · Reanimated 4.5 · react-native-worklets 0.10. Targets iOS, Android, and web, including Expo Go and development builds. Part of **Native Animation Base**, a free family sharing one theme; the CLI installs its family dependencies automatically.

## Accessibility

A static card preserves the accessibility of its children. A pressable card is announced as a button and supports accessibility activation and Enter/Space on web. It has a minimum 44 pt target. Keep nested buttons and inputs in static cards. With Reduce Motion on, the pressure scale stays at 1.
