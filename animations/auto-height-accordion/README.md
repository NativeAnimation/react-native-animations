# Auto Height Accordion

A measured-height FAQ accordion with configurable questions and answers, accent color, and font.

## How it works

1. Each answer measures its natural content height.
2. A spring-derived UI value drives its clip height, fade, and chevron.
3. Controlled and uncontrolled open ids support product state or local use.

## Install

```bash
npx expo install react-native-reanimated react-native-worklets
```

## Usage

```tsx
<AutoHeightAccordion
  items={[{ id: 'delivery', title: 'When?', content: 'Within two days.' }]}
  allowMultiple
/>
```

## Props

| Prop                 | Type                        | Default           | Description                                                         |
| -------------------- | --------------------------- | ----------------- | ------------------------------------------------------------------- |
| `items`              | `AccordionItem[]`           | `Required`        | Questions and answers displayed by the accordion.                   |
| `value`              | `string[]`                  | `undefined`       | Controlled open item ids.                                           |
| `defaultValue`       | `string[]`                  | `[]`              | Initial open item ids.                                              |
| `allowMultiple`      | `boolean`                   | `false`           | Allows more than one answer to stay open.                           |
| `accentColor`        | `string`                    | `'#645BFF'`       | Accent used for active controls.                                    |
| `fontFamily`         | `string`                    | `undefined`       | Font family for component text. Omit to preserve the existing font. |
| `onChange`           | `(value: string[]) => void` | `undefined`       | Called when open item ids change.                                   |
| `accessibilityLabel` | `string`                    | `'Toggle answer'` | Accessible label prefix.                                            |
| `style`              | `StyleProp<ViewStyle>`      | `undefined`       | Style applied to the outer container.                               |
| `testID`             | `string`                    | `undefined`       | Test identifier applied to the outer container.                     |

## Compatibility

Expo SDK 58, React Native 0.88, and Reanimated 4.7. Supports iOS, Android, and web.

## Accessibility

Headers expose button and expanded states. Reduced Motion preserves state changes with a stiffer, short spring.

## Customization notes

Movement follows gestures, scroll position, or interruptible spring physics. A global duration is not exposed; reduced-motion fades retain their short fixed timing.
