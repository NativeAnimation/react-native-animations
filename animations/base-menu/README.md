# Base Menu

An anchored action menu with configurable items, trigger, alignment, and theme.

## How it works

1. A native wrapper measures the trigger with measureInWindow.
2. A transparent Modal places the panel 4 pt below the trigger, flips it above when needed, and clamps it to an 8 pt screen margin.
3. The panel fades and scales from 0.9 to 1 in 220 ms using the soft curve. It remains mounted through exit.
4. Items highlight in 100 ms. Selecting an enabled item closes the menu before calling its callback.

## Install

```bash
npx nativeanimation add base-menu
```

The CLI also copies `base-theme`. Dependencies, if you copy by hand:

```bash
npx expo install react-native-reanimated react-native-gesture-handler react-native-worklets lucide-react-native react-native-svg
```

Wrap the host app in `GestureHandlerRootView`.

## Usage

```tsx
import { BaseMenu } from './base-menu';
import { BaseButton } from './base-button';

<BaseMenu
  trigger={<BaseButton variant="outline">Project actions</BaseButton>}
  items={[
    { label: 'Rename', onSelect: renameProject },
    { label: 'Duplicate', shortcut: '⌘D', onSelect: duplicateProject },
    { type: 'separator' },
    { label: 'Delete', destructive: true, onSelect: deleteProject },
  ]}
/>
```

```tsx
<BaseMenu
  align="end"
  trigger={<BaseButton>Preferences</BaseButton>}
  items={[
    { type: 'label', label: 'Workspace' },
    { type: 'checkbox', label: 'Compact view', checked: compact, onSelect: toggleCompact },
    { label: 'Admin settings', disabled: true },
  ]}
/>
```

An item accepts `type`, `label`, `icon: ReactNode`, `shortcut`, `destructive`, `checked`, `disabled`, and `onSelect`. Supply 16 pt icons in your chosen theme color. Checkbox state is controlled by the caller. The trigger must call its injected `onPress` and provide its own accessible name and touch target. Large menus scroll inside the available screen space.

Wrap your app in `BaseThemeProvider` (from `base-theme`) to choose light/dark and an accent; without it, pieces use the light neutral theme. The `theme` prop overrides the provider. Load the font families declared in your theme once in the host app.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `trigger` | `ReactElement` | — | Element accepting onPress and optionally testID. |
| `items` | `BaseMenuItem[]` | — | Items, checkbox items, separators, and labels. |
| `align` | `'start' \| 'end'` | 'start' | Aligns the panel to the trigger. |
| `open / onOpenChange` | `boolean / (open: boolean) => void` | uncontrolled | Optional external open state. |
| `accessibilityLabel` | `string` | — | Accessible menu name. |
| `theme` | `BaseTheme` | provider | Overrides the shared family theme. |
| `style` | `StyleProp<ViewStyle>` | — | Container style. |
| `testID` | `string` | — | Stable test identifier. |

## Compatibility

Expo SDK 57 · React Native 0.86 · Reanimated 4.5 · react-native-worklets 0.10. Runs on iOS, Android and web, in Expo Go and development builds. Part of **Native Animation Base**, a free family that shares one theme.

## Accessibility

Menu items expose checked and disabled states. Outside taps, the Android back button, accessibility escape, and Escape on web close the menu. Web items support Tab navigation and Enter/Space activation. Reduce Motion makes panel transitions and highlights immediate.
