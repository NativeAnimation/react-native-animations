# Base Accordion

Measured disclosure rows that open smoothly without guessing their content height.

## How it works

1. Each item measures a hidden copy of its content with `onLayout`.
2. The visible copy animates from zero to the measured height over 350ms.
3. Opacity and the chevron rotation follow the same progress value.
4. Single mode closes the previous item as the next one opens; multiple mode keeps any set open.

## Install

```bash
npx nativeanimation add base-accordion
```

```bash
npx expo install lucide-react-native react-native-gesture-handler react-native-reanimated react-native-worklets
```

## Usage

```tsx
<BaseAccordion items={items} type="single" value={open} onValueChange={setOpen} />
```

```tsx
<BaseAccordion items={items} type="multiple" collapsible />
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `BaseAccordionItem[]` | required | Values, titles, and React content. |
| `type` | `'single' \| 'multiple'` | single | Allow one or many open items. |
| `value` | `string \| string[]` | — | Controlled open value(s). |
| `onValueChange` | `(value: string \| string[]) => void` | — | Called when disclosure changes. |
| `collapsible` | `boolean` | true | Allows the open single item to close. |
| `theme` | `BaseTheme` | provider | Overrides the family theme. |
| `testID` | `string` | — | Stable root identifier. |

## Compatibility

Expo SDK 57 · React Native 0.86 · Reanimated 4.5 · react-native-worklets 0.10. Runs on iOS, Android, and web in Expo Go or a development build.

## Accessibility

Each trigger is a button with an expanded state and a readable title. Reduced motion changes disclosure height and opacity immediately.
