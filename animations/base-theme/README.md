# Base Theme

The shared theme of **Native Animation Base**: a neutral palette in light and dark, four accents, radii, shadows
and the motion tokens (springs, curves and durations) every Base piece animates with.

## How it works

1. `createBaseTheme({ scheme, accent })` returns plain tokens: colors (background, foreground, card, primary, muted,
   border, input, ring…), radius (`--radius` 0.625rem → 6/8/10/14), shadows and fonts.
2. Accents (`neutral`, `blue`, `green`, `violet`) only replace `primary` and `ring`.
3. Motion tokens hold named springs (always with `mass: 1`), cubic-bezier curves and durations; `spring()` and
   `timing()` turn them into Reanimated configs.
4. `BaseThemeProvider` shares one theme with every Base piece; `useBaseTheme()` reads it.

## Install

```bash
npx nativeanimation add base-theme
```

Every Base piece installs it automatically.

## Usage

```tsx
import { BaseThemeProvider } from './base-theme';

export default function App() {
  const scheme = useColorScheme() ?? 'light';
  return (
    <BaseThemeProvider scheme={scheme} accent="violet">
      <Root />
    </BaseThemeProvider>
  );
}
```

Your own palette:

```tsx
const brand = createBaseTheme({ scheme: 'light' });
brand.colors.primary = '#e11d48';
<BaseThemeProvider theme={brand}>…</BaseThemeProvider>
```

The fonts are Geist (`Geist_400Regular`, `Geist_500Medium`) loaded with `@expo-google-fonts/geist`; replace
`theme.fonts` to use your own.

## Props (`BaseThemeProvider`)

| Prop | Type | Default | Description |
|---|---|---|---|
| `scheme` | `'light' \| 'dark'` | `'light'` | Color scheme. |
| `accent` | `'neutral' \| 'blue' \| 'green' \| 'violet'` | `'neutral'` | Primary and ring color. |
| `theme` | `BaseTheme` | — | A fully custom theme; wins over `scheme` and `accent`. |

## Compatibility

Expo SDK 57 · React Native 0.86 · Reanimated 4.5 · react-native-worklets 0.10. Runs on iOS, Android and web, in Expo Go
and in development builds. Part of **Native Animation Base**, a free family that shares one theme: install
`base-theme` once (the CLI does it for you) and every Base piece picks it up.

## Accessibility

Primary text/fill pairs meet 4.5:1 in the eight built-in accent/scheme combinations.
This is not a complete AA audit; light muted text on the muted surface is below 4.5:1.
Custom palettes need their own contrast checks.

`useBaseReducedMotion()` reads the initial system preference and subscribes to changes while the app is open
(`AccessibilityInfo` on native, plus `prefers-reduced-motion` on web). Base pieces skip or shorten motion immediately.
Native starts with reduced motion until the initial asynchronous preference query resolves.

Design tokens adapted from shadcn/ui (MIT). See `NOTICE.md`.
