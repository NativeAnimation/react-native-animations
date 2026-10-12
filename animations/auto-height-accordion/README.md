# Auto Height Accordion

A measured FAQ accordion that accommodates any answer length.

## How it works

1. Each answer measures its natural content height.
2. A spring-derived UI value drives its clip height, fade, and chevron.
3. Controlled and uncontrolled open ids support product state or local use.

## Install

```bash
npx expo install react-native-reanimated
```

## Usage

```tsx
<AutoHeightAccordion items={[{ id: 'delivery', title: 'When?', content: 'Within two days.' }]} allowMultiple />
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `AccordionItem[]` | — | Questions and answers. |
| `value` | `string[]` | — | Controlled ids. |
| `defaultValue` | `string[]` | `[]` | Initial ids. |
| `allowMultiple` | `boolean` | `false` | Keep several answers open. |
| `accentColor` | `string` | `'#645BFF'` | Active color. |

## Compatibility

Expo SDK 57, React Native 0.86, and Reanimated 4.5; iOS, Android, and web supported but unverified on devices.

## Accessibility

Headers expose button and expanded states. Reduced Motion preserves state changes with a stiffer, short spring.
