# Base Tab Bar

A bottom tab bar that expands the active destination, with configurable items, bottom inset, and theme.

## How it works

1. Each destination provides its own icon renderer. The active tab shows its label; inactive tabs show only their icons.
2. A shared background pill moves and resizes with the 300/30 selection spring, mass 1.
3. Labels open and close horizontally with the same selection spring. Press feedback has its own 0.97 scale.
4. Set hidden while scrolling down to move the bar out with a 300/35 slide spring, mass 1.

## Install

```bash
npx nativeanimation add base-tab-bar
```

The CLI also copies `base-theme`. Dependencies, if you copy by hand:

```bash
npx expo install react-native-reanimated react-native-gesture-handler react-native-worklets
```

Wrap the host app in `GestureHandlerRootView`.

## Usage

```tsx
import Home from 'lucide-react-native/icons/house';
import Search from 'lucide-react-native/icons/search';
import { BaseTabBar } from './base-tab-bar';

<BaseTabBar
  value={tab}
  onValueChange={setTab}
  bottomInset={insets.bottom}
  items={[
    { value: 'home', label: 'Home', icon: (props) => <Home {...props} /> },
    { value: 'search', label: 'Search', icon: (props) => <Search {...props} /> },
  ]}
/>
```

```tsx
import { Tabs } from 'expo-router';

// Expo SDK 58: put this integration in the host app's layout.
<Tabs
  tabBar={({ state, emitter, navigateToTab, insets }) => (
    <BaseTabBar
      value={state.routes[state.index].name}
      bottomInset={insets.bottom}
      items={navigationItems}
      onValueChange={(name) => {
        const route = state.routes.find((candidate) => candidate.name === name);
        if (!route) return;
        const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
        if (!event.defaultPrevented) navigateToTab(route.key);
      }}
    />
  )}
/>
```

In SDK 57, `tabBar` provides `navigation` instead: use `navigation.emit(...)` and, unless prevented, `navigation.navigate(route.name, route.params)`.

Position the bar at the bottom of your screen and reserve space for it in the content. The host owns scrolling and navigation; the component has no router dependency. The demo hides after 6 pt of downward scroll and reveals on upward scroll.

Wrap your app in `BaseThemeProvider` (from `base-theme`) to choose light/dark and an accent; without it, pieces use the light neutral theme. The `theme` prop overrides the provider. Load the font families declared in your theme once in the host app.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `BaseTabBarItem[]` | — | Unique value, label, icon renderer, and optional numeric badge. |
| `value` | `string` | — | Active destination (controlled). |
| `onValueChange` | `(value: string) => void` | — | Called after a tab is activated. |
| `bottomInset` | `number` | 0 | Host safe-area bottom inset. |
| `hidden` | `boolean` | false | Slides the bar down and removes it from interaction. |
| `theme` | `BaseTheme` | provider | Overrides the shared family theme. |
| `style` | `StyleProp<ViewStyle>` | — | Container style. |
| `testID` | `string` | 'base-tab-bar' | Stable test identifier. |

## Compatibility

Expo SDK 58 · React Native 0.88 · Reanimated 4.7 · react-native-worklets 0.13. Runs on iOS, Android and web, in Expo Go and development builds. Part of **Native Animation Base**, a free family that shares one theme.

## Accessibility

Targets fill the space halfway to each neighboring tab without overlapping; the icons and active pill keep their original size. On Android, reserve at least 48 dp per tab in the content area inside the horizontal padding. Targets keep that minimum by adjusting shared boundaries when needed, independently of the active label. A host narrower than the combined minimum keeps targets separate but cannot give every tab 48 dp.

Tabs expose their selected state and include unread badge counts in their accessible names. Hidden navigation is removed from accessibility and pointer interaction. Web tabs support Enter/Space activation. Reduce Motion removes press scaling and makes label, pill, and visibility changes immediate.


## Touch targets

Targets are 48 dp tall on Android, 48 pt on iOS, and 48 px on web. Inside the horizontal padding, reserve at least 48 dp of width per tab on Android or 44 pt on iOS; reserve 48 px per tab on web. A narrower host cannot provide the minimum for every tab. Keep the full target inside the host and clear of neighboring controls.
