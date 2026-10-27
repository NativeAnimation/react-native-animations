# Base Radio Group

A radio group with spring-driven selection dots and configurable options, orientation, and theme.

## How it works

1. Each row is a single tap target with a 48 dp Android or 44 pt iOS/web minimum height.
2. The group controls selection while each radio animates its own dot.
3. Labels and optional descriptions use the shared theme typography and colors.
4. Horizontal and vertical layouts share the same interaction and accessibility model.

## Install

```bash
npx nativeanimation add base-radio-group
```

```bash
npx expo install react-native-gesture-handler react-native-reanimated react-native-worklets
```

## Usage

```tsx
<BaseRadioGroup value={plan} onValueChange={setPlan} options={plans} />
```

```tsx
<BaseRadio value="team" label="Team" description="For growing teams" selected={plan === 'team'} onPress={setPlan} />
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `string` | — | Controlled selected value. |
| `defaultValue` | `string` | — | Initial uncontrolled value. |
| `onValueChange` | `(value: string) => void` | — | Called after a row is selected. |
| `options` | `BaseRadioOption[]` | required | Radio values, labels, descriptions, and disabled flags. |
| `orientation` | `'vertical' \| 'horizontal'` | vertical | Row direction. |
| `theme` | `BaseTheme` | provider | Overrides the family theme. |
| `testID` | `string` | — | Stable root identifier. |

## Compatibility

Expo SDK 57 · React Native 0.86 · Reanimated 4.5 · react-native-worklets 0.10. Runs on iOS, Android, and web in Expo Go or a development build.

## Accessibility

The group exposes `radiogroup`; rows expose `radio` and their checked and disabled state. Reduced motion removes the dot and press animations but keeps selection immediate.
